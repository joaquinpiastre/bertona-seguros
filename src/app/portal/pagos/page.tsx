import Link from "next/link";
import { PolizaBloqueada, botonPagar } from "@/components/panel/Bloqueo";
import { Badge, Card, Flash, Tabla, Td, Th } from "@/components/panel/ui";
import { dato, type Row } from "@/lib/api";
import { portalUsuario } from "@/lib/auth";
import { METODOS, fecha, hoy, money } from "@/lib/format";

export default async function MisPagos({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  await portalUsuario();
  const h = hoy();
  const { cuotas, pagos, comprobantes, avisos, bloqueadas } = await dato<{ cuotas: Row[]; pagos: Row[]; comprobantes: Row[]; avisos: Row[]; bloqueadas: Row[] }>("portalPagos");

  return (
    <>
      <h1 className="mb-6 text-2xl text-brand-900 sm:text-3xl">Pagos y recibos</h1>
      <Flash sp={sp} />
      {bloqueadas.map((p) => <div key={p.id} className="mb-4"><PolizaBloqueada p={p} /></div>)}

      <Card title="Cuotas pendientes">
        <div className="-m-5">
          <Tabla head={<><Th>Póliza</Th><Th>Cuota</Th><Th>Vencimiento</Th><Th right>Importe</Th><Th>Estado</Th></>} vacio="No tenés cuotas pendientes. ¡Estás al día!">
            {cuotas.map((c) => (
              <tr key={c.id}>
                <Td>{c.compania}<span className="block text-xs text-ink-soft">Póliza {c.poliza}{c.dominio ? ` · ${c.dominio}` : ""}</span></Td>
                <Td>{c.numero}/{c.cuotas_cant}</Td>
                <Td>{fecha(c.venc)}</Td>
                <Td right className="font-semibold">{money(c.importe)}</Td>
                <Td>{c.venc < h ? <Badge tono="rojo">Vencida</Badge> : <Badge tono="ambar">A vencer</Badge>}</Td>
              </tr>
            ))}
          </Tabla>
        </div>
        {cuotas.length > 0 && (
          <div className="mt-6">
            <Link href="/portal/pagar" className={botonPagar}>PAGAR</Link>
            <p className="mt-3 text-sm text-ink-soft">Podés pagar una o varias cuotas juntas, en efectivo en la oficina (San Lorenzo 600, San Rafael) o por transferencia. Los pagos pueden demorar hasta 48 hs en acreditarse. Consultas de cobranza: 260 400-6753.</p>
          </div>
        )}
      </Card>

      {avisos.length > 0 && (
        <Card title="Pagos que informaste" className="mt-6">
          <ul className="divide-y divide-line">
            {avisos.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <span>
                  <strong>{money(a.importe)}</strong> · {METODOS[a.metodo] ?? a.metodo} · {fecha(a.creado)}
                  <span className="block text-xs text-ink-soft">
                    {Array.isArray(a.lineas) && a.lineas.length
                      ? a.lineas.map((l: Row) => `${l.compania} · Póliza ${l.poliza} · Cuota ${l.cuota}/${l.total}`).join(" — ")
                      : "Sin cuota indicada"}
                    {a.documento_id && <> · <a className="underline" href={`/api/documento/${a.documento_id}`} target="_blank">ver comprobante</a></>}
                  </span>
                  {a.estado === "rechazado" && a.motivo && <span className="block text-xs text-red-700">Motivo: {a.motivo}</span>}
                </span>
                {a.estado === "pendiente" && <Badge tono="ambar">En revisión</Badge>}
                {a.estado === "confirmado" && <Badge tono="verde">Aprobado</Badge>}
                {a.estado === "rechazado" && <Badge tono="rojo">Rechazado</Badge>}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card title="Historial de pagos" className="mt-6">
        <div className="-m-5">
          <Tabla head={<><Th>Recibo</Th><Th>Fecha</Th><Th>Póliza</Th><Th>Forma</Th><Th right>Importe</Th><Th /></>} vacio="Todavía no hay pagos registrados.">
            {pagos.map((p) => {
              const comp = comprobantes.find((x) => x.pago_id === p.id);
              return (
                <tr key={p.id}>
                  <Td className="font-semibold">N° {String(p.recibo_nro).padStart(6, "0")}</Td>
                  <Td>{fecha(p.fecha)}</Td>
                  <Td>
                    {Array.isArray(p.lineas) && p.lineas.length ? (
                      <>
                        {p.cuotas_n > 1 && <strong className="block text-xs text-brand-900">{p.cuotas_n} cuotas en un solo recibo</strong>}
                        {p.lineas.map((l: Row, i: number) => <span key={i} className="block text-xs text-ink-soft">{l.compania} · Póliza {l.poliza}{l.cuota ? ` · Cuota ${l.cuota}/${l.total}` : ""}</span>)}
                      </>
                    ) : "Pago a cuenta"}
                  </Td>
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
