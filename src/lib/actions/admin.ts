"use server";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "../auth";
import { leerArchivo, type Archivo } from "../archivos";
import { q, q1 } from "../db";
import { EMAIL_RE, ir, num, txt, txtONull } from "../flash";
import { ESTADOS_POLIZA, METODOS, PERIODICIDAD, TIPOS_DOC, esFecha, sumarMeses } from "../format";

// ───────── Utilidades ─────────
async function archivoSeguro(fd: FormData, campo: string, volver: string): Promise<Archivo | null> {
  try {
    return await leerArchivo(fd, campo);
  } catch (e) {
    ir(volver, "error", e instanceof Error ? e.message : "Archivo inválido.");
  }
}

async function guardarDoc(
  a: Archivo,
  d: { cliente_id: number; poliza_id?: number | null; pago_id?: number | null; tipo: string; subido_por: number }
) {
  await q(
    `INSERT INTO documentos (cliente_id, poliza_id, pago_id, tipo, nombre, mime, tamano, datos, subido_por)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [d.cliente_id, d.poliza_id ?? null, d.pago_id ?? null, d.tipo, a.nombre, a.mime, a.datos.length, a.datos, d.subido_por]
  );
}

async function recalcularCuota(id: number | null) {
  if (!id) return;
  await q(
    `UPDATE cuotas c SET estado = CASE
       WHEN c.estado = 'anulada' THEN 'anulada'
       WHEN COALESCE((SELECT SUM(importe) FROM pagos WHERE cuota_id = c.id AND estado = 'aplicado'), 0) >= c.importe THEN 'pagada'
       ELSE 'pendiente' END
     WHERE c.id = $1`,
    [id]
  );
}

// ───────── Clientes ─────────
function datosCliente(fd: FormData) {
  return {
    nombre: txt(fd, "nombre"),
    documento: txtONull(fd, "documento"),
    email: txtONull(fd, "email"),
    telefono: txtONull(fd, "telefono"),
    direccion: txtONull(fd, "direccion"),
    localidad: txtONull(fd, "localidad"),
    notas: txtONull(fd, "notas"),
  };
}

export async function crearCliente(fd: FormData) {
  await requireAdmin();
  const d = datosCliente(fd);
  if (!d.nombre) ir("/admin/clientes/nuevo", "error", "El nombre es obligatorio.");
  if (d.email && !EMAIL_RE.test(d.email)) ir("/admin/clientes/nuevo", "error", "El email no es válido.");
  const r = await q1(
    `INSERT INTO clientes (nombre, documento, email, telefono, direccion, localidad, notas)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    [d.nombre, d.documento, d.email, d.telefono, d.direccion, d.localidad, d.notas]
  );
  revalidatePath("/admin/clientes");
  ir(`/admin/clientes/${r!.id}`, "ok", "Cliente creado.");
}

export async function actualizarCliente(fd: FormData) {
  await requireAdmin();
  const id = Number(txt(fd, "id"));
  const volver = `/admin/clientes/${id}`;
  const d = datosCliente(fd);
  if (!d.nombre) ir(volver, "error", "El nombre es obligatorio.");
  if (d.email && !EMAIL_RE.test(d.email)) ir(volver, "error", "El email no es válido.");
  await q(
    `UPDATE clientes SET nombre=$2, documento=$3, email=$4, telefono=$5, direccion=$6, localidad=$7, notas=$8 WHERE id=$1`,
    [id, d.nombre, d.documento, d.email, d.telefono, d.direccion, d.localidad, d.notas]
  );
  ir(volver, "ok", "Datos guardados.");
}

export async function alternarCliente(fd: FormData) {
  await requireAdmin();
  const id = Number(txt(fd, "id"));
  await q("UPDATE clientes SET activo = NOT activo WHERE id = $1", [id]);
  await q("UPDATE usuarios SET activo = (SELECT activo FROM clientes WHERE id = $1) WHERE cliente_id = $1", [id]);
  ir(`/admin/clientes/${id}`, "ok", "Estado del cliente actualizado.");
}

