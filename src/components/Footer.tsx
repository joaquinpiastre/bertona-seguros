import Image from "next/image";
import Link from "next/link";
import { DIRECCION_COMPLETA, EMPRESA, MATRICULA_SSN, PRODUCTOR, RAMOS, SSN_TELEFONO } from "@/config/empresa";
import { CREDITOS } from "@/config/imagenes";
import { MERIDIONAL } from "@/config/meridional";
import { FacebookIcon, InstagramIcon } from "./Icons";
import { Logo } from "./Logo";
import { MeridionalLogo } from "./MeridionalLogo";

const h = "text-sm font-bold uppercase tracking-widest text-sky-200";
const a = "text-sm text-sky-100/90 transition hover:text-white";

export function Footer() {
  return (
    <footer className="bg-brand-900 text-sky-100">
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-16 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Logo light />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-sky-100/90">
              Productores asesores de seguros en San Rafael, Mendoza. Te acompañamos desde la cotización hasta el último paso de un siniestro, con el respaldo de {MERIDIONAL.nombre}.
            </p>
            <div className="mt-5 inline-flex flex-col gap-2 rounded-2xl bg-white px-4 py-3">
              <span className="text-[0.65rem] font-bold uppercase tracking-widest text-ink-soft">Con el respaldo de</span>
              <MeridionalLogo className="h-9 w-auto" />
            </div>
            <div className="mt-5 flex gap-3">
              <a href={EMPRESA.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="grid h-11 w-11 place-items-center rounded-full bg-white/10 transition hover:bg-sky-500"><FacebookIcon className="h-5 w-5" /></a>
              <a href={EMPRESA.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="grid h-11 w-11 place-items-center rounded-full bg-white/10 transition hover:bg-sky-500"><InstagramIcon className="h-5 w-5" /></a>
            </div>
          </div>
          <div>
            <p className={h}>Seguros</p>
            <ul className="mt-4 space-y-2.5">
              {RAMOS.slice(0, 7).map((r) => <li key={r.id}><Link className={a} href={`/seguros/${r.id}`}>{r.nombre}</Link></li>)}
              <li><Link className={`${a} font-semibold`} href="/seguros">Ver todos</Link></li>
            </ul>
          </div>
          <div>
            <p className={h}>Clientes</p>
            <ul className="mt-4 space-y-2.5">
              <li><Link className={a} href="/ayuda#siniestros">Denunciar un siniestro</Link></li>
              <li><Link className={a} href="/ayuda#auxilio">Auxilio mecánico</Link></li>
              <li><Link className={a} href="/ayuda#pagos">Medios de pago</Link></li>
              <li><Link className={a} href="/ayuda#baja">Baja y reclamos</Link></li>
              <li><Link className={a} href="/ingresar">Portal de socios</Link></li>
              <li><Link className={a} href="/nosotros">Quiénes somos</Link></li>
              <li><Link className={a} href="/contacto">Contacto</Link></li>
            </ul>
          </div>
          <div>
            <p className={h}>Contacto</p>
            <ul className="mt-4 space-y-2.5 text-sm text-sky-100/90">
              <li>{DIRECCION_COMPLETA}</li>
              <li><a className="hover:text-white" href={`tel:${EMPRESA.telefonoTel}`}>{EMPRESA.telefonoVisible}</a></li>
              <li><a className="break-all hover:text-white" href={`mailto:${EMPRESA.email}`}>{EMPRESA.email}</a></li>
              <li className="pt-2"><span className="block text-xs uppercase tracking-wider text-sky-200">Atención al cliente (Meridional)</span><a className="font-semibold hover:text-white" href={`tel:${MERIDIONAL.telClientesTel}`}>{MERIDIONAL.telClientes}</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 space-y-2 border-t border-white/10 pt-6 text-xs leading-relaxed text-sky-200/90">
          <p>Productor Asesor de Seguros — {PRODUCTOR.nombre} — N° de matrícula SSN: {MATRICULA_SSN}.</p>
          <p>
            Las coberturas, condiciones y primas dependen de cada aseguradora. Los contenidos de este sitio son informativos y no constituyen una oferta vinculante.
            Compañía aseguradora: {MERIDIONAL.nombre} (inscripción SSN N° {MERIDIONAL.inscripcionSSN}). La Superintendencia de Seguros de la Nación es el organismo de control: www.argentina.gob.ar/ssn · Atención al asegurado: {SSN_TELEFONO}.
          </p>
          <p>Créditos de imágenes: {CREDITOS.join(" ")}</p>
          <p>© {new Date().getFullYear()} Grupo Bertona. Todos los derechos reservados.</p>
        </div>
      </div>

      {/* Superintendencia de Seguros de la Nación: al final de todo */}
      <div className="bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-4 px-4 py-6 text-center sm:flex-row sm:gap-8 sm:px-6">
          <a href={MERIDIONAL.ssnWeb} target="_blank" rel="noopener noreferrer" aria-label="Superintendencia de Seguros de la Nación">
            <Image src="/brand/ssn.png" alt="Superintendencia de Seguros de la Nación" width={240} height={140} className="h-16 w-auto sm:h-20" />
          </a>
          <p className="max-w-md text-sm leading-snug text-ink-soft">
            Organismo de control de la actividad aseguradora. Atención al asegurado: <strong className="text-brand-900">{SSN_TELEFONO}</strong>
            <span className="block text-xs">Productor asesor matrícula SSN N° {MATRICULA_SSN}</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
