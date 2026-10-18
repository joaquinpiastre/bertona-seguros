import { Field, SelectField, TextArea } from "./ui";
import { ESTADOS_SINIESTRO, TIPOS_SINIESTRO } from "@/lib/format";

type Valores = {
  tipo?: string | null;
  fecha?: string | null;
  hora?: string | null;
  lugar?: string | null;
  descripcion?: string | null;
  terceros?: string | null;
  denuncia_policial?: string | null;
  nro_compania?: string | null;
  estado?: string | null;
};

/** Campos del casillero de siniestro (alta y edición en el panel). */
export function SiniestroCampos({ v = {} }: { v?: Valores }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <SelectField label="Tipo de siniestro" name="tipo" defaultValue={v.tipo ?? ""} vacio="Sin definir" options={TIPOS_SINIESTRO.map((t) => [t, t])} />
      <Field label="Fecha del hecho" name="fecha_hecho" type="date" defaultValue={v.fecha} />
      <Field label="Hora aproximada" name="hora" type="time" defaultValue={v.hora} />
      <Field label="Lugar" name="lugar" defaultValue={v.lugar} placeholder="Calle, altura, localidad" className="lg:col-span-2" />
      <SelectField label="Estado" name="estado" defaultValue={v.estado ?? "denunciado"} options={Object.entries(ESTADOS_SINIESTRO)} />
      <TextArea label="Qué pasó (descripción)" name="descripcion" defaultValue={v.descripcion} rows={4} className="sm:col-span-2 lg:col-span-3" />
      <TextArea label="Terceros involucrados" name="terceros" defaultValue={v.terceros} rows={3} className="sm:col-span-2" />
      <div className="space-y-4">
        <Field label="Denuncia policial (N° / comisaría)" name="denuncia_policial" defaultValue={v.denuncia_policial} />
        <Field label="N° de siniestro en la compañía" name="nro_compania" defaultValue={v.nro_compania} />
      </div>
    </div>
  );
}
