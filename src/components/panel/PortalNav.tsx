"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icono, type NombreIcono } from "./Iconos";

const ITEMS: { href: string; label: string; icono: NombreIcono; exact?: boolean; extra?: string[] }[] = [
  { href: "/portal", label: "Inicio", icono: "inicio", exact: true },
  { href: "/portal/pagar", label: "Pagar", icono: "pagar" },
  { href: "/portal/presentar", label: "Papeles", icono: "papeles" },
  { href: "/portal/siniestros", label: "Siniestro", icono: "siniestro" },
  { href: "/portal/mas", label: "Más", icono: "mas", extra: ["/portal/polizas", "/portal/pagos", "/portal/tramite", "/portal/auxilio", "/portal/contactos", "/portal/perfil", "/portal/anular"] },
];

function activo(path: string, i: (typeof ITEMS)[number]) {
  if (i.exact) return path === i.href;
  return path.startsWith(i.href) || !!i.extra?.some((e) => path.startsWith(e));
}

/** Menú simple: en el celular, una barra abajo con cinco botones; en la computadora, la misma barra arriba. */
export function PortalNav() {
  const path = usePathname();
  return (
    <>
      <nav aria-label="Menú principal" className="hidden border-t border-white/10 md:block">
        <ul className="mx-auto flex max-w-5xl gap-1 px-4 sm:px-6">
          {ITEMS.map((i) => (
            <li key={i.href}>
              <Link
                href={i.href}
                aria-current={activo(path, i) ? "page" : undefined}
                className={`flex items-center gap-2 border-b-4 px-4 py-3.5 text-base font-semibold transition ${activo(path, i) ? "border-accent-400 text-white" : "border-transparent text-brand-100 hover:text-white"}`}
              >
                <Icono n={i.icono} className="h-5 w-5" />
                {i.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <nav aria-label="Menú principal" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white shadow-[0_-4px_16px_rgba(10,27,51,0.12)] md:hidden">
        <ul className="grid grid-cols-5">
          {ITEMS.map((i) => (
            <li key={i.href}>
              <Link
                href={i.href}
                aria-current={activo(path, i) ? "page" : undefined}
                className={`flex min-h-[4.25rem] flex-col items-center justify-center gap-1 px-1 text-[0.8rem] font-semibold ${activo(path, i) ? "bg-brand-50 text-brand-800" : "text-ink-soft"}`}
              >
                <Icono n={i.icono} className="h-7 w-7" />
                {i.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
