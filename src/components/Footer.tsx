import { DIRECCION_COMPLETA, EMPRESA, MATRICULA_SSN } from "@/config/empresa";
import { CREDITOS } from "@/config/imagenes";
import { FacebookIcon, InstagramIcon } from "./Icons";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="bg-brand-900 pb-28 pt-14 text-brand-100 sm:pb-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <Logo light />
            <p className="mt-4 text-sm leading-relaxed">{EMPRESA.nombreLargo} · {EMPRESA.rubro} en San Rafael, Mendoza.</p>
          </div>
          <div className="text-sm leading-relaxed">
            <p className="font-bold text-white">Contacto</p>
            <p className="mt-3">{DIRECCION_COMPLETA}</p>
            <p><a className="hover:text-white" href={`tel:${EMPRESA.telefonoTel}`}>{EMPRESA.telefonoVisible}</a></p>
            <p><a className="break-all hover:text-white" href={`mailto:${EMPRESA.email}`}>{EMPRESA.email}</a></p>
          </div>
          <div>
            <p className="text-sm font-bold text-white">Seguinos</p>
            <div className="mt-3 flex gap-3">
              <a href={EMPRESA.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="grid h-11 w-11 place-items-center border border-white/25 transition hover:border-accent-400 hover:text-accent-300"><FacebookIcon className="h-5 w-5" /></a>
              <a href={EMPRESA.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="grid h-11 w-11 place-items-center border border-white/25 transition hover:border-accent-400 hover:text-accent-300"><InstagramIcon className="h-5 w-5" /></a>
            </div>
          </div>
        </div>
        <div className="mt-10 space-y-2 border-t border-white/10 pt-6 text-xs leading-relaxed text-brand-200">
          <p>
            Productor Asesor de Seguros — N° de matrícula SSN: {MATRICULA_SSN}. {/* TODO: completar matrícula real */}
          </p>
          <p>
            Las coberturas, condiciones y primas dependen de cada aseguradora. Los contenidos de este sitio son informativos y no constituyen una oferta vinculante.
            La Superintendencia de Seguros de la Nación es el organismo de control: www.argentina.gob.ar/ssn.
          </p>
          <p>Créditos de imágenes: {CREDITOS.join(" ")}</p>
          <p>© {new Date().getFullYear()} Bertona Seguros. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
