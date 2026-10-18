import bcrypt from "bcryptjs";
import { portalUsuario, requireSocio } from "../auth";
import { leerArchivo, type Archivo } from "../archivos";
import { bloqueoPoliza, crearAlerta, guardarDoc } from "../core";
import { q, q1 } from "../db";
import { ir, txt, txtONull } from "../flash";
import { TIPOS_SINIESTRO, esFecha, hoy } from "../format";

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

/** Clave opcional: el cliente puede agregar una clave numérica a su DNI, o quitarla. */
export async function configurarPin(fd: FormData) {
  const u = await requireSocio();
  if (txt(fd, "accion") === "quitar") {
    await q("UPDATE usuarios SET pin_hash = NULL WHERE id = $1", [u.id]);
    ir("/portal/perfil", "ok", "Quitaste la clave: volvés a ingresar solo con tu DNI.");
  }
  const pin = String(fd.get("pin") ?? "");
  if (!/^\d{4,8}$/.test(pin)) ir("/portal/perfil", "error", "La clave debe tener entre 4 y 8 números.");
  if (pin !== String(fd.get("repetir") ?? "")) ir("/portal/perfil", "error", "Las claves no coinciden.");
  await q("UPDATE usuarios SET pin_hash = $2 WHERE id = $1", [u.id, await bcrypt.hash(pin, 10)]);
  ir("/portal/perfil", "ok", "Listo: desde ahora vas a ingresar con tu DNI y esta clave.");
}

// ───────── Pagos ─────────
/**
 * El cliente informa que va a pagar (efectivo) o que ya pagó por Mercado Pago (con comprobante).
 * El importe es el de la cuota y la fecha es la de hoy: no se pueden modificar. La empresa aprueba o rechaza.
 */
