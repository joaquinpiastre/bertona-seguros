/**
 * Números de WhatsApp de Argentina: se aceptan como los escribe la gente (con 0, con 15, con +54 9, con espacios o guiones)
 * y se guardan siempre igual: +549 + código de área + número (10 cifras), por ejemplo +5492604123456.
 */

// Códigos de área de 3 cifras (el 11 es el único de 2; el resto son de 4). Sirve para saber dónde está el "15".
const AREAS_3 = new Set([
  "220", "221", "223", "230", "236", "237", "249", "260", "261", "263", "264", "266", "280", "291", "294", "297", "299",
  "336", "341", "342", "343", "345", "348", "351", "353", "358", "362", "364", "370", "376", "379", "380", "381", "383",
  "385", "387", "388",
]);

const largoArea = (n: string) => (n.startsWith("11") ? 2 : AREAS_3.has(n.slice(0, 3)) ? 3 : 4);

export type ResultadoWhatsapp = { ok: true; numero: string } | { ok: false; error: string };

export function normalizarWhatsapp(entrada: unknown): ResultadoWhatsapp {
  let d = String(entrada ?? "").replace(/\D/g, "");
  if (!d) return { ok: false, error: "Ingresá tu número de WhatsApp." };
  if (d.startsWith("00")) d = d.slice(2); // 0054...
  // Formato internacional: 54 (+ 9 de celulares). Ningún número de Argentina empieza con 5, así que no hay confusión.
  if (d.startsWith("54") && d.length > 10) {
    d = d.slice(2);
    if (d.startsWith("9")) d = d.slice(1);
  } else if (d.startsWith("9") && d.length === 11) {
    d = d.slice(1); // "9 260 4123456"
  }
  if (d.startsWith("0")) d = d.slice(1); // 0260...
  // Con el 15 después del código de área quedan 12 cifras: se saca el 15.
  if (d.length === 12) {
    // Primero donde corresponde según el código de área; si no está ahí, después de 3 o 4 cifras.
    const p = [largoArea(d), 3, 4].find((i) => d.slice(i, i + 2) === "15");
    if (p !== undefined) d = d.slice(0, p) + d.slice(p + 2);
  }
  if (d.length < 10) {
    return { ok: false, error: "Falta el código de área. Escribilo así: 260 4123456 (sin el 0 ni el 15)." };
  }
  if (d.length !== 10 || !/^[123]/.test(d) || /^(\d)\1+$/.test(d)) {
    return { ok: false, error: "Ese número de WhatsApp no parece de Argentina. Escribilo así: 260 4123456 (código de área y número)." };
  }
  return { ok: true, numero: "+549" + d };
}

/** Número para los enlaces wa.me (solo cifras: 549...). */
export const waDigitos = (numero: string) => numero.replace(/\D/g, "");

/** Para mostrar: +54 9 260 412-3456. */
export function whatsappVisible(numero: string | null | undefined): string {
  const d = String(numero ?? "").replace(/\D/g, "");
  if (!d.startsWith("549") || d.length !== 13) return String(numero ?? "");
  const n = d.slice(3);
  const a = largoArea(n);
  const local = n.slice(a);
  const corte = local.length - 4;
  return `+54 9 ${n.slice(0, a)} ${local.slice(0, corte)}-${local.slice(corte)}`;
}

/** Para mostrar en público (pantalla del sorteo): +54 9 260 •••-3456. */
export function whatsappOculto(numero: string | null | undefined): string {
  const d = String(numero ?? "").replace(/\D/g, "");
  if (!d.startsWith("549") || d.length !== 13) return "";
  const n = d.slice(3);
  const a = largoArea(n);
  return `+54 9 ${n.slice(0, a)} •••-${n.slice(-4)}`;
}
