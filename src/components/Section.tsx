export function SectionTitle({ eyebrow, title, intro, align = "center", light = false }: { eyebrow: string; title: string; intro?: string; align?: "center" | "left"; light?: boolean }) {
  const c = align === "center";
  return (
    <div className={`mb-12 max-w-2xl ${c ? "mx-auto text-center" : ""}`}>
      <p className={`flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] ${light ? "text-accent-300" : "text-accent-600"} ${c ? "justify-center" : ""}`}>
        <span className={`h-px w-8 ${light ? "bg-accent-400" : "bg-accent-500"}`} aria-hidden />
        {eyebrow}
      </p>
      <h2 className={`mt-4 text-3xl leading-tight sm:text-4xl ${light ? "text-white" : "text-brand-900"}`}>{title}</h2>
      {intro && <p className={`mt-4 text-lg leading-relaxed ${light ? "text-brand-100" : "text-ink-soft"}`}>{intro}</p>}
    </div>
  );
}
