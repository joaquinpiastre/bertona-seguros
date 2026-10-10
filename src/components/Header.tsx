"use client";
import { useEffect, useState } from "react";
import { DIRECCION_COMPLETA, EMPRESA, waLink } from "@/config/empresa";
import { CloseIcon, MailIcon, MenuIcon, PhoneIcon, PinIcon, WhatsAppIcon } from "./Icons";
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
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="hidden bg-brand-900 text-xs text-brand-100 lg:block">
        <div className="mx-auto flex h-9 max-w-6xl items-center justify-between px-6">
          <span className="flex items-center gap-2"><PinIcon className="h-3.5 w-3.5 text-accent-400" />{DIRECCION_COMPLETA}</span>
          <span className="flex items-center gap-6">
            <a href="/ingresar" className="font-semibold text-accent-300 hover:text-white">Área de clientes</a>
            <a href={`tel:${EMPRESA.telefonoTel}`} className="flex items-center gap-2 hover:text-white"><PhoneIcon className="h-3.5 w-3.5 text-accent-400" />{EMPRESA.telefonoVisible}</a>
            <a href={`mailto:${EMPRESA.email}`} className="flex items-center gap-2 hover:text-white"><MailIcon className="h-3.5 w-3.5 text-accent-400" />{EMPRESA.email}</a>
          </span>
        </div>
      </div>
      <div className={`border-b border-line bg-white transition-shadow ${scrolled || open ? "shadow-soft" : ""}`}>
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-4 sm:px-6">
          <a href="#inicio" aria-label="Bertona Seguros, ir al inicio"><Logo /></a>
          <nav aria-label="Principal" className="hidden items-center gap-8 lg:flex">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} className="border-b-2 border-transparent py-2 text-sm font-medium text-ink transition hover:border-accent-500 hover:text-brand-700">
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <a href="/ingresar" className="hidden border border-brand-900 px-4 py-3 text-sm font-semibold text-brand-900 transition hover:bg-brand-50 lg:inline-flex">Ingresar</a>
            <a href={waLink("Hola! Quiero cotizar un seguro.")} target="_blank" rel="noopener noreferrer"
              className="hidden items-center gap-2 bg-brand-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 sm:inline-flex">
              <WhatsAppIcon className="h-4 w-4 text-accent-300" /> Cotizá ahora
            </a>
            <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="menu-movil" aria-label={open ? "Cerrar menú" : "Abrir menú"}
              className="grid h-11 w-11 place-items-center text-brand-900 hover:bg-brand-50 lg:hidden">
              {open ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
            </button>
          </div>
        </div>
        {open && (
          <nav id="menu-movil" aria-label="Móvil" className="border-t border-line bg-white px-4 pb-5 pt-2 lg:hidden">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="block border-b border-line px-1 py-3.5 text-base font-medium text-brand-900">
                {l.label}
              </a>
            ))}
            <a href="/ingresar" className="mt-4 flex items-center justify-center border border-brand-900 px-5 py-3.5 font-semibold text-brand-900">Área de clientes</a>
            <a href={waLink("Hola! Quiero cotizar un seguro.")} target="_blank" rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-2 bg-brand-900 px-5 py-3.5 font-semibold text-white">
              <WhatsAppIcon className="h-5 w-5 text-accent-300" /> Cotizá ahora
            </a>
          </nav>
        )}
      </div>
    </header>
  );
}
