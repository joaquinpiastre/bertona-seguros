import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { SubmitButton } from "@/components/panel/Cliente";
import { Flash, inputCls } from "@/components/panel/ui";
import { EMPRESA, waLink } from "@/config/empresa";
import { login } from "@/lib/actions/auth";
import { getUsuario } from "@/lib/auth";

export const metadata: Metadata = { title: "Ingresar | Bertona Seguros", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function Ingresar({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const u = await getUsuario();
  if (u) redirect(u.rol === "admin" ? "/admin" : "/portal");
  const sp = await searchParams;
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden bg-brand-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Link href="/"><Logo light /></Link>
        <div>
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-accent-300"><span className="h-px w-8 bg-accent-400" />Área de clientes</p>
          <h1 className="mt-5 max-w-md text-4xl leading-tight">Tus pólizas, pagos y recibos en un solo lugar</h1>
          <p className="mt-4 max-w-md text-brand-100">Consultá tu cobertura, descargá tus comprobantes y mantené al día tus contactos de emergencia.</p>
        </div>
        <p className="text-sm text-brand-200">{EMPRESA.nombreLargo} · San Rafael, Mendoza</p>
      </section>
      <section className="flex items-center justify-center bg-soft px-4 py-12">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-8 block lg:hidden"><Logo /></Link>
          <h2 className="text-3xl text-brand-900">Ingresar</h2>
          <p className="mt-1 text-sm text-ink-soft">Accedé con tu email y contraseña.</p>
          <div className="mt-6"><Flash sp={sp} /></div>
          <form action={login} className="space-y-4">
            <label className="block text-sm font-semibold text-brand-900">Email
              <input name="email" type="email" required autoComplete="username" className={inputCls} />
            </label>
            <label className="block text-sm font-semibold text-brand-900">Contraseña
              <input name="password" type="password" required autoComplete="current-password" className={inputCls} />
            </label>
            <SubmitButton pendiente="Ingresando…">Ingresar</SubmitButton>
          </form>
          <p className="mt-8 text-sm text-ink-soft">
            ¿Todavía no tenés acceso o olvidaste tu contraseña?{" "}
            <a href={waLink("Hola! Necesito ayuda con mi acceso al área de clientes.")} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-700 underline underline-offset-4">Escribinos por WhatsApp</a>.
          </p>
          <Link href="/" className="mt-6 inline-block text-sm text-ink-soft hover:text-brand-700">← Volver al sitio</Link>
        </div>
      </section>
    </main>
  );
}
