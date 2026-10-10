import Link from "next/link";
import { notFound } from "next/navigation";
import { SubmitButton } from "@/components/panel/Cliente";
import { Badge, Card, Dato, Flash, LinkBtn, PageHead, btnGhost, inputCls } from "@/components/panel/ui";
import { waLink } from "@/config/empresa";
import { anularPago, eliminarDocumento, subirArchivoPago } from "@/lib/actions/admin";
import { q, q1 } from "@/lib/db";
import { METODOS, TIPOS_DOC, fecha, money, waNumero } from "@/lib/format";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> };

export default async function DetallePago({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const p = await q1(
    `SELECT pg.*, pg.fecha::text AS fecha_t, pg.importe::float8 AS imp, cl.nombre AS cliente, cl.telefono, cl.id AS cid,
            po.numero AS poliza, po.compania, po.dominio, po.riesgo, po.cuotas_cant, c.numero AS cuota_n, u.nombre AS por
     FROM pagos pg JOIN clientes cl ON cl.id = pg.cliente_id
     LEFT JOIN polizas po ON po.id = pg.poliza_id LEFT JOIN cuotas c ON c.id = pg.cuota_id LEFT JOIN usuarios u ON u.id = pg.registrado_por
     WHERE pg.id = $1`,
    [Number(id)]
  );
  if (!p) notFound();
  const docs = await q("SELECT id, tipo, nombre, tamano, creado::text AS creado FROM documentos WHERE pago_id = $1 ORDER BY id", [p.id]);
  const anulado = p.estado === "anulado";
  const nro = String(p.recibo_nro).padStart(6, "0");
  const wa = waNumero(p.telefono);
  const msg = `Hola ${p.cliente.split(" ")[0]}, recibimos tu pago de ${money(p.imp)} (${fecha(p.fecha_t)}). Tu recibo N° ${nro} ya está disponible en tu área de clientes de Bertona Seguros. ¡Gracias!`;

  return (
    <>
      <PageHead
        title={`Recibo N° ${nro}`}
        sub={`${p.cliente} · ${fecha(p.fecha_t)}`}
        actions={
          <>
            <a href={`/api/recibo/${p.id}`} target="_blank" className={btnGhost}>Ver recibo</a>
            <a href={`/api/recibo/${p.id}?sistema=1`} target="_blank" className={btnGhost}>Recibo del sistema</a>
            {wa && <a href={waLink(msg).replace(/wa\.me\/\d+/, `wa.me/${wa}`)} target="_blank" rel="noopener noreferrer" className={btnGhost}>Avisar por WhatsApp</a>}
            <LinkBtn href="/admin/pagos">Volver</LinkBtn>
          </>
        }
      />
      <Flash sp={sp} />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Detalle del cobro" className="lg:col-span-2" actions={anulado ? <Badge tono="rojo">Anulado</Badge> : <Badge tono="verde">Aplicado</Badge>}>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Dato label="Cliente"><Link href={`/admin/clientes/${p.cid}`} className="font-semibold text-brand-800 hover:underline">{p.cliente}</Link></Dato>
            <Dato label="Importe"><strong className="text-lg">{money(p.imp)}</strong></Dato>
            <Dato label="Forma de pago">{METODOS[p.metodo] ?? p.metodo}</Dato>
            <Dato label="Referencia">{p.referencia}</Dato>
            <Dato label="Póliza">{p.poliza ? <Link href={`/admin/polizas/${p.poliza_id}`} className="hover:underline">{p.compania} · {p.poliza}</Link> : "A cuenta"}</Dato>
            <Dato label="Cuota">{p.cuota_n ? `${p.cuota_n} de ${p.cuotas_cant}` : "—"}</Dato>
            <Dato label="Riesgo / dominio">{[p.riesgo, p.dominio].filter(Boolean).join(" · ")}</Dato>
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
