/** Sorteo Speedway: textos y utilidades que usan tanto la página pública como el panel (sin nada del servidor). */

export const VEHICULOS: [string, string][] = [
  ["auto", "Auto"],
  ["moto", "Moto"],
  ["camioneta", "Camioneta"],
  ["ninguno", "Ninguno"],
];
export const VEHICULO: Record<string, string> = Object.fromEntries(VEHICULOS);

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
export const VENCIMIENTOS: [string, string][] = [...MESES.map((m, i): [string, string] => [String(i + 1).padStart(2, "0"), m]), ["sin_seguro", "No tengo seguro"]];
export const VENCIMIENTO: Record<string, string> = Object.fromEntries(VENCIMIENTOS);

export const ESTADO_SORTEO: Record<string, string> = { abierto: "Abierto", proximo: "Todavía no empezó", finalizado: "Inscripción cerrada" };

/** Orígenes sugeridos para los QR (?src=). */
export const ORIGENES_SUGERIDOS = ["cartel-pista", "flyer", "redes", "locutor", "stand", "oficina"];

export type SorteoPublico = {
  id: number;
  titulo: string;
  premio: string;
  descripcion: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  fecha_sorteo: string | null;
  whatsapp: string;
  mensaje: string;
};
export type DatosPublicos = { estado: "abierto" | "proximo" | "finalizado" | "sin_sorteo" | "error"; sorteo: SorteoPublico | null };

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

/** "2026-12-12" → "viernes 12/12". */
export function diaCorto(iso: string | null | undefined): string {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return "";
  return `${DIAS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]} ${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`;
}

/** "2026-12-12T22:00" → "viernes 12/12 a las 22 h" (o "22:30 h"). */
export function fechaSorteoTexto(v: string | null | undefined): string {
  if (!v) return "";
  const dia = diaCorto(v);
  const hora = v.slice(11, 16);
  if (!dia) return "";
  if (!hora) return dia;
  return `${dia} a las ${hora.endsWith(":00") ? hora.slice(0, 2).replace(/^0/, "") : hora} h`;
}

/** "2026-12-12" → "12/12/2026". */
export const fechaCorta = (iso: string | null | undefined) => (iso ? iso.slice(0, 10).split("-").reverse().join("/") : "");

/** Mensaje de confirmación con el código. Si el texto configurado no tiene {codigo}, el código se agrega al final. */
export function mensajeConfirmacion(plantilla: string, codigo: string): string {
  const t = (plantilla || "Hola! Quiero confirmar mi participación en el sorteo Speedway de Bertona Seguros. Mi código es {codigo}").trim();
  return t.includes("{codigo}") ? t.split("{codigo}").join(codigo) : `${t} Mi código es ${codigo}`;
}

export const enlaceWhatsapp = (numero: string, texto: string) => `https://wa.me/${numero.replace(/\D/g, "")}?text=${encodeURIComponent(texto)}`;

export const CODIGO_RE = /^BS-\d{4,6}$/;

/** Estado del formulario público (errores de validación y lo que había escrito la persona). */
export type EstadoInscripcion = { error?: string; campo?: string; valores?: Record<string, string>; intento?: number };

export type ResultadoSorteo = {
  ok: boolean;
  error?: string;
  prueba?: boolean;
  tipo?: "ganador" | "suplente";
  elegibles?: number;
  ganador?: { codigo: string; nombre: string; localidad: string; wa_oculto: string };
};
