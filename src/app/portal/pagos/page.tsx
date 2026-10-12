import { Badge, Card, Flash, Tabla, Td, Th } from "@/components/panel/ui";
import { dato, type Row } from "@/lib/api";
import { portalUsuario } from "@/lib/auth";
import { METODOS, fecha, hoy, money } from "@/lib/format";

export default async function MisPagos({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const u = await portalUsuario();
  const h = hoy();
  const { cuotas, pagos, comprobantes } = await dato<{ cuotas: Row[]; pagos: Row[]; comprobantes: Row[] }>("portalPagos");

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
