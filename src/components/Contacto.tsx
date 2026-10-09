"use client";
import { useState } from "react";
import { DIRECCION_COMPLETA, EMPRESA, HORARIOS, MAPS_EMBED_URL, RAMOS, waLink } from "@/config/empresa";
import { ClockIcon, FacebookIcon, InstagramIcon, MailIcon, PhoneIcon, PinIcon, WhatsAppIcon } from "./Icons";
import { SectionTitle } from "./Section";

const field =
  "mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 text-base text-ink shadow-sm transition placeholder:text-ink-soft/60 hover:border-brand-200 focus:border-brand-500";

export function Contacto() {
  const [enviado, setEnviado] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const lineas = [
      "Hola! Quiero cotizar un seguro.",
      `Nombre: ${d.get("nombre")}`,
      `Teléfono: ${d.get("telefono")}`,
      `Tipo de seguro: ${d.get("tipo")}`,
      d.get("mensaje") ? `Mensaje: ${d.get("mensaje")}` : "",
    ].filter(Boolean);
    window.open(waLink(lineas.join("\n")), "_blank", "noopener,noreferrer");
    setEnviado(true);
  }

  return (
    <section id="contacto" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionTitle eyebrow="Contacto" title="Pedí tu cotización sin compromiso" intro="Completá el formulario y seguimos la conversación por WhatsApp." />
        <div className="grid gap-8 lg:grid-cols-5">
          <form onSubmit={onSubmit} className="rounded-[var(--radius)] border border-line bg-soft p-6 shadow-soft sm:p-8 lg:col-span-3">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-bold text-brand-900">Nombre
                <input name="nombre" required autoComplete="name" className={field} placeholder="Tu nombre" />
              </label>
              <label className="block text-sm font-bold text-brand-900">Teléfono
                <input name="telefono" required type="tel" inputMode="tel" autoComplete="tel" className={field} placeholder="260 4..." />
              </label>
            </div>
            <label className="mt-5 block text-sm font-bold text-brand-900">Tipo de seguro
              <select name="tipo" required defaultValue="" className={field}>
                <option value="" disabled>Elegí una opción</option>
                {RAMOS.map((r) => <option key={r.id} value={r.nombre}>{r.nombre}</option>)}
                <option value="Otro / no sé">Otro / no sé</option>
              </select>
            </label>
            <label className="mt-5 block text-sm font-bold text-brand-900">Mensaje (opcional)
              <textarea name="mensaje" rows={4} className={field} placeholder="Contanos qué querés asegurar" />
            </label>
            <button type="submit" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent-500 px-7 py-4 text-base font-bold text-brand-900 shadow-lift transition hover:-translate-y-0.5 hover:bg-accent-400 sm:w-auto">
              <WhatsAppIcon className="h-5 w-5" /> Enviar por WhatsApp
            </button>
            <p role="status" className="mt-3 min-h-5 text-sm text-ink-soft">
              {enviado ? "Se abrió WhatsApp con tu consulta. Si no se abrió, escribinos directamente al botón verde." : "Se abrirá WhatsApp con tu consulta lista para enviar."}
            </p>
          </form>

          <div className="space-y-5 lg:col-span-2">
            <ul className="space-y-4 rounded-[var(--radius)] border border-line p-6 shadow-soft">
              <Dato icon={<PinIcon className="h-5 w-5" />} titulo="Dirección">{DIRECCION_COMPLETA} ({EMPRESA.direccion.cp})</Dato>
              <Dato icon={<PhoneIcon className="h-5 w-5" />} titulo="Teléfono / WhatsApp"><a className="hover:underline" href={`tel:${EMPRESA.telefonoTel}`}>{EMPRESA.telefonoVisible}</a></Dato>
              <Dato icon={<MailIcon className="h-5 w-5" />} titulo="Email"><a className="break-all hover:underline" href={`mailto:${EMPRESA.email}`}>{EMPRESA.email}</a></Dato>
              <Dato icon={<ClockIcon className="h-5 w-5" />} titulo="Horarios">
                {HORARIOS.map((h) => <span key={h.dias} className="block">{h.dias}: {h.horas}</span>)}
              </Dato>
              <li className="flex gap-3 pt-1">
                <a href={EMPRESA.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook de Bertona Seguros" className="grid h-11 w-11 place-items-center rounded-full bg-brand-50 text-brand-700 transition hover:bg-brand-700 hover:text-white"><FacebookIcon className="h-5 w-5" /></a>
                <a href={EMPRESA.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram de Bertona Seguros" className="grid h-11 w-11 place-items-center rounded-full bg-brand-50 text-brand-700 transition hover:bg-brand-700 hover:text-white"><InstagramIcon className="h-5 w-5" /></a>
              </li>
            </ul>
            <div className="overflow-hidden rounded-[var(--radius)] border border-line shadow-soft">
              <iframe title={`Mapa: ${DIRECCION_COMPLETA}`} src={MAPS_EMBED_URL} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="h-64 w-full border-0" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Dato({ icon, titulo, children }: { icon: React.ReactNode; titulo: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">{icon}</span>
      <span className="text-sm leading-relaxed text-ink-soft">
        <strong className="block text-brand-900">{titulo}</strong>
        {children}
      </span>
    </li>
  );
}
