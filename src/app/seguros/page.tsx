import type { Metadata } from "next";
import { BandaCta, PageHero, PageShell, btnBorde, btnSol } from "@/components/PageShell";
import { Reveal } from "@/components/Reveal";
import { SectionTitle } from "@/components/Section";
import { TarjetaRamo } from "@/components/TarjetaRamo";
import { RAMOS, waLink } from "@/config/empresa";
import { IMG } from "@/config/imagenes";

export const metadata: Metadata = {
  title: "Seguros para personas y empresas",
  description: "Seguros de autos, motos, hogar, accidentes personales, viajes, vida, comercio, consorcios, caución y más en San Rafael, Mendoza.",
  alternates: { canonical: "/seguros" },
};

export default function Seguros() {
  return (
    <PageShell>
      <PageHero eyebrow="Nuestros seguros" titulo="Seguros para personas y empresas" texto="Elegí lo que querés proteger. Te explicamos cada cobertura en simple y te armamos una propuesta a medida." img={IMG.asesoramiento}
        migas={[{ href: "/", t: "Inicio" }, { t: "Seguros" }]} />

      <section id="personas" className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionTitle eyebrow="Para personas" title="Protegé lo tuyo y a los tuyos" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {RAMOS.filter((r) => r.grupo === "personas").map((r, i) => <Reveal key={r.id} delay={(i % 3) * 70}><TarjetaRamo r={r} /></Reveal>)}
          </div>
        </div>
      </section>

      <section id="empresas" className="bg-sky-50 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionTitle eyebrow="Para empresas" title="Respaldo para tu negocio" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {RAMOS.filter((r) => r.grupo === "empresas").map((r, i) => <Reveal key={r.id} delay={(i % 3) * 70}><TarjetaRamo r={r} /></Reveal>)}
          </div>
        </div>
      </section>

      <BandaCta titulo="¿No sabés cuál te conviene?" texto="Contanos qué querés proteger y te recomendamos la mejor opción, sin compromiso.">
        <a href={waLink("Hola! Quiero que me asesoren sobre un seguro.")} target="_blank" rel="noopener noreferrer" className={btnSol}>Hablar con un asesor</a>
        <a href="/contacto" className={btnBorde}>Otras formas de contacto</a>
      </BandaCta>
    </PageShell>
  );
}
