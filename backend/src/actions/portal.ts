import bcrypt from "bcryptjs";
import { portalUsuario, requireSocio } from "../auth";
import { leerArchivo, type Archivo } from "../archivos";
import { bloqueoPoliza, crearAlerta, enLista, fijarClave, guardarDoc } from "../core";
import { q, q1 } from "../db";
import { ir, txt, txtONull } from "../flash";
import { TIPOS_SINIESTRO, esFecha, fecha, hoy, money } from "../format";

// ───────── Contactos de emergencia ─────────
export async function crearContacto(fd: FormData) {
  const u = await requireSocio();
  const nombre = txt(fd, "nombre");
  const telefono = txt(fd, "telefono");
  if (!nombre || !telefono) ir("/portal/contactos", "error", "Nombre y teléfono son obligatorios.");
  const n = await q1("SELECT COUNT(*)::int AS n FROM contactos_emergencia WHERE cliente_id = $1", [u.cliente_id]);
  if (n!.n >= 10) ir("/portal/contactos", "error", "Podés cargar hasta 10 contactos.");
  await q(
    "INSERT INTO contactos_emergencia (cliente_id, nombre, parentesco, telefono, email, notas) VALUES ($1,$2,$3,$4,$5,$6)",
    [u.cliente_id, nombre, txtONull(fd, "parentesco"), telefono, txtONull(fd, "email"), txtONull(fd, "notas")]
  );
  ir("/portal/contactos", "ok", "Contacto agregado.");
}

export async function actualizarContacto(fd: FormData) {
  const u = await requireSocio();
  const nombre = txt(fd, "nombre");
  const telefono = txt(fd, "telefono");
  if (!nombre || !telefono) ir("/portal/contactos", "error", "Nombre y teléfono son obligatorios.");
  await q(
    "UPDATE contactos_emergencia SET nombre=$3, parentesco=$4, telefono=$5, email=$6, notas=$7 WHERE id=$1 AND cliente_id=$2",
    [Number(txt(fd, "id")), u.cliente_id, nombre, txtONull(fd, "parentesco"), telefono, txtONull(fd, "email"), txtONull(fd, "notas")]
  );
  ir("/portal/contactos", "ok", "Contacto actualizado.");
}

export async function eliminarContacto(fd: FormData) {
  const u = await requireSocio();
  await q("DELETE FROM contactos_emergencia WHERE id = $1 AND cliente_id = $2", [Number(txt(fd, "id")), u.cliente_id]);
  ir("/portal/contactos", "ok", "Contacto eliminado.");
}

// ───────── Datos y clave opcional ─────────
export async function actualizarPerfil(fd: FormData) {
  const u = await requireSocio();
  await q("UPDATE clientes SET telefono = $2, direccion = $3, localidad = $4 WHERE id = $1", [
    u.cliente_id, txtONull(fd, "telefono"), txtONull(fd, "direccion"), txtONull(fd, "localidad"),
  ]);
  ir("/portal/perfil", "ok", "Datos actualizados.");
}

/** El cliente cambia la contraseña que le dio la oficina. */
export async function cambiarClave(fd: FormData) {
  const u = await requireSocio();
  const volver = "/portal/perfil";
  const actual = String(fd.get("actual") ?? "");
  const nueva = String(fd.get("nueva") ?? "");
  const f = await q1("SELECT password_hash FROM usuarios WHERE id = $1", [u.id]);
  if (!f || !(await bcrypt.compare(actual, f.password_hash))) ir(volver, "error", "La contraseña actual no es correcta.");
  if (nueva.length < 4) ir(volver, "error", "La contraseña nueva debe tener al menos 4 caracteres.");
  if (nueva !== String(fd.get("repetir") ?? "")) ir(volver, "error", "Las contraseñas nuevas no coinciden.");
  await fijarClave(u.id, nueva);
  ir(volver, "ok", "Listo: tu contraseña se cambió. Desde ahora ingresás con tu DNI y la contraseña nueva.");
}

