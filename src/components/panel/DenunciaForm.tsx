"use client";
import { useState } from "react";
import { SubmitButton } from "./Cliente";
import { Field, SelectField, TextArea, inputCls } from "./ui";
import { TIPOS_SINIESTRO } from "@/lib/format";

type Poliza = { id: number; compania: string; numero: string; dominio: string | null; riesgo: string | null };

const archivo = "mt-1.5 w-full border border-line bg-white px-3 py-2.5 text-sm file:mr-3 file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-700";

/** Denuncia de siniestro del cliente. Con vehículo asegurado exige carnet de conducir y cédula verde. */
export function DenunciaForm({ polizas, hoy, action }: { polizas: Poliza[]; hoy: string; action: (fd: FormData) => void | Promise<void> }) {
  const [sel, setSel] = useState(String(polizas[0]?.id ?? ""));
  const p = polizas.find((x) => String(x.id) === sel);
  const vehiculo = !!p?.dominio?.trim();

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <label className="block text-base font-semibold text-brand-900 sm:col-span-2">
        ¿Qué póliza está involucrada? <span className="text-red-600">*</span>
        <select name="poliza_id" required value={sel} onChange={(e) => setSel(e.target.value)} className={inputCls}>
          {polizas.map((x) => (
            <option key={x.id} value={x.id}>{`${x.compania} · ${x.numero}${x.dominio ? ` · ${x.dominio}` : x.riesgo ? ` · ${x.riesgo}` : ""}`}</option>
          ))}
        </select>
      </label>
      <SelectField label="Tipo de siniestro" name="tipo" vacio="No sé / otro" options={TIPOS_SINIESTRO.map((t) => [t, t])} />
      <Field label="Fecha en que ocurrió" name="fecha_hecho" type="date" required defaultValue={hoy} max={hoy} />
      <Field label="Hora aproximada" name="hora" type="time" />
      <Field label="Lugar" name="lugar" required placeholder="Calle, altura, localidad" />
      <TextArea label="Contanos qué pasó" name="descripcion" rows={4} className="sm:col-span-2" />
      <TextArea label="¿Hubo otras personas o vehículos involucrados? (nombres, patentes, aseguradora)" name="terceros" rows={3} className="sm:col-span-2" />

      <div className="sm:col-span-2 border border-line bg-soft p-4">
        <p className="mb-3 text-base font-semibold text-brand-900">Fotos y documentos</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-base font-semibold text-brand-900">
            Foto del carnet de conducir {vehiculo && <span className="text-red-600">*</span>}
            <input name="carnet" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" required={vehiculo} className={archivo} />
            <span className="mt-1 block text-sm font-normal text-ink-soft">Frente del carnet. Podés sacarle una foto con el celular.</span>
          </label>
          <label className="block text-base font-semibold text-brand-900">
            Foto de la cédula verde {vehiculo && <span className="text-red-600">*</span>}
            <input name="cedula" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" required={vehiculo} className={archivo} />
            <span className="mt-1 block text-sm font-normal text-ink-soft">{vehiculo ? "Cédula del vehículo asegurado." : "Solo si el siniestro es de un vehículo."}</span>
          </label>
        </div>
        <p className="mb-2 mt-5 text-base font-semibold text-brand-900">Otras fotos o documentos del siniestro (opcional)</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {["archivo1", "archivo2", "archivo3"].map((n) => <input key={n} name={n} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className={archivo} />)}
        </div>
        <p className="mt-2 text-sm text-ink-soft">Cada archivo hasta 4 MB (PDF, JPG o PNG).</p>
      </div>
      <div className="sm:col-span-2"><SubmitButton variant="gold" pendiente="Enviando…">Enviar denuncia</SubmitButton></div>
    </form>
  );
}
