"use client";
import { useState } from "react";
import { EMPRESA, waLink } from "@/config/empresa";

const campo = "mt-1.5 w-full border border-line bg-white px-3 py-3 text-base text-ink focus:border-brand-500";

/**
 * Para quien es cliente de Bertona pero todavía no está cargado en el sistema:
 * manda sus datos por WhatsApp a la oficina, que verifica que sea cliente y le crea la cuenta.
 */
export function SolicitarAlta({ dni = "", abierto = false }: { dni?: string; abierto?: boolean }) {
  const [enviado, setEnviado] = useState(false);

  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const lineas = [
      "Hola! Soy cliente de Bertona pero no puedo ingresar al sistema porque no tengo cuenta. Les paso mis datos para que me la creen:",
      `Nombre y apellido: ${d.get("nombre")}`,
      `DNI: ${d.get("dni")}`,
      `Teléfono: ${d.get("telefono")}`,
      d.get("poliza") ? `Póliza / patente: ${d.get("poliza")}` : "",
      d.get("compania") ? `Compañía: ${d.get("compania")}` : "",
    ].filter(Boolean);
    window.open(waLink(lineas.join("\n")), "_blank", "noopener,noreferrer");
    setEnviado(true);
  }

  return (
    <details open={abierto} className="mt-8 border border-line bg-white">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-base font-semibold text-brand-900 [&::-webkit-details-marker]:hidden">
        Soy cliente pero no tengo cuenta
        <span className="text-accent-600" aria-hidden>+</span>
      </summary>
      <form onSubmit={enviar} className="space-y-4 border-t border-line p-4">
        <p className="text-sm text-ink-soft">
          Completá tus datos y los enviamos por WhatsApp a la oficina. Verificamos que seas cliente y te creamos la cuenta; te avisamos con tu contraseña.
        </p>
        <label className="block text-sm font-semibold text-brand-900">Nombre y apellido
          <input name="nombre" required autoComplete="name" className={campo} />
        </label>
        <label className="block text-sm font-semibold text-brand-900">DNI
          <input name="dni" required inputMode="numeric" defaultValue={dni} className={campo} />
        </label>
        <label className="block text-sm font-semibold text-brand-900">Teléfono
          <input name="telefono" required type="tel" inputMode="tel" autoComplete="tel" className={campo} />
        </label>
        <label className="block text-sm font-semibold text-brand-900">N° de póliza o patente <span className="font-normal text-ink-soft">(si lo tenés)</span>
          <input name="poliza" className={campo} />
        </label>
        <label className="block text-sm font-semibold text-brand-900">Compañía <span className="font-normal text-ink-soft">(si la sabés)</span>
          <input name="compania" className={campo} placeholder="Ej: Meridional" />
        </label>
        <button type="submit" className="flex w-full items-center justify-center bg-[#1fa855] px-5 py-3.5 text-base font-semibold text-white hover:bg-[#188a45]">
          Enviar mis datos por WhatsApp
        </button>
        <p role="status" className="text-sm text-ink-soft">
          {enviado ? `Se abrió WhatsApp. Tocá enviar y listo. También podés llamar al ${EMPRESA.telefonoVisible}.` : "Se abrirá WhatsApp con el mensaje listo para enviar."}
        </p>
      </form>
    </details>
  );
}
