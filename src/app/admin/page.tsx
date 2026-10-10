import Link from "next/link";
import { Badge, Card, Flash, LinkBtn, PageHead, Stat, Tabla, Td, Th } from "@/components/panel/ui";
import { q, q1 } from "@/lib/db";
import { METODOS, fecha, hoy, money, sumarDias } from "@/lib/format";

type SP = Promise<{ ok?: string; error?: string }>;

export default async function Resumen({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const h = hoy();
  const mesIni = h.slice(0, 8) + "01";
  const en7 = sumarDias(h, 7);
  const en30 = sumarDias(h, 30);

  const [mes, dia, venc, prox, polizas, porVencer, clientes, hoyMetodos, vencidas, proximas, ultimos] = await Promise.all([
    q1("SELECT COALESCE(SUM(importe),0)::float8 AS t, COUNT(*)::int AS n FROM pagos WHERE estado='aplicado' AND fecha >= $1 AND fecha <= $2", [mesIni, h]),
    q1("SELECT COALESCE(SUM(importe),0)::float8 AS t, COUNT(*)::int AS n FROM pagos WHERE estado='aplicado' AND fecha = $1", [h]),
    q1("SELECT COALESCE(SUM(importe),0)::float8 AS t, COUNT(*)::int AS n FROM cuotas WHERE estado='pendiente' AND vencimiento < $1", [h]),
    q1("SELECT COALESCE(SUM(importe),0)::float8 AS t, COUNT(*)::int AS n FROM cuotas WHERE estado='pendiente' AND vencimiento BETWEEN $1 AND $2", [h, en7]),
    q1("SELECT COUNT(*)::int AS n FROM polizas WHERE estado = 'vigente'"),
    q1("SELECT COUNT(*)::int AS n FROM polizas WHERE estado = 'vigente' AND vigencia_hasta BETWEEN $1 AND $2", [h, en30]),
    q1("SELECT COUNT(*)::int AS n FROM clientes WHERE activo"),
    q("SELECT metodo, SUM(importe)::float8 AS t FROM pagos WHERE estado='aplicado' AND fecha = $1 GROUP BY metodo ORDER BY t DESC", [h]),
    q(
      `SELECT c.id, c.numero, c.vencimiento::text AS venc, c.importe::float8 AS importe, p.id AS poliza_id, p.numero AS poliza, p.cuotas_cant, p.compania, p.dominio, cl.id AS cliente_id, cl.nombre AS cliente
       FROM cuotas c JOIN polizas p ON p.id = c.poliza_id JOIN clientes cl ON cl.id = p.cliente_id
       WHERE c.estado = 'pendiente' AND c.vencimiento < $1 ORDER BY c.vencimiento LIMIT 8`, [h]),
    q(
      `SELECT c.id, c.numero, c.vencimiento::text AS venc, c.importe::float8 AS importe, p.id AS poliza_id, p.numero AS poliza, p.cuotas_cant, p.compania, p.dominio, cl.id AS cliente_id, cl.nombre AS cliente
       FROM cuotas c JOIN polizas p ON p.id = c.poliza_id JOIN clientes cl ON cl.id = p.cliente_id
       WHERE c.estado = 'pendiente' AND c.vencimiento BETWEEN $1 AND $2 ORDER BY c.vencimiento LIMIT 8`, [h, en7]),
    q(
      `SELECT pg.id, pg.recibo_nro, pg.fecha::text AS fecha, pg.importe::float8 AS importe, pg.metodo, pg.estado, cl.id AS cliente_id, cl.nombre AS cliente, p.numero AS poliza
       FROM pagos pg JOIN clientes cl ON cl.id = pg.cliente_id LEFT JOIN polizas p ON p.id = pg.poliza_id
       ORDER BY pg.id DESC LIMIT 8`),
  ]);

  const filaCuota = (c: (typeof vencidas)[number], vencida: boolean) => (
    <tr key={c.id}>
      <Td>
        <Link href={`/admin/clientes/${c.cliente_id}`} className="font-semibold text-brand-800 hover:underline">{c.cliente}</Link>
        <span className="block text-xs text-ink-soft">{c.compania} · Póliza {c.poliza}{c.dominio ? ` · ${c.dominio}` : ""}</span>
      </Td>
      <Td>{c.numero}/{c.cuotas_cant}</Td>
      <Td><span className={vencida ? "font-semibold text-red-700" : ""}>{fecha(c.venc)}</span></Td>
      <Td right className="font-semibold">{money(c.importe)}</Td>
      <Td right><LinkBtn sm variant="gold" href={`/admin/pagos/nuevo?cliente=${c.cliente_id}&cuota=${c.id}`}>Cobrar</LinkBtn></Td>
    </tr>
  );
  const head = (<><Th>Cliente</Th><Th>Cuota</Th><Th>Vence</Th><Th right>Importe</Th><Th /></>);

  return (
    <>
      <PageHead
        title="Resumen"
        sub={`Hoy es ${fecha(h)}`}
        actions={<><LinkBtn variant="gold" href="/admin/pagos/nuevo">Registrar cobro</LinkBtn><LinkBtn href="/admin/polizas/nueva">Nueva póliza</LinkBtn><LinkBtn href="/admin/clientes/nuevo">Nuevo cliente</LinkBtn></>}
      />
      <Flash sp={sp} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Cobrado hoy" value={money(dia!.t)} sub={`${dia!.n} pago${dia!.n === 1 ? "" : "s"}`} tono="verde" />
        <Stat label="Cobrado en el mes" value={money(mes!.t)} sub={`${mes!.n} pago${mes!.n === 1 ? "" : "s"}`} />
        <Stat label="Cuotas vencidas" value={money(venc!.t)} sub={`${venc!.n} cuota${venc!.n === 1 ? "" : "s"} impaga${venc!.n === 1 ? "" : "s"}`} tono={venc!.n ? "rojo" : undefined} />
        <Stat label="Vencen en 7 días" value={money(prox!.t)} sub={`${prox!.n} cuota${prox!.n === 1 ? "" : "s"}`} />
        <Stat label="Pólizas vigentes" value={String(polizas!.n)} sub={`${porVencer!.n} vencen en 30 días`} />
        <Stat label="Clientes activos" value={String(clientes!.n)} />
        <div className="border border-line bg-white p-5 sm:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Caja de hoy por forma de pago</p>
          {hoyMetodos.length === 0 ? (
            <p className="mt-2 text-sm text-ink-soft">Todavía no hay cobros registrados hoy.</p>
          ) : (
            <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
              {hoyMetodos.map((m) => (
                <li key={m.metodo} className="flex justify-between border-b border-line py-1"><span>{METODOS[m.metodo] ?? m.metodo}</span><strong>{money(m.t)}</strong></li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card title="Cuotas vencidas" actions={<Link href="/admin/cobranzas?filtro=vencidas" className="text-sm font-semibold text-brand-700 hover:underline">Ver todas</Link>}>
          <div className="-m-5"><Tabla head={head} vacio="No hay cuotas vencidas. ¡Todo al día!">{vencidas.map((c) => filaCuota(c, true))}</Tabla></div>
        </Card>
        <Card title="Próximos vencimientos (7 días)" actions={<Link href="/admin/cobranzas?filtro=proximas" className="text-sm font-semibold text-brand-700 hover:underline">Ver todas</Link>}>
          <div className="-m-5"><Tabla head={head} vacio="No hay vencimientos en los próximos 7 días.">{proximas.map((c) => filaCuota(c, false))}</Tabla></div>
        </Card>
      </div>

      <Card title="Últimos pagos" className="mt-6" actions={<Link href="/admin/pagos" className="text-sm font-semibold text-brand-700 hover:underline">Ver todos</Link>}>
        <div className="-m-5">
          <Tabla head={<><Th>Recibo</Th><Th>Fecha</Th><Th>Cliente</Th><Th>Forma</Th><Th right>Importe</Th><Th>Estado</Th></>} vacio="Aún no se registraron pagos.">
            {ultimos.map((p) => (
              <tr key={p.id}>
                <Td><Link href={`/admin/pagos/${p.id}`} className="font-semibold text-brand-800 hover:underline">N° {String(p.recibo_nro).padStart(6, "0")}</Link></Td>
                <Td>{fecha(p.fecha)}</Td>
                <Td>{p.cliente}<span className="block text-xs text-ink-soft">{p.poliza ? `Póliza ${p.poliza}` : "A cuenta"}</span></Td>
                <Td>{METODOS[p.metodo] ?? p.metodo}</Td>
                <Td right className="font-semibold">{money(p.importe)}</Td>
                <Td>{p.estado === "anulado" ? <Badge tono="rojo">Anulado</Badge> : <Badge tono="verde">Aplicado</Badge>}</Td>
              </tr>
            ))}
          </Tabla>
        </div>
      </Card>
    </>
  );
}
