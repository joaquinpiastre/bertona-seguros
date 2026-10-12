import { SignJWT, jwtVerify } from "jose";
import { AsyncLocalStorage } from "node:async_hooks";
import { Redirigir } from "./flash";
import { q1 } from "./db";

function secret() {
  const s = process.env.AUTH_SECRET || (process.env.NODE_ENV !== "production" ? "dev-secret-bertona-cambiar" : "");
  if (!s) throw new Error("Falta AUTH_SECRET");
  return new TextEncoder().encode(s);
}

export async function firmarToken(uid: number) {
  return new SignJWT({ uid }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("7d").sign(secret());
}

export type Usuario = {
  id: number;
  email: string;
  nombre: string;
  rol: "admin" | "socio";
  cliente_id: number | null;
  debe_cambiar_password: boolean;
};

/** Usuario de la solicitud en curso (lo fija el middleware del servidor). */
export const contexto = new AsyncLocalStorage<{ user: Usuario | null }>();

export async function usuarioDeToken(token: string | undefined): Promise<Usuario | null> {
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
}

export const getUsuario = async (): Promise<Usuario | null> => contexto.getStore()?.user ?? null;

export async function requireAdmin(): Promise<Usuario> {
  const u = await getUsuario();
  if (!u || u.rol !== "admin") throw new Redirigir("/ingresar");
  return u;
}

export async function requireSocio(): Promise<Usuario & { cliente_id: number }> {
  const u = await getUsuario();
  if (!u || u.rol !== "socio" || !u.cliente_id) throw new Redirigir("/ingresar");
  return u as Usuario & { cliente_id: number };
}

/** Socio logueado; si debe cambiar la contraseña temporal lo manda a su perfil. */
export async function portalUsuario(opts: { permitirCambio?: boolean } = {}) {
  const u = await requireSocio();
  if (u.debe_cambiar_password && !opts.permitirCambio) throw new Redirigir("/portal/perfil?cambiar=1");
  return u;
}

// Limitador simple de intentos de login (en memoria).
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