// ───────── Pagos ─────────
/**
 * El cliente informa que va a pagar (efectivo) o que ya pagó por transferencia (con comprobante), de una o de varias cuotas a la vez.
 * El importe es el de cada cuota y la fecha es la de hoy: no se pueden modificar. La empresa aprueba o rechaza.
 */
export async function pagarCuota(fd: FormData) {
  const u = await portalUsuario();
  const volver = "/portal/pagar";
  const ids = [...new Set(fd.getAll("cuota_id").map((v) => Number(v)).filter((n) => n > 0))];
  const metodo = txt(fd, "metodo");
  if (!["efectivo", "transferencia"].includes(metodo)) ir(volver, "error", "Elegí cómo vas a pagar: efectivo o transferencia.");
  if (!ids.length) ir(volver, "error", "Elegí al menos una cuota para pagar.");
  const cuotas = await q(
    `SELECT c.id, c.estado, c.numero, c.vencimiento::text AS venc, c.importe::float8 AS importe, c.poliza_id, p.numero AS poliza, p.compania, p.cuotas_cant, p.dominio, p.riesgo
     FROM cuotas c JOIN polizas p ON p.id = c.poliza_id WHERE c.id IN (${enLista(ids)}) AND p.cliente_id = $1 ORDER BY c.vencimiento, c.poliza_id, c.numero`,
    [u.cliente_id]
  );
  if (cuotas.length !== ids.length) ir(volver, "error", "Alguna de las cuotas elegidas no existe.");
  if (cuotas.some((c) => c.estado !== "pendiente")) ir(volver, "error", "Alguna de esas cuotas ya figura paga.");
  for (const pid of new Set(cuotas.map((c) => c.poliza_id as number))) {
    if (await bloqueoPoliza(pid)) ir(volver, "error", "Una de las pólizas está inhabilitada por falta de pago. Comunicate con la oficina.");
  }
  const abierto = await q1(
    `SELECT 1 FROM aviso_cuotas ac JOIN avisos_pago a ON a.id = ac.aviso_id WHERE ac.cuota_id IN (${enLista(ids)}) AND a.estado = 'pendiente' LIMIT 1`
  );
  if (abierto) ir(volver, "error", "Ya informaste el pago de alguna de esas cuotas: está en revisión.");

  let a: Archivo | null = null;
  try {
    a = await leerArchivo(fd, "archivo");
  } catch (e) {
    ir(volver, "error", e instanceof Error ? e.message : "Archivo inválido.");
  }
  if (metodo === "transferencia" && !a) ir(volver, "error", "Para pagar por transferencia adjuntá el comprobante (captura o PDF).");

  const polizaCab = cuotas[0].poliza_id as number;
  let docId: number | null = null;
  if (a) {
    const d = await q1(
      `INSERT INTO documentos (cliente_id, poliza_id, tipo, nombre, mime, tamano, datos, subido_por)
       VALUES ($1,$2,'comprobante',$3,$4,$5,$6,$7) RETURNING id`,
      [u.cliente_id, polizaCab, a.nombre, a.mime, a.datos.length, a.datos, u.id]
    );
    docId = d!.id;
  }
  const total = cuotas.reduce((s, c) => s + (c.importe as number), 0);
  const av = await q1(
    `INSERT INTO avisos_pago (cliente_id, poliza_id, cuota_id, importe, fecha, metodo, nota, documento_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
    [u.cliente_id, polizaCab, cuotas[0].id, total, hoy(), metodo, txtONull(fd, "nota"), docId]
  );
  for (const c of cuotas) await q("INSERT INTO aviso_cuotas (aviso_id, cuota_id) VALUES ($1,$2)", [av!.id, c.id]);
  const detalle = cuotas
    .map((c) => `• Póliza ${c.poliza} (${c.compania})${c.dominio ? ` · ${c.dominio}` : ""} · cuota ${c.numero}/${c.cuotas_cant} (vence ${fecha(c.venc)}): ${money(c.importe)}`)
    .join("\n");
  await crearAlerta({
    tipo: "pago_informado",
    cliente_id: u.cliente_id,
    poliza_id: polizaCab,
    titulo: metodo === "efectivo" ? "El cliente va a pagar en efectivo" : "El cliente informó un pago por transferencia",
    detalle: `${cuotas.length > 1 ? `${cuotas.length} cuotas, total ${money(total)}.\n` : ""}${detalle}`,
    datos: String(av!.id),
  });
  ir(
    "/portal/pagos",
    "ok",
    metodo === "efectivo"
      ? "Listo. Acercate a la oficina (San Lorenzo 600) a abonar en efectivo; cuando lo confirmemos vas a ver tu recibo acá."
      : "Recibimos tu comprobante. Lo vamos a revisar y, cuando lo aprobemos, vas a ver tu recibo acá."
  );
}

// ───────── Trámites y baja ─────────
async function polizaPropia(u: { cliente_id: number }, polizaId: number, volver: string) {
  const p = await q1(
    "SELECT id, numero, compania, ramo, riesgo, dominio, cobertura FROM polizas WHERE id = $1 AND cliente_id = $2",
    [polizaId, u.cliente_id]
  );
  if (!p) ir(volver, "error", "No encontramos esa póliza.");
  if (await bloqueoPoliza(polizaId)) ir(volver, "error", "Esta póliza está inhabilitada por falta de pago.");
  return p!;
}

/** Pedido de trámite: el cliente escribe lo que quiere hacer. Avisa a la empresa y arma el mensaje de WhatsApp. */
export async function solicitarTramite(fd: FormData) {
  const u = await portalUsuario();
  const volver = "/portal/tramite";
  const p = await polizaPropia(u, Number(txt(fd, "poliza_id")), volver);
  const obs = txt(fd, "observaciones");
  if (obs.length < 5) ir(`${volver}?poliza=${p.id}`, "error", "Escribí qué trámite querés hacer.");
  const nuevo = { riesgo: txt(fd, "riesgo"), dominio: txt(fd, "dominio").toUpperCase() };
  const cambios: Record<string, string> = {};
  const lineas: string[] = [];
  const etiquetas: Record<string, string> = { riesgo: "Vehículo / bien asegurado", dominio: "Dominio" };
  for (const k of ["riesgo", "dominio"] as const) {
    const actual = String(p[k] ?? "");
    if (nuevo[k] && nuevo[k] !== actual) {
      cambios[k] = nuevo[k];
      lineas.push(`- ${etiquetas[k]}: ${actual || "(sin dato)"} → ${nuevo[k]}`);
    }
  }
  const c = await q1("SELECT nombre FROM clientes WHERE id = $1", [u.cliente_id]);
  const msg = [
    `Hola! Soy ${c!.nombre}. Quiero hacer un trámite sobre mi póliza ${p.numero} (${p.compania}).`,
    `Trámite: ${obs}`,
    ...(lineas.length ? ["Datos nuevos:", ...lineas] : []),
  ].join("\n");
  await crearAlerta({
    tipo: "tramite",
    cliente_id: u.cliente_id,
    poliza_id: p.id,
    titulo: "El cliente pidió un trámite",
    detalle: msg,
    datos: JSON.stringify({ cambios, observaciones: obs }),
  });
  ir(`${volver}?wa=${encodeURIComponent(msg)}`, "ok", "Trámite enviado. Si querés, avisanos también por WhatsApp con el botón verde.");
}

/** El cliente pide anular la póliza: queda un aviso para los administradores y se arma el mensaje de WhatsApp. */
export async function solicitarBaja(fd: FormData) {
  const u = await portalUsuario();
  const volver = "/portal/polizas";
  const id = Number(txt(fd, "poliza_id"));
  const p = await q1("SELECT id, numero, compania, riesgo, dominio FROM polizas WHERE id = $1 AND cliente_id = $2", [id, u.cliente_id]);
  if (!p) ir(volver, "error", "No encontramos esa póliza.");
  const c = await q1("SELECT nombre, documento FROM clientes WHERE id = $1", [u.cliente_id]);
  const motivo = txt(fd, "motivo");
  const msg = [
    `Hola! Soy ${c!.nombre}${c!.documento ? ` (DNI ${c!.documento})` : ""}.`,
    `Quiero pedir la anulación de mi póliza ${p!.numero} (${p!.compania})${p!.dominio ? ` · ${p!.dominio}` : p!.riesgo ? ` · ${p!.riesgo}` : ""}.`,
    ...(motivo ? [`Motivo: ${motivo}`] : []),
  ].join("\n");
  const ya = await q1("SELECT 1 FROM alertas WHERE tipo = 'baja' AND poliza_id = $1 AND estado = 'pendiente'", [id]);
  if (!ya) {
    await crearAlerta({
      tipo: "baja",
      cliente_id: u.cliente_id,
      poliza_id: id,
      titulo: "El cliente pidió anular la póliza",
      detalle: `Póliza ${p!.numero} (${p!.compania}).${motivo ? ` Motivo: ${motivo}` : ""}`,
    });
  }
  ir(`${volver}?wa=${encodeURIComponent(msg)}`, "ok", "Recibimos tu pedido. Para que lo veamos más rápido, mandanos el mensaje por WhatsApp con el botón verde.");
}

// ───────── Siniestros ─────────
export async function denunciarSiniestro(fd: FormData) {
  const u = await portalUsuario();
  const volver = "/portal/siniestros";
  const p = await polizaPropia(u, Number(txt(fd, "poliza_id")), volver);
  const fecha = txt(fd, "fecha_hecho");
  const lugar = txt(fd, "lugar");
  const descripcion = txt(fd, "descripcion");
  const tipo = txt(fd, "tipo");
  if (!esFecha(fecha)) ir(volver, "error", "Indicá la fecha en que ocurrió el hecho.");
  if (!lugar || descripcion.length < 5) ir(volver, "error", "Completá el lugar y contanos qué pasó.");
  if (tipo && !TIPOS_SINIESTRO.includes(tipo)) ir(volver, "error", "Tipo de siniestro inválido.");
  const archivos: { a: Archivo; tipo: string }[] = [];
  const pedidos: [string, string, string][] = [
    ["carnet", "carnet", "la foto del carnet de conducir"],
    ["cedula", "cedula_verde", "la foto de la cédula verde"],
    ["archivo1", "siniestro", ""],
    ["archivo2", "siniestro", ""],
    ["archivo3", "siniestro", ""],
  ];
  const vehiculo = !!String(p.dominio ?? "").trim();
  for (const [campo, tipoDoc, nombreDoc] of pedidos) {
    try {
      const a = await leerArchivo(fd, campo);
      if (a) archivos.push({ a, tipo: tipoDoc });
      else if (vehiculo && nombreDoc) ir(volver, "error", `Adjuntá ${nombreDoc}.`);
    } catch (e) {
      ir(volver, "error", e instanceof Error ? e.message : "Archivo inválido.");
    }
  }
  const s = await q1(
    `INSERT INTO siniestros (cliente_id, poliza_id, fecha_hecho, hora, lugar, tipo, descripcion, terceros, origen)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'cliente') RETURNING id`,
    [u.cliente_id, p.id, fecha, txtONull(fd, "hora"), lugar, tipo || null, descripcion, txtONull(fd, "terceros")]
  );
  for (const { a, tipo: tipoDoc } of archivos) await guardarDoc(a, { cliente_id: u.cliente_id, poliza_id: p.id, siniestro_id: s!.id, tipo: tipoDoc, subido_por: u.id });
  await crearAlerta({
    tipo: "siniestro",
    cliente_id: u.cliente_id,
    poliza_id: p.id,
    titulo: "El cliente denunció un siniestro",
    detalle: `Póliza ${p.numero} (${p.compania}) · ${lugar} · ${descripcion.slice(0, 140)}`,
    datos: String(s!.id),
  });
  ir(volver, "ok", "Recibimos tu denuncia. La oficina se va a comunicar con vos para continuar el trámite.");
}
