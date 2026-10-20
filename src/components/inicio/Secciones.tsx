import Image from "next/image";
import Link from "next/link";
import { EMPRESA, RAMOS, waLink } from "@/config/empresa";
import { IMG } from "@/config/imagenes";
import { MERIDIONAL } from "@/config/meridional";
import { Icono, type NombreIcono } from "../panel/Iconos";
import { ArrowIcon, RAMO_ICONS, StarIcon, WhatsAppIcon } from "../Icons";
import { btnBorde, btnPrimario, btnSol } from "../PageShell";
import { Reveal } from "../Reveal";
import { SectionTitle } from "../Section";
import { MeridionalLogo } from "../MeridionalLogo";
import { TarjetaRamo } from "../TarjetaRamo";

const personas = RAMOS.filter((r) => r.grupo === "personas");
const empresas = RAMOS.filter((r) => r.grupo === "empresas");

/* ───────── Portada ───────── */
export function Portada() {
  return (
    <section className="relative isolate overflow-hidden bg-brand-900 pt-[72px] text-white lg:pt-[108px]">
      <Image src={IMG.hero.src} alt={IMG.hero.alt} fill priority sizes="100vw" className="-z-20 object-cover object-[70%_center]" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-brand-900 via-brand-900/85 to-sky-700/30 max-lg:bg-brand-900/75" aria-hidden />
      <div className="absolute -left-32 bottom-0 -z-10 h-96 w-96 rounded-full bg-sky-500/25 blur-3xl" aria-hidden />

      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-44 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-[1.15fr_0.85fr] lg:pb-48 lg:pt-24">
        <div>
          <h1 className="text-[2.5rem] leading-[1.05] sm:text-6xl lg:text-[4.25rem]">
            Protegemos <span className="text-sun-400">lo que más querés</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-sky-100 sm:text-xl">
            Autos, motos, hogar, comercio y más. Te asesoramos de cerca, en San Rafael, con el respaldo de Meridional Seguros.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a href={waLink("Hola! Quiero cotizar un seguro.")} target="_blank" rel="noopener noreferrer" className={btnSol}>
              <WhatsAppIcon className="h-5 w-5" /> Cotizar por WhatsApp
            </a>
            <Link href="/seguros" className={btnBorde}>Ver todos los seguros <ArrowIcon className="h-5 w-5" /></Link>
          </div>
          <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-sky-100">
            <li className="flex items-center gap-2">
              <span className="flex text-sun-400">{[1, 1, 1, 1, 0.5].map((f, i) => <StarIcon key={i} fill={f} className="h-4 w-4" />)}</span>
              <strong className="text-white">{String(EMPRESA.reputacion.estrellas).replace(".", ",")}</strong> en Google
            </li>
            <li><strong className="text-white">24 h</strong> atención de siniestros</li>
            <li><strong className="text-white">Desde 1948</strong> respaldo de Meridional</li>
          </ul>
        </div>

        <div className="relative hidden lg:block">
          <div className="relative ml-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-[2rem] border-4 border-white/20 shadow-card-lift">
            <Image src={IMG.nosotros.src} alt={IMG.nosotros.alt} fill sizes="440px" className="object-cover" />
          </div>
          <div className="flotar absolute -left-6 top-10 flex items-center gap-3 rounded-2xl bg-white p-4 text-brand-900 shadow-card-lift">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-sky-100 text-sky-600"><Icono n="papeles" className="h-6 w-6" /></span>
            <span className="text-sm font-bold leading-tight">Asesoramiento<span className="block text-xs font-normal text-ink-soft">personalizado y sin letra chica</span></span>
          </div>
          <div className="flotar absolute -right-2 bottom-10 flex items-center gap-3 rounded-2xl bg-white p-4 text-brand-900 shadow-card-lift [animation-delay:2s]">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-sun-400/30 text-sun-500"><Icono n="ayuda" className="h-6 w-6" /></span>
            <span className="text-sm font-bold leading-tight">Te acompañamos<span className="block text-xs font-normal text-ink-soft">ante cada siniestro</span></span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────── ¿Qué necesitás? (tarjeta que se superpone a la portada) ───────── */
const ACCIONES: { t: string; d: string; href: string; icono: NombreIcono; ext?: boolean }[] = [
  { t: "Cotizar un seguro", d: "Te respondemos por WhatsApp", href: waLink("Hola! Quiero cotizar un seguro."), icono: "poliza", ext: true },
  { t: "Pagar mi cuota", d: "Entrá con tu DNI y contraseña", href: "/ingresar", icono: "pagar" },
  { t: "Denunciar un siniestro", d: "Qué hacer y a quién avisar", href: "/ayuda#siniestros", icono: "siniestro" },
  { t: "Auxilio mecánico", d: "Llamá, 24 horas", href: "/ayuda#auxilio", icono: "auxilio" },
  { t: "Comprobante de póliza", d: "Pedilo por WhatsApp", href: waLink("Hola! Necesito el comprobante de mi póliza."), icono: "recibo", ext: true },
];

export function Acciones() {
  return (
    <section className="relative z-10 -mt-32 px-4 sm:px-6 lg:-mt-36">
      <div className="mx-auto max-w-7xl rounded-3xl bg-white p-5 shadow-card-lift sm:p-8">
        <h2 className="text-2xl text-brand-900 sm:text-3xl">¿Qué necesitás hoy?</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {ACCIONES.map((a) => {
            const c = "group flex items-center gap-4 rounded-2xl border border-line bg-sky-50/60 p-4 transition hover:-translate-y-0.5 hover:border-sky-500 hover:bg-white hover:shadow-card lg:flex-col lg:items-start lg:gap-3";
            const inner = (
              <>
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-sky-500 text-white transition group-hover:bg-sun-400 group-hover:text-brand-900"><Icono n={a.icono} className="h-6 w-6" /></span>
                <span><strong className="block text-base text-brand-900">{a.t}</strong><span className="text-sm text-ink-soft">{a.d}</span></span>
              </>
            );
            return a.ext ? <a key={a.t} href={a.href} target="_blank" rel="noopener noreferrer" className={c}>{inner}</a> : <Link key={a.t} href={a.href} className={c}>{inner}</Link>;
          })}
        </div>
      </div>
    </section>
  );
}

/* ───────── Catálogo ───────── */
export function Catalogo() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionTitle eyebrow="Seguros para personas" title="Protegé lo tuyo y a los tuyos" intro="Elegí lo que necesitás y te armamos una propuesta a medida, sin compromiso." />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {personas.map((r, i) => <Reveal key={r.id} delay={(i % 3) * 70}><TarjetaRamo r={r} /></Reveal>)}
        </div>

        <div className="mt-20">
          <SectionTitle eyebrow="Seguros para empresas" title="Respaldo para tu negocio" intro="Comercios, consorcios, pymes y más: programas pensados para cada actividad." />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {empresas.map((r, i) => <Reveal key={r.id} delay={(i % 3) * 70}><TarjetaRamo r={r} /></Reveal>)}
          </div>
        </div>
        <p className="mt-10 text-center text-sm text-ink-soft">
          ¿No ves lo que buscás? También te asesoramos sobre embarcaciones de placer, garantía extendida, transporte de mercaderías y sepelios. <a className="font-semibold text-sky-600 underline underline-offset-4" href={waLink("Hola! Quiero consultar por un seguro.")} target="_blank" rel="noopener noreferrer">Consultanos</a>.
        </p>
      </div>
    </section>
  );
}

