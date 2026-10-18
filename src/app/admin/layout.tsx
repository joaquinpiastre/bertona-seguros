import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { AdminBottomBar, AdminSidebar } from "@/components/panel/AdminNav";
import { SubmitButton } from "@/components/panel/Cliente";
import { Icono } from "@/components/panel/Iconos";
import { TamanoLetra } from "@/components/panel/TamanoLetra";
import { dato } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { logout } from "@/lib/actions/auth";

export const metadata: Metadata = { title: "Panel de administración | Bertona Seguros", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const u = await requireAdmin();
  const cont = await dato<{ alertas: number; pagos: number }>("contadores").catch(() => ({ alertas: 0, pagos: 0 }));
  return (
    <div className="escala-panel min-h-screen bg-soft pb-24 lg:flex lg:pb-0">
      <aside className="hidden w-72 shrink-0 flex-col bg-brand-900 lg:flex">
        <div className="border-b border-white/10 p-5">
          <Link href="/admin"><Logo light /></Link>
          <Link href="/admin/pagos/nuevo" className="mt-5 flex items-center justify-center gap-2 bg-accent-500 px-4 py-3.5 text-base font-bold text-brand-900 transition hover:bg-accent-400">
            <Icono n="cobrar" className="h-5 w-5" /> Registrar cobro
          </Link>
        </div>
        <AdminSidebar contadores={cont} />
        <div className="border-t border-white/10 p-5 text-sm text-brand-100">
          <p className="truncate font-semibold text-white">{u.nombre}</p>
          <p className="truncate text-xs">{u.email}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <form action={logout}><SubmitButton variant="ghost" small pendiente="Saliendo…">Salir</SubmitButton></form>
            <TamanoLetra claro />
          </div>
          <Link href="/" className="mt-3 inline-block text-xs underline underline-offset-4 hover:text-white">Ver el sitio</Link>
        </div>
      </aside>

      <div className="relative min-w-0 flex-1">
        <div className="sticky top-0 z-30 flex min-h-14 items-center justify-between gap-2 bg-brand-900 px-4 py-2 lg:hidden">
          <Link href="/admin"><Logo light /></Link>
          <div className="flex items-center gap-2">
            <TamanoLetra claro />
            <form action={logout}><SubmitButton variant="ghost" small pendiente="Saliendo…">Salir</SubmitButton></form>
          </div>
        </div>
        <main className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
      <AdminBottomBar contadores={cont} />
    </div>
  );
}
