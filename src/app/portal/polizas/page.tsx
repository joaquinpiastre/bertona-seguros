import Link from "next/link";
import { PolizaBloqueada } from "@/components/panel/Bloqueo";
import { Badge, Card, Dato, Flash, btnGhost } from "@/components/panel/ui";
import { waLink } from "@/config/empresa";
import { dato, type Row } from "@/lib/api";
import { portalUsuario } from "@/lib/auth";
import { ESTADOS_POLIZA, PERIODICIDAD, TIPOS_DOC, fecha, money } from "@/lib/format";

export default async function MisPolizas({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  await portalUsuario();
  const { polizas, docs, bloqueadas } = await dato<{ polizas: Row[]; docs: Row[]; bloqueadas: Row[] }>("portalPolizas");

  return (
    <>
      <h1 className="mb-6 text-2xl text-brand-900 sm:text-3xl">Mis pólizas</h1>
      <Flash sp={sp} />
      {polizas.length === 0 && bloqueadas.length === 0 && (
        <Card><p className="text-sm text-ink-soft">Todavía no tenés pólizas cargadas. Si ya contrataste un seguro con nosotros, avisanos y lo cargamos.</p></Card>
      )}
      <div className="space-y-6">
        {bloqueadas.map((p) => <PolizaBloqueada key={p.id} p={p} />)}
        {polizas.map((p) => {
          const mias = docs.filter((d) => d.poliza_id === p.id);
          return (
            <Card key={p.id} title={`${p.compania} · ${p.ramo}`} actions={<Badge tono={p.estado === "vigente" ? "verde" : p.estado === "en_tramite" ? "ambar" : "gris"}>{ESTADOS_POLIZA[p.estado] ?? p.estado}</Badge>}>
              <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Dato label="N° de póliza">{p.numero}</Dato>
                <Dato label="Riesgo asegurado">{p.riesgo}</Dato>
                <Dato label="Dominio">{p.dominio}</Dato>
                <Dato label="Cobertura">{p.cobertura}</Dato>
                <Dato label="Vigencia">{p.desde || p.hasta ? `${fecha(p.desde)} al ${fecha(p.hasta)}` : null}</Dato>
                <Dato label="Suma asegurada">{p.suma ? money(p.suma) : null}</Dato>
                <Dato label="Cuotas">{p.total ? `${p.pagadas} de ${p.total} pagas · ${money(p.imp)} ${PERIODICIDAD[p.periodicidad]?.label.toLowerCase() ?? ""}` : null}</Dato>
              </dl>
              <div className="mt-5 border-t border-line pt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-soft">Documentos</p>
                {mias.length === 0 ? <p className="text-sm text-ink-soft">Estamos preparando tus documentos. Si los necesitás ya, pedínoslos por WhatsApp.</p> : (
                  <div className="flex flex-wrap gap-2">
                    {mias.map((d) => <a key={d.id} href={`/api/documento/${d.id}`} target="_blank" className={btnGhost}>{TIPOS_DOC[d.tipo] ?? d.tipo} <span className="text-xs font-normal text-ink-soft">PDF</span></a>)}
                  </div>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={`/portal/tramite?poliza=${p.id}`} className={btnGhost}>Hacer un trámite</Link>
                  <a href={waLink(`Hola! Consulta sobre mi póliza ${p.numero} (${p.compania}).`)} target="_blank" rel="noopener noreferrer" className={btnGhost}>Consultar por esta póliza</a>
                </div>
              </div>
              <div className="mt-5 border-t border-line pt-5">
                {p.baja_pedida ? (
                  <p className="border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm text-amber-900">Ya pediste anular esta póliza. La oficina se va a comunicar con vos para confirmarlo.</p>
                ) : (
                  <Link href={`/portal/anular?poliza=${p.id}`} className="flex w-full items-center justify-center border-2 border-red-700 bg-red-700 px-6 py-5 text-xl font-bold uppercase tracking-wide text-white transition hover:bg-red-800">
                    Anular póliza
                  </Link>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
