"use server";
import { redirect } from "next/navigation";
import { iniciarSesion } from "../api";
import { cerrarSesion, guardarSesion } from "../auth";
import { ir, } from "../flash";

export async function login(fd: FormData) {
  const email = String(fd.get("email") ?? "").trim();
  const pass = String(fd.get("password") ?? "");
  const r = await iniciarSesion(email, pass);
  if (r.error || !r.token) ir("/ingresar", "error", r.error ?? "No se pudo ingresar.");
  await guardarSesion(r.token!);
  redirect(r.rol === "admin" ? "/admin" : "/portal");
}

export async function logout() {
  await cerrarSesion();
  redirect("/");
}
