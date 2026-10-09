import { CIFRAS, NOSOTROS } from "@/config/empresa";
import { LandscapePanel, TeamScene } from "./Illustrations";
import { Reveal } from "./Reveal";

const PAISAJES = [
  { v: "bodega", t: "Viñedos y bodegas" },
  { v: "canon", t: "Cañón del Atuel" },
  { v: "cordillera", t: "Cordillera de los Andes" },
] as const;

export function Nosotros() {
  return (
    <section id="nosotros" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <TeamScene className="w-full rounded-[2rem] shadow-lift" />
          </Reveal>
          <Reveal delay={100}>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-accent-600">Quiénes somos</p>
            <h2 className="mt-3 text-3xl font-bold text-brand-900 sm:text-4xl">{NOSOTROS.titulo}</h2>
            {NOSOTROS.parrafos.map((t) => (
              <p key={t} className="mt-4 text-lg leading-relaxed text-ink-soft">{t}</p>
            ))}
            <ul className="mt-6 flex flex-wrap gap-2">
              {NOSOTROS.valores.map((v) => (
                <li key={v} className="rounded-full bg-brand-50 px-4 py-2 text-sm font-bold text-brand-700">{v}</li>
              ))}
            </ul>
            {CIFRAS && (
              <dl className="mt-8 grid grid-cols-3 gap-4">
                {CIFRAS.map((c) => (
                  <div key={c.etiqueta}>
                    <dt className="font-display text-3xl font-bold text-brand-700">{c.valor}</dt>
                    <dd className="text-sm text-ink-soft">{c.etiqueta}</dd>
                  </div>
                ))}
              </dl>
            )}
          </Reveal>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          {PAISAJES.map((p, i) => (
            <Reveal key={p.v} delay={i * 100}>
              <div className="overflow-hidden rounded-[var(--radius)] shadow-soft">
                <LandscapePanel variant={p.v} className="aspect-[4/3] w-full transition duration-500 hover:scale-105" />
              </div>
              <p className="mt-3 text-center text-sm font-semibold text-ink-soft">{p.t}</p>
            </Reveal>
          ))}
        </div>
        <p className="mt-6 text-center font-display text-xl font-semibold text-brand-800">Orgullosamente de San Rafael, Mendoza.</p>
      </div>
    </section>
  );
}
