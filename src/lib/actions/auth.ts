"use server";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { cerrarSesion, crearSesion, loginBloqueado, loginFallido, loginOk } from "../auth";
import { q1 } from "../db";
import { ir, txt } from "../flash";

export async function login(fd: FormData) {
  const email = txt(fd, "email").toLowerCase();
  const pass = String(fd.get("password") ?? "");
  if (!email || !pass) ir("/ingresar", "error", "Ingresá tu email y contraseña.");
  if (loginBloqueado(email)) ir("/ingresar", "error", "Demasiados intentos. Probá de nuevo en unos minutos.");
  const u = await q1("SELECT id, rol, password_hash, activo FROM usuarios WHERE email = $1", [email]);
  const ok = u && u.activo && (await bcrypt.compare(pass, u.password_hash));
  if (!ok) {
    loginFallido(email);
    ir("/ingresar", "error", "Email o contraseña incorrectos.");
  }
  loginOk(email);
  await crearSesion(u!.id);
  redirect(u!.rol === "admin" ? "/admin" : "/portal");
}

export async function logout() {
  await cerrarSesion();
  redirect("/");
}
