import { SubmitButton } from "@/components/panel/Cliente";
import { Badge, Card, Field, Flash, SelectField, TextArea } from "@/components/panel/ui";
import { EMPRESA, waLink } from "@/config/empresa";
import { denunciarSiniestro } from "@/lib/actions/portal";
import { dato, type Row } from "@/lib/api";
import { portalUsuario } from "@/lib/auth";
import { ESTADOS_SINIESTRO, TIPOS_SINIESTRO, fecha, hoy } from "@/lib/format";

const tono = (e: string) => (e === "cerrado" ? "gris" : e === "en_gestion" ? "ambar" : "rojo");
const archivo = "mt-1.5 w-full border border-line bg-white px-3 py-2.5 text-sm file:mr-3 file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-700";

export default async function Siniestros({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  await portalUsuario();
  const { filas, polizas } = await dato<{ filas: Row[]; polizas: Row[] }>("portalSiniestros");

  return (
    <>
      <h1 className="text-2xl text-brand-900 sm:text-3xl">Siniestros</h1>
      <p className="mb-6 mt-1 text-sm text-ink-soft">Si tuviste un siniestro, completá la denuncia y adjuntá fotos. La oficina se comunica con vos para seguir el trámite.</p>
      <Flash sp={sp} />

      <div className="mb-6 flex flex-wrap items-center gap-3 border-l-4 border-accent-500 bg-accent-300/20 px-4 py-3 text-sm text-brand-900">
        <span>¿Es una urgencia? Llamá a la oficina al <strong>{EMPRESA.telefonoVisible}</strong> o escribinos ahora.</span>
        <a href={waLink("Hola! Tuve un siniestro y necesito ayuda urgente.")} target="_blank" rel="noopener noreferrer" className="bg-[#1fa855] px-4 py-2 font-semibold text-white hover:bg-[#188a45]">WhatsApp</a>
      </div>

      {polizas.length === 0 ? (
        <Card><p className="text-sm text-ink-soft">No tenés pólizas activas para denunciar un siniestro. Comunicate con la oficina.</p></Card>
      ) : (
        <Card title="Denunciar un siniestro">
          <form action={denunciarSiniestro} className="grid gap-4 sm:grid-cols-2">
            <SelectField label="¿Qué póliza está involucrada?" name="poliza_id" required className="sm:col-span-2"
              options={polizas.map((p) => [String(p.id), `${p.compania} · ${p.numero}${p.dominio ? ` · ${p.dominio}` : p.riesgo ? ` · ${p.riesgo}` : ""}`])} />
            <SelectField label="Tipo de siniestro" name="tipo" vacio="No sé / otro" options={TIPOS_SINIESTRO.map((t) => [t, t])} />
            <Field label="Fecha en que ocurrió" name="fecha_hecho" type="date" required defaultValue={hoy()} max={hoy()} />
            <Field label="Hora aproximada" name="hora" type="time" />
            <Field label="Lugar" name="lugar" required placeholder="Calle, altura, localidad" />
            <TextArea label="Contanos qué pasó" name="descripcion" rows={4} className="sm:col-span-2" />
            <TextArea label="¿Hubo otras personas o vehículos involucrados? (nombres, patentes, aseguradora)" name="terceros" rows={3} className="sm:col-span-2" />
            <div className="sm:col-span-2">
              <p className="text-sm font-semibold text-brand-900">Fotos o documentos (opcional, hasta 3 archivos de 4 MB)</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {["archivo1", "archivo2", "archivo3"].map((n) => <input key={n} name={n} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className={archivo} />)}
              </div>
            </div>
            <div className="sm:col-span-2"><SubmitButton variant="gold" pendiente="Enviando…">Enviar denuncia</SubmitButton></div>
          </form>
        </Card>
      )}

      {filas.length > 0 && (
        <Card title="Mis siniestros" className="mt-6">
          <ul className="divide-y divide-line text-sm">
            {filas.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <span>
                  <strong className="text-brand-900">{s.tipo || "Siniestro"}</strong> · {fecha(s.fecha)}
                  <span className="block text-xs text-ink-soft">{s.lugar || "Sin lugar"}{s.poliza ? ` · ${s.compania} · Póliza ${s.poliza}` : ""}{s.nro_compania ? ` · N° de siniestro ${s.nro_compania}` : ""}</span>
                </span>
                <Badge tono={tono(s.estado)}>{ESTADOS_SINIESTRO[s.estado] ?? s.estado}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
