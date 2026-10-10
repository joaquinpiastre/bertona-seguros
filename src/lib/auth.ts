import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { q1 } from "./db";

const COOKIE = "bz_session";

function secret() {
  const s = process.env.AUTH_SECRET || (process.env.NODE_ENV !== "production" ? "dev-secret-bertona-cambiar" : "");
  if (!s) throw new Error("Falta AUTH_SECRET");
  return new TextEncoder().encode(s);
}

export async function crearSesion(uid: number) {
  const token = await new SignJWT({ uid }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("7d").sign(secret());
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

export type Usuario = {
  id: number;
  email: string;
  nombre: string;
  rol: "admin" | "socio";
  cliente_id: number | null;
  debe_cambiar_password: boolean;
};

export const getUsuario = cache(async (): Promise<Usuario | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const u = await q1(
      "SELECT id, email, nombre, rol, cliente_id, debe_cambiar_password FROM usuarios WHERE id = $1 AND activo",
      [Number(payload.uid)]
    );
    return (u as Usuario | null) ?? null;
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

// Limitador simple de intentos de login (en memoria; se reinicia con cada instancia).
const intentos = new Map<string, { n: number; hasta: number }>();
export function loginBloqueado(clave: string) {
  const i = intentos.get(clave);
  return !!i && i.n >= 8 && i.hasta > Date.now();
}
export function loginFallido(clave: string) {
  const i = intentos.get(clave);
  const ahora = Date.now();
  if (!i || i.hasta < ahora) intentos.set(clave, { n: 1, hasta: ahora + 10 * 60_000 });
  else i.n++;
}
export function loginOk(clave: string) {
  intentos.delete(clave);
}

/** Socio logueado; si debe cambiar la contraseña temporal lo manda a su perfil. */
export async function portalUsuario(opts: { permitirCambio?: boolean } = {}) {
  const u = await requireSocio();
  if (u.debe_cambiar_password && !opts.permitirCambio) redirect("/portal/perfil?cambiar=1");
  return u;
}
