"use server";
/** Sorteo Speedway: acciones de formularios. Cada una se ejecuta en el backend (Railway); acá solo se reenvía. */
import { updateTag } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { TAG_PUBLICO, accionSorteo, registrarEnBackend } from "./api";
import type { EstadoInscripcion, ResultadoSorteo } from "./comun";

const CAMPOS = ["nombre", "whatsapp", "localidad", "vehiculo", "vencimiento", "acepta", "alertas"];
const UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];

/** Formulario público de /sorteo. Si sale bien lleva a "Último paso"; si no, devuelve el error y lo que se había escrito. */
export async function inscribirse(prev: EstadoInscripcion, fd: FormData): Promise<EstadoInscripcion> {
  const v = (k: string) => String(fd.get(k) ?? "").slice(0, 300);
  const valores = Object.fromEntries(CAMPOS.map((k) => [k, v(k)]));
  const intento = (prev?.intento ?? 0) + 1;
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "";
  let r;
  try {
    r = await registrarEnBackend({
      ...valores,
      acepta: fd.get("acepta") === "on",
      alertas: fd.get("alertas") === "on",
      origen: v("src"),
      ...Object.fromEntries(UTM.map((k) => [k, v(k)])),
      trampa: v("bz_extra"),
      ip,
    });
  } catch (e) {
    console.error("[sorteo] inscripción", e);
    return { error: "No pudimos conectarnos. Revisá la señal y tocá «Participar» de nuevo.", valores, intento };
  }
  if (!r.ok) return { error: r.error ?? "No pudimos registrar tu participación. Probá de nuevo.", campo: r.campo, valores, intento };
  const qs = new URLSearchParams({ codigo: String(r.codigo) });
  if (r.duplicado) qs.set("ya", "1");
  if (r.confirmado) qs.set("confirmado", "1");
  redirect(`/sorteo/listo?${qs}`);
}

// ───── Panel ─────
async function ejecutar(nombre: string, fd: FormData, cambiaLoPublico = false) {
  const r = await accionSorteo(nombre, fd);
  if (cambiaLoPublico) updateTag(TAG_PUBLICO); // la página del QR muestra el cambio en el momento
  if (r.redirect) redirect(r.redirect);
}

export async function guardarSorteo(fd: FormData) {
  await ejecutar("guardar", fd, true);
}

export async function activarSorteo(fd: FormData) {
  await ejecutar("activar", fd, true);
}

export async function eliminarSorteo(fd: FormData) {
  await ejecutar("eliminar", fd, true);
}

export async function confirmarParticipante(fd: FormData) {
  await ejecutar("confirmar", fd);
}

export async function eliminarParticipante(fd: FormData) {
  await ejecutar("eliminarParticipante", fd);
}

/** Sortea en el servidor y devuelve el resultado (la pantalla lo muestra con la animación). */
export async function sortear(fd: FormData): Promise<ResultadoSorteo> {
  const r = await accionSorteo("sortear", fd);
  if (r.redirect) redirect(r.redirect);
  return {
    ok: !!r.ok,
    error: r.error,
    prueba: r.prueba,
    tipo: r.tipo,
    elegibles: r.elegibles,
    ganador: r.ganador,
  };
}
