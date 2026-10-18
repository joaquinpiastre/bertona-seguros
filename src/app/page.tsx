import { AyudaHome } from "@/components/AyudaHome";
import { Contacto } from "@/components/Contacto";
import { Faq } from "@/components/Faq";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Nosotros } from "@/components/Nosotros";
import { Pasos } from "@/components/Pasos";
import { Pilares } from "@/components/Pilares";
import { Resenas } from "@/components/Resenas";
import { Respaldo } from "@/components/Respaldo";
import { Seguros } from "@/components/Seguros";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Seguros />
        <AyudaHome />
        <Pilares />
        <Pasos />
        <Nosotros />
        <Respaldo />
        <Resenas />
        <Faq />
        <Contacto />
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
