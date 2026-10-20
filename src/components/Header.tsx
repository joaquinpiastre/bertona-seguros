"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { EMPRESA, RAMOS, waLink } from "@/config/empresa";
import { RAMO_ICONS, CloseIcon, MenuIcon, PhoneIcon, WhatsAppIcon } from "./Icons";
import { Logo } from "./Logo";
import { MeridionalLogo } from "./MeridionalLogo";

const CLIENTES = [
  { href: "/ayuda#siniestros", t: "Denunciar un siniestro", d: "Qué hacer y a quién avisar" },
  { href: "/ayuda#auxilio", t: "Auxilio mecánico", d: "Llamá y te asisten las 24 h" },
  { href: "/ayuda#pagos", t: "Medios de pago", d: "Cómo pagar tu cuota" },
  { href: "/ayuda#baja", t: "Baja y reclamos", d: "Pedí la baja o presentá un reclamo" },
  { href: "/ingresar", t: "Portal de socios", d: "Ingresá con tu DNI y contraseña" },
];
const NOSOTROS = [
  { href: "/nosotros", t: "Quiénes somos", d: "Grupo Bertona y su respaldo" },
  { href: "/contacto", t: "Contacto", d: "Oficina, teléfonos y mapa" },
];

const personas = RAMOS.filter((r) => r.grupo === "personas");
const empresas = RAMOS.filter((r) => r.grupo === "empresas");

