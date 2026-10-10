"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/portal", label: "Resumen", exact: true },
  { href: "/portal/polizas", label: "Mis pólizas" },
  { href: "/portal/pagos", label: "Pagos y recibos" },
  { href: "/portal/contactos", label: "Contactos de emergencia" },
  { href: "/portal/perfil", label: "Mis datos" },
];

export function PortalNav() {
  const path = usePathname();
  return (
    <nav aria-label="Mi cuenta" className="border-t border-white/10">
      <ul className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-2 sm:px-4">
        {ITEMS.map((i) => {
          const activo = i.exact ? path === i.href : path.startsWith(i.href);
          return (
            <li key={i.href}>
              <Link
                href={i.href}
                aria-current={activo ? "page" : undefined}
                className={`block whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition ${activo ? "border-accent-400 text-white" : "border-transparent text-brand-100 hover:text-white"}`}
              >
                {i.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
