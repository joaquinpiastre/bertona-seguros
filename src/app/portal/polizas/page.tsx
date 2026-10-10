import { Badge, Card, Dato, Flash, btnGhost } from "@/components/panel/ui";
import { waLink } from "@/config/empresa";
import { portalUsuario } from "@/lib/auth";
import { q } from "@/lib/db";
import { ESTADOS_POLIZA, PERIODICIDAD, TIPOS_DOC, fecha, money } from "@/lib/format";

export default async function MisPolizas({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const u = await portalUsuario();
  const polizas = await q(
    `SELECT p.*, p.vigencia_desde::text AS desde, p.vigencia_hasta::text AS hasta, p.suma_asegurada::float8 AS suma, p.importe_cuota::float8 AS imp,
            (SELECT COUNT(*)::int FROM cuotas c WHERE c.poliza_id = p.id AND c.estado = 'pagada') AS pagadas,
            (SELECT COUNT(*)::int FROM cuotas c WHERE c.poliza_id = p.id AND c.estado <> 'anulada') AS total
     FROM polizas p WHERE p.cliente_id = $1 ORDER BY (p.estado = 'vigente') DESC, p.id DESC`, [u.cliente_id]);
  const docs = await q(
    "SELECT id, poliza_id, tipo, nombre, tamano FROM documentos WHERE cliente_id = $1 AND pago_id IS NULL AND poliza_id IS NOT NULL ORDER BY id", [u.cliente_id]);

  return (
    <>
      <h1 className="mb-6 text-2xl text-brand-900 sm:text-3xl">Mis pólizas</h1>
      <Flash sp={sp} />
      {polizas.length === 0 && <Card><p className="text-sm text-ink-soft">Todavía no tenés pólizas cargadas. Si ya contrataste un seguro con nosotros, avisanos y lo cargamos.</p></Card>}
      <div className="space-y-6">
        {polizas.map((p) => {
          const mias = docs.filter((d) => d.poliza_id === p.id);
          return (
            <Card key={p.id} title={`${p.compania} · ${p.ramo}`} actions={<Badge tono={p.estado === "vigente" ? "verde" : p.estado === "en_tramite" ? "ambar" : "gris"}>{ESTADOS_POLIZA[p.estado] ?? p.estado}</Badge>}>
              <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Dato label="N° de póliza">{p.numero}</Dato>
                <Dato label="Riesgo asegurado">{p.riesgo}</Dato>
                <Dato label="Dominio">{p.dominio}</Dato>
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
                <a href={waLink(`Hola! Consulta sobre mi póliza ${p.numero} (${p.compania}).`)} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-sm font-semibold text-brand-700 underline underline-offset-4">Consultar por esta póliza</a>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
