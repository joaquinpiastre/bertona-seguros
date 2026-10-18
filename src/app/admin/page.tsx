import Link from "next/link";
import { dato, type Row } from "@/lib/api";
import { Icono } from "@/components/panel/Iconos";
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
      <PageHead title="Inicio" sub={`Hoy es ${fecha(h)}`} actions={<><LinkBtn variant="gold" href="/admin/pagos/nuevo">Registrar cobro</LinkBtn><LinkBtn href="/admin/clientes/nuevo">Nuevo cliente</LinkBtn><LinkBtn href="/admin/polizas/nueva">Nueva póliza</LinkBtn></>} />
      <Flash sp={sp} />

      <form action="/admin/clientes" className="mb-6 flex gap-2">
        <label className="sr-only" htmlFor="buscar">Buscar cliente</label>
        <input id="buscar" name="q" placeholder="Buscar un cliente por nombre, DNI, patente o póliza" className="min-h-14 w-full border-2 border-line bg-white px-4 text-base hover:border-brand-200 focus:border-brand-500" />
        <button className="inline-flex min-h-14 items-center gap-2 bg-brand-900 px-6 text-base font-semibold text-white hover:bg-brand-700"><Icono n="buscar" className="h-5 w-5" />Buscar</button>
      </form>

      <h2 className="mb-3 text-xl text-brand-900">Para hacer hoy</h2>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/admin/comprobantes", n: avisos.n, titulo: "Pagos para aprobar", ok: "Ninguno pendiente", icono: "inforpago" as const, tono: "gold" },
          { href: "/admin/vencimientos?vista=vencidas", n: venc.n, titulo: "Cuotas vencidas", ok: "Todo al día", icono: "vencimientos" as const, tono: "red", sub: venc.n ? money(venc.t) : "" },
          { href: "/admin/vencimientos?vista=proximas", n: prox.n, titulo: "Vencen en 7 días", ok: "Ninguna por vencer", icono: "vencimientos" as const, tono: "plain", sub: prox.n ? money(prox.t) : "" },
          { href: "/admin/alertas", n: alertas.n, titulo: "Avisos sin resolver", ok: "Sin avisos", icono: "aviso" as const, tono: "red" },
        ].map((c) => (
          <Link key={c.titulo} href={c.href} className={`group flex flex-col justify-between gap-3 border-2 bg-white p-5 transition hover:shadow-lift ${c.n > 0 ? (c.tono === "gold" ? "border-accent-500" : c.tono === "red" ? "border-red-300" : "border-brand-200") : "border-line"}`}>
            <span className="flex items-center justify-between">
              <span className={`grid h-12 w-12 place-items-center ${c.n > 0 ? "bg-brand-900 text-white" : "bg-emerald-50 text-emerald-700"}`}><Icono n={c.icono} className="h-7 w-7" /></span>
              <span className={`font-display text-5xl font-semibold ${c.n > 0 ? "text-brand-900" : "text-emerald-700"}`}>{c.n}</span>
            </span>
            <span>
              <strong className="block text-lg text-brand-900">{c.titulo}</strong>
              <span className="text-sm text-ink-soft">{c.n > 0 ? (c.sub ? `${c.sub} · tocá para verlas` : "Tocá para verlos") : c.ok}</span>
            </span>
          </Link>
        ))}
      </div>

      <h2 className="mb-3 text-xl text-brand-900">Cómo viene el negocio</h2>
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
