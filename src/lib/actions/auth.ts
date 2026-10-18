"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { iniciarSesion, iniciarSesionDni } from "../api";
import { cerrarSesion, guardarSesion } from "../auth";
import { ir } from "../flash";

/** Ingreso del personal (email + contraseña). */
export async function login(fd: FormData) {
  const email = String(fd.get("email") ?? "").trim();
  const pass = String(fd.get("password") ?? "");
  const r = await iniciarSesion(email, pass);
  if (r.error || !r.token) ir("/ingresar?modo=equipo", "error", r.error ?? "No se pudo ingresar.");
  await guardarSesion(r.token!);
  redirect(r.rol === "admin" ? "/admin" : "/portal");
}

/** Ingreso de clientes: solo con el DNI (y su clave, si la activó). */
export async function loginDni(fd: FormData) {
  const dni = String(fd.get("dni") ?? "").replace(/\D/g, "");
  const pin = String(fd.get("pin") ?? "");
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || "sin-ip";
  const r = await iniciarSesionDni(dni, pin, ip);
  if (r.needsPin) {
    if (r.error) ir(`/ingresar?dni=${dni}&pin=1`, "error", r.error);
    redirect(`/ingresar?dni=${dni}&pin=1`);
  }
  if (r.error || !r.token) ir("/ingresar", "error", r.error ?? "No se pudo ingresar.");
  await guardarSesion(r.token!);
  redirect("/portal");
}

export async function logout() {
  await cerrarSesion();
  redirect("/");
}