export async function crearAccesoCliente(fd: FormData) {
  await requireAdmin();
  const cid = Number(txt(fd, "cliente_id"));
  const volver = `/admin/clientes/${cid}`;
  const email = txt(fd, "email").toLowerCase();
  const pass = String(fd.get("password") ?? "");
  if (!EMAIL_RE.test(email)) ir(volver, "error", "Ingresá un email válido para el acceso.");
  if (pass.length < 8) ir(volver, "error", "La contraseña temporal debe tener al menos 8 caracteres.");
  const c = await q1("SELECT nombre FROM clientes WHERE id = $1", [cid]);
  if (!c) ir("/admin/clientes", "error", "Cliente inexistente.");
  if (await q1("SELECT 1 FROM usuarios WHERE email = $1", [email])) ir(volver, "error", "Ese email ya tiene un usuario.");
  await q(
    `INSERT INTO usuarios (email, nombre, password_hash, rol, cliente_id, debe_cambiar_password)
     VALUES ($1,$2,$3,'socio',$4,TRUE)`,
    [email, c!.nombre, await bcrypt.hash(pass, 10), cid]
  );
  ir(volver, "ok", `Acceso creado. Pasale al cliente el email y la contraseña temporal; se le pedirá cambiarla al ingresar.`);
}

export async function restablecerPassword(fd: FormData) {
  await requireAdmin();
  const uid = Number(txt(fd, "usuario_id"));
  const volver = txt(fd, "volver") || "/admin";
  const pass = String(fd.get("password") ?? "");
  if (pass.length < 8) ir(volver, "error", "La contraseña debe tener al menos 8 caracteres.");
  await q("UPDATE usuarios SET password_hash = $2, debe_cambiar_password = TRUE WHERE id = $1", [uid, await bcrypt.hash(pass, 10)]);
  ir(volver, "ok", "Contraseña restablecida. Se pedirá cambiarla al próximo ingreso.");
}

export async function alternarUsuario(fd: FormData) {
  const yo = await requireAdmin();
  const uid = Number(txt(fd, "usuario_id"));
  const volver = txt(fd, "volver") || "/admin";
  if (uid === yo.id) ir(volver, "error", "No podés desactivar tu propio usuario.");
  await q("UPDATE usuarios SET activo = NOT activo WHERE id = $1", [uid]);
  ir(volver, "ok", "Usuario actualizado.");
}

export async function crearAdmin(fd: FormData) {
  await requireAdmin();
  const nombre = txt(fd, "nombre");
  const email = txt(fd, "email").toLowerCase();
  const pass = String(fd.get("password") ?? "");
  if (!nombre) ir("/admin/equipo", "error", "Ingresá el nombre.");
  if (!EMAIL_RE.test(email)) ir("/admin/equipo", "error", "Email inválido.");
  if (pass.length < 8) ir("/admin/equipo", "error", "La contraseña debe tener al menos 8 caracteres.");
  if (await q1("SELECT 1 FROM usuarios WHERE email = $1", [email])) ir("/admin/equipo", "error", "Ese email ya está en uso.");
  await q(
    "INSERT INTO usuarios (email, nombre, password_hash, rol, debe_cambiar_password) VALUES ($1,$2,$3,'admin',TRUE)",
    [email, nombre, await bcrypt.hash(pass, 10)]
  );
  ir("/admin/equipo", "ok", "Administrador creado.");
}

// ───────── Contactos de emergencia (desde el panel admin) ─────────
export async function crearContactoAdmin(fd: FormData) {
  await requireAdmin();
  const cid = Number(txt(fd, "cliente_id"));
  const volver = `/admin/clientes/${cid}`;
  const nombre = txt(fd, "nombre");
  const telefono = txt(fd, "telefono");
  if (!nombre || !telefono) ir(volver, "error", "Nombre y teléfono del contacto son obligatorios.");
  await q(
    "INSERT INTO contactos_emergencia (cliente_id, nombre, parentesco, telefono, email, notas) VALUES ($1,$2,$3,$4,$5,$6)",
    [cid, nombre, txtONull(fd, "parentesco"), telefono, txtONull(fd, "email"), txtONull(fd, "notas")]
  );
  ir(volver, "ok", "Contacto agregado.");
}

export async function eliminarContactoAdmin(fd: FormData) {
  await requireAdmin();
  const cid = Number(txt(fd, "cliente_id"));
  await q("DELETE FROM contactos_emergencia WHERE id = $1 AND cliente_id = $2", [Number(txt(fd, "id")), cid]);
  ir(`/admin/clientes/${cid}`, "ok", "Contacto eliminado.");
}

