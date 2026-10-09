import { EMPRESA, MAPS_LINK, RESENAS_GOOGLE } from "@/config/empresa";
import { StarIcon } from "./Icons";
import { Reveal } from "./Reveal";
import { SectionTitle } from "./Section";

export function Resenas() {
  const e = RESENAS_GOOGLE.length;
  const r = EMPRESA.reputacion;
  const resumen = (
    <div className={`flex flex-col justify-center border border-line bg-soft p-8 text-center ${e ? "lg:col-span-1" : "mx-auto w-full max-w-md"}`}>
      <p className="font-display text-6xl font-semibold text-brand-900">{String(r.estrellas).replace(".", ",")}</p>
      <div className="mt-2 flex justify-center text-accent-500" role="img" aria-label={`${r.estrellas} de 5 estrellas`}>
        {[1, 1, 1, 1, 0.5].map((f, i) => <StarIcon key={i} fill={f} className="h-6 w-6" />)}
      </div>
      <p className="mt-3 text-sm text-ink-soft">en Google · unas {r.resenas} reseñas</p>
      <a href={MAPS_LINK} target="_blank" rel="noopener noreferrer" className="mt-4 text-sm font-semibold text-brand-700 underline underline-offset-4 hover:text-brand-900">
        Ver reseñas en Google
      </a>
    </div>
  );

  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionTitle eyebrow="Reseñas" title="La confianza de nuestros clientes" />
        {e === 0 ? (
          resumen
        ) : (
          <div className="grid gap-6 lg:grid-cols-4">
            {resumen}
            <div className="grid gap-6 md:grid-cols-3 lg:col-span-3">
              {RESENAS_GOOGLE.map((t, i) => (
                <Reveal key={i} delay={(i % 3) * 80} className="h-full">
                  <figure className="flex h-full flex-col border border-line border-l-4 border-l-accent-500 bg-white p-6">
                    <div className="flex text-accent-500" role="img" aria-label={`${t.estrellas} de 5 estrellas`}>
                      {[0, 1, 2, 3, 4].map((s) => <StarIcon key={s} fill={s < t.estrellas ? 1 : 0} className="h-4 w-4" />)}
                    </div>
                    <blockquote className="mt-4 flex-1 leading-relaxed text-ink">“{t.texto}”</blockquote>
                    <figcaption className="mt-5 text-xs font-semibold uppercase tracking-wider text-ink-soft">Reseña en Google</figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
