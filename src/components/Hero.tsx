import Image from "next/image";
import { EMPRESA, waLink } from "@/config/empresa";
import { IMG } from "@/config/imagenes";
import { ArrowIcon, StarIcon, WhatsAppIcon } from "./Icons";

export function Hero() {
  return (
    <section id="inicio" className="relative isolate overflow-hidden bg-brand-900 pt-[72px] lg:pt-[108px]">
      <Image src={IMG.hero.src} alt={IMG.hero.alt} fill priority sizes="100vw" className="-z-20 object-cover object-[60%_center]" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-brand-900 via-brand-900/85 to-brand-900/30 max-lg:bg-brand-900/65" aria-hidden />

      <div className="mx-auto max-w-6xl px-4 pb-16 pt-16 sm:px-6 sm:pb-24 sm:pt-24 lg:pb-32 lg:pt-28">
        <div className="max-w-2xl">
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-accent-300">
            <span className="h-px w-8 bg-accent-400" aria-hidden /> Productor asesor de seguros · San Rafael, Mendoza
          </p>
          <h1 className="mt-6 text-4xl leading-[1.12] text-white sm:text-5xl lg:text-6xl">
            Un respaldo real y cercano, cuando más lo necesitás
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-brand-100">
            No se trata solo de contratar un seguro. Te asesoramos de forma personalizada y te acompañamos desde la cotización hasta el siniestro.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a href={waLink("Hola! Quiero cotizar un seguro.")} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-accent-500 px-7 py-4 text-base font-semibold text-brand-900 transition hover:bg-accent-400">
              <WhatsAppIcon className="h-5 w-5" /> Cotizar por WhatsApp
            </a>
            <a href="#seguros" className="group inline-flex items-center justify-center gap-2 border border-white/60 px-7 py-4 text-base font-semibold text-white transition hover:border-white hover:bg-white/10">
              Ver seguros <ArrowIcon className="h-5 w-5 transition group-hover:translate-x-1" />
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-white/15 bg-brand-900/70 backdrop-blur-sm">
        <ul className="mx-auto grid max-w-6xl gap-4 px-4 py-5 text-sm text-brand-100 sm:grid-cols-3 sm:px-6">
          <li className="flex items-center gap-3">
            <span className="flex text-accent-400">{[1, 1, 1, 1, 0.5].map((f, i) => <StarIcon key={i} fill={f} className="h-4 w-4" />)}</span>
            <span><strong className="text-white">{String(EMPRESA.reputacion.estrellas).replace(".", ",")}</strong> en Google</span>
          </li>
          <li><strong className="text-white">Asesoramiento personalizado</strong> para personas y empresas</li>
          <li><strong className="text-white">Acompañamiento</strong> ante cada siniestro</li>
        </ul>
      </div>
    </section>
  );
}
