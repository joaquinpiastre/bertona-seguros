import { Shield } from "./Illustrations";

/** TODO: reemplazar por el logo real de /public/brand cuando esté disponible. */
export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <Shield size={30} />
      <span className="leading-none">
        <span className={`block font-display text-xl font-bold ${light ? "text-white" : "text-brand-900"}`}>Bertona</span>
        <span className={`block text-[11px] font-semibold uppercase tracking-[0.22em] ${light ? "text-accent-300" : "text-accent-600"}`}>Seguros</span>
      </span>
    </span>
  );
}
