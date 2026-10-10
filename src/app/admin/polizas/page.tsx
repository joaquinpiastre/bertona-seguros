import Link from "next/link";
import { Badge, Card, Flash, LinkBtn, PageHead, Tabla, Td, Th, btnGhost, inputCls } from "@/components/panel/ui";
import { q } from "@/lib/db";
import { ESTADOS_POLIZA, RAMOS_LISTA, fecha, hoy, sumarDias } from "@/lib/format";

type SP = Promise<{ ok?: string; error?: string; q?: string; estado?: string; ramo?: string; porvencer?: string }>;

export default async function Polizas({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const h = hoy();
  const params: unknown[] = [];
  const cond: string[] = [];
  if (sp.q) {
    params.push(`%${sp.q}%`);
    cond.push(`(cl.nombre ILIKE $${params.length} OR p.numero ILIKE $${params.length} OR p.dominio ILIKE $${params.length} OR p.compania ILIKE $${params.length})`);
  }
  if (sp.estado && ESTADOS_POLIZA[sp.estado]) { params.push(sp.estado); cond.push(`p.estado = $${params.length}`); }
  if (sp.ramo) { params.push(sp.ramo); cond.push(`p.ramo = $${params.length}`); }
  if (sp.porvencer) { params.push(h, sumarDias(h, 30)); cond.push(`p.estado = 'vigente' AND p.vigencia_hasta BETWEEN $${params.length - 1} AND $${params.length}`); }
  const filas = await q(
    `SELECT p.id, p.ramo, p.compania, p.numero, p.dominio, p.riesgo, p.estado, p.vigencia_hasta::text AS hasta, cl.id AS cliente_id, cl.nombre AS cliente,
            (SELECT COUNT(*)::int FROM documentos d WHERE d.poliza_id = p.id AND d.tipo = 'poliza') AS tiene_poliza,
            (SELECT COUNT(*)::int FROM documentos d WHERE d.poliza_id = p.id AND d.tipo = 'certificado') AS tiene_cert,
            (SELECT COUNT(*)::int FROM cuotas c WHERE c.poliza_id = p.id AND c.estado = 'pendiente' AND c.vencimiento < $${params.length + 1}) AS vencidas
     FROM polizas p JOIN clientes cl ON cl.id = p.cliente_id
     ${cond.length ? "WHERE " + cond.join(" AND ") : ""} ORDER BY p.id DESC LIMIT 300`,
    [...params, h]
  );
  return (
    <>
      <PageHead title="Pólizas" sub="Todas las pólizas cargadas" actions={<LinkBtn variant="gold" href="/admin/polizas/nueva">Nueva póliza</LinkBtn>} />
      <Flash sp={sp} />
      <form className="mb-4 flex flex-wrap items-end gap-2">
        <input name="q" defaultValue={sp.q} placeholder="Cliente, póliza, dominio o compañía" className={`${inputCls} !mt-0 min-w-64 flex-1 sm:max-w-sm`} aria-label="Buscar pólizas" />
        <select name="estado" defaultValue={sp.estado ?? ""} className={`${inputCls} !mt-0 w-auto`} aria-label="Estado">
          <option value="">Todos los estados</option>
          {Object.entries(ESTADOS_POLIZA).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select name="ramo" defaultValue={sp.ramo ?? ""} className={`${inputCls} !mt-0 w-auto`} aria-label="Ramo">
          <option value="">Todos los ramos</option>
          {RAMOS_LISTA.map((r) => <option key={r}>{r}</option>)}
        </select>
        <label className="flex items-center gap-2 px-2 text-sm"><input type="checkbox" name="porvencer" value="1" defaultChecked={!!sp.porvencer} className="h-4 w-4" />Vencen en 30 días</label>
        <button className={btnGhost}>Filtrar</button>
      </form>
      <Card>
        <div className="-m-5">
          <Tabla head={<><Th>Cliente</Th><Th>Compañía / ramo</Th><Th>Póliza</Th><Th>Riesgo</Th><Th>Vence</Th><Th>Estado</Th><Th>Documentos</Th></>} vacio="No se encontraron pólizas.">
            {filas.map((p) => (
              <tr key={p.id}>
                <Td><Link href={`/admin/clientes/${p.cliente_id}`} className="hover:underline">{p.cliente}</Link></Td>
                <Td><Link href={`/admin/polizas/${p.id}`} className="font-semibold text-brand-800 hover:underline">{p.compania}</Link><span className="block text-xs text-ink-soft">{p.ramo}</span></Td>
                <Td>{p.numero}</Td>
                <Td>{[p.riesgo, p.dominio].filter(Boolean).join(" · ") || "—"}</Td>
                <Td>{fecha(p.hasta)}</Td>
                <Td>
                  <Badge tono={p.estado === "vigente" ? "verde" : p.estado === "en_tramite" ? "ambar" : "gris"}>{ESTADOS_POLIZA[p.estado] ?? p.estado}</Badge>
                  {p.vencidas > 0 && <> <Badge tono="rojo">{p.vencidas} impaga{p.vencidas > 1 ? "s" : ""}</Badge></>}
                </Td>
                <Td className="text-xs">
                  <span className={p.tiene_poliza ? "text-emerald-700" : "text-amber-700"}>{p.tiene_poliza ? "✓" : "✗"} Póliza</span>{" "}
                  <span className={p.tiene_cert ? "text-emerald-700" : "text-amber-700"}>{p.tiene_cert ? "✓" : "✗"} Certificado</span>
                </Td>
              </tr>
            ))}
          </Tabla>
        </div>
      </Card>
    </>
  );
}
