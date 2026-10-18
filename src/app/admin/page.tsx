import Link from "next/link";
import { dato, type Row } from "@/lib/api";
import { Badge, Card, Flash, LinkBtn, PageHead, Stat, Tabla, Td, Th } from "@/components/panel/ui";
import { METODOS, fecha, hoy, money, sumarDias } from "@/lib/format";

type SP = Promise<{ ok?: string; error?: string }>;

export default async function Resumen({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const h = hoy();
  const { mes, dia, venc, prox, polizas, porVencer, clientes, hoyMetodos, vencidas, proximas, ultimos, avisos, alertas } = await dato<{
    mes: Row; dia: Row; venc: Row; prox: Row; polizas: Row; porVencer: Row; clientes: Row;
    hoyMetodos: Row[]; vencidas: Row[]; proximas: Row[]; ultimos: Row[]; avisos: Row; alertas: Row;
  }>("resumen");

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
      {alertas.n > 0 && (
        <Link href="/admin/alertas" className="mb-3 flex items-center justify-between border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-900 hover:bg-red-100">
          <span><strong>{alertas.n} aviso{alertas.n > 1 ? "s" : ""} sin resolver:</strong> pedidos de clientes, pólizas vencidas, pagos completos y más.</span>
          <span className="font-semibold">Ver avisos →</span>
        </Link>
      )}
      {avisos.n > 0 && (
        <Link href="/admin/comprobantes" className="mb-6 flex items-center justify-between border-l-4 border-accent-500 bg-accent-300/20 px-4 py-3 text-sm text-brand-900 hover:bg-accent-300/30">
          <span><strong>{avisos.n} pago{avisos.n > 1 ? "s" : ""} informado{avisos.n > 1 ? "s" : ""} por clientes para aprobar o rechazar.</strong></span>
          <span className="font-semibold">Revisar →</span>
        </Link>
      )}

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
        <Card title="Cuotas vencidas" actions={<Link href="/admin/vencimientos?vista=vencidas" className="text-sm font-semibold text-brand-700 hover:underline">Ver todas</Link>}>
          <div className="-m-5"><Tabla head={head} vacio="No hay cuotas vencidas. ¡Todo al día!">{vencidas.map((c) => filaCuota(c, true))}</Tabla></div>
        </Card>
        <Card title="Próximos vencimientos (7 días)" actions={<Link href="/admin/vencimientos?vista=proximas" className="text-sm font-semibold text-brand-700 hover:underline">Ver todas</Link>}>
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
