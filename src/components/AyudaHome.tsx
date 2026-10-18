import Link from "next/link";
import { Reveal } from "./Reveal";
import { SectionTitle } from "./Section";

const ITEMS = [
  { href: "/ayuda#siniestros", titulo: "Tuve un siniestro", texto: "Qué hacer paso a paso, a quién llamar y qué documentos preparar." },
  { href: "/ayuda#auxilio", titulo: "Auxilio mecánico", texto: "Pedí asistencia las 24 horas y conocé los kilómetros que tenés según tu cobertura." },
  { href: "/ayuda#pagos", titulo: "Cómo pagar mi cuota", texto: "Todos los medios de pago para que elijas el que más te conviene." },
  { href: "/ayuda#baja", titulo: "Baja y reclamos", texto: "Cómo pedir la baja de un seguro o presentar un reclamo." },
];

export function AyudaHome() {
  return (
    <section id="ayuda" className="bg-soft py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionTitle eyebrow="Ayuda al cliente" title="Estamos con vos cuando más lo necesitás" intro="Todo lo que necesitás saber para un siniestro, una consulta o un trámite, explicado simple." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ITEMS.map((i, n) => (
            <Reveal key={i.href} delay={n * 70} className="h-full">
              <Link href={i.href} className="group flex h-full flex-col border border-line bg-white p-6 transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift">
                <h3 className="text-xl text-brand-900">{i.titulo}</h3>
                <p className="mt-2 flex-1 text-[0.95rem] leading-relaxed text-ink-soft">{i.texto}</p>
                <span className="mt-4 text-sm font-semibold text-brand-700 group-hover:underline">Ver más →</span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
