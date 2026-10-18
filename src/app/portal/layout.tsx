import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Icono } from "@/components/panel/Iconos";
import { PortalNav } from "@/components/panel/PortalNav";
import { SubmitButton } from "@/components/panel/Cliente";
import { TamanoLetra } from "@/components/panel/TamanoLetra";
import { EMPRESA, waLink } from "@/config/empresa";
import { logout } from "@/lib/actions/auth";
import { requireSocio } from "@/lib/auth";

export const metadata: Metadata = { title: "Mi cuenta | Bertona Seguros", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  await requireSocio();
  return (
    <div className="escala-panel min-h-screen bg-soft pb-28 md:pb-0">
      <header className="bg-brand-900 text-white">
        <div className="mx-auto flex min-h-[4.25rem] max-w-5xl items-center justify-between gap-2 px-4 py-2 sm:px-6">
          <Link href="/portal" aria-label="Ir al inicio"><Logo light /></Link>
          <div className="flex items-center gap-2">
            <TamanoLetra claro />
            <a href={`tel:${EMPRESA.telefonoTel}`} className="inline-flex min-h-11 items-center gap-2 border border-white/40 px-3 text-sm font-semibold hover:bg-white/10" aria-label="Llamar a la oficina">
              <Icono n="telefono" className="h-5 w-5" /><span className="hidden sm:inline">Llamar</span>
            </a>
            <form action={logout}><SubmitButton variant="ghost" small pendiente="Saliendo…">Salir</SubmitButton></form>
          </div>
        </div>
        <PortalNav />
      </header>
      <main className="mx-auto max-w-5xl p-4 sm:p-6 lg:py-8">{children}</main>
      <footer className="mx-auto max-w-5xl px-4 pb-10 text-center text-sm text-ink-soft sm:px-6">
        <Image src="/brand/ssn.png" alt="Superintendencia de Seguros de la Nación" width={120} height={70} className="mx-auto mb-3 h-10 w-auto" />
        ¿Necesitás ayuda? <a className="font-semibold text-brand-700 underline" href={waLink("Hola! Necesito ayuda con mi cuenta.")} target="_blank" rel="noopener noreferrer">Escribinos por WhatsApp</a> ·{" "}
        <Link href="/" className="underline">Volver al sitio</Link>
      </footer>
    </div>
  );
}
