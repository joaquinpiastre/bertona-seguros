import { Contacto } from "@/components/Contacto";
import { Faq } from "@/components/Faq";
import { Acciones, Atencion, Catalogo, Pasos, PortalPromo, Portada, PorQue, QuienesNosEligen, RespaldoMeridional, Zona } from "@/components/inicio/Secciones";
import { PageShell } from "@/components/PageShell";
import { Resenas } from "@/components/Resenas";

export default function Home() {
  return (
    <PageShell>
      <Portada />
      <Acciones />
      <Catalogo />
      <PorQue />
      <RespaldoMeridional />
      <PortalPromo />
      <Pasos />
      <Atencion />
      <Zona />
      <QuienesNosEligen />
      <Resenas />
      <Faq />
      <Contacto />
    </PageShell>
  );
}
