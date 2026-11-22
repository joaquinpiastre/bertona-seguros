"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const PESTANAS = [
  { href: "/admin/sorteo", label: "Resumen" },
  { href: "/admin/sorteo/participantes", label: "Participantes" },
  { href: "/admin/sorteo/sortear", label: "Sortear" },
  { href: "/admin/sorteo/qr", label: "Códigos QR" },
];

/** Pestañas de la sección Sorteo. "Resumen" incluye la configuración de cada sorteo (/admin/sorteo/nuevo y /admin/sorteo/123). */
export function PestanasSorteo() {
  const path = usePathname();
  const activa = (href: string) =>
    href === "/admin/sorteo" ? path === href || /^\/admin\/sorteo\/(nuevo|\d+)/.test(path) : path === href || path.startsWith(href + "/");
  return (
    <nav aria-label="Sorteo" className="-mx-4 mb-6 overflow-x-auto border-b border-line px-4 sm:mx-0 sm:px-0">
      <ul className="flex min-w-max gap-1">
        {PESTANAS.map((p) => (
          <li key={p.href}>
            <Link
              href={p.href}
              aria-current={activa(p.href) ? "page" : undefined}
              className={`-mb-px block border-b-[3px] px-4 py-3 text-base font-semibold transition ${activa(p.href) ? "border-accent-500 text-brand-900" : "border-transparent text-ink-soft hover:text-brand-800"}`}
            >
              {p.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
