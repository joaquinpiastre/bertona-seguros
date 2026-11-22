import Link from "next/link";
import { SubmitButton } from "@/components/panel/Cliente";
import { Card, Flash, LinkBtn, PageHead, Stat, Tabla, Td, Th, btnGhost } from "@/components/panel/ui";
import { EstadoBadges, periodo } from "@/components/sorteo/admin/Comun";
import { Barras, Leyenda, PorDia } from "@/components/sorteo/admin/Graficos";
import type { Row } from "@/lib/api";
import { activarSorteo } from "@/lib/sorteo/acciones";
import { datoSorteo } from "@/lib/sorteo/api";
import { VEHICULO, VENCIMIENTO, fechaSorteoTexto } from "@/lib/sorteo/comun";

type SP = Promise<{ ok?: string; error?: string; sorteo?: string }>;
type Metricas = {
  total: number; confirmados: number; alertas: number;
  origenes: { origen: string; total: number; confirmados: number }[];
  dias: { dia: string; total: number; confirmados: number }[];
  vehiculos: { clave: string; total: number }[];
  vencimientos: { clave: string; total: number }[];
};

export default async function ResumenSorteo({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { sorteos, elegido, metricas } = await datoSorteo<{ sorteos: Row[]; elegido: Row | null; metricas: Metricas | null }>("resumen", { sorteo: sp.sorteo });
  const acciones = (
    <>
      <a href="/sorteo" target="_blank" rel="noopener noreferrer" className={btnGhost}>Ver la página pública</a>
      <LinkBtn variant="gold" href="/admin/sorteo/nuevo">Nuevo sorteo</LinkBtn>
    </>
  );

  if (!elegido || !metricas) {
    return (
      <>
        <PageHead title="Sorteo Speedway" sub="Inscripción por QR, confirmación por WhatsApp y sorteo en vivo" actions={acciones} />
        <Flash sp={sp} />
        <Card>
          <div className="py-6 text-center">
            <p className="text-lg font-semibold text-brand-900">Todavía no hay ningún sorteo cargado.</p>
            <p className="mt-1 text-ink-soft">Creá el primero: título, premio, fechas y el WhatsApp que recibe las confirmaciones.</p>
            <div className="mt-5"><LinkBtn variant="gold" href="/admin/sorteo/nuevo">Crear el primer sorteo</LinkBtn></div>
          </div>
        </Card>
      </>
    );
  }

  const m = metricas;
  const pendientes = m.total - m.confirmados;
  const porcentaje = m.total ? `${Math.round((m.confirmados / m.total) * 100)}%` : "—";
  const volver = `/admin/sorteo?sorteo=${elegido.id}`;

  return (
    <>
      <PageHead title="Sorteo Speedway" sub="Inscripción por QR, confirmación por WhatsApp y sorteo en vivo" actions={acciones} />
      <Flash sp={sp} />

      {sorteos.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-2" aria-label="Elegir sorteo">
          {sorteos.map((s) => (
            <Link key={s.id} href={`/admin/sorteo?sorteo=${s.id}`} aria-current={s.id === elegido.id ? "true" : undefined}
              className={`border px-3 py-2 text-sm font-semibold ${s.id === elegido.id ? "border-brand-900 bg-brand-900 text-white" : "border-line bg-white text-brand-800 hover:border-brand-500"}`}>
              {s.titulo}{s.activo ? " · activo" : ""}
            </Link>
          ))}
        </div>
      )}

      <Card className="mb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl text-brand-900">{elegido.titulo}</h2>
            <div className="mt-1.5"><EstadoBadges s={elegido} /></div>
            <p className="mt-2 text-sm text-ink-soft">
              Inscripción: {periodo(elegido)}
              {elegido.fecha_sorteo ? <> · Sorteo: <span className="inline-block first-letter:uppercase">{fechaSorteoTexto(elegido.fecha_sorteo)}</span></> : null}
              {elegido.premio ? <> · Premio: {elegido.premio}</> : null}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <LinkBtn sm href={`/admin/sorteo/${elegido.id}`}>Editar configuración</LinkBtn>
            <form action={activarSorteo}>
              <input type="hidden" name="id" value={elegido.id} />
              <input type="hidden" name="valor" value={elegido.activo ? "0" : "1"} />
              <input type="hidden" name="volver" value={volver} />
              {elegido.activo ? (
                <SubmitButton small variant="ghost" pendiente="…" confirmar="¿Desactivar el sorteo? La página del QR va a mostrar «Próximamente» y no se podrá anotar nadie.">Desactivar</SubmitButton>
              ) : (
                <SubmitButton small variant="gold" pendiente="…" confirmar="¿Activar este sorteo? Si hay otro activo, se desactiva.">Activar</SubmitButton>
              )}
            </form>
          </div>
        </div>
      </Card>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Registrados" value={m.total.toLocaleString("es-AR")} />
        <Stat label="Confirmados" value={m.confirmados.toLocaleString("es-AR")} sub={`${pendientes.toLocaleString("es-AR")} pendientes de confirmar`} tono="verde" />
        <Stat label="% de confirmación" value={porcentaje} sub="Confirmados sobre registrados" />
        <Stat label="Alertas de tormenta" value={m.alertas.toLocaleString("es-AR")} sub="Pidieron alertas por WhatsApp" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Registros por origen (QR)" actions={<Leyenda />}>
          <Barras apiladas vacio="Todavía no hay registros."
            filas={m.origenes.map((o) => ({ etiqueta: o.origen || "Directo (sin QR)", total: o.total, confirmados: o.confirmados }))} />
          <p className="mt-4 text-xs text-ink-soft">El origen sale del QR que escanearon (por ejemplo <code>?src=cartel-pista</code>). Los QR se generan en «Códigos QR».</p>
        </Card>
        <Card title="Registros por día" actions={<Leyenda />}>
          <PorDia dias={m.dias} />
        </Card>
        <Card title="Vehículo">
          <Barras filas={m.vehiculos.map((v) => ({ etiqueta: VEHICULO[v.clave] ?? v.clave, total: v.total }))} vacio="Todavía no hay registros." />
        </Card>
        <Card title="Mes de vencimiento del seguro">
          <Barras filas={m.vencimientos.map((v) => ({ etiqueta: v.clave ? VENCIMIENTO[v.clave] ?? v.clave : "No lo indicó", total: v.total }))} vacio="Todavía no hay registros." />
        </Card>
      </div>

      <Card title="Todos los sorteos" className="mt-4">
        <div className="-m-5">
          <Tabla head={<><Th>Sorteo</Th><Th>Inscripción</Th><Th>Fecha del sorteo</Th><Th right>Registrados</Th><Th right>Confirmados</Th><Th /></>}>
            {sorteos.map((s) => (
              <tr key={s.id} className={s.id === elegido.id ? "bg-brand-50/60" : ""}>
                <Td>
                  <Link href={`/admin/sorteo?sorteo=${s.id}`} className="font-semibold text-brand-800 hover:underline">{s.titulo}</Link>
                  <div className="mt-1"><EstadoBadges s={s} /></div>
                </Td>
                <Td>{periodo(s)}</Td>
                <Td><span className="inline-block first-letter:uppercase">{fechaSorteoTexto(s.fecha_sorteo) || "—"}</span></Td>
                <Td right>{s.registrados}</Td>
                <Td right>{s.confirmados}</Td>
                <Td right>
                  <div className="flex flex-wrap justify-end gap-3 text-xs font-semibold">
                    <Link href={`/admin/sorteo/${s.id}`} className="text-brand-700 hover:underline">Editar</Link>
                    <Link href={`/admin/sorteo/participantes?sorteo=${s.id}`} className="text-brand-700 hover:underline">Participantes</Link>
                  </div>
                </Td>
              </tr>
            ))}
          </Tabla>
        </div>
      </Card>
    </>
  );
}