// ───────── Pólizas ─────────
export async function crearPoliza(fd: FormData) {
  const yo = await requireAdmin();
  const cid = Number(txt(fd, "cliente_id"));
  const volver = `/admin/polizas/nueva?cliente=${cid || ""}`;
  const ramo = txt(fd, "ramo");
  const compania = txt(fd, "compania");
  const numero = txt(fd, "numero");
  const periodicidad = txt(fd, "periodicidad") || "mensual";
  const cuotasCant = Math.round(num(fd, "cuotas_cant"));
  const importe = num(fd, "importe_cuota");
  const primerVenc = txt(fd, "primer_vencimiento");
  const desde = txt(fd, "vigencia_desde");
  const hasta = txt(fd, "vigencia_hasta");
  const estado = txt(fd, "estado") || "vigente";
  if (!cid || !(await q1("SELECT 1 FROM clientes WHERE id = $1", [cid]))) ir(volver, "error", "Elegí un cliente.");
  if (!ramo || !compania || !numero) ir(volver, "error", "Ramo, compañía y número de póliza son obligatorios.");
  if (!PERIODICIDAD[periodicidad] || !ESTADOS_POLIZA[estado]) ir(volver, "error", "Datos de póliza inválidos.");
  if (!(cuotasCant >= 1 && cuotasCant <= 60)) ir(volver, "error", "La cantidad de cuotas debe estar entre 1 y 60.");
  if (!(importe >= 0)) ir(volver, "error", "El importe de la cuota no es válido.");
  if (!esFecha(primerVenc)) ir(volver, "error", "Indicá el vencimiento de la primera cuota.");
  if ((desde && !esFecha(desde)) || (hasta && !esFecha(hasta))) ir(volver, "error", "Fechas de vigencia inválidas.");
  const fPoliza = await archivoSeguro(fd, "archivo_poliza", volver);
  const fCert = await archivoSeguro(fd, "archivo_certificado", volver);
  const suma = num(fd, "suma_asegurada");

  const p = await q1(
    `INSERT INTO polizas (cliente_id, ramo, compania, numero, riesgo, dominio, suma_asegurada, periodicidad,
       cuotas_cant, importe_cuota, vigencia_desde, vigencia_hasta, estado, notas)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING id`,
    [cid, ramo, compania, numero, txtONull(fd, "riesgo"), txtONull(fd, "dominio")?.toUpperCase() ?? null,
     Number.isFinite(suma) ? suma : null, periodicidad, cuotasCant, importe, desde || null, hasta || null, estado, txtONull(fd, "notas")]
  );
  const pid = p!.id as number;
  const paso = PERIODICIDAD[periodicidad].meses;
  for (let i = 0; i < cuotasCant; i++) {
    await q("INSERT INTO cuotas (poliza_id, numero, vencimiento, importe) VALUES ($1,$2,$3,$4)", [pid, i + 1, sumarMeses(primerVenc, i * paso), importe]);
  }
  if (fPoliza) await guardarDoc(fPoliza, { cliente_id: cid, poliza_id: pid, tipo: "poliza", subido_por: yo.id });
  if (fCert) await guardarDoc(fCert, { cliente_id: cid, poliza_id: pid, tipo: "certificado", subido_por: yo.id });
  revalidatePath("/admin/polizas");
  ir(`/admin/polizas/${pid}`, "ok", `Póliza creada con ${cuotasCant} cuota${cuotasCant > 1 ? "s" : ""}.`);
}

export async function actualizarPoliza(fd: FormData) {
  await requireAdmin();
  const id = Number(txt(fd, "id"));
  const volver = `/admin/polizas/${id}`;
  const ramo = txt(fd, "ramo");
  const compania = txt(fd, "compania");
  const numero = txt(fd, "numero");
  const estado = txt(fd, "estado");
  const desde = txt(fd, "vigencia_desde");
  const hasta = txt(fd, "vigencia_hasta");
  if (!ramo || !compania || !numero) ir(volver, "error", "Ramo, compañía y número son obligatorios.");
  if (!ESTADOS_POLIZA[estado]) ir(volver, "error", "Estado inválido.");
  if ((desde && !esFecha(desde)) || (hasta && !esFecha(hasta))) ir(volver, "error", "Fechas de vigencia inválidas.");
  const suma = num(fd, "suma_asegurada");
  await q(
    `UPDATE polizas SET ramo=$2, compania=$3, numero=$4, riesgo=$5, dominio=$6, suma_asegurada=$7,
       vigencia_desde=$8, vigencia_hasta=$9, estado=$10, notas=$11 WHERE id=$1`,
    [id, ramo, compania, numero, txtONull(fd, "riesgo"), txtONull(fd, "dominio")?.toUpperCase() ?? null,
     Number.isFinite(suma) ? suma : null, desde || null, hasta || null, estado, txtONull(fd, "notas")]
  );
  ir(volver, "ok", "Póliza actualizada.");
}

