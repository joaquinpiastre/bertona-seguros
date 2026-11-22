import { SubmitButton } from "@/components/panel/Cliente";
import { Card, Field, TextArea } from "@/components/panel/ui";
import type { Row } from "@/lib/api";
import { guardarSorteo } from "@/lib/sorteo/acciones";

const ayuda = "mt-1 block text-sm font-normal text-ink-soft";

/** Configuración de un sorteo (crear o editar). */
export function FormSorteo({ s, nuevo }: { s: Row; nuevo?: boolean }) {
  return (
    <form action={guardarSorteo} className="space-y-6">
      {!nuevo && <input type="hidden" name="id" value={s.id} />}
      <Card title="Lo que ve la gente al escanear el QR">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Título" name="titulo" required defaultValue={s.titulo} className="sm:col-span-2" placeholder="Ej: Sorteo Speedway de diciembre" />
          <Field label="Premio" name="premio" defaultValue={s.premio} className="sm:col-span-2" placeholder="Ej: Un casco + un año de seguro de moto" />
          <div className="sm:col-span-2">
            <TextArea label="Descripción (opcional, va debajo del título)" name="descripcion" rows={3} defaultValue={s.descripcion} />
          </div>
          <Field label="Inscripción desde" name="fecha_inicio" type="date" defaultValue={s.fecha_inicio} hint="Antes de esta fecha la página dice que todavía no empezó." />
          <Field label="Inscripción hasta (inclusive)" name="fecha_fin" type="date" defaultValue={s.fecha_fin} hint="Después de esta fecha la inscripción se cierra sola." />
          <Field label="Fecha y hora del sorteo" name="fecha_sorteo" type="datetime-local" defaultValue={s.fecha_sorteo} hint="Se muestra arriba como «Próximo sorteo» (hora de Argentina)." />
        </div>
      </Card>

      <Card title="Confirmación por WhatsApp">
        <div className="grid gap-4">
          <Field label="WhatsApp que recibe las confirmaciones" name="whatsapp" type="tel" inputMode="tel" required className="max-w-md"
            defaultValue={s.whatsapp ? `+${s.whatsapp}` : ""} hint="Con código de área, por ejemplo 260 456-8276. Es el número al que la gente manda su código." />
          <label className="block text-base font-semibold text-brand-900">
            Mensaje precargado
            <textarea name="mensaje" rows={2} defaultValue={s.mensaje} className="mt-1.5 w-full border border-line bg-white px-4 py-3 text-base text-ink hover:border-brand-200 focus:border-brand-500" />
            <span className={ayuda}>Donde diga <code>{"{codigo}"}</code> va el código del participante (por ejemplo BS-4821). Si lo borrás, el código se agrega igual al final.</span>
          </label>
        </div>
      </Card>

      <Card title="Bases y condiciones (página /sorteo/bases)">
        <label className="block text-base font-semibold text-brand-900">
          Texto de las bases
          <textarea name="bases" rows={18} defaultValue={s.bases} className="mt-1.5 w-full border border-line bg-white px-4 py-3 font-mono text-sm leading-relaxed text-ink hover:border-brand-200 focus:border-brand-500" />
          <span className={ayuda}>Una línea en blanco separa párrafos. Las líneas que empiezan con «# » son títulos y las que empiezan con «- » son viñetas. Conviene que lo revise un abogado antes de publicarlo.</span>
        </label>
      </Card>

      {nuevo && (
        <label className="flex cursor-pointer items-start gap-3 border border-line bg-white p-4 text-base text-brand-900">
          <input type="checkbox" name="activar" className="mt-1 h-5 w-5" />
          <span><strong>Activarlo ahora</strong><span className={ayuda}>Pasa a ser el sorteo que ve la gente en /sorteo. Si hay otro activo, se desactiva (solo puede haber uno activo a la vez).</span></span>
        </label>
      )}

      <SubmitButton variant="gold" pendiente="Guardando…">{nuevo ? "Crear sorteo" : "Guardar cambios"}</SubmitButton>
    </form>
  );
}
