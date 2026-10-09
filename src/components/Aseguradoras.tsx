import { ASEGURADORAS } from "@/config/empresa";
import { Shield } from "./Illustrations";

/** TODO: reemplazar los placeholders por los logos reales de las aseguradoras (con autorización). */
export function Aseguradoras() {
  const items = [...ASEGURADORAS, ...ASEGURADORAS];
  return (
    <section aria-labelledby="aseg-t" className="overflow-hidden border-y border-line bg-soft py-12">
      <h2 id="aseg-t" className="mb-8 px-4 text-center font-sans text-sm font-bold uppercase tracking-[0.18em] text-ink-soft">
        Aseguradoras con las que trabajamos
      </h2>
      <div className="marquee flex w-max gap-5 pr-5">
        {items.map((n, i) => (
          <div key={i} aria-hidden={i >= ASEGURADORAS.length} className="flex h-16 w-48 shrink-0 items-center justify-center gap-2 rounded-2xl border border-line bg-white text-ink-soft opacity-80">
            <Shield size={22} />
            <span className="text-sm font-semibold">{n}</span>
          </div>
        ))}
      </div>
      <p className="mt-6 px-4 text-center text-xs text-ink-soft">Logos ilustrativos: se reemplazarán por las aseguradoras reales.</p>
    </section>
  );
}
