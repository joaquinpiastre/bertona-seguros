import Link from "next/link";
import { Badge, Card, Flash, LinkBtn, PageHead, Tabla, Td, Th, btnGhost, btnPrimary, inputCls } from "@/components/panel/ui";
import { DIRECCION_COMPLETA, EMPRESA, PORTAL_URL } from "@/config/empresa";
import { dato, type Row } from "@/lib/api";
import { fecha, money, waCliente } from "@/lib/format";

type SP = Promise<{ ok?: string; error?: string; vista?: string; q?: string }>;

const primerNombre = (n: string) => n.split(" ")[0].charAt(0) + n.split(" ")[0].slice(1).toLowerCase();
const pagar = `Podés abonar en efectivo en nuestra oficina (${DIRECCION_COMPLETA}) o por Mercado Pago, e informar el pago desde "Pagar" en tu cuenta (ingresás solo con tu DNI en ${PORTAL_URL}).`;

function mensajeCuota(f: Row) {
  const vencida = f.atraso > 0;
  const lineas = [
    `Hola ${primerNombre(f.cliente)}, te escribimos de Bertona Seguros.`,
    vencida ? "Te recordamos que tenés una cuota vencida:" : "Te recordamos que tenés una cuota por vencer:",
    `• Póliza N° ${f.poliza} (${f.compania})${f.dominio ? ` · ${f.dominio}` : f.riesgo ? ` · ${f.riesgo}` : ""}`,
    `• Cuota ${f.numero} de ${f.cuotas_cant}`,
    vencida
      ? `• Venció el ${fecha(f.venc)} (hace ${f.atraso} día${f.atraso === 1 ? "" : "s"})`
      : `• Vence el ${fecha(f.venc)}${f.atraso === 0 ? " (hoy)" : ` (en ${-f.atraso} día${f.atraso === -1 ? "" : "s"})`}`,
    `• Importe de la cuota: ${money(f.importe)}`,
    ...(f.vencidas_n > 1 ? [`• Total adeudado: ${money(f.deuda_total)} (${f.vencidas_n} cuotas vencidas)`] : []),
    pagar,
    `Cualquier consulta, estamos a disposición: ${EMPRESA.telefonoVisible}.`,
  ];
  return lineas.join("\n");
}

function mensajePoliza(f: Row) {
  const vencida = f.atraso >= 0;
  return [
    `Hola ${primerNombre(f.cliente)}, te escribimos de Bertona Seguros.`,
    vencida ? "Tu póliza figura vencida:" : "Tu póliza está por vencer:",
    `• Póliza N° ${f.numero} (${f.compania}${f.ramo ? ` · ${f.ramo}` : ""})${f.dominio ? ` · ${f.dominio}` : f.riesgo ? ` · ${f.riesgo}` : ""}`,
    vencida
      ? `• Venció el ${fecha(f.hasta)}${f.atraso > 0 ? ` (hace ${f.atraso} día${f.atraso === 1 ? "" : "s"})` : " (hoy)"}`
      : `• Vence el ${fecha(f.hasta)} (en ${-f.atraso} día${f.atraso === -1 ? "" : "s"})`,
    "Queremos ayudarte a renovarla para que no quedes sin cobertura. ¿Te enviamos la nueva propuesta?",
    `Contactanos al ${EMPRESA.telefonoVisible} o respondé este mensaje.`,
  ].join("\n");
}

