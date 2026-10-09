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
    <section className="bg-brand-900 py-20 text-white sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionTitle light eyebrow="Cómo funciona" title="Asegurarte es simple" />
        <ol className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {PASOS.map((p, i) => (
            <li key={p.t}>
              <Reveal delay={i * 80}>
                <div className="border-t-2 border-accent-500 pt-5">
                  <span className="font-display text-4xl font-semibold text-accent-300">0{i + 1}</span>
                  <h3 className="mt-3 text-lg text-white">{p.t}</h3>
                  <p className="mt-2 text-[0.95rem] leading-relaxed text-brand-100">{p.d}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
