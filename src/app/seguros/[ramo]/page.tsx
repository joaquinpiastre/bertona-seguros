import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RAMO_ICONS } from "@/components/Icons";
import { MeridionalLogo } from "@/components/MeridionalLogo";
import { BandaCta, PageHero, PageShell, btnBorde, btnPrimario, btnSol } from "@/components/PageShell";
import { TarjetaRamo } from "@/components/TarjetaRamo";
import { RAMOS, waLink } from "@/config/empresa";
import { IMG_RAMO } from "@/config/imagenes";
import { DETALLES } from "@/config/meridional";

export function generateStaticParams() {
  return RAMOS.map((r) => ({ ramo: r.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ ramo: string }> }): Promise<Metadata> {
  const { ramo } = await params;
  const r = RAMOS.find((x) => x.id === ramo);
  if (!r) return {};
  const d = DETALLES.find((x) => x.slug === ramo);
  return {
    title: `${d?.titulo ?? r.nombre} en San Rafael, Mendoza`,
    description: d?.bajada ?? r.descripcion,
    alternates: { canonical: `/seguros/${r.id}` },
  };
}

const tilde = <span className="mt-1.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-sky-500 text-white"><svg viewBox="0 0 20 20" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden><path d="m4 10.500 4 4 8-9" /></svg></span>;

function Lista({ items }: { items: string[] }) {
  return <ul className="mt-4 space-y-3 leading-relaxed text-ink-soft">{items.map((i) => <li key={i} className="flex gap-3">{tilde}<span>{i}</span></li>)}</ul>;
}

export default async function Detalle({ params }: { params: Promise<{ ramo: string }> }) {
  const { ramo } = await params;
  const r = RAMOS.find((x) => x.id === ramo);
  if (!r) notFound();
  const d = DETALLES.find((x) => x.slug === ramo);
  const img = IMG_RAMO[r.id];
  const Icon = RAMO_ICONS[r.id];
  const titulo = d?.titulo ?? r.nombre;
  const wa = waLink(`Hola! Quiero cotizar: ${titulo}.`);
  const relacionados = RAMOS.filter((x) => x.grupo === r.grupo && x.id !== r.id).slice(0, 3);

  return (
    <PageShell>
      <PageHero eyebrow={r.grupo === "personas" ? "Seguros para personas" : "Seguros para empresas"} titulo={titulo} texto={d?.bajada ?? r.descripcion} img={img}
        migas={[{ href: "/", t: "Inicio" }, { href: "/seguros", t: "Seguros" }, { t: r.nombre }]}>
        <div className="flex flex-wrap gap-3">
          <a href={wa} target="_blank" rel="noopener noreferrer" className={btnSol}>Cotizar por WhatsApp</a>
          <Link href="/seguros" className={btnBorde}>Ver todos los seguros</Link>
        </div>
      </PageHero>

      {d && (
        <div className="border-b border-line bg-white">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 text-sm text-ink-soft sm:px-6">
            Cobertura respaldada por <MeridionalLogo className="h-7 w-auto" />
          </div>
        </div>
      )}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        {!d && (
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <span className="grid h-16 w-16 place-items-center rounded-2xl bg-sky-500 text-white"><Icon className="h-8 w-8" /></span>
              <h2 className="mt-5 text-3xl text-brand-900">Armamos tu propuesta a medida</h2>
              <p className="mt-4 text-lg leading-relaxed text-ink-soft">{r.descripcion} Cada caso es distinto: contanos qué necesitás y te presentamos las opciones disponibles, con las coberturas explicadas en simple.</p>
              <a href={wa} target="_blank" rel="noopener noreferrer" className={`${btnPrimario} mt-6`}>Consultar ahora</a>
            </div>
            {img && <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] shadow-card-lift"><Image src={img.src} alt={img.alt} fill sizes="(min-width:1024px) 600px, 100vw" className="object-cover" /></div>}
          </div>
        )}

        {d?.planes && (
          <section>
            <h2 className="mb-8 text-3xl text-brand-900">Coberturas disponibles</h2>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {d.planes.map((p) => (
                <article key={p.nombre} className="flex flex-col rounded-3xl border border-line bg-white p-7 shadow-card transition hover:-translate-y-1 hover:border-sky-500 hover:shadow-card-lift">
                  <p className="inline-block self-start rounded-full bg-sky-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-sky-700">{p.resumen}</p>
                  <h3 className="mt-3 text-2xl text-brand-900">{p.nombre}</h3>
                  <Lista items={p.incluye} />
                </article>
              ))}
            </div>
          </section>
        )}

        {d?.grupos && (
          <div className="grid gap-5 md:grid-cols-2">
            {d.grupos.map((g) => (
              <section key={g.titulo} className="rounded-3xl border border-line bg-white p-7 shadow-card">
                <h2 className="text-2xl text-brand-900">{g.titulo}</h2>
                <Lista items={g.items} />
              </section>
            ))}
          </div>
        )}

        {(d?.beneficios || d?.requisitos) && (
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {d.beneficios && (
              <section className={`rounded-3xl bg-sky-50 p-7 ${d.requisitos ? "" : "md:col-span-2"}`}>
                <h2 className="text-2xl text-brand-900">Beneficios</h2>
                <Lista items={d.beneficios} />
              </section>
            )}
            {d.requisitos && (
              <section className="rounded-3xl bg-sky-50 p-7">
                <h2 className="text-2xl text-brand-900">Qué necesitás</h2>
                <Lista items={d.requisitos} />
              </section>
            )}
          </div>
        )}

        {d?.nota && <p className="mt-8 text-sm text-ink-soft">{d.nota}</p>}

        {relacionados.length > 0 && (
          <section className="mt-20">
            <h2 className="mb-8 text-3xl text-brand-900">También te puede interesar</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{relacionados.map((x) => <TarjetaRamo key={x.id} r={x} />)}</div>
          </section>
        )}
      </div>

      <BandaCta titulo="¿Cuál te conviene? Te asesoramos sin compromiso." texto="Escribinos y en poco tiempo tenés la propuesta.">
        <a href={wa} target="_blank" rel="noopener noreferrer" className={btnSol}>Hablar con un asesor</a>
      </BandaCta>
    </PageShell>
  );
}
