import type { Metadata } from "next";
import Link from "next/link";
import { FormularioSorteo } from "@/components/sorteo/Formulario";
import { Cuadros, IconoCalendario, IconoTrofeo, IconoWhatsapp } from "@/components/sorteo/Publico";
import { waLink } from "@/config/empresa";
import { datosPublicos } from "@/lib/sorteo/api";
import { diaCorto, fechaCorta, fechaSorteoTexto } from "@/lib/sorteo/comun";

// Página estática que se renueva sola (y al instante cuando se guarda algo en el panel): carga muy rápido desde el QR.
export const revalidate = 60;

export const metadata: Metadata = {
  alternates: { canonical: "/sorteo" },
  openGraph: { title: "Sorteo Speedway | Bertona Seguros", description: "Participá gratis: completá tus datos y confirmá por WhatsApp.", url: "/sorteo" },
};

const cotizar = waLink("Hola! Vengo del sorteo Speedway y quiero cotizar un seguro.");

function Aviso({ titulo, children }: { titulo: string; children?: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-white p-6 text-center text-ink shadow-card-lift">
      <h2 className="text-2xl text-brand-900">{titulo}</h2>
      {children && <div className="mt-3 space-y-3 leading-relaxed text-ink-soft">{children}</div>}
      <a href={cotizar} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#1fa855] px-6 py-3 text-base font-extrabold text-white transition hover:bg-[#188a45]">
        <IconoWhatsapp className="h-6 w-6" /> Cotizá tu seguro por WhatsApp
      </a>
    </section>
  );
}

export default async function Sorteo() {
  const { estado, sorteo } = await datosPublicos();

  if (estado === "error") {
    return (
      <Aviso titulo="No pudimos cargar el sorteo">
        <p>Probá de nuevo en unos minutos.</p>
        <p><Link href="/sorteo" className="font-bold text-sky-700 underline underline-offset-4">Volver a intentar</Link></p>
      </Aviso>
    );
  }
  if (!sorteo) {
    return (
      <>
        <Encabezado titulo="Próximamente, un nuevo sorteo" />
        <Aviso titulo="Todavía no hay un sorteo abierto">
          <p>Muy pronto vas a poder participar desde acá. ¡Te esperamos en el próximo Speedway!</p>
        </Aviso>
      </>
    );
  }

  const fechaSorteo = fechaSorteoTexto(sorteo.fecha_sorteo);
  return (
    <>
      <Encabezado titulo={sorteo.titulo} descripcion={sorteo.descripcion} />

      <div className="mt-6 grid gap-3">
        {sorteo.premio && (
          <div className="relative overflow-hidden rounded-2xl bg-sun-400 p-4 pr-14 text-brand-900 shadow-card">
            <Cuadros className="absolute inset-y-0 right-0 w-10 opacity-25" tam={5} oscuro="#0d1e3a" />
            <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.2em]"><IconoTrofeo className="h-4 w-4" /> Premio</p>
            <p className="mt-1 whitespace-pre-line text-xl font-extrabold leading-snug">{sorteo.premio}</p>
          </div>
        )}
        {fechaSorteo && (
          <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 p-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-500/20 text-sky-200"><IconoCalendario className="h-6 w-6" /></span>
            <span>
              <span className="block text-xs font-bold uppercase tracking-[0.16em] text-sky-200">Próximo sorteo</span>
              <span className="block text-lg font-extrabold first-letter:uppercase">{fechaSorteo}</span>
            </span>
          </div>
        )}
      </div>

      <div className="mt-6">
        {estado === "abierto" ? (
          <section className="rounded-3xl bg-white p-5 text-ink shadow-card-lift sm:p-7" aria-labelledby="titulo-form">
            <div className="mb-5">
              <span className="inline-block rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">Paso 1 de 2</span>
              <h2 id="titulo-form" className="mt-2 text-2xl text-brand-900">Completá tus datos</h2>
            </div>
            <FormularioSorteo />
            {sorteo.fecha_fin && <p className="mt-4 text-center text-xs text-ink-soft">Podés anotarte hasta el {fechaCorta(sorteo.fecha_fin)} inclusive.</p>}
          </section>
        ) : estado === "proximo" ? (
          <Aviso titulo="El sorteo todavía no empezó">
            <p>Vas a poder anotarte desde el <strong className="text-brand-900">{diaCorto(sorteo.fecha_inicio)}</strong>. ¡Volvé a escanear el QR ese día!</p>
          </Aviso>
        ) : (
          <Aviso titulo="La inscripción ya cerró">
            <p>¡Gracias a todos los que participaron!{fechaSorteo ? <> El sorteo es el <strong className="text-brand-900">{fechaSorteo}</strong>.</> : null}</p>
            <p>Al ganador lo contactamos por WhatsApp.</p>
          </Aviso>
        )}
      </div>
    </>
  );
}

function Encabezado({ titulo, descripcion }: { titulo: string; descripcion?: string }) {
  return (
    <section>
      <p className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.22em] text-sun-400">
        <span aria-hidden className="inline-block h-1 w-8 -skew-x-[30deg] bg-sun-400" />
        Speedway · San Rafael
      </p>
      <h1 className="mt-3 text-[2.15rem] leading-[1.06] sm:text-5xl">{titulo}</h1>
      {descripcion && <p className="mt-3 whitespace-pre-line text-[1.05rem] leading-relaxed text-sky-100">{descripcion}</p>}
    </section>
  );
}
