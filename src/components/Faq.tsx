import { FAQ } from "@/config/empresa";
import { PlusIcon } from "./Icons";
import { SectionTitle } from "./Section";

export function Faq() {
  return (
    <section id="faq" className="bg-soft py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <SectionTitle eyebrow="Preguntas frecuentes" title="Resolvemos tus dudas" />
        <div className="space-y-3">
          {FAQ.map((f) => (
            <details key={f.q} className="group rounded-2xl border border-line bg-white shadow-soft open:shadow-lift">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-6 py-4 text-left font-bold text-brand-900 [&::-webkit-details-marker]:hidden">
                {f.q}
                <PlusIcon className="h-5 w-5 shrink-0 text-accent-600 transition-transform duration-300 group-open:rotate-45" />
              </summary>
              <p className="px-6 pb-5 leading-relaxed text-ink-soft">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
