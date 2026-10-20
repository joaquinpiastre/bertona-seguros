import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MeridionalLogo } from "@/components/MeridionalLogo";
import { BandaCta, PageHero, PageShell, btnBorde, btnSol } from "@/components/PageShell";
import { Reveal } from "@/components/Reveal";
import { SectionTitle } from "@/components/Section";
import { NOSOTROS, waLink } from "@/config/empresa";
import { IMG } from "@/config/imagenes";
import { MERIDIONAL, RESPALDO } from "@/config/meridional";

export const metadata: Metadata = {
  title: "Quiénes somos",
  description: "Grupo Bertona: productores asesores de seguros en San Rafael, Mendoza, con el respaldo de Meridional Seguros.",
  alternates: { canonical: "/nosotros" },
};

export default function Nosotros() {
  return (
    <PageShell>
      <PageHero eyebrow="Quiénes somos" titulo="Grupo Bertona: cerca tuyo, en San Rafael" texto="Una agencia de seguros de la zona que trabaja para que cada persona, familia y comercio tenga el respaldo que necesita." img={IMG.hero}
        migas={[{ href: "/", t: "Inicio" }, { t: "Nosotros" }]} />

      <section className="py-16 sm:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <Reveal>
            <h2 className="text-3xl leading-tight text-brand-900 sm:text-4xl">{NOSOTROS.titulo}</h2>
            {NOSOTROS.parrafos.map((p) => <p key={p} className="mt-4 text-lg leading-relaxed text-ink-soft">{p}</p>)}
            <div className="mt-6 flex flex-wrap gap-2">
              {NOSOTROS.valores.map((v) => <span key={v} className="rounded-full bg-sky-100 px-4 py-2 text-sm font-bold text-sky-700">{v}</span>)}
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] shadow-card-lift">
              <Image src={IMG.nosotros.src} alt={IMG.nosotros.alt} fill sizes="(min-width:1024px) 600px, 100vw" className="object-cover" />
            </div>
          </Reveal>
        </div>
      </section>

      <section id="respaldo" className="bg-brand-900 py-16 text-white sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionTitle light eyebrow="Nuestro respaldo" title={RESPALDO.titulo} />
          <div className="mx-auto mb-10 flex max-w-sm justify-center rounded-3xl bg-white p-6"><MeridionalLogo className="h-14 w-auto sm:h-16" /></div>
          <div className="grid items-start gap-10 lg:grid-cols-2">
            <div>
              {RESPALDO.texto.map((t) => <p key={t} className="mb-4 text-lg leading-relaxed text-sky-100">{t}</p>)}
              <p className="mt-6 text-sm font-bold uppercase tracking-widest text-sky-200">Sus valores</p>
              <div className="mt-3 flex flex-wrap gap-2">{RESPALDO.valores.map((v) => <span key={v} className="rounded-full border border-white/20 px-4 py-2 text-sm">{v}</span>)}</div>
              <a href={MERIDIONAL.web} target="_blank" rel="noopener noreferrer" className="mt-8 inline-block font-bold text-sun-400 underline underline-offset-4">Conocé Meridional Seguros</a>
            </div>
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {RESPALDO.datos.map((d) => (
                <div key={d.etiqueta} className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
                  <p className="font-display text-4xl font-extrabold text-sun-400">{d.valor}</p>
                  <p className="mt-2 text-sm text-sky-100">{d.etiqueta}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionTitle eyebrow="Cómo trabajamos" title="Te acompañamos en cada paso" />
          <div className="grid gap-5 md:grid-cols-3">
            {[
              ["Antes de contratar", "Escuchamos lo que necesitás, comparamos coberturas y te explicamos cada una sin letra chica."],
              ["Mientras estás cubierto", "Tenés tu cuenta para pagar, ver pólizas y descargar documentos, y una oficina a la que podés ir."],
              ["Cuando pasa algo", "Te guiamos con la denuncia y el seguimiento del siniestro, y te ayudamos con el auxilio mecánico."],
            ].map(([t, d], i) => (
              <Reveal key={t} delay={i * 80} className="h-full">
                <article className="h-full rounded-3xl border border-line bg-white p-7 shadow-card">
                  <span className="font-display text-5xl font-extrabold text-sky-200">{i + 1}</span>
                  <h3 className="mt-2 text-xl text-brand-900">{t}</h3>
                  <p className="mt-2 leading-relaxed text-ink-soft">{d}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <BandaCta titulo="Conocenos en persona" texto="Te esperamos en San Lorenzo 600, San Rafael, o escribinos cuando quieras.">
        <a href={waLink("Hola! Quiero hacer una consulta.")} target="_blank" rel="noopener noreferrer" className={btnSol}>Escribir por WhatsApp</a>
        <Link href="/contacto" className={btnBorde}>Cómo llegar</Link>
      </BandaCta>
    </PageShell>
  );
}