/* ───────── Por qué elegirnos ───────── */
const MOTIVOS: { t: string; d: string; icono: NombreIcono }[] = [
  { t: "Asesoramiento personalizado", d: "Escuchamos lo que necesitás, comparamos opciones y te explicamos todo en simple.", icono: "datos" },
  { t: "Respaldo de Meridional", d: "Una compañía argentina que nació en 1948 y llegó a las principales ciudades del interior.", icono: "papeles" },
  { t: "Siniestros acompañados", d: "Te guiamos con la denuncia y el seguimiento. La atención de siniestros funciona las 24 horas.", icono: "ayuda" },
  { t: "Tu cuenta, siempre a mano", d: "Pagá, mirá tus pólizas y descargá tus papeles desde el celular, con tu DNI y tu contraseña.", icono: "pagar" },
];

export function PorQue() {
  return (
    <section className="bg-sky-50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionTitle eyebrow="¿Por qué Grupo Bertona?" title="Un seguro es tranquilidad, no un trámite" intro="Trabajamos para que tengas el respaldo que necesitás, con un trato humano y sin letra chica." />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {MOTIVOS.map((m, i) => (
            <Reveal key={m.t} delay={i * 70} className="h-full">
              <article className="h-full rounded-3xl bg-white p-7 shadow-card transition hover:-translate-y-1 hover:shadow-card-lift">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-sky-500 text-white"><Icono n={m.icono} className="h-7 w-7" /></span>
                <h3 className="mt-5 text-xl text-brand-900">{m.t}</h3>
                <p className="mt-2 leading-relaxed text-ink-soft">{m.d}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────── Respaldo de Meridional ───────── */
export function RespaldoMeridional() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-center gap-8 rounded-3xl border border-line bg-white p-8 shadow-card sm:p-12 lg:grid-cols-[auto_1fr_auto]">
          <MeridionalLogo className="h-16 w-auto sm:h-20" />
          <div>
            <h2 className="text-2xl text-brand-900 sm:text-3xl">Trabajamos con el respaldo de Meridional Seguros</h2>
            <p className="mt-2 leading-relaxed text-ink-soft">
              Una compañía argentina que nació en 1948 y hoy cuenta con atención de siniestros y asistencia las 24 horas. Inscripción SSN N° {MERIDIONAL.inscripcionSSN}.
            </p>
          </div>
          <Link href="/nosotros#respaldo" className={btnPrimario}>Conocé más</Link>
        </div>
      </div>
    </section>
  );
}