export async function agregarCuota(fd: FormData) {
  await requireAdmin();
  const pid = Number(txt(fd, "poliza_id"));
  const volver = `/admin/polizas/${pid}`;
  const p = await q1("SELECT periodicidad, importe_cuota::float8 AS importe FROM polizas WHERE id = $1", [pid]);
  if (!p) ir("/admin/polizas", "error", "Póliza inexistente.");
  const ult = await q1("SELECT numero, vencimiento::text AS venc FROM cuotas WHERE poliza_id = $1 ORDER BY numero DESC LIMIT 1", [pid]);
  const paso = PERIODICIDAD[p!.periodicidad]?.meses ?? 1;
  const hoyIso = new Date().toISOString().slice(0, 10);
  await q("INSERT INTO cuotas (poliza_id, numero, vencimiento, importe) VALUES ($1,$2,$3,$4)", [
    pid, (ult?.numero ?? 0) + 1, ult ? sumarMeses(ult.venc, paso) : hoyIso, p!.importe,
  ]);
  await q("UPDATE polizas SET cuotas_cant = (SELECT COUNT(*) FROM cuotas WHERE poliza_id = $1) WHERE id = $1", [pid]);
  ir(volver, "ok", "Cuota agregada.");
}

export async function actualizarCuota(fd: FormData) {
  await requireAdmin();
  const id = Number(txt(fd, "id"));
  const pid = Number(txt(fd, "poliza_id"));
  const volver = `/admin/polizas/${pid}`;
  const venc = txt(fd, "vencimiento");
  const importe = num(fd, "importe");
  if (!esFecha(venc) || !(importe >= 0)) ir(volver, "error", "Vencimiento o importe inválido.");
  await q("UPDATE cuotas SET vencimiento = $2, importe = $3 WHERE id = $1 AND poliza_id = $4", [id, venc, importe, pid]);
  await recalcularCuota(id);
  ir(volver, "ok", "Cuota actualizada.");
}

export async function anularCuota(fd: FormData) {
  await requireAdmin();
  const id = Number(txt(fd, "id"));
  const pid = Number(txt(fd, "poliza_id"));
  const volver = `/admin/polizas/${pid}`;
  const pagos = await q1("SELECT 1 FROM pagos WHERE cuota_id = $1 AND estado = 'aplicado'", [id]);
  if (pagos) ir(volver, "error", "La cuota tiene pagos aplicados: anulá primero el pago.");
  await q("UPDATE cuotas SET estado = 'anulada' WHERE id = $1 AND poliza_id = $2", [id, pid]);
  ir(volver, "ok", "Cuota anulada.");
}

// ───────── Documentos ─────────
export async function subirDocumento(fd: FormData) {
  const yo = await requireAdmin();
  const pid = Number(txt(fd, "poliza_id"));
  const volver = `/admin/polizas/${pid}`;
  const tipo = txt(fd, "tipo");
  if (!TIPOS_DOC[tipo]) ir(volver, "error", "Tipo de documento inválido.");
  const p = await q1("SELECT cliente_id FROM polizas WHERE id = $1", [pid]);
  if (!p) ir("/admin/polizas", "error", "Póliza inexistente.");
  const a = await archivoSeguro(fd, "archivo", volver);
  if (!a) ir(volver, "error", "Elegí un archivo para subir.");
  await guardarDoc(a!, { cliente_id: p!.cliente_id, poliza_id: pid, tipo, subido_por: yo.id });
  ir(volver, "ok", `${TIPOS_DOC[tipo]} cargado.`);
}

export async function eliminarDocumento(fd: FormData) {
  await requireAdmin();
  await q("DELETE FROM documentos WHERE id = $1", [Number(txt(fd, "id"))]);
  ir(txt(fd, "volver") || "/admin", "ok", "Documento eliminado.");
}

