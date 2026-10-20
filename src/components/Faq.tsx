import { FAQ } from "@/config/empresa";
import { FAQ_MERIDIONAL } from "@/config/meridional";
import { PlusIcon } from "./Icons";
import { SectionTitle } from "./Section";

export function Faq({ fondo = true }: { fondo?: boolean }) {
  return (
    <section id="faq" className={`py-20 sm:py-28 ${fondo ? "bg-sky-50" : ""}`}>
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <SectionTitle eyebrow="Preguntas frecuentes" title="Resolvemos tus dudas" />
        <div className="space-y-3">
          {[...FAQ, ...FAQ_MERIDIONAL].map((f) => (
            <details key={f.q} className="group rounded-2xl border border-line bg-white shadow-card open:border-sky-500">
              <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 text-left font-display text-lg font-bold text-brand-900 [&::-webkit-details-marker]:hidden">
                {f.q}
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sky-100 text-sky-600 transition group-open:rotate-45 group-open:bg-sky-500 group-open:text-white"><PlusIcon className="h-4 w-4" /></span>
              </summary>
              <p className="px-6 pb-6 pr-12 leading-relaxed text-ink-soft">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
