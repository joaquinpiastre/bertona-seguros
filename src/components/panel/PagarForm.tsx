"use client";
import { useMemo, useState } from "react";
import { SubmitButton } from "./Cliente";

type Cuota = { id: number; poliza: string; compania: string; dominio: string | null; numero: number; cuotas_cant: number; venc: string; importe: number; en_revision: boolean };

const ars = (n: number) => n.toLocaleString("es-AR", { style: "currency", currency: "ARS" });

/** Pago del cliente: una o varias cuotas a la vez; importe y fecha fijos; solo efectivo o transferencia. */
export function PagarForm({ cuotas, hoy, mp, action, preseleccion = [] }: { cuotas: Cuota[]; hoy: string; mp: string; action: (fd: FormData) => void | Promise<void>; preseleccion?: number[] }) {
  const libres = cuotas.filter((c) => !c.en_revision);
  const [sel, setSel] = useState<Set<number>>(() => new Set(preseleccion.length ? preseleccion : libres[0] ? [libres[0].id] : []));
  const [metodo, setMetodo] = useState<"efectivo" | "transferencia">("transferencia");
  const total = useMemo(() => cuotas.filter((c) => sel.has(c.id)).reduce((s, c) => s + c.importe, 0), [cuotas, sel]);
  const vencidas = libres.filter((c) => c.venc < hoy);
  const fijo = "mt-1.5 w-full border border-line bg-soft px-3 py-3 text-lg font-semibold text-brand-900";

  const alternar = (id: number) =>
    setSel((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <form action={action} className="space-y-6">
      <fieldset>
        <legend className="mb-1 text-sm font-semibold text-brand-900">1. Elegí las cuotas que querés pagar</legend>
        <p className="mb-3 text-xs text-ink-soft">Podés pagar una o varias cuotas juntas: se hace un solo recibo por todas.</p>
        <div className="mb-3 flex flex-wrap gap-2 text-xs font-semibold">
          {vencidas.length > 0 && <button type="button" onClick={() => setSel(new Set(vencidas.map((c) => c.id)))} className="border border-line bg-white px-3 py-2 text-brand-800 hover:border-brand-500">Elegir las vencidas ({vencidas.length})</button>}
          {libres.length > 1 && <button type="button" onClick={() => setSel(new Set(libres.map((c) => c.id)))} className="border border-line bg-white px-3 py-2 text-brand-800 hover:border-brand-500">Elegir todas</button>}
          {sel.size > 0 && <button type="button" onClick={() => setSel(new Set())} className="border border-line bg-white px-3 py-2 text-ink-soft hover:border-brand-500">Quitar la selección</button>}
        </div>
        <div className="space-y-2">
          {cuotas.map((c) => {
            const marcada = sel.has(c.id);
            return (
              <label key={c.id} className={`flex items-center gap-3 border p-3 text-sm ${c.en_revision ? "cursor-not-allowed opacity-60" : "cursor-pointer"} ${marcada ? "border-brand-500 bg-brand-50" : "border-line bg-white hover:border-brand-200"}`}>
                <input type="checkbox" name="cuota_id" value={c.id} disabled={c.en_revision} checked={marcada && !c.en_revision} onChange={() => alternar(c.id)} className="h-5 w-5 accent-[var(--brand-700)]" />
                <span className="flex-1">
                  <strong className="text-brand-900">{c.compania}</strong> · Póliza {c.poliza}{c.dominio ? ` · ${c.dominio}` : ""} · Cuota {c.numero}/{c.cuotas_cant}
                  <span className="block text-xs text-ink-soft">
                    Vence {c.venc.split("-").reverse().join("/")}
                    {c.venc < hoy && <strong className="text-red-700"> · VENCIDA</strong>}
                    {c.en_revision && <strong className="text-amber-700"> · ya informaste el pago, está en revisión</strong>}
                  </span>
                </span>
                <strong className="text-brand-900">{ars(c.importe)}</strong>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="text-sm font-semibold text-brand-900">
          Total a pagar {sel.size > 1 ? `(${sel.size} cuotas)` : ""}
          <div className={fijo}>{sel.size ? ars(total) : "—"}</div>
          <span className="mt-1 block text-xs font-normal text-ink-soft">Es la suma de los importes de las cuotas elegidas.</span>
        </div>
        <div className="text-sm font-semibold text-brand-900">
          Fecha de pago
          <div className={fijo}>{hoy.split("-").reverse().join("/")}</div>
          <span className="mt-1 block text-xs font-normal text-ink-soft">Se registra con la fecha de hoy.</span>
        </div>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-brand-900">2. ¿Cómo vas a pagar?</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {([["transferencia", "Transferencia", "Transferís y subís el comprobante."], ["efectivo", "Efectivo", "Pagás en la oficina (San Lorenzo 600, San Rafael)."]] as const).map(([v, t, d]) => (
            <label key={v} className={`flex cursor-pointer items-start gap-3 border p-4 ${metodo === v ? "border-brand-500 bg-brand-50" : "border-line bg-white hover:border-brand-200"}`}>
              <input type="radio" name="metodo" value={v} checked={metodo === v} onChange={() => setMetodo(v)} className="mt-1 h-5 w-5 accent-[var(--brand-700)]" />
              <span><strong className="block text-brand-900">{t}</strong><span className="text-sm text-ink-soft">{d}</span></span>
            </label>
          ))}
        </div>
      </fieldset>

      {metodo === "transferencia" ? (
        <div className="space-y-4 border border-line bg-soft p-4">
          <div>
            <p className="text-sm font-semibold text-brand-900">Datos para transferir</p>
            <p className="mt-1 whitespace-pre-line text-sm text-ink-soft">{mp || "Pedinos por WhatsApp los datos para transferir. Después subí acá el comprobante."}</p>
          </div>
          <label className="block text-sm font-semibold text-brand-900">3. Subí el comprobante (captura o PDF, máx. 4 MB) <span className="text-red-600">*</span>
            <input name="archivo" type="file" required accept=".pdf,.jpg,.jpeg,.png,.webp" className="mt-1.5 w-full border border-line bg-white px-3 py-2.5 text-sm file:mr-3 file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-700" />
          </label>
        </div>
      ) : (
        <p className="border border-line bg-soft p-4 text-sm text-ink-soft">Tu pago en efectivo queda anotado. Cuando lo abones en la oficina y lo confirmemos, vas a ver tu recibo en esta cuenta.</p>
      )}

      <label className="block text-sm font-semibold text-brand-900">Comentario (opcional)
        <textarea name="nota" rows={2} className="mt-1.5 w-full border border-line bg-white px-3 py-2.5 text-sm" />
      </label>
      <SubmitButton variant="gold" pendiente="Enviando…" disabled={sel.size === 0}>{metodo === "efectivo" ? "Avisar que voy a pagar en efectivo" : "Enviar comprobante de pago"}</SubmitButton>
      {sel.size === 0 && <p className="text-sm text-red-700">Elegí al menos una cuota para continuar.</p>}
    </form>
  );
}
