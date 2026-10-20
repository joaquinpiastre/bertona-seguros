import { SubmitButton } from "@/components/panel/Cliente";
import { Badge, Card, Field, Flash, SelectField, TextArea } from "@/components/panel/ui";
import { EMPRESA } from "@/config/empresa";
import { solicitarTramite } from "@/lib/actions/portal";
import { dato, type Row } from "@/lib/api";
import { portalUsuario } from "@/lib/auth";
import { fecha } from "@/lib/format";

type SP = { ok?: string; error?: string; poliza?: string; wa?: string };

export default async function Tramite({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  await portalUsuario();
  const { polizas, previos, seleccionada } = await dato<{ polizas: Row[]; previos: Row[]; seleccionada: number }>("portalTramite", { poliza: sp.poliza });
  const p = polizas.find((x) => x.id === seleccionada) ?? polizas[0];
  const waUrl = sp.wa ? `https://wa.me/${EMPRESA.whatsapp}?text=${encodeURIComponent(sp.wa)}` : "";

  return (
    <>
      <h1 className="text-2xl text-brand-900 sm:text-3xl">Trámite</h1>
      <p className="mb-6 mt-1 text-sm text-ink-soft">Contanos qué trámite querés gestionar con tu póliza. La oficina lo revisa y te responde.</p>
      <Flash sp={sp} />

      {waUrl && (
        <div className="mb-6 border-2 border-emerald-600 bg-emerald-50 p-5">
          <p className="font-semibold text-emerald-900">Tu trámite quedó registrado. Para que nos llegue más rápido, mandanos también el mensaje por WhatsApp:</p>
          <a href={waUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block bg-[#1fa855] px-6 py-3.5 text-base font-bold text-white hover:bg-[#188a45]">Enviar por WhatsApp</a>
        </div>
      )}

      {polizas.length === 0 || !p ? (
        <Card><p className="text-sm text-ink-soft">No tenés pólizas activas para hacer trámites. Comunicate con la oficina.</p></Card>
      ) : (
        <Card title="Datos de la póliza">
          <form method="get" className="mb-5 flex flex-wrap items-end gap-3">
            <SelectField label="Póliza" name="poliza" defaultValue={p.id} className="min-w-72 flex-1"
              options={polizas.map((x) => [String(x.id), `${x.compania} · ${x.numero}${x.dominio ? ` · ${x.dominio}` : x.riesgo ? ` · ${x.riesgo}` : ""}`])} />
            <button className="border border-line bg-white px-4 py-2.5 text-sm font-semibold text-brand-800 hover:border-brand-500">Elegir</button>
          </form>
          <form action={solicitarTramite} className="grid gap-4 border-t border-line pt-5 sm:grid-cols-2" key={p.id}>
            <input type="hidden" name="poliza_id" value={p.id} />
            <TextArea label="¿Qué trámite querés gestionar? (observaciones)" name="observaciones" rows={5} required className="sm:col-span-2"
              placeholder="Ej: Cambié de auto, quiero asegurar el nuevo. / Cambió mi domicilio. / Quiero agregar a otra persona." />
            <p className="text-sm text-ink-soft sm:col-span-2">Si cambia el vehículo, completá estos datos (si no, dejalos como están):</p>
            <Field label="Vehículo / bien asegurado" name="riesgo" defaultValue={p.riesgo} placeholder="Ej: Toyota Corolla XEI 2.0" className="sm:col-span-2" />
            <Field label="Dominio (patente)" name="dominio" defaultValue={p.dominio} />
            <div className="sm:col-span-2">
              <SubmitButton variant="gold" pendiente="Enviando…">Enviar trámite</SubmitButton>
              <p className="mt-2 text-xs text-ink-soft">Los cambios no se aplican solos: la oficina los revisa y te confirma.</p>
            </div>
          </form>
        </Card>
      )}

      {previos.length > 0 && (
        <Card title="Mis trámites" className="mt-6">
          <ul className="divide-y divide-line text-sm">
            {previos.map((t) => (
              <li key={t.id} className="flex flex-wrap items-start justify-between gap-2 py-3">
                <span className="min-w-0 flex-1"><span className="text-xs text-ink-soft">{fecha(t.creado)}{t.poliza ? ` · Póliza ${t.poliza}` : ""}</span><span className="block whitespace-pre-line">{t.detalle}</span></span>
                {t.estado === "resuelta" ? <Badge tono="verde">Resuelto</Badge> : <Badge tono="ambar">En proceso</Badge>}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
