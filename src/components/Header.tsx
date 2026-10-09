"use client";
import { useEffect, useState } from "react";
import { waLink } from "@/config/empresa";
import { CloseIcon, MenuIcon, WhatsAppIcon } from "./Icons";
import { Logo } from "./Logo";

const LINKS = [
  { href: "#inicio", label: "Inicio" },
  { href: "#seguros", label: "Seguros" },
  { href: "#nosotros", label: "Nosotros" },
  { href: "#por-que-elegirnos", label: "Por qué elegirnos" },
  { href: "#contacto", label: "Contacto" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 8);
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all ${scrolled || open ? "bg-white/95 shadow-soft backdrop-blur" : "bg-white/70 backdrop-blur-sm"}`}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="#inicio" aria-label="Bertona Seguros, ir al inicio"><Logo /></a>
        <nav aria-label="Principal" className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="rounded-full px-3.5 py-2 text-sm font-semibold text-ink-soft transition hover:bg-brand-50 hover:text-brand-700">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a href={waLink("Hola! Quiero cotizar un seguro.")} target="_blank" rel="noopener noreferrer"
            className="hidden items-center gap-2 rounded-full bg-accent-500 px-5 py-2.5 text-sm font-bold text-brand-900 shadow-soft transition hover:-translate-y-0.5 hover:bg-accent-400 sm:inline-flex">
            <WhatsAppIcon className="h-4 w-4" /> Cotizá ahora
          </a>
          <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="menu-movil" aria-label={open ? "Cerrar menú" : "Abrir menú"}
            className="grid h-11 w-11 place-items-center rounded-full text-brand-800 hover:bg-brand-50 lg:hidden">
            {open ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
          </button>
        </div>
      </div>
      {open && (
        <nav id="menu-movil" aria-label="Móvil" className="border-t border-line bg-white px-4 pb-5 pt-2 lg:hidden">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="block rounded-xl px-3 py-3 text-base font-semibold text-brand-800 hover:bg-brand-50">
              {l.label}
            </a>
          ))}
          <a href={waLink("Hola! Quiero cotizar un seguro.")} target="_blank" rel="noopener noreferrer"
            className="mt-3 flex items-center justify-center gap-2 rounded-full bg-accent-500 px-5 py-3 font-bold text-brand-900">
            <WhatsAppIcon className="h-5 w-5" /> Cotizá ahora
          </a>
        </nav>
      )}
    </header>
  );
}
