import { EMPRESA, waLink } from "@/config/empresa";
import { ArrowIcon, StarIcon, WhatsAppIcon } from "./Icons";
import { HeroScene } from "./Illustrations";

export function Hero() {
  return (
    <section id="inicio" className="relative overflow-hidden bg-gradient-to-b from-brand-50 to-white pt-24 sm:pt-28">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 sm:px-6 lg:grid-cols-2 lg:pb-24">
        <div>
          <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-sm font-semibold text-brand-700 shadow-soft">
            <span className="flex text-accent-500">
              {[1, 1, 1, 1, 0.5].map((f, i) => <StarIcon key={i} fill={f} className="h-4 w-4" />)}
            </span>
            {String(EMPRESA.reputacion.estrellas).replace(".", ",")} en Google · San Rafael, Mendoza
          </p>
          <h1 className="text-4xl font-bold leading-[1.08] text-brand-900 sm:text-5xl lg:text-6xl">
            Un respaldo real y cercano, <span className="text-brand-500">cuando más lo necesitás</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
            No se trata solo de contratar un seguro. Te asesoramos de forma personalizada y te acompañamos desde la cotización hasta el siniestro: nunca estás solo.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href={waLink("Hola! Quiero cotizar un seguro.")} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-accent-500 px-7 py-4 text-base font-bold text-brand-900 shadow-lift transition hover:-translate-y-0.5 hover:bg-accent-400">
              <WhatsAppIcon className="h-5 w-5" /> Cotizar por WhatsApp
            </a>
            <a href="#seguros" className="group inline-flex items-center justify-center gap-2 rounded-full border-2 border-brand-200 bg-white px-7 py-4 text-base font-bold text-brand-700 transition hover:border-brand-500 hover:text-brand-900">
              Ver seguros <ArrowIcon className="h-5 w-5 transition group-hover:translate-x-1" />
            </a>
          </div>
        </div>
        <div className="relative">
          <div className="aspect-[4/3] overflow-hidden rounded-[2rem] shadow-lift ring-1 ring-brand-100">
            <HeroScene className="h-full w-full" />
          </div>
          <div className="absolute -bottom-5 left-4 rounded-2xl bg-white px-5 py-3 shadow-lift sm:-left-5">
            <p className="font-display text-lg font-bold text-brand-900">Asesoramiento a medida</p>
            <p className="text-sm text-ink-soft">Personas, familias y comercios</p>
          </div>
        </div>
      </div>
    </section>
  );
}
