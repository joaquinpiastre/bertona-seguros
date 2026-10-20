import Image from "next/image";
import Link from "next/link";
import type { Img } from "@/config/imagenes";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { WhatsAppFloat } from "./WhatsAppFloat";

/** Estructura de las páginas del sitio público (encabezado, pie y botón de WhatsApp). */
export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="site">
      <Header />
      <main>{children}</main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}

/** Encabezado de las páginas interiores: foto de fondo, migas de pan y título. */
export function PageHero({ eyebrow, titulo, texto, migas, img, children }: {
  eyebrow?: string; titulo: string; texto?: string; migas?: { href?: string; t: string }[]; img?: Img; children?: React.ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-brand-900 text-white">
      {img && <Image src={img.src} alt="" fill priority sizes="100vw" className="-z-20 object-cover opacity-40" />}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-brand-900 via-brand-900/90 to-sky-700/60" aria-hidden />
      <div className="absolute -right-24 -top-24 -z-10 h-80 w-80 rounded-full bg-sky-500/30 blur-3xl" aria-hidden />
      <div className="mx-auto max-w-7xl px-4 pb-14 pt-[calc(72px+3.5rem)] sm:px-6 sm:pb-20 sm:pt-[calc(72px+5rem)] lg:pt-[calc(108px+4rem)]">
        {migas && (
          <nav aria-label="Ubicación" className="mb-5 flex flex-wrap items-center gap-2 text-sm text-sky-200">
            {migas.map((m, i) => (
              <span key={m.t} className="flex items-center gap-2">
                {i > 0 && <span aria-hidden>/</span>}
                {m.href ? <Link href={m.href} className="hover:text-white">{m.t}</Link> : <span className="text-white">{m.t}</span>}
              </span>
            ))}
          </nav>
        )}
        {eyebrow && <p className="inline-block rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-sun-400">{eyebrow}</p>}
        <h1 className="mt-4 max-w-3xl text-4xl leading-[1.1] sm:text-5xl">{titulo}</h1>
        {texto && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-sky-100">{texto}</p>}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}

/** Banda final con llamado a la acción. */
export function BandaCta({ titulo, texto, children }: { titulo: string; texto?: string; children: React.ReactNode }) {
  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-gradient-to-br from-sky-600 to-brand-900 px-6 py-12 text-white sm:px-14 sm:py-16">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10" aria-hidden />
        <div className="absolute -bottom-20 right-24 h-48 w-48 rounded-full bg-sun-400/20" aria-hidden />
        <div className="relative max-w-2xl">
          <h2 className="text-3xl leading-tight sm:text-4xl">{titulo}</h2>
          {texto && <p className="mt-4 text-lg text-sky-100">{texto}</p>}
          <div className="mt-8 flex flex-wrap gap-3">{children}</div>
        </div>
      </div>
    </section>
  );
}

export const btnPrimario = "inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-7 py-4 text-base font-bold text-white shadow-card transition hover:bg-sky-600";
export const btnSol = "inline-flex items-center justify-center gap-2 rounded-xl bg-sun-400 px-7 py-4 text-base font-bold text-brand-900 shadow-card transition hover:bg-sun-500";
export const btnBlanco = "inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-4 text-base font-bold text-brand-900 shadow-card transition hover:bg-sky-50";
export const btnBorde = "inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/70 px-7 py-3.5 text-base font-bold text-white transition hover:bg-white/10";
export const btnBordeAzul = "inline-flex items-center justify-center gap-2 rounded-xl border-2 border-sky-500 px-7 py-3.5 text-base font-bold text-sky-600 transition hover:bg-sky-50";
