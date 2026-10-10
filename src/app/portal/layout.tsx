import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { SubmitButton } from "@/components/panel/Cliente";
import { PortalNav } from "@/components/panel/PortalNav";
import { waLink } from "@/config/empresa";
import { logout } from "@/lib/actions/auth";
import { requireSocio } from "@/lib/auth";
import { q1 } from "@/lib/db";

export const metadata: Metadata = { title: "Mi cuenta | Bertona Seguros", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const u = await requireSocio();
  const c = await q1("SELECT nombre FROM clientes WHERE id = $1", [u.cliente_id]);
  return (
    <div className="min-h-screen bg-soft">
      <header className="bg-brand-900 text-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/portal"><Logo light /></Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden max-w-48 truncate sm:block">{c?.nombre ?? u.nombre}</span>
            <form action={logout}><SubmitButton variant="ghost" small pendiente="Saliendo…">Salir</SubmitButton></form>
          </div>
        </div>
        <PortalNav />
      </header>
      <main className="mx-auto max-w-5xl p-4 sm:p-6 lg:py-8">{children}</main>
      <footer className="mx-auto max-w-5xl px-4 pb-10 text-center text-xs text-ink-soft sm:px-6">
        ¿Necesitás ayuda? <a className="font-semibold text-brand-700 underline" href={waLink("Hola! Necesito ayuda con mi cuenta.")} target="_blank" rel="noopener noreferrer">Escribinos por WhatsApp</a> ·{" "}
        <Link href="/" className="underline">Volver al sitio</Link>
      </footer>
    </div>
  );
}
