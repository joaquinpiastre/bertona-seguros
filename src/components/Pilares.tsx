import Image from "next/image";
import { IMG } from "@/config/imagenes";
import { Reveal } from "./Reveal";
import { SectionTitle } from "./Section";

const PILARES = [
  { t: "Asesoramiento personalizado", d: "Escuchamos tus necesidades antes de ofrecerte nada. Cada persona y cada comercio es distinto." },
  { t: "Cobertura a medida", d: "Comparamos opciones y armamos una cobertura que se ajuste a lo que realmente necesitás y a tu presupuesto." },
  { t: "Acompañamiento hasta el siniestro", d: "Desde la cotización hasta el último trámite de un siniestro, estamos a tu lado en cada paso." },
];

export function Pilares() {
  return (
    <section id="por-que-elegirnos" className="bg-soft py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <div className="relative aspect-[4/3] overflow-hidden">
            <Image src={IMG.asesoramiento.src} alt={IMG.asesoramiento.alt} fill sizes="(min-width:1024px) 540px, 100vw" className="object-cover" />
          </div>
        </Reveal>
        <div>
          <SectionTitle align="left" eyebrow="Por qué elegirnos" title="Más que una póliza: un respaldo real" />
          <ol className="-mt-4 divide-y divide-line border-y border-line">
            {PILARES.map((p, i) => (
              <li key={p.t} className="flex gap-5 py-6">
                <span className="font-display text-3xl font-semibold text-accent-500">0{i + 1}</span>
                <div>
                  <h3 className="text-xl text-brand-900">{p.t}</h3>
                  <p className="mt-2 leading-relaxed text-ink-soft">{p.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
