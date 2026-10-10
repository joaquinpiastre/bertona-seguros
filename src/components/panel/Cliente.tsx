"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { btnDanger, btnGold, btnGhost, btnPrimary, btnSm } from "./ui";

export function SubmitButton({
  children,
  variant = "primary",
  small,
  confirmar,
  pendiente = "Guardando…",
}: {
  children: React.ReactNode;
  variant?: "primary" | "gold" | "ghost" | "danger";
  small?: boolean;
  /** Pide confirmación antes de enviar el formulario. */
  confirmar?: string;
  pendiente?: string;
}) {
  const { pending } = useFormStatus();
  const c = { primary: btnPrimary, gold: btnGold, ghost: btnGhost, danger: btnDanger }[variant];
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (confirmar && !window.confirm(confirmar)) e.preventDefault();
      }}
      className={`${c} ${small ? btnSm : ""}`}
    >
      {pending ? pendiente : children}
    </button>
  );
}

export function NavLinks({ items, onClick }: { items: { href: string; label: string; exact?: boolean }[]; onClick?: () => void }) {
  const path = usePathname();
  return (
    <>
      {items.map((i) => {
        const activo = i.exact ? path === i.href : path === i.href || path.startsWith(i.href + "/");
        return (
          <Link
            key={i.href}
            href={i.href}
            onClick={onClick}
            aria-current={activo ? "page" : undefined}
            className={`block border-l-2 px-4 py-2.5 text-sm font-medium transition ${
              activo ? "border-accent-400 bg-white/10 text-white" : "border-transparent text-brand-100 hover:bg-white/5 hover:text-white"
            }`}
          >
            {i.label}
          </Link>
        );
      })}
    </>
  );
}

export function MenuMovil({ items }: { items: { href: string; label: string; exact?: boolean }[] }) {
  const [abierto, setAbierto] = useState(false);
  const path = usePathname();
  useEffect(() => setAbierto(false), [path]);
  return (
    <div className="lg:hidden">
      <button
        onClick={() => setAbierto((a) => !a)}
        aria-expanded={abierto}
        aria-label="Menú"
        className="grid h-10 w-10 place-items-center border border-white/25 text-white"
      >
        <span className="text-xl leading-none">{abierto ? "×" : "≡"}</span>
      </button>
      {abierto && (
        <nav className="absolute inset-x-0 top-14 z-30 border-t border-white/10 bg-brand-900 pb-3">
          <NavLinks items={items} />
        </nav>
      )}
    </div>
  );
}

/** Formulario de cobro: al elegir una cuota completa el importe. */
export function CobroForm({
  cuotas,
  hoy,
  metodos,
  polizas,
  cuotaInicial,
  clienteId,
  action,
}: {
  cuotas: { id: number; poliza: string; compania: string; dominio: string; numero: number; total: number; vencimiento: string; importe: number; vencida: boolean }[];
  hoy: string;
  metodos: [string, string][];
  polizas: { id: number; label: string }[];
  cuotaInicial?: number;
  clienteId: number;
  action: (fd: FormData) => void | Promise<void>;
}) {
  const [cuota, setCuota] = useState<string>(cuotaInicial ? String(cuotaInicial) : "");
  const imp = useRef<HTMLInputElement>(null);
  const sel = cuotas.find((c) => String(c.id) === cuota);
  useEffect(() => {
    if (sel && imp.current) imp.current.value = String(sel.importe);
  }, [sel]);
  const campo = "mt-1.5 w-full border border-line bg-white px-3 py-2.5 text-sm text-ink hover:border-brand-200 focus:border-brand-500";
  const lab = "block text-sm font-semibold text-brand-900";
  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="cliente_id" value={clienteId} />
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-brand-900">¿Qué cuota se paga?</legend>
        <div className="space-y-2">
          {cuotas.map((c) => (
            <label key={c.id} className={`flex cursor-pointer items-center gap-3 border p-3 text-sm ${cuota === String(c.id) ? "border-brand-500 bg-brand-50" : "border-line bg-white hover:border-brand-200"}`}>
              <input type="radio" name="cuota_id" value={c.id} checked={cuota === String(c.id)} onChange={() => setCuota(String(c.id))} className="h-4 w-4 accent-[var(--brand-700)]" />
              <span className="flex-1">
                <strong className="text-brand-900">Póliza {c.poliza}</strong> · {c.compania}
                {c.dominio ? ` · ${c.dominio}` : ""} · Cuota {c.numero}/{c.total}
                <span className="block text-xs text-ink-soft">
                  Vence {c.vencimiento.split("-").reverse().join("/")} {c.vencida && <strong className="text-red-700">· VENCIDA</strong>}
                </span>
              </span>
              <strong className="text-brand-900">{c.importe.toLocaleString("es-AR", { style: "currency", currency: "ARS" })}</strong>
            </label>
          ))}
          <label className={`flex cursor-pointer items-center gap-3 border p-3 text-sm ${cuota === "" ? "border-brand-500 bg-brand-50" : "border-line bg-white hover:border-brand-200"}`}>
            <input type="radio" name="cuota_id" value="" checked={cuota === ""} onChange={() => setCuota("")} className="h-4 w-4 accent-[var(--brand-700)]" />
            <span className="flex-1">Pago a cuenta / sin cuota asociada</span>
          </label>
        </div>
        {cuota === "" && (
          <label className={`${lab} mt-3 max-w-md`}>
            Póliza (opcional)
            <select name="poliza_id" defaultValue="" className={campo}>
              <option value="">Sin póliza</option>
              {polizas.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </label>
        )}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className={lab}>
          Importe cobrado (ARS) <span className="text-red-600">*</span>
          <input ref={imp} name="importe" required inputMode="decimal" placeholder="0,00" className={campo} />
        </label>
        <label className={lab}>
          Fecha de pago <span className="text-red-600">*</span>
          <input name="fecha" type="date" required defaultValue={hoy} className={campo} />
        </label>
        <label className={lab}>
          Forma de pago <span className="text-red-600">*</span>
          <select name="metodo" required defaultValue="efectivo" className={campo}>
            {metodos.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </label>
        <label className={`${lab} sm:col-span-3`}>
          Referencia (N° de operación, cheque, etc.)
          <input name="referencia" className={campo} />
        </label>
        <label className={`${lab} sm:col-span-3`}>
          Observaciones
          <textarea name="observaciones" rows={2} className={campo} />
        </label>
        <label className={lab}>
          Comprobante de pago (opcional)
          <input name="comprobante" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className={`${campo} file:mr-3 file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-700`} />
        </label>
        <label className={`${lab} sm:col-span-2`}>
          Recibo propio ya emitido (opcional)
          <input name="recibo_propio" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className={`${campo} file:mr-3 file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-700`} />
          <span className="mt-1 block text-xs font-normal text-ink-soft">Si lo cargás, el cliente verá este recibo. Si no, se genera uno automáticamente.</span>
        </label>
      </div>
      <SubmitButton variant="gold" pendiente="Registrando…">Registrar cobro y emitir recibo</SubmitButton>
    </form>
  );
}
