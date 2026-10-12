import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { COOKIE, cabeceras } from "./api";

export type Usuario = {
  id: number;
  email: string;
  nombre: string;
  rol: "admin" | "socio";
  cliente_id: number | null;
  debe_cambiar_password: boolean;
};

export async function guardarSesion(token: string) {
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 7 * 24 * 3600,
  });
}

export async function cerrarSesion() {
  (await cookies()).delete(COOKIE);
}

/** Usuario actual según el backend (una consulta por solicitud). */
export const getUsuario = cache(async (): Promise<Usuario | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const base = process.env.API_URL?.replace(/\/$/, "");
  if (!base) throw new Error("Falta API_URL");
  try {
    const r = await fetch(`${base}/me`, { headers: await cabeceras(), cache: "no-store" });
    if (!r.ok) return null;
    return ((await r.json()) as { user: Usuario | null }).user;
  } catch {
    return null;
  }
});

export async function requireAdmin(): Promise<Usuario> {
  const u = await getUsuario();
  if (!u || u.rol !== "admin") redirect("/ingresar");
  return u;
}

export async function requireSocio(): Promise<Usuario & { cliente_id: number }> {
  const u = await getUsuario();
  if (!u || u.rol !== "socio" || !u.cliente_id) redirect("/ingresar");
  return u as Usuario & { cliente_id: number };
}

/** Socio logueado; si debe cambiar la contraseña temporal lo manda a su perfil. */
export async function portalUsuario(opts: { permitirCambio?: boolean } = {}) {
  const u = await requireSocio();
  if (u.debe_cambiar_password && !opts.permitirCambio) redirect("/portal/perfil?cambiar=1");
  return u;
}
