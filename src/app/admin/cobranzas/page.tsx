import Link from "next/link";
import { Badge, Card, Flash, LinkBtn, PageHead, Tabla, Td, Th, btnGhost, btnPrimary, inputCls } from "@/components/panel/ui";
import { waLink } from "@/config/empresa";
import { q } from "@/lib/db";
import { fecha, hoy, money, sumarDias, waNumero } from "@/lib/format";

type SP = Promise<{ ok?: string; error?: string; filtro?: string; q?: string }>;

export default async function Cobranzas({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const h = hoy();
  const filtro = sp.filtro === "proximas" || sp.filtro === "todas" ? sp.filtro : "vencidas";
  const params: unknown[] = [];
  let where = "c.estado = 'pendiente'";
  if (filtro === "vencidas") {
    params.push(h);
    where += ` AND c.vencimiento < $${params.length}`;
  } else if (filtro === "proximas") {
    params.push(h, sumarDias(h, 15));
    where += ` AND c.vencimiento BETWEEN $${params.length - 1} AND $${params.length}`;
  }
  if (sp.q) {
    params.push(`%${sp.q}%`);
    where += ` AND (cl.nombre ILIKE $${params.length} OR p.numero ILIKE $${params.length} OR p.dominio ILIKE $${params.length})`;
  }
  const filas = await q(
    `SELECT c.id, c.numero, c.vencimiento::text AS venc, c.importe::float8 AS importe,
            p.id AS poliza_id, p.numero AS poliza, p.cuotas_cant, p.compania, p.dominio, p.riesgo,
            cl.id AS cliente_id, cl.nombre AS cliente, cl.telefono
     FROM cuotas c JOIN polizas p ON p.id = c.poliza_id JOIN clientes cl ON cl.id = p.cliente_id
     WHERE ${where} AND cl.activo AND p.estado <> 'anulada'
     ORDER BY c.vencimiento, cl.nombre LIMIT 300`,
    params
  );
  const total = filas.reduce((s, f) => s + f.importe, 0);

  const tab = (v: string, l: string) => (
    <Link key={v} href={`/admin/cobranzas?filtro=${v}`} className={`${filtro === v ? btnPrimary : btnGhost}`}>{l}</Link>
  );

  return (
    <>
      <PageHead title="Cobranzas" sub="Cuotas pendientes de cobro" actions={<LinkBtn variant="gold" href="/admin/pagos/nuevo">Registrar cobro</LinkBtn>} />
      <Flash sp={sp} />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {tab("vencidas", "Vencidas")}
          {tab("proximas", "Próximos 15 días")}
          {tab("todas", "Todas las pendientes")}
        </div>
        <form className="flex gap-2">
          <input type="hidden" name="filtro" value={filtro} />
          <input name="q" defaultValue={sp.q} placeholder="Cliente, póliza o dominio" className={`${inputCls} !mt-0 w-64`} aria-label="Buscar" />
          <button className={btnGhost}>Buscar</button>
        </form>
      </div>
      <Card>
        <div className="-m-5">
          <Tabla
            head={<><Th>Cliente</Th><Th>Póliza</Th><Th>Cuota</Th><Th>Vencimiento</Th><Th right>Importe</Th><Th>Estado</Th><Th /></>}
            vacio="No hay cuotas para mostrar con este filtro."
          >
            {filas.map((f) => {
              const vencida = f.venc < h;
              const dias = Math.round((Date.parse(h) - Date.parse(f.venc)) / 86400000);
              const wa = waNumero(f.telefono);
              const msg = `Hola ${f.cliente.split(" ")[0]}, te escribimos de Bertona Seguros. Te recordamos que la cuota ${f.numero}/${f.cuotas_cant} de tu póliza ${f.poliza} (${f.compania}) ${vencida ? "venció" : "vence"} el ${fecha(f.venc)} por ${money(f.importe)}. Cualquier consulta, estamos a disposición.`;
              return (
                <tr key={f.id}>
                  <Td>
                    <Link href={`/admin/clientes/${f.cliente_id}`} className="font-semibold text-brand-800 hover:underline">{f.cliente}</Link>
                    <span className="block text-xs text-ink-soft">{f.telefono || "Sin teléfono"}</span>
                  </Td>
                  <Td>
                    <Link href={`/admin/polizas/${f.poliza_id}`} className="hover:underline">{f.poliza}</Link>
                    <span className="block text-xs text-ink-soft">{f.compania}{f.dominio ? ` · ${f.dominio}` : f.riesgo ? ` · ${f.riesgo}` : ""}</span>
                  </Td>
                  <Td>{f.numero}/{f.cuotas_cant}</Td>
                  <Td>{fecha(f.venc)}</Td>
                  <Td right className="font-semibold">{money(f.importe)}</Td>
                  <Td>{vencida ? <Badge tono="rojo">Vencida hace {dias} d</Badge> : <Badge tono="ambar">A vencer</Badge>}</Td>
                  <Td right>
                    <div className="flex justify-end gap-2">
                      {wa && <a href={waLink(msg).replace(/wa\.me\/\d+/, `wa.me/${wa}`)} target="_blank" rel="noopener noreferrer" className={`${btnGhost} !px-3 !py-1.5 !text-xs`}>Recordar</a>}
                      <LinkBtn sm variant="gold" href={`/admin/pagos/nuevo?cliente=${f.cliente_id}&cuota=${f.id}`}>Cobrar</LinkBtn>
                    </div>
                  </Td>
                </tr>
              );
            })}
          </Tabla>
        </div>
      </Card>
      <p className="mt-3 text-right text-sm text-ink-soft">{filas.length} cuota{filas.length === 1 ? "" : "s"} · Total <strong className="text-brand-900">{money(total)}</strong></p>
    </>
  );
}
