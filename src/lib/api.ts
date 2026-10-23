/**
 * Cliente del backend (Railway). Solo se usa del lado del servidor de Vercel:
 * el navegador nunca habla con la API ni conoce sus claves.
 */
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any>;
export const COOKIE = "bz_session";

function config() {
  const base = process.env.API_URL?.replace(/\/$/, "");
  const key = process.env.INTERNAL_API_KEY;
  if (!base || !key) throw new Error("Faltan API_URL / INTERNAL_API_KEY");
  return { base, key };
}

export async function cabeceras(): Promise<Record<string, string>> {
  const { key } = config();
  const token = (await cookies()).get(COOKIE)?.value;
  const h: Record<string, string> = { "x-internal-key": key };
  if (token) h.authorization = `Bearer ${token}`;
  return h;
}

/** Consulta de datos para una pantalla. Redirige / 404 según indique el backend. */
export async function dato<T = Row>(nombre: string, params: Record<string, string | number | undefined | null> = {}): Promise<T> {
  const { base } = config();
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
  const r = await fetch(`${base}/data/${nombre}?${qs}`, { headers: await cabeceras(), cache: "no-store" });
  if (r.status === 401) redirect("/ingresar");
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Backend ${r.status}: ${j.error ?? "error"}`);
  if (j.redirect) redirect(j.redirect);
  if (j.notFound) notFound();
  return j as T;
}

/** Ejecuta una acción (formulario) en el backend y aplica la redirección que devuelva. */
export async function accion(nombre: string, fd: FormData): Promise<void> {
  const { base } = config();
  const r = await fetch(`${base}/actions/${nombre}`, { method: "POST", headers: await cabeceras(), body: fd, cache: "no-store" });
  if (r.status === 401) redirect("/ingresar");
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Backend ${r.status}: ${j.error ?? "error"}`);
  if (j.redirect) redirect(j.redirect);
}

export async function iniciarSesion(email: string, password: string): Promise<{ token?: string; rol?: string; error?: string }> {
  const { base } = config();
  const r = await fetch(`${base}/auth/login`, {
    method: "POST",
    headers: { ...(await cabeceras()), "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });
  return r.json().catch(() => ({ error: "No se pudo conectar con el servidor." }));
}

export async function iniciarSesionDni(dni: string, password: string, ip: string): Promise<{ token?: string; rol?: string; error?: string; noEncontrado?: boolean }> {
  const { base } = config();
  const r = await fetch(`${base}/auth/login-dni`, {
    method: "POST",
    headers: { ...(await cabeceras()), "content-type": "application/json" },
    body: JSON.stringify({ dni, password, ip }),
    cache: "no-store",
  });
  return r.json().catch(() => ({ error: "No se pudo conectar con el servidor." }));
}

/** Reenvía una descarga (documento, recibo, CSV) desde el backend conservando cabeceras de archivo. */
/** Pide al backend que lea las fechas de una constancia de cobertura en PDF (solo personal; el backend lo verifica). */
export async function leerCertificado(fd: FormData): Promise<Response> {
  const { base } = config();
  const r = await fetch(`${base}/leer-certificado`, { method: "POST", headers: await cabeceras(), body: fd, cache: "no-store" });
  return new Response(await r.text(), { status: r.status, headers: { "content-type": "application/json" } });
}

export async function archivo(ruta: string): Promise<Response> {
  const { base } = config();
  const r = await fetch(`${base}/files/${ruta}`, { headers: await cabeceras(), cache: "no-store" });
  const h = new Headers();
  for (const k of ["content-type", "content-disposition", "cache-control", "x-content-type-options"]) {
    const v = r.headers.get(k);
    if (v) h.set(k, v);
  }
  return new Response(r.body, { status: r.status, headers: h });
}
