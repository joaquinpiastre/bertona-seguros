import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { EMPRESA, MATRICULA_SSN } from "@/config/empresa";

/** Franja a cuadros (bandera de llegada), solo con CSS. */
export function Cuadros({ className = "h-3", tam = 12, oscuro = "var(--brand-900)" }: { className?: string; tam?: number; oscuro?: string }) {
  const s: CSSProperties = { backgroundImage: `repeating-conic-gradient(${oscuro} 0 25%, #fff 0 50%)`, backgroundSize: `${tam * 2}px ${tam * 2}px` };
  return <div aria-hidden className={className} style={s} />;
}

const base = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
type P = { className?: string };

export const IconoTrofeo = ({ className }: P) => (
  <svg {...base} className={className}><path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" /><path d="M8 6H5a3 3 0 0 0 3 4.5M16 6h3a3 3 0 0 1-3 4.5" /><path d="M12 13v3.5M8.5 20h7M10 16.5h4V20h-4z" /></svg>
);
export const IconoCalendario = ({ className }: P) => (
  <svg {...base} className={className}><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 10h17M8 3.5v3M16 3.5v3" /></svg>
);
export const IconoBandera = ({ className }: P) => (
  <svg {...base} className={className}><path d="M5 21V4" /><path d="M5 4h13l-2.5 4L18 12H5" /><path d="M9 4v8M13 4v8M5 8h13" /></svg>
);
export const IconoAuto = ({ className }: P) => (
  <svg {...base} className={className}><path d="M5 16V12l1.6-4.2A2 2 0 0 1 8.5 6.5h7a2 2 0 0 1 1.9 1.3L19 12v4" /><path d="M3.5 16h17v2.5h-3V17M6.5 17v1.5h-3V16" /><path d="M5.5 11.5h13" /></svg>
);
export const IconoMoto = ({ className }: P) => (
  <svg {...base} className={className}><circle cx="5.5" cy="16" r="3" /><circle cx="18.5" cy="16" r="3" /><path d="M5.5 16l3-6h5l3 6M13.5 10l-1.5-3h-2M12 16h-3M15 7h2.5" /></svg>
);
export const IconoCamioneta = ({ className }: P) => (
  <svg {...base} className={className}><path d="M2.5 16v-4.5l2-4h7v4.5h10V16" /><path d="M11.5 12H2.5M14.5 12V9h4l2.5 3" /><circle cx="6.5" cy="16.5" r="2" /><circle cx="17.5" cy="16.5" r="2" /><path d="M8.5 16.5h7" /></svg>
);
export const IconoNinguno = ({ className }: P) => (
  <svg {...base} className={className}><circle cx="13" cy="4.5" r="1.8" /><path d="m9 21 2.5-6.5L14 17v4M8 11l3-3.5 3 2 2.5 3" /><path d="m11.5 14.5-1-4.5" /></svg>
);
export const IconoWhatsapp = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.3-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1-1.5-.7-2.5-1.3-3.4-2.9-.1-.2 0-.4.1-.5l.4-.5.2-.4v-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.4c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.8 4.5 3.9 1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.6-.3Z" />
  </svg>
);

/** Cabecera y pie de las páginas del sorteo (enfocadas: sin el menú completo del sitio). */
export function MarcoSorteo({ children }: { children: ReactNode }) {
  return (
    <div className="site relative flex min-h-dvh flex-col overflow-x-hidden bg-brand-900 text-white">
      {/* Líneas de velocidad de fondo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[560px] opacity-60"
        style={{ backgroundImage: "repeating-linear-gradient(-58deg, transparent 0 46px, rgb(32 128 200 / 0.10) 46px 50px, transparent 50px 96px, rgb(255 191 63 / 0.07) 96px 99px)" }}
      />
      <div aria-hidden className="pointer-events-none absolute -right-32 top-24 h-80 w-80 rounded-full bg-sky-500/25 blur-3xl" />
      <Cuadros className="relative h-3" tam={6} />
      <header className="relative mx-auto flex w-full max-w-xl items-center justify-between gap-3 px-4 pt-4">
        <Link href="/" aria-label="Bertona Seguros: ir al sitio"><Logo light compacto /></Link>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-sun-400/50 bg-sun-400/10 px-3 py-1.5 text-[0.7rem] font-extrabold uppercase tracking-[0.18em] text-sun-400">
          <IconoBandera className="h-4 w-4" /> Speedway
        </span>
      </header>
      <main className="relative mx-auto w-full max-w-xl flex-1 px-4 pb-12 pt-6">{children}</main>
      <footer className="relative border-t border-white/10 bg-black/20">
        <div className="mx-auto max-w-xl space-y-3 px-4 py-6 text-center text-xs leading-relaxed text-sky-100/80">
          <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm font-semibold">
            <Link href="/sorteo/bases" className="underline underline-offset-4 hover:text-white">Bases y condiciones</Link>
            <Link href="/" className="underline underline-offset-4 hover:text-white">bertonaseguros.com</Link>
            <Link href="/legales#privacidad" className="underline underline-offset-4 hover:text-white">Privacidad</Link>
          </p>
          <p>{EMPRESA.nombre} · Productor Asesor de Seguros · Matrícula SSN N° {MATRICULA_SSN}</p>
          <p>Participar es gratis y no exige comprar ni contratar ningún seguro.</p>
        </div>
        <Cuadros className="h-2" tam={4} />
      </footer>
    </div>
  );
}
