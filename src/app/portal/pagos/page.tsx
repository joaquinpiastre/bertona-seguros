import { SubmitButton } from "@/components/panel/Cliente";
import { Badge, Card, Field, Flash, SelectField, Tabla, Td, Th, TextArea } from "@/components/panel/ui";
import { enviarComprobante } from "@/lib/actions/portal";
import { dato, type Row } from "@/lib/api";
import { portalUsuario } from "@/lib/auth";
import { METODOS, fecha, hoy, money } from "@/lib/format";

export default async function MisPagos({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const u = await portalUsuario();
  const h = hoy();
  const { cuotas, pagos, comprobantes, avisos } = await dato<{ cuotas: Row[]; pagos: Row[]; comprobantes: Row[]; avisos: Row[] }>("portalPagos");

  return (
    <>
      <h1 className="mb-6 text-2xl text-brand-900 sm:text-3xl">Pagos y recibos</h1>
      <Flash sp={sp} />
      <Card title="Cuotas pendientes">
        <div className="-m-5">
          <Tabla head={<><Th>Póliza</Th><Th>Cuota</Th><Th>Vencimiento</Th><Th right>Importe</Th><Th>Estado</Th></>} vacio="No tenés cuotas pendientes. ¡Estás al día!">
            {cuotas.map((c) => {
              const vencida = c.venc < h;
              return (
                <tr key={c.id}>
                  <Td>{c.compania}<span className="block text-xs text-ink-soft">Póliza {c.poliza}{c.dominio ? ` · ${c.dominio}` : ""}</span></Td>
                  <Td>{c.numero}/{c.cuotas_cant}</Td>
                  <Td>{fecha(c.venc)}</Td>
                  <Td right className="font-semibold">{money(c.importe)}</Td>
                  <Td>{vencida ? <Badge tono="rojo">Vencida</Badge> : <Badge tono="ambar">A vencer</Badge>}</Td>
                </tr>
              );
            })}
          </Tabla>
        </div>
        {cuotas.length > 0 && <p className="mt-6 text-sm text-ink-soft">Podés abonar en nuestra oficina (San Lorenzo 600, San Rafael) o consultarnos por otros medios de pago por WhatsApp. Los pagos pueden demorar hasta 48 hs en acreditarse.</p>}
      </Card>

      <Card title="Informar un pago / subir comprobante" className="mt-6">
        <p className="mb-4 text-sm text-ink-soft">¿Pagaste por transferencia o depósito? Subí la foto o el PDF del comprobante. Lo revisamos, impactamos el pago y te emitimos el recibo.</p>
        <form action={enviarComprobante} className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="¿Qué cuota pagaste?"
            name="cuota_id"
            vacio="Otro / no sé"
            options={cuotas.map((c) => [String(c.id), `${c.compania} · Póliza ${c.poliza} · Cuota ${c.numero}/${c.cuotas_cant} · vence ${fecha(c.venc)} · ${money(c.importe)}`])}
            className="sm:col-span-2"
          />
          <Field label="Importe pagado (ARS)" name="importe" placeholder="Ej: 33000" />
          <Field label="Fecha del pago" name="fecha" type="date" defaultValue={h} />
          <SelectField label="Forma de pago" name="metodo" defaultValue="transferencia" options={[["transferencia", "Transferencia"], ["efectivo", "Efectivo (en oficina)"], ["debito", "Débito"], ["credito", "Tarjeta de crédito"], ["mercadopago", "Mercado Pago"], ["otro", "Otro"]]} />
          <Field label="Comprobante (foto o PDF, máx. 4 MB)" name="archivo" type="file" required accept=".pdf,.jpg,.jpeg,.png,.webp" />
          <TextArea label="Comentario (opcional)" name="nota" rows={2} className="sm:col-span-2" />
          <div className="sm:col-span-2"><SubmitButton variant="gold" pendiente="Enviando…">Enviar comprobante</SubmitButton></div>
        </form>
        {avisos.length > 0 && (
          <div className="mt-6 border-t border-line pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-soft">Mis comprobantes enviados</p>
            <ul className="divide-y divide-line">
              {avisos.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                  <span>
                    {a.importe ? <strong>{money(a.importe)}</strong> : "Comprobante"} · {fecha(a.fecha ?? a.creado)}
                    <span className="block text-xs text-ink-soft">
                      {a.poliza ? `${a.compania} · Póliza ${a.poliza}${a.cuota_n ? ` · Cuota ${a.cuota_n}/${a.cuotas_cant}` : ""}` : "Sin cuota indicada"}
                      {a.documento_id && <> · <a className="underline" href={`/api/documento/${a.documento_id}`} target="_blank">ver archivo</a></>}
                    </span>
                    {a.estado === "rechazado" && a.motivo && <span className="block text-xs text-red-700">Motivo: {a.motivo}</span>}
                  </span>
                  {a.estado === "pendiente" && <Badge tono="ambar">En revisión</Badge>}
                  {a.estado === "confirmado" && <Badge tono="verde">Confirmado</Badge>}
                  {a.estado === "rechazado" && <Badge tono="rojo">Rechazado</Badge>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      <Card title="Historial de pagos" className="mt-6">
        <div className="-m-5">
          <Tabla head={<><Th>Recibo</Th><Th>Fecha</Th><Th>Póliza</Th><Th>Forma</Th><Th right>Importe</Th><Th /></>} vacio="Todavía no hay pagos registrados.">
            {pagos.map((p) => {
              const comp = comprobantes.find((x) => x.pago_id === p.id);
              return (
                <tr key={p.id}>
                  <Td className="font-semibold">N° {String(p.recibo_nro).padStart(6, "0")}</Td>
                  <Td>{fecha(p.fecha)}</Td>
                  <Td>{p.poliza ? <>{p.compania}<span className="block text-xs text-ink-soft">Póliza {p.poliza}{p.cuota_n ? ` · Cuota ${p.cuota_n}/${p.cuotas_cant}` : ""}</span></> : "Pago a cuenta"}</Td>
                  <Td>{METODOS[p.metodo] ?? p.metodo}</Td>
                  <Td right className="font-semibold">{money(p.importe)}</Td>
                  <Td right>
                    <div className="flex justify-end gap-3 text-xs font-semibold">
                      <a href={`/api/recibo/${p.id}`} target="_blank" className="text-brand-700 hover:underline">Recibo</a>
                      {comp && <a href={`/api/documento/${comp.id}`} target="_blank" className="text-brand-700 hover:underline">Comprobante</a>}
                    </div>
                  </Td>
                </tr>
              );
            })}
          </Tabla>
        </div>
      </Card>
    </>
  );
}
