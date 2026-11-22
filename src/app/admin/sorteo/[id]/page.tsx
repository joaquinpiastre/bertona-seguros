import { notFound } from "next/navigation";
import { SubmitButton } from "@/components/panel/Cliente";
import { Card, Flash, LinkBtn, PageHead, btnGhost, inputCls } from "@/components/panel/ui";
import { EstadoBadges } from "@/components/sorteo/admin/Comun";
import { FormSorteo } from "@/components/sorteo/admin/FormSorteo";
import type { Row } from "@/lib/api";
import { activarSorteo, eliminarSorteo } from "@/lib/sorteo/acciones";
import { datoSorteo } from "@/lib/sorteo/api";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> };

export default async function EditarSorteo({ params, searchParams }: Props) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  if (!/^\d+$/.test(id)) notFound();
  const { sorteo: s } = await datoSorteo<{ sorteo: Row }>("sorteo", { id });
  return (
    <>
      <PageHead
        title="Configuración del sorteo"
        sub={s.titulo}
        actions={<><a href="/sorteo" target="_blank" rel="noopener noreferrer" className={btnGhost}>Ver la página pública</a><LinkBtn href={`/admin/sorteo/participantes?sorteo=${s.id}`}>Participantes ({s.registrados})</LinkBtn></>}
      />
      <Flash sp={sp} />

      <Card className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <EstadoBadges s={s} />
            <p className="mt-2 text-sm text-ink-soft">
              {s.activo ? "Es el sorteo que ve la gente al escanear el QR (bertonaseguros.com/sorteo)." : "Ahora no se muestra en la página pública. Activalo cuando quieras que la gente pueda anotarse."}
            </p>
          </div>
          <form action={activarSorteo}>
            <input type="hidden" name="id" value={s.id} />
            <input type="hidden" name="valor" value={s.activo ? "0" : "1"} />
            <input type="hidden" name="volver" value={`/admin/sorteo/${s.id}`} />
            {s.activo ? (
              <SubmitButton variant="ghost" pendiente="…" confirmar="¿Desactivar el sorteo? La página del QR va a mostrar «Próximamente» y no se podrá anotar nadie.">Desactivar</SubmitButton>
            ) : (
              <SubmitButton variant="gold" pendiente="…" confirmar="¿Activar este sorteo? Si hay otro activo, se desactiva.">Activar este sorteo</SubmitButton>
            )}
          </form>
        </div>
      </Card>

      <FormSorteo s={s} />

      <section className="mt-10 border border-red-200 bg-white">
        <header className="border-b border-red-200 px-5 py-3.5"><h2 className="text-lg text-red-800">Zona de peligro</h2></header>
        <div className="p-5">
          {s.sorteados > 0 ? (
            <p className="text-sm text-ink-soft">Este sorteo ya tiene ganadores sorteados: queda guardado con su historial y no se puede eliminar.</p>
          ) : (
            <form action={eliminarSorteo} className="flex flex-wrap items-end gap-3">
              <input type="hidden" name="id" value={s.id} />
              <label className="text-sm font-semibold text-brand-900">
                Para eliminar el sorteo y sus {s.registrados} participantes escribí <strong>ELIMINAR</strong>
                <input name="confirmar" autoComplete="off" className={`${inputCls} max-w-xs`} />
              </label>
              <SubmitButton variant="danger" pendiente="Eliminando…" confirmar="¿Eliminar el sorteo y todos sus participantes? No se puede deshacer.">Eliminar sorteo</SubmitButton>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
