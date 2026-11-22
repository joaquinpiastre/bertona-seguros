/**
 * Sorteo Speedway: llamadas al backend (rutas /sorteo/*). Solo se usa del lado del servidor de Vercel,
 * igual que src/lib/api.ts (el navegador nunca habla con la API ni ve sus claves).
 */
import { notFound, redirect } from "next/navigation";
import { cabeceras, type Row } from "@/lib/api";
import type { DatosPublicos } from "./comun";

export const TAG_PUBLICO = "sorteo-publico";

function config() {
  const base = process.env.API_URL?.replace(/\/$/, "");
  const key = process.env.INTERNAL_API_KEY;
  if (!base || !key) throw new Error("Faltan API_URL / INTERNAL_API_KEY");
  return { base, key };
}

/**
 * Datos públicos (sorteo activo, bases). Sin cookies, así se guardan unos segundos en la caché de Vercel y la página carga
 * al instante desde el QR; al guardar cambios en el panel se renuevan en el momento (TAG_PUBLICO).
 * Si el backend no responde, devuelve null en vez de romper la página.
 */
async function publico<T>(ruta: string): Promise<T | null> {
  try {
    const { base, key } = config();
    const r = await fetch(`${base}/sorteo/${ruta}`, { headers: { "x-internal-key": key }, next: { revalidate: 60, tags: [TAG_PUBLICO] } });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

export const datosPublicos = async (): Promise<DatosPublicos> => (await publico<DatosPublicos>("publico")) ?? { estado: "error", sorteo: null };
export const basesPublicas = () => publico<{ titulo: string; bases: string }>("bases");

/** Inscripción desde el formulario público. */
export async function registrarEnBackend(datos: Record<string, unknown>): Promise<Row> {
  const { base, key } = config();
  const r = await fetch(`${base}/sorteo/registro`, {
    method: "POST",
    headers: { "x-internal-key": key, "content-type": "application/json" },
    body: JSON.stringify(datos),
    cache: "no-store",
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Backend ${r.status}: ${j.error ?? "error"}`);
  return j;
}

/** Confirmación automática por código (bot de WhatsApp). El backend valida el token. */
export async function confirmarCodigoEnBackend(token: string, datos: unknown): Promise<Response> {
  const { base, key } = config();
  const r = await fetch(`${base}/sorteo/confirmar-codigo`, {
    method: "POST",
    headers: { "x-internal-key": key, "x-sorteo-token": token, "content-type": "application/json" },
    body: JSON.stringify(datos ?? {}),
    cache: "no-store",
  });
  const j = await r.json().catch(() => ({ ok: false, error: "Respuesta inválida del servidor." }));
  return Response.json(j, { status: r.status, headers: { "Cache-Control": "no-store" } });
}

// ───── Panel (con la sesión del administrador) ─────

/** Consulta del panel. Redirige / 404 según indique el backend (igual que dato()). */
export async function datoSorteo<T = Row>(nombre: string, params: Record<string, string | number | undefined | null> = {}): Promise<T> {
  const { base } = config();
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
  const r = await fetch(`${base}/sorteo/admin/${nombre}?${qs}`, { headers: await cabeceras(), cache: "no-store" });
  if (r.status === 401) redirect("/ingresar");
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Backend ${r.status}: ${j.error ?? "error"}`);
  if (j.redirect) redirect(j.redirect);
  if (j.notFound) notFound();
  return j as T;
}

/** Acción del panel: devuelve la respuesta del backend (la redirección la aplica quien llama). */
export async function accionSorteo(nombre: string, fd: FormData): Promise<Row> {
  const { base } = config();
  const r = await fetch(`${base}/sorteo/admin/${nombre}`, { method: "POST", headers: await cabeceras(), body: fd, cache: "no-store" });
  if (r.status === 401) redirect("/ingresar");
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Backend ${r.status}: ${j.error ?? "error"}`);
  return j;
}

/** Descarga (Excel / CSV) con la sesión del administrador. */
export async function archivoSorteo(ruta: string): Promise<Response> {
  const { base } = config();
  const r = await fetch(`${base}/sorteo/${ruta}`, { headers: await cabeceras(), cache: "no-store" });
  const h = new Headers();
  for (const k of ["content-type", "content-disposition", "cache-control", "x-content-type-options"]) {
    const v = r.headers.get(k);
    if (v) h.set(k, v);
  }
  return new Response(r.body, { status: r.status, headers: h });
}
