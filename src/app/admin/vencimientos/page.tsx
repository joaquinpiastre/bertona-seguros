import Link from "next/link";
import { Badge, Card, Flash, LinkBtn, PageHead, Tabla, Td, Th, btnGhost, btnPrimary, inputCls } from "@/components/panel/ui";
import { COBRANZA, DIRECCION_COMPLETA, PORTAL_URL } from "@/config/empresa";
import { dato, type Row } from "@/lib/api";
import { ACTUALIZACION, fecha, money, waCliente } from "@/lib/format";

type SP = Promise<{ ok?: string; error?: string; vista?: string; q?: string }>;

const primerNombre = (n: string) => n.split(" ")[0].charAt(0) + n.split(" ")[0].slice(1).toLowerCase();
const detalleBien = (f: Row) => [f.riesgo, f.dominio].filter(Boolean).join(" · ");
const pagar = `Podés abonar en efectivo en nuestra oficina (${DIRECCION_COMPLETA}) o por transferencia, e informar el pago desde "Pagar" en tu cuenta (${PORTAL_URL}, con tu DNI y contraseña). Podés pagar varias cuotas juntas con un solo recibo.`;

/** Un solo mensaje por cliente con todo lo que debe: total, vehículos, pólizas, cuotas y vencimientos. */
function mensajeCliente(filas: Row[]) {
  const nombre = primerNombre(filas[0].cliente);
  const vencidas = filas.filter((f) => f.atraso > 0);
  const proximas = filas.filter((f) => f.atraso <= 0);
  const linea = (f: Row) => {
    const estado = f.atraso > 0
      ? `venció el ${fecha(f.venc)} (hace ${f.atraso} día${f.atraso === 1 ? "" : "s"})`
      : `vence el ${fecha(f.venc)}${f.atraso === 0 ? " (hoy)" : ` (en ${-f.atraso} día${f.atraso === -1 ? "" : "s"})`}`;
    return `• ${detalleBien(f) || "Póliza"} — Póliza N° ${f.poliza} (${f.compania}) — Cuota ${f.numero} de ${f.cuotas_cant}, ${estado}: ${money(f.importe)}`;
  };
  const partes = [`Hola ${nombre}, te escribimos de Bertona Seguros.`];
  if (vencidas.length) {
    partes.push(`Te recordamos que tenés ${vencidas.length === 1 ? "una cuota vencida" : `${vencidas.length} cuotas vencidas`}:`, ...vencidas.map(linea));
    partes.push(`TOTAL ADEUDADO: ${money(filas[0].deuda_total)}`);
  }
  if (proximas.length) {
    partes.push(vencidas.length ? "Y estas cuotas están por vencer:" : `Te recordamos que tenés ${proximas.length === 1 ? "una cuota por vencer" : `${proximas.length} cuotas por vencer`}:`, ...proximas.map(linea));
    partes.push(`Total a vencer: ${money(proximas.reduce((s, f) => s + f.importe, 0))}`);
  }
  partes.push(pagar, `Consultas de cobranza: ${COBRANZA.visible}.`);
  return partes.join("\n");
}

function mensajePoliza(f: Row) {
  const vencida = f.atraso >= 0;
  return [
    `Hola ${primerNombre(f.cliente)}, te escribimos de Bertona Seguros.`,
    vencida ? "Tu póliza figura vencida:" : "Tu póliza está por vencer:",
    `• Póliza N° ${f.numero} (${f.compania}${f.ramo ? ` · ${f.ramo}` : ""})${detalleBien(f) ? ` · ${detalleBien(f)}` : ""}`,
    vencida
      ? `• Venció el ${fecha(f.hasta)}${f.atraso > 0 ? ` (hace ${f.atraso} día${f.atraso === 1 ? "" : "s"})` : " (hoy)"}`
      : `• Vence el ${fecha(f.hasta)} (en ${-f.atraso} día${f.atraso === -1 ? "" : "s"})`,
    "Queremos ayudarte a renovarla para que no quedes sin cobertura. ¿Te enviamos la nueva propuesta?",
    `Contactanos al ${COBRANZA.visible} (cobranza) o respondé este mensaje.`,
  ].join("\n");
}

