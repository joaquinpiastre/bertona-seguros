import Link from "next/link";
import { Badge, Card, Flash, LinkBtn, PageHead, Tabla, Td, Th, btnGhost, btnPrimary, inputCls } from "@/components/panel/ui";
import { METODOS, esFecha, fecha, hoy, money } from "@/lib/format";
import { listarPagos } from "@/lib/queries";

type SP = Promise<{ ok?: string; error?: string; desde?: string; hasta?: string; metodo?: string; q?: string; estado?: string }>;

export default async function Pagos({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const h = hoy();
  const desde = esFecha(sp.desde) ? sp.desde : h.slice(0, 8) + "01";
  const hasta = esFecha(sp.hasta) ? sp.hasta : h;
  const metodo = sp.metodo && METODOS[sp.metodo] ? sp.metodo : "";
  const filas = await listarPagos({ desde, hasta, metodo: metodo || undefined, busqueda: sp.q?.trim() || undefined, estado: sp.estado });

  const aplicados = filas.filter((f) => f.estado === "aplicado");
  const total = aplicados.reduce((s, f) => s + f.importe, 0);
  const porMetodo = Object.entries(
    aplicados.reduce<Record<string, number>>((a, f) => ((a[f.metodo] = (a[f.metodo] ?? 0) + f.importe), a), {})
  ).sort((a, b) => b[1] - a[1]);
  const qs = new URLSearchParams({ desde, hasta, ...(metodo && { metodo }), ...(sp.q && { q: sp.q }), ...(sp.estado && { estado: sp.estado }) }).toString();

  const atajo = (label: string, d: string, hh: string) => (
    <Link key={label} href={`/admin/pagos?desde=${d}&hasta=${hh}`} className={`${desde === d && hasta === hh ? btnPrimary : btnGhost} !px-3 !py-1.5 !text-xs`}>{label}</Link>
  );

  return (
    <>
      <PageHead
        title="Pagos y caja"
        sub="Historial de cobros y totales por forma de pago"
        actions={<><a href={`/api/pagos/export?${qs}`} className={btnGhost}>Exportar CSV</a><LinkBtn variant="gold" href="/admin/pagos/nuevo">Registrar cobro</LinkBtn></>}
      />
      <Flash sp={sp} />

      <form className="mb-4 grid gap-3 border border-line bg-white p-4 sm:grid-cols-2 lg:grid-cols-6" method="get">
        <label className="text-xs font-semibold text-ink-soft lg:col-span-1">Desde<input type="date" name="desde" defaultValue={desde} className={inputCls} /></label>
        <label className="text-xs font-semibold text-ink-soft lg:col-span-1">Hasta<input type="date" name="hasta" defaultValue={hasta} className={inputCls} /></label>
        <label className="text-xs font-semibold text-ink-soft lg:col-span-1">Forma de pago
          <select name="metodo" defaultValue={metodo} className={inputCls}>
            <option value="">Todas</option>
            {Object.entries(METODOS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-ink-soft lg:col-span-1">Estado
          <select name="estado" defaultValue={sp.estado ?? ""} className={inputCls}>
            <option value="">Todos</option><option value="aplicado">Aplicados</option><option value="anulado">Anulados</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-ink-soft lg:col-span-1">Buscar<input name="q" defaultValue={sp.q} placeholder="Cliente, póliza, recibo…" className={inputCls} /></label>
        <div className="flex items-end"><button className={`${btnPrimary} w-full`}>Filtrar</button></div>
      </form>
      <div className="mb-4 flex flex-wrap gap-2">
        {atajo("Hoy", h, h)}
        {atajo("Este mes", h.slice(0, 8) + "01", h)}
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border border-line bg-white p-4 lg:col-span-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Total cobrado</p>
          <p className="mt-1 font-display text-2xl font-semibold text-emerald-700">{money(total)}</p>
          <p className="text-xs text-ink-soft">{aplicados.length} pago{aplicados.length === 1 ? "" : "s"} aplicado{aplicados.length === 1 ? "" : "s"}</p>
        </div>
        {porMetodo.map(([m, t]) => (
          <div key={m} className="border border-line bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">{METODOS[m] ?? m}</p>
            <p className="mt-1 font-display text-xl font-semibold text-brand-900">{money(t)}</p>
          </div>
        ))}
      </div>

      <Card>
        <div className="-m-5">
          <Tabla head={<><Th>Recibo</Th><Th>Fecha</Th><Th>Cliente</Th><Th>Cuota</Th><Th>Forma</Th><Th right>Importe</Th><Th>Estado</Th><Th /></>} vacio="No hay pagos en el período seleccionado.">
            {filas.map((p) => (
              <tr key={p.id} className={p.estado === "anulado" ? "bg-red-50/40 text-ink-soft" : ""}>
                <Td><Link href={`/admin/pagos/${p.id}`} className="font-semibold text-brand-800 hover:underline">N° {String(p.recibo_nro).padStart(6, "0")}</Link></Td>
                <Td>{fecha(p.fecha)}</Td>
                <Td>
                  <Link href={`/admin/clientes/${p.cliente_id}`} className="hover:underline">{p.cliente}</Link>
                  <span className="block text-xs text-ink-soft">{p.poliza ? `${p.compania} · ${p.poliza}${p.dominio ? ` · ${p.dominio}` : ""}` : "A cuenta"}</span>
                </Td>
                <Td>{p.cuota_n ?? "—"}</Td>
                <Td>{METODOS[p.metodo] ?? p.metodo}</Td>
                <Td right className="font-semibold">{money(p.importe)}</Td>
                <Td>{p.estado === "anulado" ? <Badge tono="rojo">Anulado</Badge> : <Badge tono="verde">Aplicado</Badge>}</Td>
                <Td right><a href={`/api/recibo/${p.id}`} target="_blank" className="text-xs font-semibold text-brand-700 hover:underline">Recibo</a></Td>
              </tr>
            ))}
          </Tabla>
        </div>
      </Card>
      {filas.length >= 1000 && <p className="mt-2 text-xs text-ink-soft">Se muestran los primeros 1000 resultados: acotá el período.</p>}
    </>
  );
}
