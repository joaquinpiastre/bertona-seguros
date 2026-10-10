import Link from "next/link";
import type { ReactNode } from "react";

export const btn = "inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold transition disabled:opacity-60";
export const btnPrimary = `${btn} bg-brand-900 text-white hover:bg-brand-700`;
export const btnGold = `${btn} bg-accent-500 text-brand-900 hover:bg-accent-400`;
export const btnGhost = `${btn} border border-line bg-white text-brand-800 hover:border-brand-500 hover:text-brand-900`;
export const btnDanger = `${btn} border border-red-200 bg-white text-red-700 hover:bg-red-50`;
export const btnSm = "!px-3 !py-1.5 !text-xs";
export const inputCls =
  "mt-1.5 w-full border border-line bg-white px-3 py-2.5 text-sm text-ink placeholder:text-ink-soft/60 hover:border-brand-200 focus:border-brand-500";

export function Flash({ sp }: { sp: { ok?: string; error?: string } }) {
  if (!sp.ok && !sp.error) return null;
  const ok = !!sp.ok;
  return (
    <div
      data-flash
      role={ok ? "status" : "alert"}
      className={`mb-6 border-l-4 px-4 py-3 text-sm ${ok ? "border-emerald-600 bg-emerald-50 text-emerald-900" : "border-red-600 bg-red-50 text-red-900"}`}
    >
      {sp.ok ?? sp.error}
    </div>
  );
}

export function PageHead({ title, sub, actions }: { title: string; sub?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl text-brand-900 sm:text-3xl">{title}</h1>
        {sub && <p className="mt-1 text-sm text-ink-soft">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, children, actions, className = "" }: { title?: string; children: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <section className={`border border-line bg-white ${className}`}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          {title && <h2 className="text-lg text-brand-900">{title}</h2>}
          {actions}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

const TONOS: Record<string, string> = {
  verde: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  rojo: "bg-red-50 text-red-800 ring-red-200",
  ambar: "bg-amber-50 text-amber-800 ring-amber-200",
  gris: "bg-slate-100 text-slate-700 ring-slate-200",
  azul: "bg-brand-50 text-brand-700 ring-brand-200",
};
export function Badge({ tono = "gris", children }: { tono?: keyof typeof TONOS; children: ReactNode }) {
  return <span className={`inline-block whitespace-nowrap px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${TONOS[tono]}`}>{children}</span>;
}

export function Stat({ label, value, sub, tono }: { label: string; value: string; sub?: string; tono?: "rojo" | "verde" }) {
  return (
    <div className="border border-line bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">{label}</p>
      <p className={`mt-2 font-display text-2xl font-semibold sm:text-3xl ${tono === "rojo" ? "text-red-700" : tono === "verde" ? "text-emerald-700" : "text-brand-900"}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-ink-soft">{sub}</p>}
    </div>
  );
}

type FieldProps = {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number | null;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  className?: string;
  min?: string;
  max?: string;
  step?: string;
  autoComplete?: string;
  accept?: string;
};
export function Field({ label, name, type = "text", defaultValue, required, placeholder, hint, className = "", ...rest }: FieldProps) {
  return (
    <label className={`block text-sm font-semibold text-brand-900 ${className}`}>
      {label}
      {required && <span className="text-red-600"> *</span>}
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue ?? undefined}
        placeholder={placeholder}
        className={`${inputCls} ${type === "file" ? "file:mr-3 file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-700" : ""}`}
        {...rest}
      />
      {hint && <span className="mt-1 block text-xs font-normal text-ink-soft">{hint}</span>}
    </label>
  );
}

export function SelectField({
  label, name, options, defaultValue, required, className = "", vacio,
}: {
  label: string; name: string; options: [string, string][]; defaultValue?: string | number | null; required?: boolean; className?: string; vacio?: string;
}) {
  return (
    <label className={`block text-sm font-semibold text-brand-900 ${className}`}>
      {label}
      {required && <span className="text-red-600"> *</span>}
      <select name={name} required={required} defaultValue={defaultValue ?? ""} className={inputCls}>
        {vacio !== undefined && <option value="">{vacio}</option>}
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </label>
  );
}

export function TextArea({ label, name, defaultValue, rows = 3, className = "" }: { label: string; name: string; defaultValue?: string | null; rows?: number; className?: string }) {
  return (
    <label className={`block text-sm font-semibold text-brand-900 ${className}`}>
      {label}
      <textarea name={name} rows={rows} defaultValue={defaultValue ?? undefined} className={inputCls} />
    </label>
  );
}

export const Th = ({ children, right }: { children?: ReactNode; right?: boolean }) => (
  <th scope="col" className={`whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-ink-soft ${right ? "text-right" : "text-left"}`}>{children}</th>
);
export const Td = ({ children, right, className = "" }: { children?: ReactNode; right?: boolean; className?: string }) => (
  <td className={`px-4 py-3 align-middle ${right ? "text-right" : ""} ${className}`}>{children}</td>
);

export function Tabla({ head, children, vacio }: { head: ReactNode; children: ReactNode; vacio?: string }) {
  const filas = Array.isArray(children) ? children.length : children ? 1 : 0;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="border-b border-line bg-soft">
          <tr>{head}</tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
      {filas === 0 && <p className="px-4 py-8 text-center text-sm text-ink-soft">{vacio ?? "Sin resultados."}</p>}
    </div>
  );
}

export function LinkBtn({ href, children, variant = "ghost", sm }: { href: string; children: ReactNode; variant?: "primary" | "ghost" | "gold"; sm?: boolean }) {
  const c = variant === "primary" ? btnPrimary : variant === "gold" ? btnGold : btnGhost;
  return <Link href={href} className={`${c} ${sm ? btnSm : ""}`}>{children}</Link>;
}

export function Dato({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-ink-soft">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink">{children || "—"}</dd>
    </div>
  );
}
