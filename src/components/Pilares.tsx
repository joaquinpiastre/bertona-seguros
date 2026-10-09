import { Reveal } from "./Reveal";

const PILARES = [
  { t: "Asesoramiento personalizado", d: "Escuchamos tus necesidades antes de ofrecerte nada. Cada persona y cada comercio es distinto.", n: "01" },
  { t: "Cobertura a medida", d: "Comparamos opciones y armamos una cobertura que se ajuste a lo que realmente necesitás y a tu presupuesto.", n: "02" },
  { t: "Acompañamiento hasta el siniestro", d: "Desde la cotización hasta el último trámite de un siniestro, estamos a tu lado en cada paso.", n: "03" },
];

export function Pilares() {
  return (
    <section id="por-que-elegirnos" className="bg-brand-900 py-20 text-white sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-12 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-accent-400">Por qué elegirnos</p>
          <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-bold sm:text-4xl">Más que una póliza: un respaldo real</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {PILARES.map((p, i) => (
            <Reveal key={p.n} delay={i * 100}>
              <div className="h-full rounded-[var(--radius)] border border-white/10 bg-white/5 p-8 transition hover:bg-white/10">
                <span className="font-display text-5xl font-bold text-accent-400">{p.n}</span>
                <h3 className="mt-4 text-xl font-bold">{p.t}</h3>
                <p className="mt-3 leading-relaxed text-brand-100">{p.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
