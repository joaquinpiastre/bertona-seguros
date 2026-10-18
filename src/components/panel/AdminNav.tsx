"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icono, type NombreIcono } from "./Iconos";

type Item = { href: string; label: string; icono: NombreIcono; exact?: boolean; badge?: number };

export type Contadores = { alertas: number; pagos: number };

function grupos(c: Contadores): { titulo: string; items: Item[] }[] {
  return [
    {
      titulo: "Para hoy",
      items: [
        { href: "/admin", label: "Inicio", icono: "inicio", exact: true },
        { href: "/admin/vencimientos", label: "Vencimientos", icono: "vencimientos" },
        { href: "/admin/comprobantes", label: "Pagos informados", icono: "inforpago", badge: c.pagos },
        { href: "/admin/alertas", label: "Avisos", icono: "aviso", badge: c.alertas },
      ],
    },
    {
      titulo: "Gestión",
      items: [
        { href: "/admin/clientes", label: "Clientes", icono: "clientes" },
        { href: "/admin/polizas", label: "Pólizas", icono: "polizas" },
        { href: "/admin/siniestros", label: "Siniestros", icono: "siniestros" },
        { href: "/admin/pagos", label: "Pagos y caja", icono: "pagos" },
      ],
    },
    {
      titulo: "Ajustes",
      items: [
        { href: "/admin/configuracion", label: "Configuración", icono: "config" },
        { href: "/admin/equipo", label: "Equipo", icono: "equipo" },
      ],
    },
  ];
}

const esActivo = (path: string, i: Item) => (i.exact ? path === i.href : path === i.href || path.startsWith(i.href + "/"));

/** Menú lateral (computadora). */
export function AdminSidebar({ contadores }: { contadores: Contadores }) {
  const path = usePathname();
  return (
    <nav aria-label="Administración" className="flex-1 overflow-y-auto py-2">
      {grupos(contadores).map((g) => (
        <div key={g.titulo} className="mb-2">
          <p className="px-5 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-300">{g.titulo}</p>
          {g.items.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              aria-current={esActivo(path, i) ? "page" : undefined}
              className={`flex items-center gap-3 border-l-4 px-5 py-3 text-base font-medium transition ${esActivo(path, i) ? "border-accent-400 bg-white/10 text-white" : "border-transparent text-brand-100 hover:bg-white/5 hover:text-white"}`}
            >
              <Icono n={i.icono} className="h-5 w-5 shrink-0" />
              <span className="flex-1">{i.label}</span>
              {i.badge ? <span className="min-w-6 bg-accent-500 px-1.5 text-center text-xs font-bold leading-6 text-brand-900">{i.badge}</span> : null}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}

/** Barra inferior (celular): lo más usado a un toque. */
export function AdminBottomBar({ contadores }: { contadores: Contadores }) {
  const path = usePathname();
  const items: (Item & { extra?: string[] })[] = [
    { href: "/admin", label: "Inicio", icono: "inicio", exact: true },
    { href: "/admin/vencimientos", label: "Vencen", icono: "vencimientos" },
    { href: "/admin/pagos/nuevo", label: "Cobrar", icono: "cobrar" },
    { href: "/admin/clientes", label: "Clientes", icono: "clientes" },
    { href: "/admin/mas", label: "Más", icono: "mas", badge: contadores.alertas + contadores.pagos, extra: ["/admin/comprobantes", "/admin/alertas", "/admin/polizas", "/admin/siniestros", "/admin/pagos", "/admin/configuracion", "/admin/equipo"] },
  ];
  const activo = (i: (typeof items)[number]) => {
    if (i.href === "/admin/pagos/nuevo") return path.startsWith("/admin/pagos/nuevo");
    if (i.extra) return path.startsWith(i.href) || i.extra.some((e) => path.startsWith(e) && !path.startsWith("/admin/pagos/nuevo"));
    return esActivo(path, i);
  };
  return (
    <nav aria-label="Menú principal" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white shadow-[0_-4px_16px_rgba(10,27,51,0.12)] lg:hidden">
      <ul className="grid grid-cols-5">
        {items.map((i) => (
          <li key={i.href}>
            <Link
              href={i.href}
              aria-current={activo(i) ? "page" : undefined}
              className={`relative flex min-h-[4.25rem] flex-col items-center justify-center gap-1 px-1 text-[0.8rem] font-semibold ${activo(i) ? "bg-brand-50 text-brand-800" : "text-ink-soft"}`}
            >
              <Icono n={i.icono} className="h-7 w-7" />
              {i.label}
              {i.badge ? <span className="absolute right-3 top-2 min-w-5 bg-accent-500 px-1 text-center text-[11px] font-bold leading-5 text-brand-900">{i.badge}</span> : null}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