/* ───────── Portal de socios ───────── */
export function PortalPromo() {
  const items = ["Pagá tu cuota (efectivo o transferencia) y descargá el recibo", "Mirá tus pólizas, vencimientos y documentos", "Denunciá un siniestro con fotos", "Pedí trámites o la baja de una póliza", "Ingresás con tu DNI y tu contraseña"];
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <div className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] shadow-card-lift">
              <Image src={IMG.asesoramiento.src} alt={IMG.asesoramiento.alt} fill sizes="(min-width:1024px) 600px, 100vw" className="object-cover" />
            </div>
            <div className="absolute -bottom-6 right-4 rounded-2xl bg-sky-500 px-6 py-4 text-white shadow-card-lift sm:right-8">
              <p className="font-display text-3xl font-extrabold">100%</p>
              <p className="text-sm text-sky-100">desde tu celular</p>
            </div>
          </div>
        </Reveal>
        <Reveal delay={100}>
          <p className="inline-block rounded-full bg-sky-100 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-sky-700">Portal de socios</p>
          <h2 className="mt-4 text-3xl leading-[1.15] text-brand-900 sm:text-4xl">Tu cuenta de Grupo Bertona, simple y a mano</h2>
          <p className="mt-4 text-lg text-ink-soft">Pensado para que cualquier persona lo pueda usar, desde el celular o la computadora.</p>
          <ul className="mt-6 space-y-3">
            {items.map((i) => (
              <li key={i} className="flex items-start gap-3 text-ink">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-sky-500 text-white"><svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden><path d="m4 10.500 4 4 8-9" /></svg></span>
                {i}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/ingresar" className={btnPrimario}>Ingresar a mi cuenta</Link>
            <a href={waLink("Hola! Soy cliente y quiero que me creen mi acceso al portal de socios.")} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-xl border-2 border-sky-500 px-7 py-3.5 font-bold text-sky-600 transition hover:bg-sky-50">Pedir mi acceso</a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────── Cómo trabajamos ───────── */
export function Pasos() {
  const pasos = [
    { t: "Contanos qué querés asegurar", d: "Por WhatsApp, por teléfono o en nuestra oficina de San Rafael." },
    { t: "Comparamos y te asesoramos", d: "Te mostramos las coberturas posibles y te explicamos cada una, sin letra chica." },
    { t: "Contratás y te acompañamos", d: "Nos ocupamos de la gestión y seguimos a tu lado ante cualquier siniestro." },
  ];
  return (
    <section className="bg-brand-900 py-20 text-white sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionTitle light eyebrow="Cómo trabajamos" title="Contratar es más fácil de lo que pensás" />
        <ol className="grid gap-6 md:grid-cols-3">
          {pasos.map((p, i) => (
            <Reveal key={p.t} delay={i * 90} className="h-full">
              <li className="relative h-full rounded-3xl border border-white/10 bg-white/5 p-8">
                <span className="font-display text-6xl font-extrabold text-sky-500/60">{i + 1}</span>
                <h3 className="mt-3 text-xl">{p.t}</h3>
                <p className="mt-2 leading-relaxed text-sky-100">{p.d}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ───────── Atención ───────── */
export function Atencion() {
  const tarjetas = [
    { t: "Siniestros las 24 horas", n: MERIDIONAL.telClientes, tel: MERIDIONAL.telClientesTel, d: "Atención al cliente de Meridional. Si hubo lesionados, opción 2.", icono: "siniestro" as NombreIcono },
    { t: "Auxilio mecánico", n: MERIDIONAL.telClientes, tel: MERIDIONAL.telClientesTel, d: "Llamá y te asisten en la ruta, todos los días.", icono: "auxilio" as NombreIcono },
    { t: "Oficina Grupo Bertona", n: EMPRESA.telefonoVisible, tel: EMPRESA.telefonoTel, d: "San Lorenzo 600, San Rafael. Consultas, cotizaciones y trámites.", icono: "ayuda" as NombreIcono },
  ];
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionTitle eyebrow="Estamos cuando nos necesitás" title="Atención a clientes" intro="Tené estos teléfonos a mano: son los que más se usan." />
        <div className="grid gap-5 md:grid-cols-3">
          {tarjetas.map((t, i) => (
            <Reveal key={t.t} delay={i * 80} className="h-full">
              <a href={`tel:${t.tel}`} className="group flex h-full flex-col rounded-3xl border border-line bg-white p-7 shadow-card transition hover:-translate-y-1 hover:border-sky-500 hover:shadow-card-lift">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-sky-100 text-sky-600 transition group-hover:bg-sky-500 group-hover:text-white"><Icono n={t.icono} className="h-7 w-7" /></span>
                <h3 className="mt-5 text-xl text-brand-900">{t.t}</h3>
                <p className="mt-1 flex-1 text-ink-soft">{t.d}</p>
                <p className="mt-5 font-display text-2xl font-extrabold text-sky-600">{t.n}</p>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────── San Rafael ───────── */
export function Zona() {
  const fotos = [IMG.valleGrande, IMG.atuel, IMG.hero];
  return (
    <section className="bg-sky-50 py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Reveal>
          <p className="inline-block rounded-full bg-sky-100 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-sky-700">Cerca tuyo</p>
          <h2 className="mt-4 text-3xl leading-[1.15] text-brand-900 sm:text-4xl">De San Rafael, para San Rafael</h2>
          <p className="mt-4 text-lg leading-relaxed text-ink-soft">Somos una agencia de la zona. Nos conocés, sabés dónde estamos y cuando necesitás algo, te atendemos en persona.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/nosotros" className={btnPrimario}>Conocé Grupo Bertona</Link>
            <Link href="/contacto" className="inline-flex items-center rounded-xl border-2 border-sky-500 px-7 py-3.5 font-bold text-sky-600 transition hover:bg-sky-50">Cómo llegar</Link>
          </div>
        </Reveal>
        <Reveal delay={100}>
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {fotos.map((f, i) => (
              <div key={f.src} className={`relative overflow-hidden rounded-3xl shadow-card ${i === 1 ? "mt-8 aspect-[3/4]" : "aspect-[3/4]"}`}>
                <Image src={f.src} alt={f.alt} fill sizes="(min-width:1024px) 220px, 33vw" className="object-cover" />
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────── Quiénes nos eligen ───────── */
export function QuienesNosEligen() {
  const bloques = [
    { t: "Personas y familias", d: "Autos, motos, hogar, accidentes personales y viajes, con coberturas que se adaptan a tu bolsillo.", href: "/seguros#personas", icono: RAMO_ICONS.hogar },
    { t: "Comercios y empresas", d: "Seguro de comercio, consorcios, caución, responsabilidad civil y vida colectivo para tu equipo.", href: "/seguros#empresas", icono: RAMO_ICONS.comercio },
  ];
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionTitle eyebrow="¿Quiénes nos eligen?" title="Para cada necesidad, una propuesta" />
        <div className="grid gap-6 md:grid-cols-2">
          {bloques.map((b, i) => {
            const I = b.icono;
            return (
              <Reveal key={b.t} delay={i * 90} className="h-full">
                <Link href={b.href} className="group flex h-full items-start gap-5 rounded-3xl border border-line bg-white p-8 shadow-card transition hover:-translate-y-1 hover:border-sky-500 hover:shadow-card-lift">
                  <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-sky-500 text-white"><I className="h-8 w-8" /></span>
                  <span>
                    <strong className="block font-display text-2xl text-brand-900">{b.t}</strong>
                    <span className="mt-2 block leading-relaxed text-ink-soft">{b.d}</span>
                    <span className="mt-4 inline-flex items-center gap-2 font-bold text-sky-600">Ver seguros <ArrowIcon className="h-4 w-4 transition group-hover:translate-x-1" /></span>
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