function ListaRamos({ items, onClick }: { items: typeof RAMOS; onClick?: () => void }) {
  return (
    <ul className="space-y-1">
      {items.map((r) => {
        const Icon = RAMO_ICONS[r.id];
        return (
          <li key={r.id}>
            <Link href={`/seguros/${r.id}`} onClick={onClick} className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-sky-50">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-sky-100 text-sky-600"><Icon className="h-5 w-5" /></span>
              <span className="text-sm font-semibold text-brand-900">{r.nombre}<span className="block text-xs font-normal text-ink-soft">{r.corto}</span></span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function ListaLinks({ items, onClick }: { items: { href: string; t: string; d: string }[]; onClick?: () => void }) {
  return (
    <ul className="space-y-1">
      {items.map((l) => (
        <li key={l.href}>
          <Link href={l.href} onClick={onClick} className="block rounded-xl px-3 py-2.5 transition hover:bg-sky-50">
            <span className="text-sm font-semibold text-brand-900">{l.t}</span>
            <span className="block text-xs text-ink-soft">{l.d}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

const trigger = "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2.5 text-[0.95rem] font-semibold text-brand-900 transition hover:bg-sky-50 hover:text-sky-600";

export function Header() {
  const [open, setOpen] = useState(false);
  const [sub, setSub] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 8);
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);
  const cerrar = () => { setOpen(false); setSub(null); };
  const chevron = <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 transition group-hover:rotate-180 group-focus-within:rotate-180" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="m5 8 5 5 5-5" /></svg>;

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="hidden bg-brand-900 text-[0.8rem] text-sky-100 lg:block">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-6">
          <span className="flex items-center gap-5"><span>San Lorenzo 600, San Rafael, Mendoza</span><span className="flex items-center gap-2 border-l border-white/20 pl-5 text-sky-200">Con el respaldo de <MeridionalLogo className="h-5 w-auto" /></span></span>
          <span className="flex items-center gap-6">
            <a href={`tel:${EMPRESA.telefonoTel}`} className="flex items-center gap-2 hover:text-white"><PhoneIcon className="h-3.5 w-3.5 text-sun-400" />{EMPRESA.telefonoVisible}</a>
            <a href={`mailto:${EMPRESA.email}`} className="hover:text-white">{EMPRESA.email}</a>
          </span>
        </div>
      </div>
      <div className={`border-b border-line bg-white/95 backdrop-blur transition-shadow ${scrolled || open ? "shadow-card" : ""}`}>
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" aria-label="Grupo Bertona, ir al inicio" onClick={cerrar}><Logo /></Link>

          <nav aria-label="Principal" className="hidden items-center gap-1 lg:flex">
            <Link href="/" className={trigger}>Inicio</Link>

            <div className="group relative">
              <Link href="/seguros" className={trigger}>Seguros {chevron}</Link>
              <div className="invisible absolute left-1/2 top-full w-[640px] -translate-x-1/2 pt-3 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                <div className="grid grid-cols-2 gap-4 rounded-2xl border border-line bg-white p-4 shadow-card-lift">
                  <div><p className="px-3 pb-2 text-xs font-bold uppercase tracking-widest text-sky-600">Personas</p><ListaRamos items={personas} /></div>
                  <div><p className="px-3 pb-2 text-xs font-bold uppercase tracking-widest text-sky-600">Empresas</p><ListaRamos items={empresas} /></div>
                </div>
              </div>
            </div>

            <div className="group relative">
              <Link href="/ayuda" className={trigger}>Clientes {chevron}</Link>
              <div className="invisible absolute left-0 top-full w-80 pt-3 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                <div className="rounded-2xl border border-line bg-white p-3 shadow-card-lift"><ListaLinks items={CLIENTES} /></div>
              </div>
            </div>

            <div className="group relative">
              <Link href="/nosotros" className={trigger}>Nosotros {chevron}</Link>
              <div className="invisible absolute left-0 top-full w-72 pt-3 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                <div className="rounded-2xl border border-line bg-white p-3 shadow-card-lift"><ListaLinks items={NOSOTROS} /></div>
              </div>
            </div>
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/ingresar" className="hidden rounded-xl border-2 border-sky-500 px-4 py-2.5 text-sm font-bold text-sky-600 transition hover:bg-sky-50 sm:inline-flex">Ingresar</Link>
            <a href={waLink("Hola! Quiero cotizar un seguro.")} target="_blank" rel="noopener noreferrer"
              className="hidden items-center gap-2 rounded-xl bg-sky-500 px-5 py-3 text-sm font-bold text-white shadow-card transition hover:bg-sky-600 md:inline-flex">
              <WhatsAppIcon className="h-4 w-4" /> Cotizá ahora
            </a>
            <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="menu-movil" aria-label={open ? "Cerrar menú" : "Abrir menú"}
              className="grid h-11 w-11 place-items-center rounded-xl text-brand-900 hover:bg-sky-50 lg:hidden">
              {open ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {open && (
          <nav id="menu-movil" aria-label="Móvil" className="max-h-[calc(100dvh-72px)] overflow-y-auto border-t border-line bg-white px-4 pb-6 pt-2 lg:hidden">
            <Link href="/" onClick={cerrar} className="block border-b border-line px-1 py-4 text-lg font-bold text-brand-900">Inicio</Link>
            {([
              ["seguros", "Seguros", <div key="s" className="space-y-3 pb-3"><p className="px-3 text-xs font-bold uppercase tracking-widest text-sky-600">Personas</p><ListaRamos items={personas} onClick={cerrar} /><p className="px-3 pt-2 text-xs font-bold uppercase tracking-widest text-sky-600">Empresas</p><ListaRamos items={empresas} onClick={cerrar} /></div>],
              ["clientes", "Clientes", <div key="c" className="pb-3"><ListaLinks items={CLIENTES} onClick={cerrar} /></div>],
              ["nosotros", "Nosotros", <div key="n" className="pb-3"><ListaLinks items={NOSOTROS} onClick={cerrar} /></div>],
            ] as [string, string, React.ReactNode][]).map(([id, label, body]) => (
              <div key={id} className="border-b border-line">
                <button onClick={() => setSub(sub === id ? null : id)} aria-expanded={sub === id} className="flex w-full items-center justify-between px-1 py-4 text-left text-lg font-bold text-brand-900">
                  {label}
                  <svg viewBox="0 0 20 20" className={`h-5 w-5 transition ${sub === id ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="m5 8 5 5 5-5" /></svg>
                </button>
                {sub === id && body}
              </div>
            ))}
            <Link href="/ingresar" onClick={cerrar} className="mt-5 flex items-center justify-center rounded-xl border-2 border-sky-500 px-5 py-3.5 font-bold text-sky-600">Ingresar a mi cuenta</Link>
            <a href={waLink("Hola! Quiero cotizar un seguro.")} target="_blank" rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-5 py-3.5 font-bold text-white">
              <WhatsAppIcon className="h-5 w-5" /> Cotizá ahora
            </a>
          </nav>
        )}
      </div>
    </header>
  );
}
