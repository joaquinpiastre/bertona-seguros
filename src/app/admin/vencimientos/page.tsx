import Link from "next/link";
import { AvisoCheck, EnviarAviso } from "@/components/panel/Cliente";
import { Badge, Card, Flash, LinkBtn, PageHead, Tabla, Td, Th, btnGhost, btnPrimary, inputCls } from "@/components/panel/ui";
import { marcarAviso } from "@/lib/actions/admin";
import { COBRANZA, DIRECCION_COMPLETA, PORTAL_URL } from "@/config/empresa";
import { dato, type Row } from "@/lib/api";
import { fecha, hoy, money, sumarDias, waCliente } from "@/lib/format";

type SP = Promise<{ ok?: string; error?: string; vista?: string; q?: string; aviso?: string }>;

const primerNombre = (n: string) => n.split(" ")[0].charAt(0) + n.split(" ")[0].slice(1).toLowerCase();
const detalleBien = (f: Row) => [f.riesgo, f.dominio].filter(Boolean).join(" · ");
const pagar = (transferir?: string) =>
  `Podés abonar en efectivo en nuestra oficina (${DIRECCION_COMPLETA}) o por transferencia, e informar el pago desde "Pagar" en tu cuenta (${PORTAL_URL}, con tu DNI y contraseña). Podés pagar varias cuotas juntas con un solo recibo.` +
  (transferir?.trim() ? `\n\nDatos para transferir:\n${transferir.trim()}` : "");

