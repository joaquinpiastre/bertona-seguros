import Link from "next/link";
import { SubmitButton } from "@/components/panel/Cliente";
import { Badge, Card, Flash, PageHead, Tabla, Td, Th, btnGhost, btnPrimary, inputCls } from "@/components/panel/ui";
import { BotonTexto } from "@/components/sorteo/admin/BotonTexto";
import type { Row } from "@/lib/api";
import { confirmarParticipante, eliminarParticipante } from "@/lib/sorteo/acciones";
import { datoSorteo } from "@/lib/sorteo/api";
import { VEHICULO, VEHICULOS, VENCIMIENTO, VENCIMIENTOS } from "@/lib/sorteo/comun";

type SP = Promise<Record<string, string | undefined>>;
type Datos = { sorteos: Row[]; sorteo: number | null; total: number; pagina: number; paginas: number; filas: Row[]; origenes: string[] };

const FILTROS = ["sorteo", "q", "estado", "origen", "vehiculo", "venc", "alertas"] as const;
const sel = `${inputCls} !mt-1`;

export default async function Participantes({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const d = await datoSorteo<Datos>("participantes", Object.fromEntries([...FILTROS, "pagina"].map((k) => [k, sp[k]?.trim()])));
  const filtro: Record<string, string> = {};
  for (const k of FILTROS) if (sp[k]?.trim()) filtro[k] = sp[k]!.trim();
  if (d.sorteo !== null) filtro.sorteo = String(d.sorteo);
  const qs = new URLSearchParams(filtro).toString();
  const volver = `/admin/sorteo/participantes?${new URLSearchParams({ ...filtro, ...(d.pagina > 1 && { pagina: String(d.pagina) }) })}`;
  const pagina = (n: number) => `/admin/sorteo/participantes?${new URLSearchParams({ ...filtro, pagina: String(n) })}`;
  const desde = (d.pagina - 1) * 100 + 1;
  const unico = d.total === 1 && /^\s*bs[\s-]?\d{4,6}\s*$/i.test(sp.q ?? "") ? d.filas[0] : null;

  return (
    <>
      <PageHead
        title="Participantes"
        sub="Cuando llega un WhatsApp con el código, buscalo acá y tocá «Confirmar»."
        actions={
          d.sorteo !== null && d.total > 0 ? (
            <>
              <a href={`/api/sorteo/exportar?${qs}`} className={btnPrimary}>Exportar a Excel</a>
              <a href={`/api/sorteo/exportar?${qs}&formato=csv`} className={btnGhost}>CSV</a>
            </>
          ) : null
        }
      />
      <Flash sp={sp} />

      <form method="get" className="mb-4 grid gap-3 border border-line bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs font-semibold text-ink-soft sm:col-span-2">
          Buscar por código, nombre, WhatsApp o localidad
          <input name="q" defaultValue={sp.q} autoFocus placeholder="Ej: BS-4821" className={sel} />
        </label>
        <label className="text-xs font-semibold text-ink-soft">
          Sorteo
          <select name="sorteo" defaultValue={d.sorteo === null ? "" : String(d.sorteo)} className={sel}>
            {d.sorteos.map((s) => <option key={s.id} value={s.id}>{s.titulo}{s.activo ? " (activo)" : ""}</option>)}
            <option value="0">Todos los sorteos</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-ink-soft">
          Estado
          <select name="estado" defaultValue={sp.estado ?? ""} className={sel}>
            <option value="">Todos</option><option value="pendiente">Pendientes</option><option value="confirmado">Confirmados</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-ink-soft">
          Origen (QR)
          <select name="origen" defaultValue={sp.origen ?? ""} className={sel}>
            <option value="">Todos</option>
            {d.origenes.map((o) => <option key={o} value={o}>{o}</option>)}
            <option value="-">Sin origen (enlace directo)</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-ink-soft">
          Vehículo
          <select name="vehiculo" defaultValue={sp.vehiculo ?? ""} className={sel}>
            <option value="">Todos</option>
            {VEHICULOS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-ink-soft">
          Vencimiento del seguro
          <select name="venc" defaultValue={sp.venc ?? ""} className={sel}>
            <option value="">Todos</option>
            {VENCIMIENTOS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            <option value="-">No lo indicó</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-ink-soft">
          Alertas de tormenta
          <select name="alertas" defaultValue={sp.alertas ?? ""} className={sel}>
            <option value="">Todos</option><option value="1">Solo los que las pidieron</option>
          </select>
        </label>
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
          <button className={btnPrimary}>Buscar</button>
          <Link href={`/admin/sorteo/participantes${d.sorteo ? `?sorteo=${d.sorteo}` : ""}`} className={btnGhost}>Limpiar filtros</Link>
        </div>
      </form>

      {unico && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4 border-l-4 border-brand-700 bg-brand-50 p-4">
          <div>
            <p className="text-sm text-ink-soft">Código <strong className="text-brand-900">{unico.codigo}</strong> · {unico.sorteo_titulo}</p>
            <p className="text-lg font-semibold text-brand-900">{unico.nombre} <span className="font-normal text-ink-soft">· {unico.localidad}</span></p>
            <p className="text-sm text-ink-soft">WhatsApp registrado: <strong className="text-brand-900">{unico.wa_visible}</strong>. Revisá que el mensaje venga de ese número.</p>
          </div>
          {unico.estado === "confirmado" ? <Badge tono="verde">Ya está confirmado</Badge> : (
            <form action={confirmarParticipante}>
              <input type="hidden" name="id" value={unico.id} /><input type="hidden" name="valor" value="1" /><input type="hidden" name="volver" value={volver} />
              <SubmitButton variant="gold" pendiente="Confirmando…">Confirmar {unico.codigo}</SubmitButton>
            </form>
          )}
        </div>
      )}

      <Card>
        <div className="-m-5">
          <Tabla
            head={<><Th>Código</Th><Th>Participante</Th><Th>Vehículo</Th><Th>Registro</Th><Th /></>}
            vacio={d.sorteo === null ? "Todavía no hay sorteos cargados." : "No hay participantes con esos filtros."}
          >
            {d.filas.map((p) => (
              <tr key={p.id}>
                <Td>
                  <span className="whitespace-nowrap font-semibold tracking-wide text-brand-900">{p.codigo}</span>
                  {d.sorteo === 0 && <span className="block text-xs text-ink-soft">{p.sorteo_titulo}</span>}
                  <span className="mt-1 flex flex-wrap gap-1">
                    {p.estado === "confirmado" ? <Badge tono="verde">Confirmado</Badge> : <Badge tono="ambar">Pendiente</Badge>}
                    {p.sorteado && <Badge tono="azul">Salió sorteado</Badge>}
                  </span>
                  {p.estado === "confirmado" && p.confirmado_en && <span className="mt-1 block text-[11px] text-ink-soft">{p.confirmado_en}{p.confirmado_por ? ` · ${p.confirmado_por}` : ""}</span>}
                </Td>
                <Td>
                  <span className="font-semibold text-brand-900">{p.nombre}</span>
                  <span className="block whitespace-nowrap text-sm text-ink">{p.wa_visible}</span>
                  <span className="block text-xs text-ink-soft">{p.localidad}{p.alertas_tormenta ? " · quiere alertas de tormenta" : ""}</span>
                </Td>
                <Td>
                  {VEHICULO[p.vehiculo] ?? p.vehiculo}
                  <span className="block text-xs text-ink-soft">
                    {p.vencimiento_seguro === "sin_seguro" ? "Sin seguro" : p.vencimiento_seguro ? `Vence en ${(VENCIMIENTO[p.vencimiento_seguro] ?? p.vencimiento_seguro).toLowerCase()}` : "Vencimiento: no indicó"}
                  </span>
                </Td>
                <Td>
                  <span className="whitespace-nowrap">{p.creado}</span>
                  <span className="block text-xs text-ink-soft">{p.origen ? `QR: ${p.origen}` : "Directo (sin QR)"}</span>
                </Td>
                <Td right>
                  <div className="flex flex-col items-end gap-1.5">
                    <form action={confirmarParticipante}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="valor" value={p.estado === "confirmado" ? "0" : "1"} />
                      <input type="hidden" name="volver" value={volver} />
                      {p.estado === "confirmado" ? (
                        <SubmitButton small variant="ghost" pendiente="…" confirmar={`¿Desmarcar ${p.codigo}? Vuelve a quedar pendiente y no entra en el sorteo.`}>Desmarcar</SubmitButton>
                      ) : (
                        <SubmitButton small variant="gold" pendiente="…">Confirmar</SubmitButton>
                      )}
                    </form>
                    <a href={`https://wa.me/${p.wa}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center whitespace-nowrap bg-[#1fa855] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#188a45]">Abrir WhatsApp</a>
                    {!p.sorteado && (
                      <form action={eliminarParticipante}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="volver" value={volver} />
                        <BotonTexto className="text-red-700" confirmar={`¿Eliminar el registro ${p.codigo} (${p.nombre})? No se puede deshacer.`}>Eliminar</BotonTexto>
                      </form>
                    )}
                  </div>
                </Td>
              </tr>
            ))}
          </Tabla>
        </div>
      </Card>

      {d.total > 0 && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-ink-soft">
          <p>Mostrando {desde.toLocaleString("es-AR")}–{(desde + d.filas.length - 1).toLocaleString("es-AR")} de {d.total.toLocaleString("es-AR")}</p>
          {d.paginas > 1 && (
            <div className="flex gap-2">
              {d.pagina > 1 && <Link href={pagina(d.pagina - 1)} className={`${btnGhost} !min-h-10 !py-2`}>← Anteriores</Link>}
              {d.pagina < d.paginas && <Link href={pagina(d.pagina + 1)} className={`${btnGhost} !min-h-10 !py-2`}>Siguientes →</Link>}
            </div>
          )}
        </div>
      )}
    </>
  );
}
