export function SectionTitle({ eyebrow, title, intro, align = "center", light = false }: { eyebrow: string; title: string; intro?: string; align?: "center" | "left"; light?: boolean }) {
  const c = align === "center";
  return (
    <div className={`mb-10 max-w-2xl sm:mb-12 ${c ? "mx-auto text-center" : ""}`}>
      <p className={`inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] ${light ? "bg-white/10 text-sun-400" : "bg-sky-100 text-sky-700"}`}>{eyebrow}</p>
      <h2 className={`mt-4 text-3xl leading-[1.15] sm:text-4xl ${light ? "text-white" : "text-brand-900"}`}>{title}</h2>
      {intro && <p className={`mt-4 text-lg leading-relaxed ${light ? "text-sky-100" : "text-ink-soft"}`}>{intro}</p>}
    </div>
  );
}
