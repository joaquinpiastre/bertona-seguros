import bcrypt from "bcryptjs";
import { requireSocio } from "../auth";
import { q, q1 } from "../db";
import { leerArchivo } from "../archivos";
import { ir, num, txt, txtONull } from "../flash";
import { METODOS, esFecha } from "../format";

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

export async function actualizarPerfil(fd: FormData) {
  const u = await requireSocio();
  await q("UPDATE clientes SET telefono = $2, direccion = $3, localidad = $4 WHERE id = $1", [
    u.cliente_id, txtONull(fd, "telefono"), txtONull(fd, "direccion"), txtONull(fd, "localidad"),
  ]);
  ir("/portal/perfil", "ok", "Datos actualizados.");
}

export async function cambiarPassword(fd: FormData) {
  const u = await requireSocio();
  const actual = String(fd.get("actual") ?? "");
  const nueva = String(fd.get("nueva") ?? "");
  const repetir = String(fd.get("repetir") ?? "");
  const row = await q1("SELECT password_hash FROM usuarios WHERE id = $1", [u.id]);
  if (!row || !(await bcrypt.compare(actual, row.password_hash))) ir("/portal/perfil", "error", "La contraseña actual no es correcta.");
  if (nueva.length < 8) ir("/portal/perfil", "error", "La nueva contraseña debe tener al menos 8 caracteres.");
  if (nueva !== repetir) ir("/portal/perfil", "error", "Las contraseñas nuevas no coinciden.");
  await q("UPDATE usuarios SET password_hash = $2, debe_cambiar_password = FALSE WHERE id = $1", [u.id, await bcrypt.hash(nueva, 10)]);
  ir("/portal/perfil", "ok", "Contraseña actualizada.");
}

/** El socio informa un pago y adjunta el comprobante; el administrador lo revisa y lo impacta. */
export async function enviarComprobante(fd: FormData) {
  const u = await requireSocio();
  const volver = "/portal/pagos";
  const cuotaId = Number(txt(fd, "cuota_id")) || null;
  const metodo = txt(fd, "metodo") || "transferencia";
  const fecha = txt(fd, "fecha");
  const importe = num(fd, "importe");
  if (!METODOS[metodo]) ir(volver, "error", "Elegí la forma de pago.");
  if (fecha && !esFecha(fecha)) ir(volver, "error", "La fecha no es válida.");
  let a;
  try {
    a = await leerArchivo(fd, "archivo");
  } catch (e) {
    ir(volver, "error", e instanceof Error ? e.message : "Archivo inválido.");
  }
  if (!a) ir(volver, "error", "Adjuntá la foto o el PDF del comprobante.");
  let polizaId: number | null = null;
  if (cuotaId) {
    const c = await q1(
      "SELECT c.estado, c.poliza_id FROM cuotas c JOIN polizas p ON p.id = c.poliza_id WHERE c.id = $1 AND p.cliente_id = $2",
      [cuotaId, u.cliente_id]
    );
    if (!c) ir(volver, "error", "La cuota elegida no es tuya o no existe.");
    if (c!.estado !== "pendiente") ir(volver, "error", "Esa cuota ya figura como paga.");
    polizaId = c!.poliza_id;
  }
  const abiertos = await q1("SELECT COUNT(*)::int AS n FROM avisos_pago WHERE cliente_id = $1 AND estado = 'pendiente'", [u.cliente_id]);
  if (abiertos!.n >= 10) ir(volver, "error", "Ya tenés varios comprobantes en revisión. Esperá a que los procesemos.");
  const d = await q1(
    `INSERT INTO documentos (cliente_id, poliza_id, tipo, nombre, mime, tamano, datos, subido_por)
     VALUES ($1,$2,'comprobante',$3,$4,$5,$6,$7) RETURNING id`,
    [u.cliente_id, polizaId, a!.nombre, a!.mime, a!.datos.length, a!.datos, u.id]
  );
  await q(
    `INSERT INTO avisos_pago (cliente_id, poliza_id, cuota_id, importe, fecha, metodo, nota, documento_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [u.cliente_id, polizaId, cuotaId, Number.isFinite(importe) ? importe : null, fecha || null, metodo, txtONull(fd, "nota"), d!.id]
  );
  ir(volver, "ok", "Recibimos tu comprobante. Lo vamos a revisar y, cuando lo confirmemos, vas a ver tu recibo acá.");
}
