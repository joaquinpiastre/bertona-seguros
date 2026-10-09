import Image from "next/image";
import { CIFRAS, NOSOTROS } from "@/config/empresa";
import { IMG } from "@/config/imagenes";
import { Reveal } from "./Reveal";

const PAISAJES = [
  { img: IMG.hero, t: "Viñedos de Mendoza" },
  { img: IMG.atuel, t: "Cañón del Atuel" },
  { img: IMG.valleGrande, t: "Embalse Valle Grande" },
];

export function Nosotros() {
  return (
    <section id="nosotros" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <div className="relative">
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image src={IMG.nosotros.src} alt={IMG.nosotros.alt} fill sizes="(min-width:1024px) 540px, 100vw" className="object-cover" />
              </div>
              <div className="absolute -bottom-4 -right-0 hidden h-24 w-24 border-b-4 border-r-4 border-accent-500 sm:block" aria-hidden />
            </div>
          </Reveal>
          <Reveal delay={100}>
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-accent-600">
              <span className="h-px w-8 bg-accent-500" aria-hidden /> Quiénes somos
            </p>
            <h2 className="mt-4 text-3xl leading-tight text-brand-900 sm:text-4xl">{NOSOTROS.titulo}</h2>
            {NOSOTROS.parrafos.map((t) => (
              <p key={t} className="mt-4 text-lg leading-relaxed text-ink-soft">{t}</p>
            ))}
            <ul className="mt-7 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-line pt-6">
              {NOSOTROS.valores.map((v) => (
                <li key={v} className="flex items-center gap-3 font-medium text-brand-900">
                  <span className="h-2 w-2 bg-accent-500" aria-hidden />{v}
                </li>
              ))}
            </ul>
            {CIFRAS && (
              <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-line pt-6">
                {CIFRAS.map((c) => (
                  <div key={c.etiqueta}>
                    <dt className="font-display text-3xl font-semibold text-brand-700">{c.valor}</dt>
                    <dd className="text-sm text-ink-soft">{c.etiqueta}</dd>
                  </div>
                ))}
              </dl>
            )}
          </Reveal>
        </div>

        <div className="mt-20 grid gap-3 sm:grid-cols-3">
          {PAISAJES.map((p, i) => (
            <Reveal key={p.t} delay={i * 80}>
              <figure className="group relative aspect-[4/3] overflow-hidden">
                <Image src={p.img.src} alt={p.img.alt} fill sizes="(min-width:640px) 360px, 100vw" className="object-cover object-[center_75%] transition duration-700 group-hover:scale-[1.04]" />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-900/80 via-transparent to-transparent" aria-hidden />
                <figcaption className="absolute bottom-0 p-5 font-display text-lg text-white">{p.t}</figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
        <p className="mt-6 text-center font-display text-xl text-brand-800">Orgullosamente de San Rafael, Mendoza.</p>
      </div>
    </section>
  );
}
