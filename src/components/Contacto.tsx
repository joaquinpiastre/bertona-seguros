"use client";
import { useState } from "react";
import { DIRECCION_COMPLETA, EMPRESA, HORARIOS, MAPS_EMBED_URL, RAMOS, waLink } from "@/config/empresa";
import { MERIDIONAL } from "@/config/meridional";
import { ClockIcon, FacebookIcon, InstagramIcon, MailIcon, PhoneIcon, PinIcon, WhatsAppIcon } from "./Icons";
import { SectionTitle } from "./Section";

const field =
  "mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 text-base text-ink transition placeholder:text-ink-soft/60 hover:border-sky-200 focus:border-sky-500";

export function Contacto({ titulo = "Pedí tu cotización sin compromiso" }: { titulo?: string }) {
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
    <section id="contacto" className="bg-sky-50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionTitle eyebrow="Contacto" title={titulo} intro="Completá el formulario y seguimos la conversación por WhatsApp." />
        <div className="grid gap-8 lg:grid-cols-5">
          <form onSubmit={onSubmit} className="rounded-3xl bg-white p-6 shadow-card sm:p-8 lg:col-span-3">
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
                <optgroup label="Personas">{RAMOS.filter((r) => r.grupo === "personas").map((r) => <option key={r.id} value={r.nombre}>{r.nombre}</option>)}</optgroup>
                <optgroup label="Empresas">{RAMOS.filter((r) => r.grupo === "empresas").map((r) => <option key={r.id} value={r.nombre}>{r.nombre}</option>)}</optgroup>
                <option value="Otro / no sé">Otro / no sé</option>
              </select>
            </label>
            <label className="mt-5 block text-sm font-bold text-brand-900">Mensaje (opcional)
              <textarea name="mensaje" rows={4} className={field} placeholder="Contanos qué querés asegurar" />
            </label>
            <button type="submit" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1fa855] px-8 py-4 text-base font-bold text-white shadow-card transition hover:bg-[#188a45] sm:w-auto">
              <WhatsAppIcon className="h-5 w-5" /> Enviar por WhatsApp
            </button>
            <p role="status" className="mt-3 min-h-5 text-sm text-ink-soft">
              {enviado ? "Se abrió WhatsApp con tu consulta. Si no se abrió, escribinos directamente al botón verde." : "Se abrirá WhatsApp con tu consulta lista para enviar."}
            </p>
          </form>

          <div className="space-y-5 lg:col-span-2">
            <ul className="space-y-4 rounded-3xl bg-white p-6 shadow-card">
              <Dato icon={<PinIcon className="h-5 w-5" />} titulo="Dirección">{DIRECCION_COMPLETA} ({EMPRESA.direccion.cp})</Dato>
              <Dato icon={<PhoneIcon className="h-5 w-5" />} titulo="Teléfono / WhatsApp"><a className="hover:underline" href={`tel:${EMPRESA.telefonoTel}`}>{EMPRESA.telefonoVisible}</a></Dato>
              <Dato icon={<MailIcon className="h-5 w-5" />} titulo="Email"><a className="break-all hover:underline" href={`mailto:${EMPRESA.email}`}>{EMPRESA.email}</a></Dato>
              <Dato icon={<ClockIcon className="h-5 w-5" />} titulo="Horarios">
                {HORARIOS.map((h) => <span key={h.dias} className="block">{h.dias}: {h.horas}</span>)}
              </Dato>
              <li className="flex gap-3 pt-1">
                <a href={EMPRESA.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook de Grupo Bertona" className="grid h-11 w-11 place-items-center rounded-full bg-sky-100 text-sky-600 transition hover:bg-sky-500 hover:text-white"><FacebookIcon className="h-5 w-5" /></a>
                <a href={EMPRESA.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram de Grupo Bertona" className="grid h-11 w-11 place-items-center rounded-full bg-sky-100 text-sky-600 transition hover:bg-sky-500 hover:text-white"><InstagramIcon className="h-5 w-5" /></a>
              </li>
            </ul>
            <div className="rounded-3xl bg-brand-900 p-6 text-sm text-sky-100">
              <p className="font-display text-lg font-bold text-white">Líneas de Meridional Seguros</p>
              <ul className="mt-3 space-y-2">
                <li><strong className="text-white">Atención al cliente y siniestros:</strong> <a className="underline" href={`tel:${MERIDIONAL.telClientesTel}`}>{MERIDIONAL.telClientes}</a> (opción 2 si hubo lesionados)</li>
                <li><strong className="text-white">Reclamos:</strong> Servicio de Atención al Asegurado {MERIDIONAL.telReclamos}</li>
                <li><strong className="text-white">Superintendencia de Seguros:</strong> {MERIDIONAL.telSSN}</li>
              </ul>
            </div>
            <div className="overflow-hidden rounded-3xl shadow-card">
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
      <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-100 text-sky-600">{icon}</span>
      <span className="text-sm leading-relaxed text-ink-soft">
        <strong className="block text-brand-900">{titulo}</strong>
        {children}
      </span>
    </li>
  );
}
