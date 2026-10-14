import Link from "next/link";
import { SubmitButton } from "@/components/panel/Cliente";
import { Badge, Card, Flash, LinkBtn, PageHead, inputCls } from "@/components/panel/ui";
import { rechazarAviso } from "@/lib/actions/admin";
import { dato, type Row } from "@/lib/api";
import { METODOS, fecha, money } from "@/lib/format";

export default async function Comprobantes({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const { filas } = await dato<{ filas: Row[] }>("avisos");
  const pendientes = filas.filter((f) => f.estado === "pendiente");
  const resueltos = filas.filter((f) => f.estado !== "pendiente");

  return (
    <>
      <PageHead title="Comprobantes de clientes" sub="Pagos informados por los clientes desde su portal, para revisar y confirmar" />
      <Flash sp={sp} />

      <Card title={`Para revisar (${pendientes.length})`}>
        {pendientes.length === 0 ? (
          <p className="text-sm text-ink-soft">No hay comprobantes pendientes de revisión.</p>
        ) : (
          <ul className="divide-y divide-line">
            {pendientes.map((a) => (
              <li key={a.id} className="py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="text-sm">
                    <Link href={`/admin/clientes/${a.cliente_id}`} className="font-semibold text-brand-800 hover:underline">{a.cliente}</Link>
                    <span className="text-ink-soft"> · enviado el {fecha(a.creado)}</span>
                    <span className="block text-ink-soft">
                      {a.poliza ? `${a.compania} · Póliza ${a.poliza}${a.dominio ? ` · ${a.dominio}` : ""}${a.cuota_n ? ` · Cuota ${a.cuota_n}/${a.cuotas_cant} (${money(a.cuota_importe)})` : ""}` : "Sin cuota indicada"}
                    </span>
                    <span className="block">
                      Informa {a.importe ? <strong>{money(a.importe)}</strong> : "importe no indicado"} · {METODOS[a.metodo] ?? a.metodo ?? "—"} · {a.fecha ? fecha(a.fecha) : "sin fecha"}
                    </span>
                    {a.nota && <span className="block text-xs text-ink-soft">Nota: {a.nota}</span>}
                    {a.documento_id && <a href={`/api/documento/${a.documento_id}`} target="_blank" className="mt-1 inline-block text-sm font-semibold text-brand-700 underline">Ver comprobante</a>}
                  </div>
                  <LinkBtn variant="gold" href={`/admin/pagos/nuevo?cliente=${a.cliente_id}&aviso=${a.id}`}>Confirmar y registrar cobro</LinkBtn>
                </div>
                <form action={rechazarAviso} className="mt-3 flex flex-wrap items-end gap-2">
                  <input type="hidden" name="id" value={a.id} />
                  <label className="min-w-64 flex-1 text-xs font-semibold text-ink-soft">Motivo si lo rechazás (lo ve el cliente)
                    <input name="motivo" placeholder="Ej: el comprobante no se lee / el importe no coincide" className={inputCls} />
                  </label>
                  <SubmitButton variant="danger" small confirmar="¿Rechazar este comprobante?">Rechazar</SubmitButton>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Resueltos en los últimos 30 días" className="mt-6">
        {resueltos.length === 0 ? (
          <p className="text-sm text-ink-soft">Todavía no hay comprobantes resueltos.</p>
        ) : (
          <ul className="divide-y divide-line text-sm">
            {resueltos.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <span>
                  <Link href={`/admin/clientes/${a.cliente_id}`} className="font-semibold text-brand-800 hover:underline">{a.cliente}</Link>
                  <span className="text-ink-soft"> · {a.importe ? money(a.importe) : "sin importe"} · {fecha(a.creado)}</span>
                  {a.estado === "rechazado" && a.motivo && <span className="block text-xs text-red-700">Motivo: {a.motivo}</span>}
                </span>
                <span className="flex items-center gap-3">
                  {a.pago_id && <Link href={`/admin/pagos/${a.pago_id}`} className="text-xs font-semibold text-brand-700 hover:underline">Ver recibo</Link>}
                  {a.estado === "confirmado" ? <Badge tono="verde">Confirmado</Badge> : <Badge tono="rojo">Rechazado</Badge>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
