import { MERIDIONAL, RESPALDO } from "@/config/meridional";
import { Reveal } from "./Reveal";

export function Respaldo() {
  return (
    <section id="respaldo" className="bg-brand-50 py-20 sm:py-24">
      <div className="mx-auto grid max-w-6xl items-start gap-12 px-4 sm:px-6 lg:grid-cols-2">
        <Reveal>
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-accent-600">
            <span className="h-px w-8 bg-accent-500" aria-hidden /> Nuestra compañía
          </p>
          <h2 className="mt-4 text-3xl leading-tight text-brand-900 sm:text-4xl">{RESPALDO.titulo}</h2>
          {RESPALDO.texto.map((t) => (
            <p key={t} className="mt-4 text-lg leading-relaxed text-ink-soft">{t}</p>
          ))}
          <ul className="mt-6 flex flex-wrap gap-2">
            {RESPALDO.valores.map((v) => (
              <li key={v} className="bg-white px-4 py-2 text-sm font-semibold text-brand-700 shadow-soft">{v}</li>
            ))}
          </ul>
          <a href={MERIDIONAL.web} target="_blank" rel="noopener noreferrer" className="mt-6 inline-block text-sm font-semibold text-brand-700 underline underline-offset-4 hover:text-brand-900">
            Conocé más en meridionalseguros.seg.ar
          </a>
        </Reveal>
        <Reveal delay={100}>
          <dl className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {RESPALDO.datos.map((d) => (
              <div key={d.etiqueta} className="border border-line bg-white p-6">
                <dt className="font-display text-4xl font-semibold text-brand-700">{d.valor}</dt>
                <dd className="mt-1 text-sm text-ink-soft">{d.etiqueta}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
