import Link from "next/link";
import { Icono, type NombreIcono } from "@/components/panel/Iconos";
import { EMPRESA, waLink } from "@/config/empresa";
import { portalUsuario } from "@/lib/auth";

const TILES: { href: string; titulo: string; texto: string; icono: NombreIcono }[] = [
  { href: "/portal/polizas", titulo: "Mis pólizas", texto: "Ver mis seguros y anular uno", icono: "poliza" },
  { href: "/portal/pagos", titulo: "Mis recibos y pagos", texto: "Descargar recibos y ver lo que pagué", icono: "recibo" },
  { href: "/portal/tramite", titulo: "Hacer un trámite", texto: "Cambiar el auto, la patente o la cobertura", icono: "tramite" },
  { href: "/portal/auxilio", titulo: "Auxilio mecánico", texto: "A quién llamar si me quedo en la ruta", icono: "auxilio" },
  { href: "/portal/contactos", titulo: "Contactos de emergencia", texto: "Personas a quienes avisar", icono: "contactos" },
  { href: "/portal/perfil", titulo: "Mis datos", texto: "Mi teléfono, dirección y clave", icono: "datos" },
];

const tile = "flex items-center gap-4 border border-line bg-white p-5 transition hover:border-brand-500 hover:shadow-lift";

export default async function Mas() {
  await portalUsuario();
  return (
    <>
      <h1 className="text-3xl text-brand-900">Más opciones</h1>
      <p className="mb-6 mt-1 text-base text-ink-soft">Tocá lo que necesitás.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {TILES.map((t) => (
          <Link key={t.href} href={t.href} className={tile}>
            <span className="grid h-14 w-14 shrink-0 place-items-center bg-brand-50 text-brand-700"><Icono n={t.icono} className="h-8 w-8" /></span>
            <span><strong className="block font-display text-xl text-brand-900">{t.titulo}</strong><span className="text-base text-ink-soft">{t.texto}</span></span>
          </Link>
        ))}
        <a href={waLink("Hola! Necesito ayuda con mi cuenta.")} target="_blank" rel="noopener noreferrer" className={tile}>
          <span className="grid h-14 w-14 shrink-0 place-items-center bg-[#1fa855] text-white"><Icono n="ayuda" className="h-8 w-8" /></span>
          <span><strong className="block font-display text-xl text-brand-900">Ayuda por WhatsApp</strong><span className="text-base text-ink-soft">Escribinos y te respondemos</span></span>
        </a>
        <a href={`tel:${EMPRESA.telefonoTel}`} className={tile}>
          <span className="grid h-14 w-14 shrink-0 place-items-center bg-brand-900 text-white"><Icono n="telefono" className="h-8 w-8" /></span>
          <span><strong className="block font-display text-xl text-brand-900">Llamar a la oficina</strong><span className="text-base text-ink-soft">{EMPRESA.telefonoVisible}</span></span>
        </a>
      </div>
    </>
  );
}
