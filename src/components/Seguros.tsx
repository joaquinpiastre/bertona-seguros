import { RAMOS, waLink } from "@/config/empresa";
import { ArrowIcon } from "./Icons";
import { RamoArt } from "./Illustrations";
import { Reveal } from "./Reveal";
import { SectionTitle } from "./Section";

export function Seguros() {
  return (
    <section id="seguros" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionTitle eyebrow="Nuestros seguros" title="Cobertura para cada parte de tu vida" intro="Elegí lo que necesitás proteger y te armamos una propuesta a medida." />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {RAMOS.map((r, i) => (
            <Reveal key={r.id} delay={(i % 3) * 80}>
              <article className="group flex h-full flex-col overflow-hidden rounded-[var(--radius)] border border-line bg-white shadow-soft transition duration-300 hover:-translate-y-1.5 hover:shadow-lift">
                <div className="aspect-[400/220] overflow-hidden">
                  <RamoArt id={r.id} className="h-full w-full transition duration-500 group-hover:scale-105" />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="text-xl font-bold text-brand-900">{r.nombre}</h3>
                  <p className="mt-2 flex-1 text-[0.95rem] leading-relaxed text-ink-soft">{r.descripcion}</p>
                  <a href={waLink(`Hola! Quiero cotizar un seguro de ${r.nombre}.`)} target="_blank" rel="noopener noreferrer"
                    aria-label={`Cotizar seguro de ${r.nombre}`}
                    className="mt-5 inline-flex items-center gap-2 self-start rounded-full bg-brand-50 px-5 py-2.5 text-sm font-bold text-brand-700 transition hover:bg-brand-700 hover:text-white">
                    Cotizar <ArrowIcon className="h-4 w-4" />
                  </a>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
