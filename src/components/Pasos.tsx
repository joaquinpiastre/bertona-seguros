import { Reveal } from "./Reveal";
import { SectionTitle } from "./Section";

const PASOS = [
  { t: "Contanos qué necesitás", d: "Por WhatsApp o con el formulario, decinos qué querés asegurar." },
  { t: "Te cotizamos", d: "Comparamos opciones y te presentamos propuestas claras, sin letra chica." },
  { t: "Contratás", d: "Elegís la que más te convence y nos ocupamos de la gestión." },
  { t: "Te acompañamos", d: "Ante cualquier duda o siniestro, estamos para guiarte." },
];

export function Pasos() {
  return (
    <section className="bg-soft py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionTitle eyebrow="Cómo funciona" title="Asegurarte es simple" />
        <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PASOS.map((p, i) => (
            <li key={p.t}>
              <Reveal delay={i * 90} className="h-full">
                <div className="h-full rounded-[var(--radius)] bg-white p-7 shadow-soft">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent-400 font-display text-xl font-bold text-brand-900">{i + 1}</span>
                  <h3 className="mt-5 text-lg font-bold text-brand-900">{p.t}</h3>
                  <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-soft">{p.d}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
