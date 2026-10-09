import Image from "next/image";
import { RAMOS, waLink } from "@/config/empresa";
import { IMG_RAMO } from "@/config/imagenes";
import { ArrowIcon, RAMO_ICONS } from "./Icons";
import { Reveal } from "./Reveal";
import { SectionTitle } from "./Section";

export function Seguros() {
  return (
    <section id="seguros" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionTitle eyebrow="Nuestros seguros" title="Cobertura para cada ámbito de tu vida" intro="Elegí lo que necesitás proteger y te armamos una propuesta a medida." />
        <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {RAMOS.map((r, i) => {
            const img = IMG_RAMO[r.id];
            const Icon = RAMO_ICONS[r.id];
            return (
              <Reveal key={r.id} delay={(i % 3) * 70} className="h-full">
                <article className="group flex h-full flex-col border border-line bg-white transition duration-300 hover:border-brand-200 hover:shadow-lift">
                  <div className="relative aspect-[3/2] overflow-hidden bg-brand-50">
                    <Image src={img.src} alt={img.alt} fill sizes="(min-width:1024px) 360px, (min-width:640px) 50vw, 100vw"
                      className="object-cover transition duration-700 group-hover:scale-[1.04]" />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="flex items-center gap-3 text-xl text-brand-900">
                      <Icon className="h-6 w-6 shrink-0 text-accent-600" />
                      {r.nombre}
                    </h3>
                    <p className="mt-3 flex-1 text-[0.95rem] leading-relaxed text-ink-soft">{r.descripcion}</p>
                    <a href={waLink(`Hola! Quiero cotizar un seguro de ${r.nombre}.`)} target="_blank" rel="noopener noreferrer"
                      aria-label={`Cotizar seguro de ${r.nombre}`}
                      className="mt-6 flex items-center justify-between border-t border-line pt-4 text-sm font-semibold text-brand-700 transition hover:text-brand-900">
                      Cotizar <ArrowIcon className="h-4 w-4 transition group-hover:translate-x-1" />
                    </a>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
