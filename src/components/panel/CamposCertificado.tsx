"use client";
import { useState } from "react";
import { inputCls } from "./ui";

type Leido = { emitida?: string; vence?: string; poliza?: string; patente?: string };
type Aviso = { tono: "ok" | "aviso"; texto: string };

const norm = (s?: string | null) => String(s ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/^0+/, "");
const dmy = (iso: string) => iso.split("-").reverse().join("/");

/**
 * Archivo + período del certificado. Si el archivo es la constancia en PDF de la compañía, lee su Fecha y su Vencimiento
 * y completa las fechas (editables, para revisar antes de guardar). Avisa si el PDF parece ser de otra póliza o patente.
 */
export function CamposCertificado({ desde: desde0, hasta: hasta0, poliza, dominio }: { desde: string; hasta: string; poliza: string; dominio?: string | null }) {
  const [desde, setDesde] = useState(desde0);
  const [hasta, setHasta] = useState(hasta0);
  const [leyendo, setLeyendo] = useState(false);
  const [avisos, setAvisos] = useState<Aviso[]>([]);

  async function alElegir(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setAvisos([]);
    if (!f || !/\.pdf$/i.test(f.name)) return;
    setLeyendo(true);
    try {
      const fd = new FormData();
      fd.set("archivo", f);
      const r = await fetch("/api/certificado-leer", { method: "POST", body: fd });
      const j = (await r.json().catch(() => ({}))) as { datos?: Leido; error?: string };
      const d = j.datos ?? {};
      const out: Aviso[] = [];
      if (d.emitida && d.vence) {
        setDesde(d.emitida);
        setHasta(d.vence);
        out.push({ tono: "ok", texto: `Fechas leídas del PDF: del ${dmy(d.emitida)} al ${dmy(d.vence)}. Revisalas antes de guardar.` });
      } else {
        out.push({ tono: "aviso", texto: j.error ?? "No pude leer la fecha y el vencimiento de este PDF (puede ser una imagen escaneada u otro formato). Completalas a mano." });
      }
      if (d.poliza && norm(d.poliza) !== norm(poliza)) out.push({ tono: "aviso", texto: `Ojo: el PDF es de la póliza ${d.poliza} y esta es la ${poliza}. ¿Es el archivo correcto?` });
      if (d.patente && dominio && norm(d.patente) !== norm(dominio)) out.push({ tono: "aviso", texto: `Ojo: la patente del PDF (${d.patente}) no coincide con la de esta póliza (${dominio}).` });
      setAvisos(out);
    } catch {
      setAvisos([{ tono: "aviso", texto: "No se pudo leer el PDF. Completá las fechas a mano." }]);
    } finally {
      setLeyendo(false);
    }
  }

  const label = "block text-base font-semibold text-brand-900";
  return (
    <>
      <label className={`${label} lg:col-span-2`}>
        Archivo (PDF o imagen, máx. 4 MB)
        <input type="file" name="archivo" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={alElegir} className={`${inputCls} file:mr-3 file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-700`} />
        <span className="mt-1 block text-sm font-normal text-ink-soft">Si es la constancia en PDF de la compañía, las fechas se completan solas.</span>
      </label>
      <label className={label}>
        Desde (fecha de la constancia)
        <input type="date" name="desde" value={desde} onChange={(e) => setDesde(e.target.value)} required className={inputCls} />
      </label>
      <label className={label}>
        Hasta (vencimiento)
        <input type="date" name="hasta" value={hasta} onChange={(e) => setHasta(e.target.value)} required className={inputCls} />
      </label>
      {(leyendo || avisos.length > 0) && (
        <div className="space-y-2 sm:col-span-2 lg:col-span-4" aria-live="polite">
          {leyendo && <p className="text-sm text-ink-soft">Leyendo el PDF…</p>}
          {avisos.map((a, i) => (
            <p key={i} className={`border-l-4 px-3 py-2 text-sm ${a.tono === "ok" ? "border-emerald-600 bg-emerald-50 text-emerald-900" : "border-amber-500 bg-amber-50 text-amber-900"}`}>{a.texto}</p>
          ))}
        </div>
      )}
    </>
  );
}