export default async function Vencimientos({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const d = await dato<{ vista: string; filas?: Row[]; polizas?: Row[]; certificados?: Row[]; dias?: number }>("vencimientos", { vista: sp.vista, q: sp.q });
  const vista = d.vista;
  const filas = d.filas ?? [];
  const polizas = d.polizas ?? [];
  const certificados = d.certificados ?? [];
  const total = filas.reduce((s, f) => s + f.importe, 0);

  // Agrupa las cuotas por cliente (un mensaje y un cobro por cliente).
  const clientes: { id: number; filas: Row[] }[] = [];
  for (const f of filas) {
    let g = clientes.find((x) => x.id === f.cliente_id);
    if (!g) clientes.push((g = { id: f.cliente_id, filas: [] }));
    g.filas.push(f);
  }

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
          {tab("certificados", "Certificados")}
        </div>
        <form className="flex gap-2">
          <input type="hidden" name="vista" value={vista} />
          <input name="q" defaultValue={sp.q} placeholder="Cliente, póliza o dominio" className={`${inputCls} !mt-0 w-64`} aria-label="Buscar" />
          <button className={btnGhost}>Buscar</button>
        </form>
      </div>

      {vista === "certificados" ? (
        <Card>
          <div className="-m-5">
            <Tabla
              head={<><Th>Cliente</Th><Th>Póliza</Th><Th>Certificado hasta</Th><Th>Estado</Th><Th /></>}
              vacio={`No hay certificados vencidos ni por vencer en los próximos ${d.dias ?? 15} días.`}
            >
              {certificados.map((f) => (
                <tr key={f.id}>
                  <Td>
                    <Link href={`/admin/clientes/${f.cliente_id}`} className="font-semibold text-brand-800 hover:underline">{f.cliente}</Link>
                    {f.es_agencia && <> <Badge tono="azul">Agencia</Badge></>}
                    <span className="block text-xs text-ink-soft">{f.telefono || "Sin teléfono"}</span>
                  </Td>
                  <Td>
                    <Link href={`/admin/polizas/${f.id}`} className="hover:underline">{f.numero}</Link>
                    <span className="block text-xs text-ink-soft">{f.compania} · {f.ramo}{detalleBien(f) ? ` · ${detalleBien(f)}` : ""}</span>
                    <span className="block text-xs text-ink-soft">{f.cobro === "credito" ? "Tarjeta de crédito" : f.cobro === "debito" ? "Tarjeta de débito" : "Cobro en oficina"} · se actualiza {ACTUALIZACION[String(f.actualizacion_meses)]?.split(" (")[0].toLowerCase()}</span>
                  </Td>
                  <Td>{f.hasta ? fecha(f.hasta) : "—"}</Td>
                  <Td>
                    {f.atraso === null ? <Badge tono="rojo">Sin certificado</Badge> : f.atraso > 0 ? <Badge tono="rojo">Vencido hace {f.atraso} d</Badge> : f.atraso === 0 ? <Badge tono="rojo">Vence hoy</Badge> : <Badge tono="ambar">Vence en {-f.atraso} d</Badge>}
                  </Td>
                  <Td right><LinkBtn sm variant="gold" href={`/admin/polizas/${f.id}`}>Cargar certificado</LinkBtn></Td>
                </tr>
              ))}
            </Tabla>
          </div>
        </Card>
      ) : vista === "polizas" ? (
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
                      <span className="block text-xs text-ink-soft">{f.compania} · {f.ramo}{detalleBien(f) ? ` · ${detalleBien(f)}` : ""}</span>
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
          {clientes.length === 0 && <Card><p className="text-sm text-ink-soft">No hay cuotas para mostrar con este filtro.</p></Card>}
          <div className="space-y-4">
            {clientes.map((g) => {
              const f0 = g.filas[0];
              const wa = waCliente(f0.telefono, mensajeCliente(g.filas));
              const vencidas = g.filas.filter((f) => f.atraso > 0);
              const sumaVista = g.filas.reduce((s, f) => s + f.importe, 0);
              return (
                <section key={g.id} className="border border-line bg-white">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line p-4 sm:p-5">
                    <div>
                      <Link href={`/admin/clientes/${g.id}`} className="font-display text-xl font-semibold text-brand-900 hover:underline">{f0.cliente}</Link>
                      {f0.es_agencia && <> <Badge tono="azul">Agencia</Badge></>}
                      <p className="text-sm text-ink-soft">{f0.telefono || "Sin teléfono"} · {g.filas.length} cuota{g.filas.length === 1 ? "" : "s"} en esta vista</p>
                    </div>
                    <div className="text-right">
                      {vencidas.length > 0 ? (
                        <>
                          <p className="text-xs font-semibold uppercase tracking-wider text-red-700">Total adeudado</p>
                          <p className="font-display text-2xl font-semibold text-red-700">{money(f0.deuda_total)}</p>
                          <p className="text-xs text-ink-soft">{f0.vencidas_n} cuota{f0.vencidas_n === 1 ? "" : "s"} vencida{f0.vencidas_n === 1 ? "" : "s"}</p>
                        </>
                      ) : (
                        <>
                          <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">A cobrar</p>
                          <p className="font-display text-2xl font-semibold text-brand-900">{money(sumaVista)}</p>
                        </>
                      )}
                    </div>
                  </div>
                  <ul className="divide-y divide-line text-sm">
                    {g.filas.map((f) => (
                      <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-5">
                        <span>
                          <strong className="text-brand-900">{detalleBien(f) || "Póliza " + f.poliza}</strong>
                          <span className="block text-xs text-ink-soft">
                            <Link href={`/admin/polizas/${f.poliza_id}`} className="hover:underline">Póliza {f.poliza}</Link> · {f.compania} · Cuota {f.numero}/{f.cuotas_cant} · vence {fecha(f.venc)}
                          </span>
                        </span>
                        <span className="flex items-center gap-3">
                          <strong>{money(f.importe)}</strong>
                          {f.atraso > 0 ? <Badge tono="rojo">Vencida hace {f.atraso} d</Badge> : <Badge tono="ambar">{f.atraso === 0 ? "Vence hoy" : `Vence en ${-f.atraso} d`}</Badge>}
                          <LinkBtn sm variant="gold" href={`/admin/pagos/nuevo?cliente=${g.id}&cuota=${f.id}`}>Cobrar</LinkBtn>
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap items-center gap-3 border-t border-line bg-soft px-4 py-3 sm:px-5">
                    {wa ? <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center bg-[#1fa855] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#188a45]">Enviar WhatsApp con el total y el detalle</a> : <span className="text-sm text-ink-soft">Sin teléfono para enviar WhatsApp</span>}
                    {g.filas.length > 1 && <LinkBtn sm href={`/admin/pagos/nuevo?cliente=${g.id}&todas=${vencidas.length ? "vencidas" : "1"}`}>Cobrar varias juntas</LinkBtn>}
                  </div>
                </section>
              );
            })}
          </div>
          <p className="mt-3 text-right text-sm text-ink-soft">{clientes.length} cliente{clientes.length === 1 ? "" : "s"} · {filas.length} cuota{filas.length === 1 ? "" : "s"} · Total <strong className="text-brand-900">{money(total)}</strong></p>
        </>
      )}
      <p className="mt-4 text-xs text-ink-soft">El botón Enviar WhatsApp abre la conversación con un solo mensaje por cliente: el total que debe, cada vehículo o póliza, cuota, fecha y días de atraso. Solo hay que tocar enviar.</p>
    </>
  );
}
