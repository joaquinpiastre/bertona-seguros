import type { Metadata } from "next";
import { Contacto } from "@/components/Contacto";
import { Faq } from "@/components/Faq";
import { PageHero, PageShell } from "@/components/PageShell";
import { IMG } from "@/config/imagenes";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Contactá a Grupo Bertona: oficina en San Lorenzo 600, San Rafael, Mendoza. Teléfono, WhatsApp, email y mapa.",
  alternates: { canonical: "/contacto" },
};

export default function ContactoPagina() {
  return (
    <PageShell>
      <PageHero eyebrow="Contacto" titulo="Estamos cerca, escribinos" texto="Por WhatsApp, por teléfono o en nuestra oficina de San Rafael." img={IMG.valleGrande}
        migas={[{ href: "/", t: "Inicio" }, { t: "Contacto" }]} />
      <Contacto titulo="Contanos qué necesitás" />
      <Faq fondo={false} />
    </PageShell>
  );
}
