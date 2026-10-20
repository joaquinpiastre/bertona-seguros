import type { Metadata } from "next";
import { PageHero, PageShell, btnPrimario, btnBordeAzul } from "@/components/PageShell";
import { IMG } from "@/config/imagenes";
import { EMPRESA, waLink } from "@/config/empresa";
import { AUXILIO, BAJA_RECLAMOS, MERIDIONAL, PAGOS, SINIESTROS } from "@/config/meridional";

export const metadata: Metadata = {
  title: "Ayuda al cliente: siniestros, auxilio mecánico y pagos",
  description: "Qué hacer ante un siniestro, cómo pedir auxilio mecánico, medios de pago, baja y reclamos. Bertona Seguros, San Rafael, Mendoza.",
  alternates: { canonical: "/ayuda" },
};

const h2 = "text-3xl text-brand-900 sm:text-4xl";
const h3 = "text-xl text-brand-900";

export default function Ayuda() {
  return (
    <PageShell>
      <PageHero eyebrow="Atención a clientes" titulo="Todo lo que necesitás saber, explicado simple" texto="Siniestros, auxilio mecánico, medios de pago, baja y reclamos. Y si preferís que te ayudemos, escribinos: respondemos con gusto." img={IMG.atuel} migas={[{ href: "/", t: "Inicio" }, { t: "Atención a clientes" }]} />

      <nav aria-label="Secciones de ayuda" className="sticky top-[72px] z-30 border-b border-line bg-white/95 backdrop-blur lg:top-[108px]">
        <ul className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-3 sm:px-6">
          {[["siniestros", "Siniestros"], ["auxilio", "Auxilio mecánico"], ["pagos", "Medios de pago"], ["baja", "Baja y reclamos"]].map(([id, l]) => (
            <li key={id}><a href={`#${id}`} className="block whitespace-nowrap rounded-full border border-line px-4 py-2 text-sm font-bold text-brand-800 hover:border-sky-500 hover:bg-sky-50">{l}</a></li>
          ))}
        </ul>
      </nav>

      {/* Siniestros */}
      <section id="siniestros" className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className={h2}>Tuve un siniestro: qué hacer</h2>
          <p className="mt-3 text-lg text-ink-soft">{SINIESTROS.intro}</p>
          <div className="mt-6 rounded-2xl border-l-4 border-red-600 bg-red-50 px-5 py-4 text-red-900">
            <strong>Urgente.</strong> {SINIESTROS.urgente}
          </div>

          <h3 className={`${h3} mt-10`}>A quién avisar</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {SINIESTROS.canales.map((c) => (
              <div key={c.titulo} className={`rounded-2xl border p-5 shadow-card ${c.destacado ? "border-sky-500 bg-sky-50" : "border-line bg-white"}`}>
                <p className="font-display text-lg font-semibold text-brand-900">{c.titulo}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">{c.texto}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href={waLink("Hola! Tuve un siniestro y necesito ayuda.")} target="_blank" rel="noopener noreferrer" className={btnPrimario}>Avisar a Bertona por WhatsApp</a>
            <a href={`tel:${EMPRESA.telefonoTel}`} className={btnBordeAzul}>Llamar a la oficina</a>
            <a href={`tel:${MERIDIONAL.telClientesTel}`} className={btnBordeAzul}>Llamar a Meridional {MERIDIONAL.telClientes}</a>
          </div>

          <h3 className={`${h3} mt-10`}>Datos que conviene tener a mano</h3>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-ink-soft">{SINIESTROS.datos.map((d) => <li key={d}>{d}</li>)}</ul>

          <h3 className={`${h3} mt-10`}>Qué te van a pedir según el caso</h3>
          <div className="mt-4 space-y-3">
            {SINIESTROS.porTipo.map((t) => (
              <details key={t.titulo} className="group rounded-2xl border border-line bg-white shadow-card open:border-sky-500">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 font-display text-lg font-semibold text-brand-900 [&::-webkit-details-marker]:hidden">
                  {t.titulo}<span className="text-sky-600 transition group-open:rotate-45" aria-hidden>+</span>
                </summary>
                <ul className="list-disc space-y-1.5 px-5 pb-5 pl-10 text-ink-soft">{t.items.map((i) => <li key={i}>{i}</li>)}</ul>
              </details>
            ))}
          </div>

          <h3 className={`${h3} mt-10`}>Consejos</h3>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-ink-soft">{SINIESTROS.consejos.map((d) => <li key={d}>{d}</li>)}</ul>
          <p className="mt-6 text-sm text-ink-soft">Si el otro vehículo no es de un cliente de Meridional pero el siniestro involucra a un asegurado de la compañía, el tercero puede iniciar el reclamo en el <a className="font-semibold underline" href={MERIDIONAL.portalTerceros} target="_blank" rel="noopener noreferrer">portal de terceros</a>.</p>
        </div>
      </section>

      {/* Auxilio */}
      <section id="auxilio" className="bg-sky-50 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className={h2}>{AUXILIO.titulo}</h2>
          <p className="mt-3 text-lg text-ink-soft">{AUXILIO.intro}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={`tel:${MERIDIONAL.telClientesTel}`} className={btnPrimario}>Llamar al {MERIDIONAL.telClientes}</a>
          </div>

          <h3 className={`${h3} mt-10`}>Cómo se pide</h3>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-ink-soft">{AUXILIO.pasos.map((p) => <li key={p}>{p}</li>)}</ol>

          <h3 className={`${h3} mt-10`}>Servicios y kilómetros según tu cobertura</h3>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-white shadow-card">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="border-b border-line bg-sky-50 text-xs uppercase tracking-wider text-ink-soft"><tr><th className="px-4 py-3">Cobertura</th><th className="px-4 py-3">Servicios</th><th className="px-4 py-3">Remolque</th></tr></thead>
              <tbody className="divide-y divide-line">
                {AUXILIO.planes.map((p) => (<tr key={p.cobertura}><td className="px-4 py-3 font-semibold text-brand-900">{p.cobertura}</td><td className="px-4 py-3">{p.servicios}</td><td className="px-4 py-3 text-ink-soft">{p.km}</td></tr>))}
              </tbody>
            </table>
          </div>
          <h3 className={`${h3} mt-8`}>Tené en cuenta</h3>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-ink-soft">{AUXILIO.limites.map((l) => <li key={l}>{l}</li>)}</ul>
          <h3 className={`${h3} mt-8`}>Asistencia al viajero (seguros de automotor)</h3>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-ink-soft">{AUXILIO.viajero.map((l) => <li key={l}>{l}</li>)}</ul>
          <p className="mt-6 text-xs text-ink-soft">Información de Meridional Seguros (2026). El detalle exacto de tu servicio figura en tu póliza.</p>
        </div>
      </section>

      {/* Pagos */}
      <section id="pagos" className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className={h2}>Cómo pagar mi cuota</h2>
          <p className="mt-3 text-lg text-ink-soft">{PAGOS.intro}</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {PAGOS.medios.map((m) => (
              <div key={m.titulo} className="rounded-2xl border border-line bg-white p-5 shadow-card">
                <p className="font-display text-lg font-semibold text-brand-900">{m.titulo}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">{m.texto}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-sm text-ink-soft">{PAGOS.nota}</p>
          <a href={waLink("Hola! Necesito mi cuponera / código de pago.")} target="_blank" rel="noopener noreferrer" className={`${btnPrimario} mt-4`}>Pedir mi cuponera por WhatsApp</a>
        </div>
      </section>

      {/* Baja y reclamos */}
      <section id="baja" className="bg-sky-50 py-16 sm:py-20">
        <div className="mx-auto grid max-w-4xl gap-10 px-4 sm:px-6 md:grid-cols-2">
          <div>
            <h2 className="text-2xl text-brand-900 sm:text-3xl">Pedir la baja de un seguro</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-ink-soft">{BAJA_RECLAMOS.baja.map((b) => <li key={b}>{b}</li>)}</ul>
            <a href={MERIDIONAL.solicitudBaja} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-sm font-semibold text-sky-600 underline underline-offset-4">Formulario de baja de Meridional</a>
          </div>
          <div>
            <h2 className="text-2xl text-brand-900 sm:text-3xl">Reclamos</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-ink-soft">{BAJA_RECLAMOS.reclamos.map((b) => <li key={b}>{b}</li>)}</ul>
            <div className="mt-4 flex flex-col gap-2 text-sm font-semibold text-brand-700">
              <a className="underline underline-offset-4" href={MERIDIONAL.formularioReclamos} target="_blank" rel="noopener noreferrer">Formulario de reclamos de Meridional</a>
              <a className="underline underline-offset-4" href={MERIDIONAL.ssnWeb} target="_blank" rel="noopener noreferrer">Superintendencia de Seguros de la Nación</a>
              <a className="underline underline-offset-4" href={MERIDIONAL.denunciaAnonima} target="_blank" rel="noopener noreferrer">Denuncia anónima de fraude</a>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
