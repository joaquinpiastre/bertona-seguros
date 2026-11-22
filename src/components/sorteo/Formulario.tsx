"use client";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { inscribirse } from "@/lib/sorteo/acciones";
import { VEHICULOS, VENCIMIENTOS, type EstadoInscripcion } from "@/lib/sorteo/comun";
import { IconoAuto, IconoBandera, IconoCamioneta, IconoMoto, IconoNinguno } from "./Publico";

const ICONOS: Record<string, (p: { className?: string }) => React.JSX.Element> = { auto: IconoAuto, moto: IconoMoto, camioneta: IconoCamioneta, ninguno: IconoNinguno };
const CAMPOS_ORIGEN = ["src", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
const LOCALIDADES = [
  "San Rafael", "General Alvear", "Malargüe", "Mendoza", "25 de Mayo", "Villa Atuel", "Real del Padre", "Monte Comán", "Rama Caída",
  "Cuadro Nacional", "Las Paredes", "Salto de las Rosas", "Goudge", "Jaime Prats", "Cañada Seca", "Cuadro Benegas", "El Nihuil", "Las Malvinas",
];

const lab = "block text-[0.95rem] font-bold text-brand-900";
const campo = (error: boolean) =>
  `mt-1.5 block w-full rounded-xl border-2 bg-white px-4 py-3.5 text-base text-ink placeholder:text-ink-soft/60 transition focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-500/15 ${error ? "border-red-500" : "border-line"}`;

export function FormularioSorteo() {
  const [estado, enviar, enviando] = useActionState<EstadoInscripcion, FormData>(inscribirse, {});
  const [origen, setOrigen] = useState<Record<string, string>>({});
  const form = useRef<HTMLFormElement>(null);

  // De qué QR o campaña viene la persona (?src=cartel-pista, utm_*): se guarda con la inscripción.
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setOrigen(Object.fromEntries(CAMPOS_ORIGEN.map((k) => [k, (sp.get(k) ?? "").slice(0, 100)])));
  }, []);

  // Si hubo un error: se lleva el foco al campo a corregir (o al aviso).
  useEffect(() => {
    if (!estado.error) return;
    const aviso = document.getElementById("aviso-sorteo");
    const el = estado.campo ? form.current?.querySelector<HTMLElement>(`[name="${estado.campo}"]`) : null;
    aviso?.scrollIntoView({ block: "center", behavior: "smooth" });
    (el ?? aviso)?.focus({ preventScroll: true });
  }, [estado.intento, estado.error, estado.campo]);

  const v = estado.valores ?? {};
  const mal = (c: string) => estado.campo === c;

  return (
    // key: después de un error, el formulario se vuelve a armar con lo que la persona había escrito.
    <form ref={form} key={estado.intento ?? 0} action={enviar} className="relative space-y-5">
      {estado.error && (
        <div id="aviso-sorteo" tabIndex={-1} role="alert" className="rounded-xl border-l-4 border-red-600 bg-red-50 px-4 py-3 text-[0.95rem] font-semibold text-red-900 outline-none">
          {estado.error}
        </div>
      )}

      <label className={lab}>
        Nombre y apellido <span className="text-red-600">*</span>
        <input name="nombre" required minLength={3} maxLength={80} autoComplete="name" autoCapitalize="words" placeholder="Ej: Juan Pérez"
          defaultValue={v.nombre} aria-invalid={mal("nombre") || undefined} className={campo(mal("nombre"))} />
      </label>

      <label className={lab}>
        WhatsApp <span className="text-red-600">*</span>
        <input name="whatsapp" type="tel" inputMode="tel" required maxLength={25} autoComplete="tel" placeholder="Ej: 260 4123456"
          defaultValue={v.whatsapp} aria-invalid={mal("whatsapp") || undefined} aria-describedby="ayuda-wa" className={campo(mal("whatsapp"))} />
        <span id="ayuda-wa" className="mt-1 block text-sm font-normal text-ink-soft">Con código de área. Ahí te escribimos si ganás.</span>
      </label>

      <label className={lab}>
        Localidad <span className="text-red-600">*</span>
        <input name="localidad" required maxLength={60} autoComplete="address-level2" list="localidades-sorteo" placeholder="Ej: San Rafael"
          defaultValue={v.localidad} aria-invalid={mal("localidad") || undefined} className={campo(mal("localidad"))} />
        <datalist id="localidades-sorteo">{LOCALIDADES.map((l) => <option key={l} value={l} />)}</datalist>
      </label>

      <fieldset>
        <legend className={lab}>¿Qué vehículo tenés? <span className="text-red-600">*</span></legend>
        <div className={`mt-2 grid grid-cols-2 gap-2.5 rounded-2xl ${mal("vehiculo") ? "ring-2 ring-red-500 ring-offset-2" : ""}`}>
          {VEHICULOS.map(([valor, etiqueta], i) => {
            const Icono = ICONOS[valor];
            return (
              <label key={valor} className="flex min-h-[5.25rem] cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-line bg-white p-3 text-[0.95rem] font-bold text-brand-900 transition hover:border-sky-200 has-[:checked]:border-sky-500 has-[:checked]:bg-sky-50 has-[:checked]:text-sky-700 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-sky-500/25">
                <input type="radio" name="vehiculo" value={valor} required={i === 0} defaultChecked={v.vehiculo === valor} className="sr-only" />
                <Icono className="h-8 w-8" />
                {etiqueta}
              </label>
            );
          })}
        </div>
      </fieldset>

      <label className={lab}>
        ¿En qué mes vence tu seguro actual? <span className="font-normal text-ink-soft">(opcional)</span>
        <select name="vencimiento" defaultValue={v.vencimiento ?? ""} aria-invalid={mal("vencimiento") || undefined} className={`${campo(mal("vencimiento"))} appearance-auto`}>
          <option value="">Elegí un mes</option>
          {VENCIMIENTOS.map(([valor, etiqueta]) => <option key={valor} value={valor}>{etiqueta}</option>)}
        </select>
      </label>

      <div className="space-y-3 pt-1">
        <label className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3.5 text-[0.95rem] leading-snug text-ink ${mal("acepta") ? "border-red-500 bg-red-50" : "border-line bg-soft"}`}>
          <input type="checkbox" name="acepta" required defaultChecked={v.acepta === "on"} className="mt-0.5 h-6 w-6 shrink-0 cursor-pointer accent-[var(--sky-500)]" />
          <span>
            Soy mayor de 18 y acepto las{" "}
            <Link href="/sorteo/bases" target="_blank" className="font-bold text-sky-700 underline underline-offset-2">bases y condiciones</Link>{" "}
            y recibir promociones de Bertona{" "}Seguros<span className="text-red-600">{" "}*</span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-line bg-soft p-3.5 text-[0.95rem] leading-snug text-ink">
          <input type="checkbox" name="alertas" defaultChecked={v.alertas === "on"} className="mt-0.5 h-6 w-6 shrink-0 cursor-pointer accent-[var(--sky-500)]" />
          <span>Quiero recibir alertas de tormenta por WhatsApp</span>
        </label>
      </div>

      {CAMPOS_ORIGEN.map((k) => <input key={k} type="hidden" name={k} value={origen[k] ?? ""} />)}
      {/* Trampa para robots: una persona no lo ve ni lo completa. */}
      <div aria-hidden="true" className="absolute -left-[9999px] top-0 h-px w-px overflow-hidden">
        <label>No completar este campo<input name="bz_extra" tabIndex={-1} autoComplete="off" defaultValue="" /></label>
      </div>

      <button type="submit" disabled={enviando} className="flex min-h-16 w-full items-center justify-center gap-2.5 rounded-2xl bg-sun-400 px-6 py-4 text-lg font-extrabold text-brand-900 shadow-card transition hover:bg-sun-500 active:scale-[0.99] disabled:opacity-70">
        <IconoBandera className="h-6 w-6" />
        {enviando ? "Enviando…" : "Participar"}
      </button>
      <p className="text-center text-sm text-ink-soft">En el paso siguiente confirmás tu participación por WhatsApp.</p>
    </form>
  );
}
