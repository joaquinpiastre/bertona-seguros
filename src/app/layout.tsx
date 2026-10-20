import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { DIRECCION_COMPLETA, EMPRESA, SITE_URL } from "@/config/empresa";

const display = Source_Serif_4({ subsets: ["latin"], variable: "--f-display", display: "swap" });
const head = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--f-head", display: "swap" });
const sans = Inter({ subsets: ["latin"], variable: "--f-sans", display: "swap" });

const description =
  "Grupo Bertona, productor asesor de seguros en San Rafael, Mendoza. Cotizá seguros de auto, moto, hogar, comercio, vida, viaje y más, con asesoramiento personalizado y el respaldo de Meridional Seguros.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Grupo Bertona | Seguros en San Rafael, Mendoza", template: "%s | Grupo Bertona" },
  description,
  keywords: [
    "seguros San Rafael Mendoza",
    "seguros de auto San Rafael",
    "productor asesor de seguros",
    "seguro de hogar Mendoza",
    "ART San Rafael",
    "Bertona Seguros",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Grupo Bertona | Seguros en San Rafael, Mendoza",
    description,
    url: SITE_URL,
    siteName: "Grupo Bertona",
    locale: "es_AR",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "Grupo Bertona", description },
};

export const viewport: Viewport = { themeColor: "#2080c8", width: "device-width", initialScale: 1 };

const jsonLd = {
  "@context": "https://schema.org",
  "@type": ["InsuranceAgency", "LocalBusiness"],
  name: "Grupo Bertona",
  url: SITE_URL,
  logo: `${SITE_URL}/brand/emblema.png`,
  image: `${SITE_URL}/brand/emblema.png`,
  telephone: EMPRESA.telefonoTel,
  email: EMPRESA.email,
  description,
  address: {
    "@type": "PostalAddress",
    streetAddress: EMPRESA.direccion.calle,
    addressLocality: EMPRESA.direccion.ciudad,
    addressRegion: EMPRESA.direccion.provincia,
    postalCode: EMPRESA.direccion.cp,
    addressCountry: EMPRESA.direccion.pais,
  },
  areaServed: DIRECCION_COMPLETA,
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: EMPRESA.reputacion.estrellas,
    reviewCount: EMPRESA.reputacion.resenas,
  },
  sameAs: [EMPRESA.facebook, EMPRESA.instagram],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" data-scroll-behavior="smooth" className={`${display.variable} ${sans.variable} ${head.variable}`}>
      <body>
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </body>
    </html>
  );
}
