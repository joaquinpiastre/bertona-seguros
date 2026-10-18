import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Banda, PageShell } from "@/components/PageShell";
import { waLink } from "@/config/empresa";
import { DETALLES } from "@/config/meridional";

export function generateStaticParams() {
  return DETALLES.map((d) => ({ ramo: d.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ ramo: string }> }): Promise<Metadata> {
  const { ramo } = await params;
  const d = DETALLES.find((x) => x.slug === ramo);
  if (!d) return {};
  return {
    title: `${d.titulo} en San Rafael, Mendoza | Bertona Seguros`,
    description: d.bajada,
    alternates: { canonical: `/seguros/${d.slug}` },
  };
}

export default async function Detalle({ params }: { params: Promise<{ ramo: string }> }) {
  const { ramo } = await params;
  const d = DETALLES.find((x) => x.slug === ramo);
  if (!d) notFound();
  const wa = waLink(`Hola! Quiero cotizar: ${d.titulo}.`);

  return (
    <PageShell>
      <Banda eyebrow="Seguros" titulo={d.titulo} texto={d.bajada} />
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="mb-10 flex flex-wrap gap-3">
          <a href={wa} target="_blank" rel="noopener noreferrer" className="bg-accent-500 px-7 py-4 font-semibold text-brand-900 hover:bg-accent-400">Cotizar por WhatsApp</a>
          <Link href="/#seguros" className="border border-brand-900 px-7 py-4 font-semibold text-brand-900 hover:bg-brand-50">Ver todos los seguros</Link>
        </div>

        {d.planes && (
          <section>
            <h2 className="mb-6 text-3xl text-brand-900">Coberturas disponibles</h2>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {d.planes.map((p) => (
                <article key={p.nombre} className="flex flex-col border border-line bg-white p-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-accent-600">{p.resumen}</p>
                  <h3 className="mt-1 text-2xl text-brand-900">{p.nombre}</h3>
                  <ul className="mt-4 space-y-2 text-[0.95rem] leading-relaxed text-ink-soft">
                    {p.incluye.map((i) => (<li key={i} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 bg-accent-500" aria-hidden />{i}</li>))}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        )}

        {d.grupos && (
          <div className="grid gap-5 md:grid-cols-2">
            {d.grupos.map((g) => (
              <section key={g.titulo} className="border border-line bg-white p-6">
                <h2 className="text-2xl text-brand-900">{g.titulo}</h2>
                <ul className="mt-4 space-y-2 text-[0.95rem] leading-relaxed text-ink-soft">
                  {g.items.map((i) => (<li key={i} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 bg-accent-500" aria-hidden />{i}</li>))}
                </ul>
              </section>
            ))}
          </div>
        )}

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {d.beneficios && (
            <section className="bg-brand-50 p-6">
              <h2 className="text-2xl text-brand-900">Beneficios</h2>
              <ul className="mt-4 space-y-2 text-[0.95rem] leading-relaxed text-ink-soft">{d.beneficios.map((b) => <li key={b} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 bg-brand-500" aria-hidden />{b}</li>)}</ul>
            </section>
          )}
          {d.requisitos && (
            <section className="bg-brand-50 p-6">
              <h2 className="text-2xl text-brand-900">Qué necesitás</h2>
              <ul className="mt-4 space-y-2 text-[0.95rem] leading-relaxed text-ink-soft">{d.requisitos.map((b) => <li key={b} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 bg-brand-500" aria-hidden />{b}</li>)}</ul>
            </section>
          )}
        </div>

        {d.nota && <p className="mt-8 text-sm text-ink-soft">{d.nota}</p>}

        <div className="mt-12 border border-accent-500 bg-accent-300/15 p-6 sm:flex sm:items-center sm:justify-between">
          <p className="font-display text-xl text-brand-900">¿Cuál te conviene? Te asesoramos sin compromiso.</p>
          <a href={wa} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block bg-brand-900 px-6 py-3.5 font-semibold text-white hover:bg-brand-700 sm:mt-0">Hablar con un asesor</a>
        </div>
      </div>
    </PageShell>
  );
}
