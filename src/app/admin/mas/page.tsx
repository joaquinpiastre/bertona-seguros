import Link from "next/link";
import { Icono, type NombreIcono } from "@/components/panel/Iconos";
import { PageHead } from "@/components/panel/ui";
import { dato } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";

export default async function Mas() {
  await requireAdmin();
  const c = await dato<{ alertas: number; pagos: number }>("contadores").catch(() => ({ alertas: 0, pagos: 0 }));
  const tiles: { href: string; titulo: string; texto: string; icono: NombreIcono; badge?: number }[] = [
    { href: "/admin/comprobantes", titulo: "Pagos informados", texto: "Pagos que avisaron los clientes: aprobar o rechazar", icono: "inforpago", badge: c.pagos },
    { href: "/admin/alertas", titulo: "Avisos", texto: "Pedidos de clientes, pólizas vencidas, bajas", icono: "aviso", badge: c.alertas },
    { href: "/admin/polizas", titulo: "Pólizas", texto: "Todas las pólizas cargadas", icono: "polizas" },
    { href: "/admin/siniestros", titulo: "Siniestros", texto: "Casillero de siniestros", icono: "siniestros" },
    { href: "/admin/pagos", titulo: "Pagos y caja", texto: "Cobros del día y del mes, exportar a Excel", icono: "pagos" },
    { href: "/admin/configuracion", titulo: "Configuración", texto: "Auxilio mecánico, datos de transferencia y días de gracia", icono: "config" },
    { href: "/admin/equipo", titulo: "Equipo", texto: "Personas con acceso al panel", icono: "equipo" },
  ];
  return (
    <>
      <PageHead title="Más opciones" sub="Tocá lo que necesitás" />
      <div className="grid gap-4 sm:grid-cols-2">
        {tiles.map((t) => (
          <Link key={t.href} href={t.href} className="flex items-center gap-4 border border-line bg-white p-5 transition hover:border-brand-500 hover:shadow-lift">
            <span className="relative grid h-14 w-14 shrink-0 place-items-center bg-brand-50 text-brand-700">
              <Icono n={t.icono} className="h-8 w-8" />
              {t.badge ? <span className="absolute -right-2 -top-2 min-w-6 bg-accent-500 px-1.5 text-center text-xs font-bold leading-6 text-brand-900">{t.badge}</span> : null}
            </span>
            <span><strong className="block font-display text-xl text-brand-900">{t.titulo}</strong><span className="text-base text-ink-soft">{t.texto}</span></span>
          </Link>
        ))}
        <Link href="/" className="flex items-center gap-4 border border-line bg-white p-5 transition hover:border-brand-500 hover:shadow-lift">
          <span className="grid h-14 w-14 shrink-0 place-items-center bg-brand-50 text-brand-700"><Icono n="inicio" className="h-8 w-8" /></span>
          <span><strong className="block font-display text-xl text-brand-900">Ver el sitio</strong><span className="text-base text-ink-soft">La página pública de Bertona Seguros</span></span>
        </Link>
      </div>
    </>
  );
}