/** Un solo mensaje por cliente con todo lo que debe: total, vehículos, pólizas, cuotas y vencimientos. El 2.º aviso es más firme. */
function mensajeCliente(filas: Row[], transferir: string | undefined, aviso: 1 | 2) {
  const nombre = primerNombre(filas[0].cliente);
  const vencidas = filas.filter((f) => f.atraso > 0);
  const proximas = filas.filter((f) => f.atraso <= 0);
  const linea = (f: Row) => {
    const estado = f.atraso > 0
      ? `venció el ${fecha(f.venc)} (hace ${f.atraso} día${f.atraso === 1 ? "" : "s"})`
      : `vence el ${fecha(f.venc)}${f.atraso === 0 ? " (hoy)" : ` (en ${-f.atraso} día${f.atraso === -1 ? "" : "s"})`}`;
    return `• ${detalleBien(f) || "Póliza"} — Póliza N° ${f.poliza} (${f.compania}) — Cuota ${f.numero} de ${f.cuotas_cant}, ${estado}: ${money(f.importe)}`;
  };
  const partes = [`Hola ${nombre}, te escribimos de Bertona Seguros${aviso === 2 ? " por segunda vez" : ""}.`];
  if (aviso === 2) partes.push("Todavía no registramos el pago de lo que te avisamos antes. Para que no quedes sin cobertura, necesitamos que lo regularices:");
  if (vencidas.length) {
    partes.push(aviso === 2 ? (vencidas.length === 1 ? "Cuota vencida:" : `Cuotas vencidas (${vencidas.length}):`) : `Te recordamos que tenés ${vencidas.length === 1 ? "una cuota vencida" : `${vencidas.length} cuotas vencidas`}:`, ...vencidas.map(linea));
    partes.push(`TOTAL ADEUDADO: ${money(filas[0].deuda_total)}`);
  }
  if (proximas.length) {
    partes.push(vencidas.length ? "Y estas cuotas están por vencer:" : aviso === 2 ? "Cuotas por vencer:" : `Te recordamos que tenés ${proximas.length === 1 ? "una cuota por vencer" : `${proximas.length} cuotas por vencer`}:`, ...proximas.map(linea));
    partes.push(`Total a vencer: ${money(proximas.reduce((s, f) => s + f.importe, 0))}`);
  }
  partes.push(pagar(transferir));
  if (aviso === 2) partes.push("Si ya abonaste, avisanos y mandanos el comprobante para actualizarlo.");
  partes.push(`Consultas de cobranza: ${COBRANZA.visible}.`);
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
  const d = await dato<{ vista: string; filas?: Row[]; polizas?: Row[]; transferir?: string; diasEntreAvisos?: number }>("vencimientos", { vista: sp.vista, q: sp.q, aviso: sp.aviso });
  const vista = d.vista;
  const filas = d.filas ?? [];
  const polizas = d.polizas ?? [];
  const entreAvisos = d.diasEntreAvisos ?? 15;
  const total = filas.reduce((s, f) => s + f.importe, 0);

  // Agrupa las cuotas por cliente (un mensaje y un cobro por cliente).
  const clientes: { id: number; filas: Row[] }[] = [];
  for (const f of filas) {
    let g = clientes.find((x) => x.id === f.cliente_id);
    if (!g) clientes.push((g = { id: f.cliente_id, filas: [] }));
    g.filas.push(f);
  }

  const filtroAviso = sp.aviso === "sin" || sp.aviso === "1" || sp.aviso === "2" ? sp.aviso : "";
  const volverA = `/admin/vencimientos?vista=${vista}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ""}${filtroAviso ? `&aviso=${filtroAviso}` : ""}`;
  const chip = (v: string, l: string) => (
    <Link key={v} href={`/admin/vencimientos?vista=${vista}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ""}${v ? `&aviso=${v}` : ""}`} className={`${filtroAviso === v ? btnPrimary : btnGhost} !px-3 !py-1.5 !text-xs`}>{l}</Link>
  );
  const h = hoy();

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
          {filtroAviso && <input type="hidden" name="aviso" value={filtroAviso} />}
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
          <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold text-brand-900">Cobranza por WhatsApp (1er y 2.º aviso):</span>
            {chip("", "Todos")}{chip("sin", "Sin avisar")}{chip("1", "Con 1er aviso")}{chip("2", "Con 2.º aviso")}
          </div>
          {clientes.length === 0 && <Card><p className="text-sm text-ink-soft">No hay cuotas para mostrar con este filtro.</p></Card>}
          <div className="space-y-4">
            {clientes.map((g) => {
              const f0 = g.filas[0];
              // Cada cuota está sin avisar, con el 1er aviso o con el 2.º; los mensajes se arman solo con las cuotas que le tocan a cada aviso.
              const sin1 = g.filas.filter((f) => !f.aviso1);
              const con1 = g.filas.filter((f) => f.aviso1 && !f.aviso2);
              const todas1 = sin1.length === 0;
              const todas2 = g.filas.every((f) => f.aviso2);
              const ult = (campo: "aviso1" | "aviso2") => g.filas.map((f) => f[campo] as string | null).filter(Boolean).sort().at(-1) ?? undefined;
              const ult1 = ult("aviso1");
              const ult2 = ult("aviso2");
              const fecha2 = ult1 ? sumarDias(ult1, entreAvisos) : ""; // desde cuándo corresponde el 2.º aviso
              const temprano2 = !!fecha2 && fecha2 > h;
              const wa1 = sin1.length ? waCliente(f0.telefono, mensajeCliente(sin1, d.transferir, 1)) : "";
              const wa2 = con1.length ? waCliente(f0.telefono, mensajeCliente(con1, d.transferir, 2)) : "";
              const waRepetir = todas2 ? waCliente(f0.telefono, mensajeCliente(g.filas, d.transferir, 2)) : "";
              const vencidas = g.filas.filter((f) => f.atraso > 0);
              const sumaVista = g.filas.reduce((s, f) => s + f.importe, 0);
              return (
                <section key={g.id} className="border border-line bg-white">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line p-4 sm:p-5">
                    <div>
                      <Link href={`/admin/clientes/${g.id}`} className="font-display text-xl font-semibold text-brand-900 hover:underline">{f0.cliente}</Link>
                      {f0.es_agencia && <> <Badge tono="azul">Agencia</Badge></>}
                      {todas2 ? <> <Badge tono="verde">2.º aviso enviado</Badge></> : todas1 && <> <Badge tono="verde">1er aviso enviado</Badge></>}
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
                          {f.aviso2 ? <Badge tono="azul">2.º aviso {fecha(f.aviso2)}</Badge> : f.aviso1 ? <Badge tono="gris">1er aviso {fecha(f.aviso1)}</Badge> : null}
                          {f.atraso > 0 ? <Badge tono="rojo">Vencida hace {f.atraso} d</Badge> : <Badge tono="ambar">{f.atraso === 0 ? "Vence hoy" : `Vence en ${-f.atraso} d`}</Badge>}
                          <LinkBtn sm variant="gold" href={`/admin/pagos/nuevo?cliente=${g.id}&cuota=${f.id}`}>Cobrar</LinkBtn>
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap items-center gap-3 border-t border-line bg-soft px-4 py-3 sm:px-5">
                    {!f0.telefono && <span className="text-sm text-ink-soft">Sin teléfono para enviar WhatsApp</span>}
                    {wa1 && (
                      <EnviarAviso action={marcarAviso} ids={sin1.map((f) => f.id)} url={wa1} aviso={1} destacado volver={volverA}
                        etiqueta={`Enviar 1er aviso por WhatsApp${sin1.length < g.filas.length ? ` (${sin1.length} cuota${sin1.length === 1 ? "" : "s"})` : ""}`} />
                    )}
                    {wa2 && (
                      <EnviarAviso action={marcarAviso} ids={con1.map((f) => f.id)} url={wa2} aviso={2} destacado={!temprano2} volver={volverA}
                        confirmar={temprano2 ? `El 2.º aviso corresponde a partir del ${fecha(fecha2)} (${entreAvisos} días después del 1.º, enviado el ${fecha(ult1)}). ¿Querés enviarlo igual?` : undefined}
                        etiqueta={`Enviar 2.º aviso por WhatsApp${con1.length < g.filas.length ? ` (${con1.length} cuota${con1.length === 1 ? "" : "s"})` : ""}${temprano2 ? ` · desde el ${fecha(fecha2)}` : ""}`} />
                    )}
                    {waRepetir && (
                      <EnviarAviso action={marcarAviso} ids={g.filas.map((f) => f.id)} url={waRepetir} aviso={2} destacado={false} volver={volverA}
                        confirmar={`Ya le enviaste el 2.º aviso${ult2 ? ` el ${fecha(ult2)}` : ""}. ¿Querés enviarlo otra vez?`} etiqueta="Enviar el 2.º aviso de nuevo" />
                    )}
                    <AvisoCheck action={marcarAviso} ids={g.filas.map((f) => f.id)} aviso={1} marcado={todas1} volver={volverA}
                      texto={!todas1 && sin1.length < g.filas.length ? `${g.filas.length - sin1.length} de ${g.filas.length} cuotas` : undefined} />
                    <AvisoCheck action={marcarAviso} ids={g.filas.map((f) => f.id)} aviso={2} marcado={todas2} volver={volverA}
                      texto={!todas2 && g.filas.some((f) => f.aviso2) ? `${g.filas.filter((f) => f.aviso2).length} de ${g.filas.length} cuotas` : undefined} />
                    {g.filas.length > 1 && <LinkBtn sm href={`/admin/pagos/nuevo?cliente=${g.id}&todas=${vencidas.length ? "vencidas" : "1"}`}>Cobrar varias juntas</LinkBtn>}
                  </div>
                </section>
              );
            })}
          </div>
          <p className="mt-3 text-right text-sm text-ink-soft">{clientes.length} cliente{clientes.length === 1 ? "" : "s"} · {filas.length} cuota{filas.length === 1 ? "" : "s"} · Total <strong className="text-brand-900">{money(total)}</strong></p>
        </>
      )}
      <p className="mt-4 text-xs text-ink-soft">
        Cada cuota tiene dos avisos: el 1er aviso y el 2.º aviso (el 2.º corresponde a los {entreAvisos} días del 1.º; si lo mandás antes, el sistema te pide confirmar). Los botones de WhatsApp abren la conversación con un solo mensaje por cliente
        (total adeudado, cada vehículo o póliza, cuota, fecha, días de atraso y datos para transferir, que se cargan en Configuración) y dejan marcado el aviso con la fecha. Las casillas «1er aviso» y «2.º aviso» sirven para marcarlo o desmarcarlo a mano
        (por ejemplo si avisaste por teléfono). Pasados {entreAvisos} días del 2.º aviso sin que la cuota se pague, aparece una alerta en Avisos. Las cuotas nuevas arrancan sin avisos.
      </p>
    </>
  );
}