export default async function Vencimientos({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const d = await dato<{ vista: string; filas?: Row[]; polizas?: Row[] }>("vencimientos", { vista: sp.vista, q: sp.q });
  const vista = d.vista;
  const filas = d.filas ?? [];
  const polizas = d.polizas ?? [];
  const total = filas.reduce((s, f) => s + f.importe, 0);

  const tab = (v: string, l: string) => (
    <Link key={v} href={`/admin/vencimientos?vista=${v}`} className={vista === v ? btnPrimary : btnGhost}>{l}</Link>
  );

  return (
    <>
      <PageHead title="Vencimientos" sub="Todas las cuotas y pólizas que vencen, con el mensaje de WhatsApp listo para enviar" actions={<LinkBtn variant="gold" href="/admin/pagos/nuevo">Registrar cobro</LinkBtn>} />
      <Flash sp={sp} />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {tab("vencidas", "Cuotas vencidas")}
          {tab("proximas", "Cuotas: próximos 15 días")}
          {tab("todas", "Todas las cuotas pendientes")}
          {tab("polizas", "Pólizas vencidas o por vencer")}
        </div>
        <form className="flex gap-2">
          <input type="hidden" name="vista" value={vista} />
          <input name="q" defaultValue={sp.q} placeholder="Cliente, póliza o dominio" className={`${inputCls} !mt-0 w-64`} aria-label="Buscar" />
          <button className={btnGhost}>Buscar</button>
        </form>
      </div>

      {vista === "polizas" ? (
        <Card>
          <div className="-m-5">
            <Tabla
              head={<><Th>Cliente</Th><Th>Póliza</Th><Th>Vigencia hasta</Th><Th>Estado</Th><Th /></>}
              vacio="No hay pólizas vencidas ni por vencer en los próximos 30 días."
            >
              {polizas.map((f) => {
                const wa = waCliente(f.telefono, mensajePoliza(f));
                return (
                  <tr key={f.id}>
                    <Td>
                      <Link href={`/admin/clientes/${f.cliente_id}`} className="font-semibold text-brand-800 hover:underline">{f.cliente}</Link>
                      {f.es_agencia && <> <Badge tono="azul">Agencia</Badge></>}
                      <span className="block text-xs text-ink-soft">{f.telefono || "Sin teléfono"}</span>
                    </Td>
                    <Td>
                      <Link href={`/admin/polizas/${f.id}`} className="hover:underline">{f.numero}</Link>
                      <span className="block text-xs text-ink-soft">{f.compania} · {f.ramo}{f.dominio ? ` · ${f.dominio}` : f.riesgo ? ` · ${f.riesgo}` : ""}</span>
                    </Td>
                    <Td>{fecha(f.hasta)}</Td>
                    <Td>
                      {f.atraso > 0 ? <Badge tono="rojo">Vencida hace {f.atraso} d</Badge> : f.atraso === 0 ? <Badge tono="rojo">Vence hoy</Badge> : <Badge tono="ambar">Vence en {-f.atraso} d</Badge>}
                      {f.cuotas_pend === 0 && <> <Badge tono="gris">Sin cuotas pendientes</Badge></>}
                    </Td>
                    <Td right>
                      {wa ? <a href={wa} target="_blank" rel="noopener noreferrer" className={`${btnGhost} !px-3 !py-1.5 !text-xs`}>Enviar WhatsApp</a> : <span className="text-xs text-ink-soft">Sin teléfono</span>}
                    </Td>
                  </tr>
                );
              })}
            </Tabla>
          </div>
        </Card>
      ) : (
        <>
          <Card>
            <div className="-m-5">
              <Tabla
                head={<><Th>Cliente</Th><Th>Póliza</Th><Th>Cuota</Th><Th>Vencimiento</Th><Th right>Importe</Th><Th>Estado</Th><Th /></>}
                vacio="No hay cuotas para mostrar con este filtro."
              >
                {filas.map((f) => {
                  const wa = waCliente(f.telefono, mensajeCuota(f));
                  return (
                    <tr key={f.id}>
                      <Td>
                        <Link href={`/admin/clientes/${f.cliente_id}`} className="font-semibold text-brand-800 hover:underline">{f.cliente}</Link>
                        {f.es_agencia && <> <Badge tono="azul">Agencia</Badge></>}
                        <span className="block text-xs text-ink-soft">{f.telefono || "Sin teléfono"}</span>
                      </Td>
                      <Td>
                        <Link href={`/admin/polizas/${f.poliza_id}`} className="hover:underline">{f.poliza}</Link>
                        <span className="block text-xs text-ink-soft">{f.compania}{f.dominio ? ` · ${f.dominio}` : f.riesgo ? ` · ${f.riesgo}` : ""}</span>
                      </Td>
                      <Td>{f.numero}/{f.cuotas_cant}</Td>
                      <Td>{fecha(f.venc)}</Td>
                      <Td right className="font-semibold">{money(f.importe)}</Td>
                      <Td>{f.atraso > 0 ? <Badge tono="rojo">Vencida hace {f.atraso} d</Badge> : <Badge tono="ambar">{f.atraso === 0 ? "Vence hoy" : `Vence en ${-f.atraso} d`}</Badge>}</Td>
                      <Td right>
                        <div className="flex justify-end gap-2">
                          {wa ? <a href={wa} target="_blank" rel="noopener noreferrer" className={`${btnGhost} !px-3 !py-1.5 !text-xs`}>Enviar WhatsApp</a> : <span className="self-center text-xs text-ink-soft">Sin teléfono</span>}
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
      )}
      <p className="mt-4 text-xs text-ink-soft">El botón Enviar WhatsApp abre la conversación con el mensaje ya escrito (nombre, póliza, cuota, fecha, días de atraso e importes); solo hay que tocar enviar.</p>
    </>
  );
}
