import { Footer } from "./Footer";
import { Header } from "./Header";
import { WhatsAppFloat } from "./WhatsAppFloat";

/** Estructura de las páginas interiores del sitio público (encabezado, pie y botón de WhatsApp). */
export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="pt-[72px] lg:pt-[108px]">{children}</main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}

export function Banda({ eyebrow, titulo, texto }: { eyebrow: string; titulo: string; texto?: string }) {
  return (
    <section className="bg-brand-900 py-14 text-white sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-accent-300">
          <span className="h-px w-8 bg-accent-400" aria-hidden /> {eyebrow}
        </p>
        <h1 className="mt-4 max-w-3xl text-3xl leading-tight sm:text-5xl">{titulo}</h1>
        {texto && <p className="mt-4 max-w-2xl text-lg leading-relaxed text-brand-100">{texto}</p>}
      </div>
    </section>
  );
}
