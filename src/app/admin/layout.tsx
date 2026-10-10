import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { MenuMovil, NavLinks, SubmitButton } from "@/components/panel/Cliente";
import { requireAdmin } from "@/lib/auth";
import { logout } from "@/lib/actions/auth";

export const metadata: Metadata = { title: "Panel de administración | Bertona Seguros", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const ITEMS = [
  { href: "/admin", label: "Resumen", exact: true },
  { href: "/admin/cobranzas", label: "Cobranzas" },
  { href: "/admin/pagos", label: "Pagos y caja" },
  { href: "/admin/clientes", label: "Clientes" },
  { href: "/admin/polizas", label: "Pólizas" },
  { href: "/admin/equipo", label: "Equipo" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const u = await requireAdmin();
  return (
    <div className="min-h-screen bg-soft lg:flex">
      <aside className="hidden w-64 shrink-0 flex-col bg-brand-900 lg:flex">
        <div className="border-b border-white/10 p-5">
          <Link href="/admin"><Logo light /></Link>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-300">Panel de administración</p>
        </div>
        <nav aria-label="Administración" className="flex-1 py-3"><NavLinks items={ITEMS} /></nav>
        <div className="border-t border-white/10 p-5 text-sm text-brand-100">
          <p className="truncate font-semibold text-white">{u.nombre}</p>
          <p className="truncate text-xs">{u.email}</p>
          <div className="mt-3 flex items-center gap-3">
            <form action={logout}><SubmitButton variant="ghost" small pendiente="Saliendo…">Salir</SubmitButton></form>
            <Link href="/" className="text-xs underline underline-offset-4 hover:text-white">Ver sitio</Link>
          </div>
        </div>
      </aside>

      <div className="relative min-w-0 flex-1">
        <div className="sticky top-0 z-20 flex h-14 items-center justify-between bg-brand-900 px-4 lg:hidden">
          <Link href="/admin"><Logo light /></Link>
          <MenuMovil items={ITEMS} />
        </div>
        <main className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
