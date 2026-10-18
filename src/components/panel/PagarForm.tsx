"use client";
import { useState } from "react";
import { SubmitButton } from "./Cliente";

type Cuota = { id: number; poliza: string; compania: string; dominio: string | null; numero: number; cuotas_cant: number; venc: string; importe: number; en_revision: boolean };

const ars = (n: number) => n.toLocaleString("es-AR", { style: "currency", currency: "ARS" });

/** Pago del cliente: importe y fecha fijos; solo efectivo o Mercado Pago. */
export function PagarForm({ cuotas, hoy, mp, action }: { cuotas: Cuota[]; hoy: string; mp: string; action: (fd: FormData) => void | Promise<void> }) {
  const libres = cuotas.filter((c) => !c.en_revision);
  const [cuota, setCuota] = useState<string>(libres[0] ? String(libres[0].id) : "");
  const [metodo, setMetodo] = useState<"efectivo" | "mercadopago">("mercadopago");
  const sel = cuotas.find((c) => String(c.id) === cuota);
  const fijo = "mt-1.5 w-full border border-line bg-soft px-3 py-3 text-lg font-semibold text-brand-900";

  return (
    <form action={action} className="space-y-6">
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-brand-900">1. Elegí la cuota que querés pagar</legend>
        <div className="space-y-2">
          {cuotas.map((c) => (
            <label key={c.id} className={`flex items-center gap-3 border p-3 text-sm ${c.en_revision ? "cursor-not-allowed opacity-60" : "cursor-pointer"} ${cuota === String(c.id) ? "border-brand-500 bg-brand-50" : "border-line bg-white hover:border-brand-200"}`}>
              <input type="radio" name="cuota_id" value={c.id} required disabled={c.en_revision} checked={cuota === String(c.id)} onChange={() => setCuota(String(c.id))} className="h-5 w-5 accent-[var(--brand-700)]" />
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
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="text-sm font-semibold text-brand-900">
          Importe a pagar
          <div className={fijo}>{sel ? ars(sel.importe) : "—"}</div>
          <span className="mt-1 block text-xs font-normal text-ink-soft">Es el importe de la cuota.</span>
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
          {([["mercadopago", "Mercado Pago", "Pagás desde tu celular y subís el comprobante."], ["efectivo", "Efectivo", "Pagás en la oficina (San Lorenzo 600, San Rafael)."]] as const).map(([v, t, d]) => (
            <label key={v} className={`flex cursor-pointer items-start gap-3 border p-4 ${metodo === v ? "border-brand-500 bg-brand-50" : "border-line bg-white hover:border-brand-200"}`}>
              <input type="radio" name="metodo" value={v} checked={metodo === v} onChange={() => setMetodo(v)} className="mt-1 h-5 w-5 accent-[var(--brand-700)]" />
              <span><strong className="block text-brand-900">{t}</strong><span className="text-sm text-ink-soft">{d}</span></span>
            </label>
          ))}
        </div>
      </fieldset>

      {metodo === "mercadopago" ? (
        <div className="space-y-4 border border-line bg-soft p-4">
          <div>
            <p className="text-sm font-semibold text-brand-900">Cómo pagar por Mercado Pago</p>
            <p className="mt-1 whitespace-pre-line text-sm text-ink-soft">{mp || "Pedinos por WhatsApp el alias o el link de pago de Mercado Pago. Después subí acá el comprobante."}</p>
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
      <SubmitButton variant="gold" pendiente="Enviando…">{metodo === "efectivo" ? "Avisar que voy a pagar en efectivo" : "Enviar comprobante de pago"}</SubmitButton>
    </form>
  );
}
