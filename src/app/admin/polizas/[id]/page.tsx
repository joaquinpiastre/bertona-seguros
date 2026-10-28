import Link from "next/link";
import { dato, type Row } from "@/lib/api";
import { notFound } from "next/navigation";
import { SubmitButton } from "@/components/panel/Cliente";
import { Badge, Card, Field, Flash, LinkBtn, PageHead, SelectField, Tabla, Td, TextArea, Th, inputCls } from "@/components/panel/ui";
import { actualizarCuota, actualizarPoliza, agregarCuota, anularCuota, anularPoliza, eliminarDocumento, eliminarPoliza, reactivarPoliza, subirDocumento } from "@/lib/actions/admin";
import { COBROS, ESTADOS_POLIZA, PERIODICIDAD, RAMOS_LISTA, TIPOS_DOC, fecha, hoy, money } from "@/lib/format";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> };

export default async function DetallePoliza({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const pid = Number(id);
  const h = hoy();
  const { p, cuotas, docs } = await dato<{ p: Row; cuotas: Row[]; docs: Row[] }>("polizaDetalle", { id: pid });

  const volver = `/admin/polizas/${pid}`;
  const pagadas = cuotas.filter((c) => c.estado === "pagada").length;
  const faltaPoliza = !docs.some((d) => d.tipo === "poliza");
  const faltaCert = !docs.some((d) => d.tipo === "certificado");
  const porTarjeta = p.cobro !== "oficina";

  return (
    <>
      <PageHead
        title={`Póliza ${p.numero}`}
        sub={`${p.compania} · ${p.ramo} · ${p.cliente}`}
        actions={<><LinkBtn variant="gold" href={`/admin/pagos/nuevo?cliente=${p.cliente_id}`}>Registrar cobro</LinkBtn><LinkBtn href={`/admin/polizas/${pid}/constancia`}>Generar constancia</LinkBtn><LinkBtn href={`/admin/clientes/${p.cliente_id}`}>Ver cliente</LinkBtn><LinkBtn href="/admin/polizas">Volver</LinkBtn></>}
      />
      <Flash sp={sp} />
      {p.estado === "anulada" && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-l-4 border-slate-500 bg-slate-50 px-4 py-3 text-sm text-slate-800">
          <span><strong>Esta póliza está anulada (inactiva).</strong> El cliente no puede usarla. Si hace falta, la podés reactivar.</span>
          <form action={reactivarPoliza}><input type="hidden" name="id" value={pid} /><SubmitButton variant="gold" small confirmar="¿Reactivar esta póliza? Vuelve a estar vigente." pendiente="Reactivando…">Reactivar póliza</SubmitButton></form>
        </div>
      )}
      {(faltaPoliza || faltaCert) && (
        <div className="mb-6 border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Falta cargar: {[faltaPoliza && "la póliza", faltaCert && "el certificado de cobertura"].filter(Boolean).join(" y ")}. El cliente no podrá descargarlos hasta que los subas.
        </div>
      )}

      <Card title="Datos de la póliza">
        <form action={actualizarPoliza} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <input type="hidden" name="id" value={pid} />
          <SelectField label="Ramo" name="ramo" required defaultValue={p.ramo} options={[...new Set([p.ramo, ...RAMOS_LISTA])].map((r) => [r, r])} />
          <Field label="Compañía aseguradora" name="compania" defaultValue={p.compania} required />
          <Field label="N° de póliza" name="numero" defaultValue={p.numero} required />
          <Field label="Riesgo / bien asegurado" name="riesgo" defaultValue={p.riesgo} className="lg:col-span-2" />
          <Field label="Dominio (patente)" name="dominio" defaultValue={p.dominio} />
          <Field label="Cobertura" name="cobertura" defaultValue={p.cobertura} className="lg:col-span-2" />
          <Field label="Suma asegurada (ARS)" name="suma_asegurada" defaultValue={p.suma ?? ""} />
          <Field label="Vigencia desde" name="vigencia_desde" type="date" defaultValue={p.desde} />
          <Field label="Vigencia hasta" name="vigencia_hasta" type="date" defaultValue={p.hasta} />
          <SelectField label="Estado" name="estado" defaultValue={p.estado} options={Object.entries(ESTADOS_POLIZA)} />
          <SelectField label="¿Quién cobra?" name="cobro" defaultValue={p.cobro} options={Object.entries(COBROS)} className="lg:col-span-2" />
          <SelectField label="Las cuotas vencen cada" name="periodicidad" defaultValue={p.periodicidad} options={Object.entries(PERIODICIDAD).map(([v, x]) => [v, x.label])} />
          <TextArea label="Notas internas" name="notas" defaultValue={p.notas} className="sm:col-span-2 lg:col-span-3" />
          <div className="sm:col-span-2 lg:col-span-3 flex flex-wrap items-center gap-4">
            <SubmitButton>Guardar cambios</SubmitButton>
            <span className="text-sm text-ink-soft">
              {porTarjeta
                ? `Cobro con ${p.cobro === "credito" ? "tarjeta de crédito" : "tarjeta de débito"} (lo cobra la compañía)`
                : `Cuotas ${(PERIODICIDAD[p.periodicidad]?.label ?? p.periodicidad).toLowerCase()}es · ${pagadas}/${cuotas.length} pagas · ${money(p.imp)} por cuota`}
            </span>
          </div>
        </form>
      </Card>

      <Card
        title="Documentos de la póliza"
        className="mt-6"
      >
        {docs.length === 0 ? <p className="text-sm text-ink-soft">Todavía no hay documentos cargados.</p> : (
          <ul className="divide-y divide-line">
            {docs.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-sm">
                <span><Badge tono="azul">{TIPOS_DOC[d.tipo] ?? d.tipo}</Badge> <a href={`/api/documento/${d.id}`} target="_blank" className="ml-2 font-semibold text-brand-800 hover:underline">{d.nombre}</a> <span className="text-xs text-ink-soft">({Math.ceil(d.tamano / 1024)} KB · {fecha(d.creado)})</span></span>
                <form action={eliminarDocumento}><input type="hidden" name="id" value={d.id} /><input type="hidden" name="volver" value={volver} /><SubmitButton variant="danger" small confirmar="¿Eliminar este documento?">Eliminar</SubmitButton></form>
              </li>
            ))}
          </ul>
        )}
        <form action={subirDocumento} className="mt-4 flex flex-wrap items-end gap-3 border-t border-line pt-4">
          <input type="hidden" name="poliza_id" value={pid} />
          <label className="text-sm font-semibold text-brand-900">Tipo
            <select name="tipo" className={inputCls} defaultValue={faltaPoliza ? "poliza" : "certificado"}>
              {["poliza", "certificado", "otro"].map((t) => <option key={t} value={t}>{TIPOS_DOC[t]}</option>)}
            </select>
          </label>
          <label className="min-w-64 flex-1 text-sm font-semibold text-brand-900">Archivo (PDF o imagen, máx. 4 MB)
            <input type="file" name="archivo" required accept=".pdf,.jpg,.jpeg,.png,.webp" className={`${inputCls} file:mr-3 file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-700`} />
          </label>
          <SubmitButton pendiente="Subiendo…">Subir documento</SubmitButton>
        </form>
      </Card>

      {p.estado !== "anulada" && (
        <Card title="Anular la póliza" className="mt-6">
          <p className="mb-3 text-sm text-ink-soft">La póliza queda inactiva (el cliente deja de poder usarla y descargar sus papeles), pero la podés reactivar cuando quieras.</p>
          <form action={anularPoliza}><input type="hidden" name="id" value={pid} /><SubmitButton variant="danger" small confirmar="¿Anular esta póliza? Queda inactiva y se puede reactivar." pendiente="Anulando…">Anular póliza</SubmitButton></form>
        </Card>
      )}

      <Card title="Eliminar la póliza" className="mt-6">
        <p className="mb-3 text-sm text-ink-soft">
          Se borra para siempre junto con sus cuotas y documentos.
          {p.npagos > 0 ? ` Tiene ${p.npagos} pago${p.npagos > 1 ? "s" : ""} registrado${p.npagos > 1 ? "s" : ""}: también se borran sus recibos. Si solo querés que deje de estar activa, mejor anulala.` : ""}
        </p>
        <form action={eliminarPoliza} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="id" value={pid} />
          {p.npagos > 0 && (
            <label className="text-sm font-semibold text-brand-900">Para confirmar escribí ELIMINAR
              <input name="confirmar" autoComplete="off" required className={inputCls} />
            </label>
          )}
          <SubmitButton variant="danger" small confirmar="¿Eliminar esta póliza definitivamente?" pendiente="Eliminando…">Eliminar póliza</SubmitButton>
        </form>
      </Card>

      {porTarjeta && cuotas.length === 0 ? (
        <Card title="Cuotas" className="mt-6">
          <p className="text-sm text-ink-soft">Esta póliza se paga con tarjeta y la cobra la compañía: no tiene cuotas para gestionar acá.</p>
        </Card>
      ) : (
      <Card title="Cuotas" className="mt-6" actions={<form action={agregarCuota}><input type="hidden" name="poliza_id" value={pid} /><SubmitButton variant="ghost" small>Agregar cuota</SubmitButton></form>}>
        <div className="-m-5">
          <Tabla head={<><Th>N°</Th><Th>Vencimiento</Th><Th right>Importe</Th><Th>Estado</Th><Th>Recibo</Th><Th /></>} vacio="Sin cuotas.">
            {cuotas.map((c) => {
              const vencida = c.estado === "pendiente" && c.venc < h;
              return (
                <tr key={c.id} className={c.estado === "anulada" ? "text-ink-soft line-through" : ""}>
                  <Td>{c.numero}/{p.cuotas_cant}</Td>
                  <Td>
                    {c.estado === "pendiente" ? (
                      <form action={actualizarCuota} className="flex flex-wrap items-center gap-2">
                        <input type="hidden" name="id" value={c.id} /><input type="hidden" name="poliza_id" value={pid} />
                        <input type="date" name="vencimiento" defaultValue={c.venc} aria-label={`Vencimiento cuota ${c.numero}`} className="border border-line px-2 py-1 text-sm" />
                        <input name="importe" defaultValue={String(c.importe)} aria-label={`Importe cuota ${c.numero}`} className="w-28 border border-line px-2 py-1 text-sm" />
                        <SubmitButton variant="ghost" small>Guardar</SubmitButton>
                      </form>
                    ) : fecha(c.venc)}
                  </Td>
                  <Td right className="font-semibold">{c.estado === "pendiente" ? "" : money(c.importe)}</Td>
                  <Td>{c.estado === "pagada" ? <Badge tono="verde">Pagada</Badge> : c.estado === "anulada" ? <Badge>Anulada</Badge> : vencida ? <Badge tono="rojo">Vencida</Badge> : <Badge tono="ambar">Pendiente</Badge>}</Td>
                  <Td>{c.pago_id ? <Link href={`/admin/pagos/${c.pago_id}`} className="font-semibold text-brand-800 hover:underline">N° {String(c.recibo).padStart(6, "0")}</Link> : "—"}</Td>
                  <Td right>
                    {c.estado === "pendiente" && (
                      <div className="flex justify-end gap-2">
                        <LinkBtn sm variant="gold" href={`/admin/pagos/nuevo?cliente=${p.cliente_id}&cuota=${c.id}`}>Cobrar</LinkBtn>
                        <form action={anularCuota}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="poliza_id" value={pid} /><SubmitButton variant="danger" small confirmar="¿Anular esta cuota?">Anular</SubmitButton></form>
                      </div>
                    )}
                  </Td>
                </tr>
              );
            })}
          </Tabla>
        </div>
      </Card>
      )}
    </>
  );
}
