import { EMPRESA, MAPS_LINK, TESTIMONIOS } from "@/config/empresa";
import { StarIcon } from "./Icons";
import { Reveal } from "./Reveal";
import { SectionTitle } from "./Section";

export function Resenas() {
  const e = EMPRESA.reputacion;
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionTitle eyebrow="Reseñas" title="La confianza de nuestros clientes" />
        <div className="grid gap-6 lg:grid-cols-4">
          <div className="flex flex-col justify-center border border-line bg-soft p-8 text-center lg:col-span-1">
            <p className="font-display text-6xl font-semibold text-brand-900">{String(e.estrellas).replace(".", ",")}</p>
            <div className="mt-2 flex justify-center text-accent-500" role="img" aria-label={`${e.estrellas} de 5 estrellas`}>
              {[1, 1, 1, 1, 0.5].map((f, i) => <StarIcon key={i} fill={f} className="h-6 w-6" />)}
            </div>
            <p className="mt-3 text-sm text-ink-soft">en Google · unas {e.resenas} reseñas</p>
            <a href={MAPS_LINK} target="_blank" rel="noopener noreferrer" className="mt-4 text-sm font-semibold text-brand-700 underline underline-offset-4 hover:text-brand-900">
              Ver reseñas en Google
            </a>
          </div>
          <div className="grid gap-6 md:grid-cols-3 lg:col-span-3">
            {TESTIMONIOS.map((t, i) => (
              <Reveal key={i} delay={i * 80} className="h-full">
                <figure className="relative flex h-full flex-col border border-line border-l-4 border-l-accent-500 bg-white p-6">
                  <span className="mb-3 self-start bg-brand-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-brand-700">Ejemplo editable</span>
                  <div className="flex text-accent-500">{[0, 1, 2, 3, 4].map((s) => <StarIcon key={s} className="h-4 w-4" />)}</div>
                  <blockquote className="mt-4 flex-1 leading-relaxed text-ink">“{t.texto}”</blockquote>
                  <figcaption className="mt-5 text-sm"><strong className="text-brand-900">{t.nombre}</strong><span className="text-ink-soft"> · {t.detalle}</span></figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
