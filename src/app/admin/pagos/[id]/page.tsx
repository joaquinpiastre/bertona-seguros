import Link from "next/link";
import { dato, type Row } from "@/lib/api";
import { notFound } from "next/navigation";
import { SubmitButton } from "@/components/panel/Cliente";
import { EnviarRecibo } from "@/components/panel/EnviarRecibo";
import { Badge, Card, Dato, Flash, LinkBtn, PageHead, btnGhost, inputCls } from "@/components/panel/ui";
import { COBRANZA } from "@/config/empresa";
import { anularPago, eliminarDocumento, subirArchivoPago } from "@/lib/actions/admin";
import { METODOS, TIPOS_DOC, fecha, money, waNumero } from "@/lib/format";
import { PORTAL_URL } from "@/config/empresa";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> };

export default async function DetallePago({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const { p, docs, lineas, total } = await dato<{ p: Row; docs: Row[]; lineas: Row[]; total: number }>("pagoDetalle", { id });
  const enlace = await dato<{ token: string }>("reciboEnlace", { id });
  const anulado = p.estado === "anulado";
  const nro = String(p.recibo_nro).padStart(6, "0");
  const wa = waNumero(p.telefono);
  const detalle = lineas.map((l) => `• ${[l.riesgo, l.dominio].filter(Boolean).join(" · ") || `Póliza ${l.poliza}`} — Póliza ${l.poliza}${l.cuota_n ? `, cuota ${l.cuota_n}/${l.cuotas_cant}` : ""}: ${money(l.importe)}`).join("\n");
  const msg = `Hola ${p.cliente.split(" ")[0]}! Recibimos tu pago de ${money(total)} (${fecha(p.fecha_t)}). Te enviamos el recibo N° ${nro}:\n${detalle}\n¡Gracias por confiar en Bertona Seguros! Cobranza: ${COBRANZA.visible}.`;

  return (
    <>
      <PageHead
        title={`Recibo N° ${nro}`}
        sub={`${p.cliente} · ${fecha(p.fecha_t)}`}
        actions={
          <>
            <a href={`/api/recibo/${p.id}`} target="_blank" className={btnGhost}>Ver recibo</a>
            <a href={`/api/recibo/${p.id}?sistema=1`} target="_blank" className={btnGhost}>Recibo del sistema</a>
            <LinkBtn href="/admin/pagos">Volver</LinkBtn>
          </>
        }
      />
      <Flash sp={sp} />
      {!anulado && (
        <Card title="Enviar el recibo al cliente" className="mb-6">
          <EnviarRecibo pagoId={p.id} nro={nro} whatsapp={wa} mensaje={msg} enlace={`${PORTAL_URL.replace(/\/ingresar$/, "")}/r/${enlace.token}`} />
        </Card>
      )}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Detalle del cobro" className="lg:col-span-2" actions={anulado ? <Badge tono="rojo">Anulado</Badge> : <Badge tono="verde">Aplicado</Badge>}>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Dato label="Cliente"><Link href={`/admin/clientes/${p.cid}`} className="font-semibold text-brand-800 hover:underline">{p.cliente}</Link></Dato>
            <Dato label={lineas.length > 1 ? `Importe total (${lineas.length} cuotas)` : "Importe"}><strong className="text-lg">{money(total)}</strong></Dato>
            <Dato label="Forma de pago">{METODOS[p.metodo] ?? p.metodo}</Dato>
            <Dato label="Referencia">{p.referencia}</Dato>
            <div className="sm:col-span-2">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-soft">{lineas.length > 1 ? "Cuotas que cubre este recibo" : "Cuota"}</p>
              <ul className="divide-y divide-line border border-line text-sm">
                {lineas.map((l) => (
                  <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5">
                    <span>
                      {l.poliza_id ? <Link href={`/admin/polizas/${l.poliza_id}`} className="font-semibold text-brand-800 hover:underline">{l.compania} · Póliza {l.poliza}</Link> : "A cuenta"}
                      <span className="block text-xs text-ink-soft">{[l.riesgo, l.dominio].filter(Boolean).join(" · ") || "—"}{l.cuota_n ? ` · Cuota ${l.cuota_n}/${l.cuotas_cant} · vence ${fecha(l.vto)}` : ""}</span>
                    </span>
                    <strong>{money(l.importe)}</strong>
                  </li>
                ))}
              </ul>
            </div>
            <Dato label="Registrado por">{p.por}</Dato>
            <div className="sm:col-span-2"><Dato label="Observaciones">{p.observaciones}</Dato></div>
            {anulado && <div className="sm:col-span-2"><Dato label="Motivo de anulación"><span className="text-red-700">{p.anulado_motivo}</span></Dato></div>}
          </dl>
        </Card>

        {!anulado && (
          <Card title="Anular pago">
            <p className="mb-3 text-sm text-ink-soft">Si el cobro se cargó por error, anulalo: la cuota vuelve a quedar pendiente y el recibo se marca como anulado.</p>
            <form action={anularPago} className="space-y-3">
              <input type="hidden" name="id" value={p.id} />
              <label className="block text-sm font-semibold text-brand-900">Motivo<input name="motivo" required className={inputCls} /></label>
              <SubmitButton variant="danger" confirmar="¿Anular este pago? Esta acción no se puede deshacer." pendiente="Anulando…">Anular pago</SubmitButton>
            </form>
          </Card>
        )}
      </div>

      <Card title="Archivos del pago" className="mt-6">
        {docs.length === 0 ? <p className="text-sm text-ink-soft">Sin archivos adjuntos. Se usa el recibo generado por el sistema.</p> : (
          <ul className="divide-y divide-line">
            {docs.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-sm">
                <span><Badge tono="azul">{TIPOS_DOC[d.tipo] ?? d.tipo}</Badge> <a href={`/api/documento/${d.id}`} target="_blank" className="ml-2 font-semibold text-brand-800 hover:underline">{d.nombre}</a> <span className="text-xs text-ink-soft">({Math.ceil(d.tamano / 1024)} KB)</span></span>
                <form action={eliminarDocumento}><input type="hidden" name="id" value={d.id} /><input type="hidden" name="volver" value={`/admin/pagos/${p.id}`} /><SubmitButton variant="danger" small confirmar="¿Eliminar este archivo?">Eliminar</SubmitButton></form>
              </li>
            ))}
          </ul>
        )}
        <form action={subirArchivoPago} className="mt-4 flex flex-wrap items-end gap-3 border-t border-line pt-4">
          <input type="hidden" name="pago_id" value={p.id} />
          <label className="text-sm font-semibold text-brand-900">Tipo
            <select name="tipo" className={inputCls}><option value="recibo">Recibo propio</option><option value="comprobante">Comprobante de pago</option></select>
          </label>
          <label className="min-w-64 flex-1 text-sm font-semibold text-brand-900">Archivo (PDF o imagen, máx. 4 MB)
            <input type="file" name="archivo" required accept=".pdf,.jpg,.jpeg,.png,.webp" className={`${inputCls} file:mr-3 file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-700`} />
          </label>
          <SubmitButton variant="primary" pendiente="Subiendo…">Subir archivo</SubmitButton>
        </form>
      </Card>
    </>
  );
}
