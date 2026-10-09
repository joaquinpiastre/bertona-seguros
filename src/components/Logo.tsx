/** TODO: reemplazar por el logo real de /public/brand cuando esté disponible. */
export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <span className={`grid h-10 w-10 place-items-center border font-display text-2xl font-semibold ${light ? "border-accent-400 text-accent-300" : "border-brand-900 bg-brand-900 text-accent-300"}`} aria-hidden>
        B
      </span>
      <span className="leading-none">
        <span className={`block font-display text-xl font-semibold tracking-wide ${light ? "text-white" : "text-brand-900"}`}>BERTONA</span>
        <span className={`mt-1 block text-[10px] font-semibold uppercase tracking-[0.32em] ${light ? "text-accent-300" : "text-accent-600"}`}>Seguros</span>
      </span>
    </span>
  );
}
