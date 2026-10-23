/** Lee los datos que figuran en la constancia de cobertura que emite la compañía (PDF del portal de productores). Solo lee: no modifica el archivo. */
import { extractText, getDocumentProxy } from "unpdf";

export type DatosCertificado = {
  emitida?: string; // "Fecha:" (ISO)
  vence?: string; // "Vencimiento:" (ISO)
  vigenciaDesde?: string;
  vigenciaHasta?: string;
  poliza?: string;
  patente?: string;
};

const FECHA = "(\\d{1,2})\\/(\\d{1,2})\\/(\\d{4})";
const iso = (m: RegExpMatchArray | null) => (m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : undefined);

/** Extrae las fechas y los datos clave del texto de la constancia. Devuelve {} si no es una constancia legible (ej. un escaneo). */
export function datosDeTexto(texto: string): DatosCertificado {
  const t = texto.replace(/\s+/g, " ");
  const out: DatosCertificado = {
    emitida: iso(t.match(new RegExp(`(?<![\\wÁ-ú])Fecha:\\s*${FECHA}`, "i"))),
    vence: iso(t.match(new RegExp(`Vencimiento:\\s*${FECHA}`, "i"))),
    vigenciaDesde: iso(t.match(new RegExp(`Vigencia Desde:\\s*${FECHA}`, "i"))),
    vigenciaHasta: iso(t.match(new RegExp(`Vigencia Hasta:\\s*${FECHA}`, "i"))),
    poliza: t.match(/N[úu]mero de P[óo]liza:\s*([0-9][A-Z0-9-]*)/i)?.[1],
    patente: t.match(/Patente:\s*([A-Z0-9]{6,7})\b/i)?.[1]?.toUpperCase(),
  };
  for (const k of Object.keys(out) as (keyof DatosCertificado)[]) if (!out[k]) delete out[k];
  return out;
}

export async function leerCertificadoPdf(datos: Uint8Array): Promise<DatosCertificado> {
  const pdf = await getDocumentProxy(new Uint8Array(datos));
  const { text } = await extractText(pdf, { mergePages: true });
  return datosDeTexto(text);
}