export async function pagarCuota(fd: FormData) {
  const u = await portalUsuario();
  const volver = "/portal/pagar";
  const cuotaId = Number(txt(fd, "cuota_id")) || null;
  const metodo = txt(fd, "metodo");
  if (!["efectivo", "mercadopago"].includes(metodo)) ir(volver, "error", "Elegí cómo vas a pagar: efectivo o Mercado Pago.");
  if (!cuotaId) ir(volver, "error", "Elegí la cuota que querés pagar.");
  const c = await q1(
    `SELECT c.estado, c.numero, c.importe::float8 AS importe, c.poliza_id, p.numero AS poliza, p.compania, p.cuotas_cant
     FROM cuotas c JOIN polizas p ON p.id = c.poliza_id WHERE c.id = $1 AND p.cliente_id = $2`,
    [cuotaId, u.cliente_id]
  );
  if (!c) ir(volver, "error", "La cuota elegida no existe.");
  if (c!.estado !== "pendiente") ir(volver, "error", "Esa cuota ya figura paga.");
  if (await bloqueoPoliza(c!.poliza_id)) ir(volver, "error", "Esta póliza está inhabilitada por falta de pago. Comunicate con la oficina.");
  const abierto = await q1("SELECT 1 FROM avisos_pago WHERE cuota_id = $1 AND estado = 'pendiente'", [cuotaId]);
  if (abierto) ir(volver, "error", "Ya informaste un pago de esta cuota: está en revisión.");

  let a: Archivo | null = null;
  try {
    a = await leerArchivo(fd, "archivo");
  } catch (e) {
    ir(volver, "error", e instanceof Error ? e.message : "Archivo inválido.");
  }
  if (metodo === "mercadopago" && !a) ir(volver, "error", "Para pagos por Mercado Pago adjuntá el comprobante (captura o PDF).");

  let docId: number | null = null;
  if (a) {
    const d = await q1(
      `INSERT INTO documentos (cliente_id, poliza_id, tipo, nombre, mime, tamano, datos, subido_por)
       VALUES ($1,$2,'comprobante',$3,$4,$5,$6,$7) RETURNING id`,
      [u.cliente_id, c!.poliza_id, a.nombre, a.mime, a.datos.length, a.datos, u.id]
    );
    docId = d!.id;
  }
  const av = await q1(
    `INSERT INTO avisos_pago (cliente_id, poliza_id, cuota_id, importe, fecha, metodo, nota, documento_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
    [u.cliente_id, c!.poliza_id, cuotaId, c!.importe, hoy(), metodo, txtONull(fd, "nota"), docId]
  );
  await crearAlerta({
    tipo: "pago_informado",
    cliente_id: u.cliente_id,
    poliza_id: c!.poliza_id,
    titulo: metodo === "efectivo" ? "El cliente va a pagar en efectivo" : "El cliente informó un pago por Mercado Pago",
    detalle: `Cuota ${c!.numero}/${c!.cuotas_cant} de la póliza ${c!.poliza} (${c!.compania}).`,
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

/** Pedido de modificación de datos (vehículo, dominio, cobertura...). Avisa a la empresa y arma el mensaje de WhatsApp. */
export async function solicitarTramite(fd: FormData) {
  const u = await portalUsuario();
  const volver = "/portal/tramite";
  const p = await polizaPropia(u, Number(txt(fd, "poliza_id")), volver);
  const nuevo = { riesgo: txt(fd, "riesgo"), dominio: txt(fd, "dominio").toUpperCase(), cobertura: txt(fd, "cobertura") };
  const obs = txt(fd, "observaciones");
  const cambios: Record<string, string> = {};
  const lineas: string[] = [];
  const etiquetas: Record<string, string> = { riesgo: "Vehículo / bien asegurado", dominio: "Dominio", cobertura: "Cobertura" };
  for (const k of ["riesgo", "dominio", "cobertura"] as const) {
    const actual = String(p[k] ?? "");
    if (nuevo[k] && nuevo[k] !== actual) {
      cambios[k] = nuevo[k];
      lineas.push(`- ${etiquetas[k]}: ${actual || "(sin dato)"} → ${nuevo[k]}`);
    }
  }
  if (!lineas.length && !obs) ir(`${volver}?poliza=${p.id}`, "error", "Cambiá algún dato o escribí una observación.");
  const c = await q1("SELECT nombre FROM clientes WHERE id = $1", [u.cliente_id]);
  const msg = [
    `Hola! Soy ${c!.nombre}. Quiero hacer un trámite sobre mi póliza ${p.numero} (${p.compania}).`,
    ...(lineas.length ? ["Datos a modificar:", ...lineas] : []),
    ...(obs ? [`Observaciones: ${obs}`] : []),
  ].join("\n");
  await crearAlerta({
    tipo: "tramite",
    cliente_id: u.cliente_id,
    poliza_id: p.id,
    titulo: "El cliente pidió un trámite",
    detalle: msg,
    datos: JSON.stringify({ cambios, observaciones: obs || null }),
  });
  ir(`${volver}?wa=${encodeURIComponent(msg)}`, "ok", "Trámite enviado. Si querés, avisanos también por WhatsApp con el botón verde.");
}

/** El cliente pide anular la póliza: queda un aviso para los administradores. */
export async function solicitarBaja(fd: FormData) {
  const u = await portalUsuario();
  const volver = "/portal/polizas";
  const id = Number(txt(fd, "poliza_id"));
  const p = await q1("SELECT id, numero, compania FROM polizas WHERE id = $1 AND cliente_id = $2", [id, u.cliente_id]);
  if (!p) ir(volver, "error", "No encontramos esa póliza.");
  const ya = await q1("SELECT 1 FROM alertas WHERE tipo = 'baja' AND poliza_id = $1 AND estado = 'pendiente'", [id]);
  if (ya) ir(volver, "error", "Ya pediste la baja de esta póliza: la oficina se va a comunicar con vos.");
  const motivo = txt(fd, "motivo");
  await crearAlerta({
    tipo: "baja",
    cliente_id: u.cliente_id,
    poliza_id: id,
    titulo: "El cliente quiere anular la póliza",
    detalle: `Póliza ${p!.numero} (${p!.compania}).${motivo ? ` Motivo: ${motivo}` : ""}`,
  });
  ir(volver, "ok", "Recibimos tu pedido de anulación. La oficina se va a comunicar con vos para confirmarlo.");
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
  const archivos: Archivo[] = [];
  for (const campo of ["archivo1", "archivo2", "archivo3"]) {
    try {
      const a = await leerArchivo(fd, campo);
      if (a) archivos.push(a);
    } catch (e) {
      ir(volver, "error", e instanceof Error ? e.message : "Archivo inválido.");
    }
  }
  const s = await q1(
    `INSERT INTO siniestros (cliente_id, poliza_id, fecha_hecho, hora, lugar, tipo, descripcion, terceros, origen)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'cliente') RETURNING id`,
    [u.cliente_id, p.id, fecha, txtONull(fd, "hora"), lugar, tipo || null, descripcion, txtONull(fd, "terceros")]
  );
  for (const a of archivos) await guardarDoc(a, { cliente_id: u.cliente_id, poliza_id: p.id, siniestro_id: s!.id, tipo: "siniestro", subido_por: u.id });
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