// ───────── Cobros ─────────
export async function registrarPago(fd: FormData) {
  const yo = await requireAdmin();
  const volver = `/admin/pagos/nuevo?cliente=${txt(fd, "cliente_id")}`;
  const importe = num(fd, "importe");
  const fecha = txt(fd, "fecha");
  const metodo = txt(fd, "metodo");
  const cuotaId = Number(txt(fd, "cuota_id")) || null;
  let clienteId = Number(txt(fd, "cliente_id")) || null;
  let polizaId = Number(txt(fd, "poliza_id")) || null;
  if (!(importe > 0)) ir(volver, "error", "Ingresá un importe mayor a cero.");
  if (!esFecha(fecha)) ir(volver, "error", "Fecha inválida.");
  if (!METODOS[metodo]) ir(volver, "error", "Elegí la forma de pago.");
  if (cuotaId) {
    const c = await q1(
      "SELECT c.estado, c.poliza_id, p.cliente_id FROM cuotas c JOIN polizas p ON p.id = c.poliza_id WHERE c.id = $1",
      [cuotaId]
    );
    if (!c) ir(volver, "error", "La cuota no existe.");
    if (c!.estado !== "pendiente") ir(volver, "error", "Esa cuota ya está paga o anulada.");
    polizaId = c!.poliza_id;
    clienteId = c!.cliente_id;
  } else if (polizaId) {
    const p = await q1("SELECT cliente_id FROM polizas WHERE id = $1", [polizaId]);
    if (!p) ir(volver, "error", "La póliza no existe.");
    clienteId = p!.cliente_id;
  }
  if (!clienteId || !(await q1("SELECT 1 FROM clientes WHERE id = $1", [clienteId]))) ir(volver, "error", "Elegí un cliente.");
  const comprobante = await archivoSeguro(fd, "comprobante", volver);
  const reciboPropio = await archivoSeguro(fd, "recibo_propio", volver);

  const r = await q1(
    `INSERT INTO pagos (cliente_id, poliza_id, cuota_id, fecha, importe, metodo, referencia, observaciones, registrado_por)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
    [clienteId, polizaId, cuotaId, fecha, importe, metodo, txtONull(fd, "referencia"), txtONull(fd, "observaciones"), yo.id]
  );
  const pagoId = r!.id as number;
  await recalcularCuota(cuotaId);
  if (comprobante) await guardarDoc(comprobante, { cliente_id: clienteId!, poliza_id: polizaId, pago_id: pagoId, tipo: "comprobante", subido_por: yo.id });
  if (reciboPropio) await guardarDoc(reciboPropio, { cliente_id: clienteId!, poliza_id: polizaId, pago_id: pagoId, tipo: "recibo", subido_por: yo.id });
  revalidatePath("/admin");
  ir(`/admin/pagos/${pagoId}`, "ok", "Cobro registrado y recibo emitido.");
}

export async function anularPago(fd: FormData) {
  await requireAdmin();
  const id = Number(txt(fd, "id"));
  const volver = `/admin/pagos/${id}`;
  const motivo = txt(fd, "motivo");
  if (motivo.length < 3) ir(volver, "error", "Indicá el motivo de la anulación.");
  const p = await q1("SELECT cuota_id, estado FROM pagos WHERE id = $1", [id]);
  if (!p) ir("/admin/pagos", "error", "Pago inexistente.");
  if (p!.estado === "anulado") ir(volver, "error", "El pago ya estaba anulado.");
  await q("UPDATE pagos SET estado = 'anulado', anulado_motivo = $2 WHERE id = $1", [id, motivo]);
  await recalcularCuota(p!.cuota_id);
  ir(volver, "ok", "Pago anulado. La cuota volvió a quedar pendiente.");
}

export async function subirArchivoPago(fd: FormData) {
  const yo = await requireAdmin();
  const id = Number(txt(fd, "pago_id"));
  const volver = `/admin/pagos/${id}`;
  const tipo = txt(fd, "tipo") === "recibo" ? "recibo" : "comprobante";
  const p = await q1("SELECT cliente_id, poliza_id FROM pagos WHERE id = $1", [id]);
  if (!p) ir("/admin/pagos", "error", "Pago inexistente.");
  const a = await archivoSeguro(fd, "archivo", volver);
  if (!a) ir(volver, "error", "Elegí un archivo.");
  await guardarDoc(a!, { cliente_id: p!.cliente_id, poliza_id: p!.poliza_id, pago_id: id, tipo, subido_por: yo.id });
  ir(volver, "ok", "Archivo cargado.");
}
