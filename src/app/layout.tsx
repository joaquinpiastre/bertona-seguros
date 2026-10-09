import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { DIRECCION_COMPLETA, EMPRESA, SITE_URL } from "@/config/empresa";

const display = Fraunces({ subsets: ["latin"], variable: "--f-display", display: "swap" });
const sans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--f-sans", display: "swap" });

const description =
  "Bertona Seguros, productor asesor de seguros en San Rafael, Mendoza. Cotizá seguros de auto, moto, hogar, comercio, vida, ART y más, con asesoramiento personalizado.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Seguros en San Rafael, Mendoza | Bertona Seguros",
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
    title: "Bertona Seguros | Seguros en San Rafael, Mendoza",
    description,
    url: SITE_URL,
    siteName: "Bertona Seguros",
    locale: "es_AR",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "Bertona Seguros", description },
};

export const viewport: Viewport = { themeColor: "#091f42", width: "device-width", initialScale: 1 };

const jsonLd = {
  "@context": "https://schema.org",
  "@type": ["InsuranceAgency", "LocalBusiness"],
  name: EMPRESA.nombre,
  url: SITE_URL,
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
    <html lang="es-AR" className={`${display.variable} ${sans.variable}`}>
      <body>
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </body>
    </html>
  );
}
