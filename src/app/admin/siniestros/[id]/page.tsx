import Link from "next/link";
import { SiniestroCampos } from "@/components/panel/SiniestroCampos";
import { SubmitButton } from "@/components/panel/Cliente";
import { Badge, Card, Dato, Flash, LinkBtn, PageHead, TextArea, btnGhost, inputCls } from "@/components/panel/ui";
import { EMPRESA } from "@/config/empresa";
import { actualizarSiniestro, agregarNotaSiniestro, eliminarDocumento, eliminarSiniestro, subirArchivoSiniestro } from "@/lib/actions/admin";
import { dato, type Row } from "@/lib/api";
import { ESTADOS_SINIESTRO, fecha, waCliente } from "@/lib/format";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> };

export default async function DetalleSiniestro({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const sid = Number(id);
  const { s, notas, docs } = await dato<{ s: Row; notas: Row[]; docs: Row[] }>("siniestroDetalle", { id: sid });
  const volver = `/admin/siniestros/${sid}`;
  const wa = waCliente(
    s.telefono,
    `Hola ${s.cliente.split(" ")[0]}, te escribimos de Bertona Seguros por tu siniestro${s.fecha ? ` del ${fecha(s.fecha)}` : ""}${s.poliza ? ` (póliza ${s.poliza})` : ""}. Estado actual: ${ESTADOS_SINIESTRO[s.estado] ?? s.estado}. Cualquier novedad te avisamos; consultas al ${EMPRESA.telefonoVisible}.`
  );

  return (
    <>
      <PageHead
        title={`Siniestro ${s.tipo ? `· ${s.tipo}` : ""}`}
        sub={`${s.cliente}${s.fecha ? ` · ${fecha(s.fecha)}` : ""}${s.origen === "cliente" ? " · denunciado por el cliente" : ""}`}
        actions={<>{wa && <a href={wa} target="_blank" rel="noopener noreferrer" className={btnGhost}>WhatsApp al cliente</a>}<LinkBtn href="/admin/siniestros">Volver</LinkBtn></>}
      />
      <Flash sp={sp} />

      <div className="mb-6 grid gap-4 border border-line bg-white p-5 sm:grid-cols-4">
        <Dato label="Cliente"><Link href={`/admin/clientes/${s.cliente_id}`} className="font-semibold text-brand-800 hover:underline">{s.cliente}</Link></Dato>
        <Dato label="Teléfono">{s.telefono}</Dato>
        <Dato label="Póliza">{s.poliza ? <Link href={`/admin/polizas/${s.poliza_id}`} className="hover:underline">{s.compania} · {s.poliza}</Link> : null}</Dato>
        <Dato label="Vehículo / dominio">{[s.riesgo, s.dominio].filter(Boolean).join(" · ")}</Dato>
        <div className="sm:col-span-2"><Dato label="Cobertura de la póliza">{s.cobertura}</Dato></div>
        <Dato label="Estado"><Badge tono={s.estado === "cerrado" ? "gris" : s.estado === "en_gestion" ? "ambar" : "rojo"}>{ESTADOS_SINIESTRO[s.estado] ?? s.estado}</Badge></Dato>
        <Dato label="Cargado el">{fecha(s.creado)}</Dato>
      </div>

      <Card title="Datos del siniestro">
        <form action={actualizarSiniestro} className="space-y-4">
          <input type="hidden" name="id" value={sid} />
          <SiniestroCampos v={s} />
          <SubmitButton>Guardar cambios</SubmitButton>
        </form>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Seguimiento">
          <form action={agregarNotaSiniestro} className="mb-4 space-y-3">
            <input type="hidden" name="id" value={sid} />
            <TextArea label="Agregar novedad" name="texto" rows={3} />
            <SubmitButton variant="gold" small>Agregar al seguimiento</SubmitButton>
          </form>
          {notas.length === 0 ? <p className="text-sm text-ink-soft">Todavía no hay novedades.</p> : (
            <ol className="space-y-3 border-l-2 border-line pl-4">
              {notas.map((n) => (
                <li key={n.id} className="text-sm">
                  <p className="text-xs text-ink-soft">{fecha(n.creado)}{n.autor ? ` · ${n.autor}` : ""}</p>
                  <p className="whitespace-pre-line">{n.texto}</p>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card title="Archivos del siniestro">
          {docs.length === 0 ? <p className="mb-4 text-sm text-ink-soft">Sin archivos. Podés subir fotos, la denuncia, presupuestos, etc.</p> : (
            <ul className="mb-4 divide-y divide-line">
              {docs.map((d) => (
                <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-sm">
                  <span><a href={`/api/documento/${d.id}`} target="_blank" className="font-semibold text-brand-800 hover:underline">{d.nombre}</a> <span className="text-xs text-ink-soft">({Math.ceil(d.tamano / 1024)} KB · {fecha(d.creado)})</span></span>
                  <form action={eliminarDocumento}><input type="hidden" name="id" value={d.id} /><input type="hidden" name="volver" value={volver} /><SubmitButton variant="danger" small confirmar="¿Eliminar este archivo?">Eliminar</SubmitButton></form>
                </li>
              ))}
            </ul>
          )}
          <form action={subirArchivoSiniestro} className="space-y-3 border-t border-line pt-4">
            <input type="hidden" name="id" value={sid} />
            <label className="block text-sm font-semibold text-brand-900">Archivo (PDF o imagen, máx. 4 MB)
              <input type="file" name="archivo" required accept=".pdf,.jpg,.jpeg,.png,.webp" className={`${inputCls} file:mr-3 file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-700`} />
            </label>
            <SubmitButton small pendiente="Subiendo…">Subir archivo</SubmitButton>
          </form>
        </Card>
      </div>

      <Card title="Zona de peligro" className="mt-6">
        <form action={eliminarSiniestro} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="id" value={sid} />
          <label className="text-sm font-semibold text-brand-900">Escribí ELIMINAR para confirmar
            <input name="confirmar" autoComplete="off" className="mt-1.5 block w-56 border border-line px-3 py-2.5 text-sm" />
          </label>
          <SubmitButton variant="danger" confirmar="¿Eliminar este siniestro con todo su seguimiento y archivos?" pendiente="Eliminando…">Eliminar siniestro</SubmitButton>
        </form>
      </Card>
    </>
  );
}
