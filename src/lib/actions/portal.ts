"use server";
import bcrypt from "bcryptjs";
import { requireSocio } from "../auth";
import { q, q1 } from "../db";
import { ir, txt, txtONull } from "../flash";

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
