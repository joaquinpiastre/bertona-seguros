import Link from "next/link";
import { dato, type Row } from "@/lib/api";
import { Badge, Card, Flash, LinkBtn, PageHead, Tabla, Td, Th, btnGhost, inputCls } from "@/components/panel/ui";
import { ESTADOS_POLIZA, RAMOS_LISTA, fecha, hoy, sumarDias } from "@/lib/format";

type SP = Promise<{ ok?: string; error?: string; q?: string; estado?: string; ramo?: string; porvencer?: string }>;

export default async function Polizas({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const h = hoy();
  const { filas } = await dato<{ filas: Row[] }>("polizas", { q: sp.q, estado: sp.estado, ramo: sp.ramo, porvencer: sp.porvencer });
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
