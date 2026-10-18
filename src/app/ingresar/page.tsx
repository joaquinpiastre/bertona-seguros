import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { SubmitButton } from "@/components/panel/Cliente";
import { Flash, inputCls } from "@/components/panel/ui";
import { EMPRESA, waLink } from "@/config/empresa";
import { login, loginDni } from "@/lib/actions/auth";
import { getUsuario } from "@/lib/auth";

export const metadata: Metadata = { title: "Ingresar | Bertona Seguros", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type SP = { error?: string; ok?: string; modo?: string; dni?: string; pin?: string };

export default async function Ingresar({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const u = await getUsuario();
  // Si llegó con un mensaje de error no lo redirigimos: la sesión ya se cerró.
  if (u && !sp.error) redirect(u.rol === "admin" ? "/admin" : "/portal");
  const equipo = sp.modo === "equipo";
  const pideClave = sp.pin === "1" && !!sp.dni;

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden bg-brand-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Link href="/"><Logo light /></Link>
        <div>
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-accent-300"><span className="h-px w-8 bg-accent-400" />Área de clientes</p>
          <h1 className="mt-5 max-w-md text-4xl leading-tight">Tus pólizas, pagos y recibos en un solo lugar</h1>
          <p className="mt-4 max-w-md text-brand-100">Consultá tu cobertura, descargá tus comprobantes y presentá tu documentación cuando la necesites.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white px-3 py-2"><Image src="/brand/ssn.png" alt="Superintendencia de Seguros de la Nación" width={120} height={70} className="h-12 w-auto" /></div>
          <p className="text-sm text-brand-200">{EMPRESA.nombreLargo} · San Rafael, Mendoza</p>
        </div>
      </section>

      <section className="flex items-center justify-center bg-soft px-4 py-12">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-8 block lg:hidden"><Logo /></Link>

          {equipo ? (
            <>
              <h2 className="text-3xl text-brand-900">Ingreso del personal</h2>
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
              <Link href="/ingresar" className="mt-6 inline-block text-sm font-semibold text-brand-700 underline underline-offset-4">Soy cliente: ingresar con mi DNI</Link>
            </>
          ) : (
            <>
              <h2 className="text-3xl text-brand-900">Ingresá con tu DNI</h2>
              <p className="mt-1 text-sm text-ink-soft">{pideClave ? "Tu cuenta tiene una clave. Escribila para continuar." : "Escribí tu número de documento, sin puntos."}</p>
              <div className="mt-6"><Flash sp={sp} /></div>
              <form action={loginDni} className="space-y-4">
                {pideClave ? (
                  <>
                    <input type="hidden" name="dni" value={sp.dni} />
                    <p className="text-sm text-ink-soft">DNI: <strong className="text-brand-900">{sp.dni}</strong> · <Link href="/ingresar" className="underline">cambiar</Link></p>
                    <label className="block text-sm font-semibold text-brand-900">Clave
                      <input name="pin" type="password" inputMode="numeric" required autoFocus autoComplete="current-password" className={inputCls} />
                    </label>
                  </>
                ) : (
                  <label className="block text-sm font-semibold text-brand-900">DNI
                    <input name="dni" inputMode="numeric" pattern="[0-9.]*" required autoComplete="username" placeholder="Ej: 30111222" className={`${inputCls} !py-3.5 text-lg tracking-wider`} />
                  </label>
                )}
                <SubmitButton pendiente="Ingresando…">Ingresar</SubmitButton>
              </form>
              <p className="mt-8 text-sm text-ink-soft">
                ¿No podés ingresar? <a href={waLink("Hola! Necesito ayuda para ingresar a mi cuenta.")} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-700 underline underline-offset-4">Escribinos por WhatsApp</a>.
              </p>
              <div className="mt-6 flex items-center justify-between text-sm">
                <Link href="/" className="text-ink-soft hover:text-brand-700">← Volver al sitio</Link>
                <Link href="/ingresar?modo=equipo" className="text-ink-soft hover:text-brand-700">Ingreso del personal</Link>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
