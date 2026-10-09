import { FAQ } from "@/config/empresa";
import { PlusIcon } from "./Icons";
import { SectionTitle } from "./Section";

export function Faq() {
  return (
    <section id="faq" className="bg-soft py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <SectionTitle eyebrow="Preguntas frecuentes" title="Resolvemos tus dudas" />
        <div className="border-t border-line">
          {FAQ.map((f) => (
            <details key={f.q} className="group border-b border-line">
              <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 py-4 text-left font-display text-lg font-semibold text-brand-900 [&::-webkit-details-marker]:hidden">
                {f.q}
                <PlusIcon className="h-5 w-5 shrink-0 text-accent-600 transition-transform duration-300 group-open:rotate-45" />
              </summary>
              <p className="pb-6 pr-8 leading-relaxed text-ink-soft">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
