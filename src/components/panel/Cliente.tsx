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
  disabled,
}: {
  children: React.ReactNode;
  variant?: "primary" | "gold" | "ghost" | "danger";
  small?: boolean;
  /** Pide confirmación antes de enviar el formulario. */
  confirmar?: string;
  pendiente?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  const c = { primary: btnPrimary, gold: btnGold, ghost: btnGhost, danger: btnDanger }[variant];
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      onClick={(e) => {
        if (confirmar && !window.confirm(confirmar)) e.preventDefault();
      }}
      className={`${c} ${small ? btnSm : ""}`}
    >
      {pending ? pendiente : children}
    </button>
  );
}

type ItemNav = { href: string; label: string; exact?: boolean; badge?: number };

export function NavLinks({ items, onClick }: { items: ItemNav[]; onClick?: () => void }) {
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
            <span className="flex items-center justify-between gap-2">
              {i.label}
              {i.badge ? <span className="min-w-5 bg-accent-500 px-1.5 text-center text-[11px] font-bold leading-5 text-brand-900">{i.badge}</span> : null}
            </span>
          </Link>
        );
      })}
    </>
  );
}

export function MenuMovil({ items }: { items: ItemNav[] }) {
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

/** Formulario de cobro: solo efectivo o transferencia; el importe es el de la cuota y la fecha es hoy (no se editan). */
export function CobroForm({
  cuotas,
  hoy,
  cuotaInicial,
  cuotasIniciales = [],
  clienteId,
  action,
}: {
  cuotas: { id: number; poliza: string; compania: string; dominio: string; numero: number; total: number; vencimiento: string; importe: number; vencida: boolean }[];
  hoy: string;
  cuotaInicial?: number;
  cuotasIniciales?: number[];
  clienteId: number;
  action: (fd: FormData) => void | Promise<void>;
}) {
  const [elegidas, setElegidas] = useState<Set<number>>(() => new Set(cuotasIniciales.length ? cuotasIniciales : cuotaInicial ? [cuotaInicial] : []));
  const seleccion = cuotas.filter((c) => elegidas.has(c.id));
  const totalElegido = seleccion.reduce((s, c) => s + c.importe, 0);
  const alternar = (id: number) =>
    setElegidas((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const ars = (n: number) => n.toLocaleString("es-AR", { style: "currency", currency: "ARS" });
  const campo = "mt-1.5 w-full border border-line bg-white px-3 py-2.5 text-sm text-ink hover:border-brand-200 focus:border-brand-500";
  const fijo = "mt-1.5 w-full border border-line bg-soft px-3 py-2.5 text-sm font-semibold text-brand-900";
  const lab = "block text-sm font-semibold text-brand-900";
  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="cliente_id" value={clienteId} />
      <fieldset>
        <legend className="mb-1 text-sm font-semibold text-brand-900">¿Qué cuotas se pagan? <span className="text-red-600">*</span></legend>
        <p className="mb-3 text-xs text-ink-soft">Se puede cobrar más de una cuota a la vez: se emite un solo recibo por todas.</p>
        <div className="mb-3 flex flex-wrap gap-2 text-xs font-semibold">
          {cuotas.some((c) => c.vencida) && <button type="button" onClick={() => setElegidas(new Set(cuotas.filter((c) => c.vencida).map((c) => c.id)))} className="border border-line bg-white px-3 py-2 text-brand-800 hover:border-brand-500">Elegir las vencidas</button>}
          {cuotas.length > 1 && <button type="button" onClick={() => setElegidas(new Set(cuotas.map((c) => c.id)))} className="border border-line bg-white px-3 py-2 text-brand-800 hover:border-brand-500">Elegir todas</button>}
          {elegidas.size > 0 && <button type="button" onClick={() => setElegidas(new Set())} className="border border-line bg-white px-3 py-2 text-ink-soft hover:border-brand-500">Quitar selección</button>}
        </div>
        <div className="space-y-2">
          {cuotas.map((c) => (
            <label key={c.id} className={`flex cursor-pointer items-center gap-3 border p-3 text-sm ${elegidas.has(c.id) ? "border-brand-500 bg-brand-50" : "border-line bg-white hover:border-brand-200"}`}>
              <input type="checkbox" name="cuota_id" value={c.id} checked={elegidas.has(c.id)} onChange={() => alternar(c.id)} className="h-4 w-4 accent-[var(--brand-700)]" />
              <span className="flex-1">
                <strong className="text-brand-900">Póliza {c.poliza}</strong> · {c.compania}
                {c.dominio ? ` · ${c.dominio}` : ""} · Cuota {c.numero}/{c.total}
                <span className="block text-xs text-ink-soft">
                  Vence {c.vencimiento.split("-").reverse().join("/")} {c.vencida && <strong className="text-red-700">· VENCIDA</strong>}
                </span>
              </span>
              <strong className="text-brand-900">{ars(c.importe)}</strong>
            </label>
          ))}
          {cuotas.length === 0 && <p className="text-sm text-ink-soft">Este cliente no tiene cuotas pendientes de cobro.</p>}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className={lab}>
          Importe a cobrar{seleccion.length > 1 ? ` (${seleccion.length} cuotas)` : ""}
          <div className={fijo}>{seleccion.length ? ars(totalElegido) : "Elegí una cuota"}</div>
          <span className="mt-1 block text-xs font-normal text-ink-soft">Es la suma de las cuotas elegidas: no se modifica.</span>
        </div>
        <div className={lab}>
          Fecha de pago
          <div className={fijo}>{hoy.split("-").reverse().join("/")}</div>
          <span className="mt-1 block text-xs font-normal text-ink-soft">Se registra con la fecha de hoy.</span>
        </div>
        <label className={lab}>
          Forma de pago <span className="text-red-600">*</span>
          <select name="metodo" required defaultValue="efectivo" className={campo}>
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
          </select>
        </label>
        <label className={`${lab} sm:col-span-3`}>
          Referencia (N° de operación de la transferencia, etc.)
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

type AccionForm = (fd: FormData) => void | Promise<void>;

/** Casilla de aviso de cobranza ("1er aviso" / "2.º aviso"): al tocarla se guarda sola y queda registrado a quién ya se le avisó. */
export function AvisoCheck({ action, ids, aviso, marcado, texto, volver }: { action: AccionForm; ids: number[]; aviso: 1 | 2; marcado: boolean; texto?: string; volver: string }) {
  return (
    <form action={action} className="inline-flex flex-wrap items-center gap-2">
      <input type="hidden" name="volver" value={volver} />
      <input type="hidden" name="aviso" value={aviso} />
      <input type="hidden" name="valor" value={marcado ? "0" : "1"} />
      {ids.map((id) => <input key={id} type="hidden" name="cuota_id" value={id} />)}
      <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold text-brand-900">
        <input type="checkbox" checked={marcado} onChange={(e) => e.currentTarget.form?.requestSubmit()} className="h-5 w-5 cursor-pointer" />
        {aviso === 1 ? "1er aviso" : "2.º aviso"}
      </label>
      {texto && <span className="text-xs text-ink-soft">{texto}</span>}
    </form>
  );
}

/**
 * Botón de WhatsApp de cobranza: abre la conversación y deja marcado el aviso (1.º o 2.º) de esas cuotas en el mismo toque.
 * Con `confirmar` pide confirmación antes de mandarlo (por ejemplo si ya se envió o si todavía es pronto para el 2.º aviso).
 */
export function EnviarAviso({ action, ids, url, aviso, etiqueta, confirmar, destacado, volver }: { action: AccionForm; ids: number[]; url: string; aviso: 1 | 2; etiqueta: string; confirmar?: string; destacado: boolean; volver: string }) {
  const form = useRef<HTMLFormElement>(null);
  return (
    <form ref={form} action={action} className="inline-flex">
      <input type="hidden" name="volver" value={volver} />
      <input type="hidden" name="aviso" value={aviso} />
      <input type="hidden" name="valor" value="1" />
      {ids.map((id) => <input key={id} type="hidden" name="cuota_id" value={id} />)}
      <button
        type="button"
        onClick={() => {
          if (confirmar && !window.confirm(confirmar)) return;
          window.open(url, "_blank", "noopener,noreferrer");
          form.current?.requestSubmit();
        }}
        className={`inline-flex min-h-11 items-center gap-2 px-5 py-2.5 text-sm font-semibold ${destacado ? "bg-[#1fa855] text-white hover:bg-[#188a45]" : "border border-line bg-white text-brand-800 hover:border-brand-500"}`}
      >
        {etiqueta}
      </button>
    </form>
  );
}
