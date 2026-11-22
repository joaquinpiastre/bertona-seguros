import Link from "next/link";
import { Badge, Card, Flash, LinkBtn, PageHead, Tabla, Td, Th } from "@/components/panel/ui";
import { Sorteador } from "@/components/sorteo/admin/Sorteador";
import type { Row } from "@/lib/api";
import { datoSorteo } from "@/lib/sorteo/api";

type Datos = { sorteos: Row[]; elegido: Row | null; elegibles: number; muestra: string[]; historial: Row[] };

export default async function Sortear({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string; sorteo?: string }> }) {
  const sp = await searchParams;
  const d = await datoSorteo<Datos>("sortear", { sorteo: sp.sorteo });
  return (
    <>
      <PageHead title="Sortear" sub="El ganador sale al azar solo entre los confirmados. Un ganador o suplente no puede volver a salir en el mismo sorteo." />
      <Flash sp={sp} />

      {!d.elegido ? (
        <Card>
          <p className="py-4 text-center text-ink-soft">Primero creá un sorteo.</p>
          <div className="text-center"><LinkBtn variant="gold" href="/admin/sorteo/nuevo">Nuevo sorteo</LinkBtn></div>
        </Card>
      ) : (
        <>
          {d.sorteos.length > 1 && (
            <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold text-ink-soft">Sorteo:</span>
              {d.sorteos.map((s) => (
                <Link key={s.id} href={`/admin/sorteo/sortear?sorteo=${s.id}`} aria-current={s.id === d.elegido!.id ? "true" : undefined}
                  className={`border px-3 py-2 font-semibold ${s.id === d.elegido!.id ? "border-brand-900 bg-brand-900 text-white" : "border-line bg-white text-brand-800 hover:border-brand-500"}`}>
                  {s.titulo}{s.activo ? " · activo" : ""} ({s.confirmados} conf.)
                </Link>
              ))}
            </div>
          )}
          {!d.elegido.activo && (
            <p className="mb-4 border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Ojo: «{d.elegido.titulo}» no es el sorteo activo. Revisá que sea el que querés sortear.
            </p>
          )}
          <Sorteador key={d.elegido.id} sorteo={{ id: d.elegido.id, titulo: d.elegido.titulo, premio: d.elegido.premio }} elegibles={d.elegibles} muestra={d.muestra} />
        </>
      )}

      <Card title="Historial de ganadores" className="mt-6">
        <div className="-m-5">
          <Tabla head={<><Th>Fecha</Th><Th>Resultado</Th><Th>Ganador</Th><Th>Detalle</Th><Th /></>} vacio="Todavía no se sorteó nada.">
            {d.historial.map((g) => (
              <tr key={g.id}>
                <Td>
                  <span className="whitespace-nowrap">{g.fecha}</span>
                  <span className="block text-xs text-ink-soft">{g.sorteo_titulo}</span>
                </Td>
                <Td>
                  {g.tipo === "ganador" ? <Badge tono="verde">Ganador</Badge> : <Badge tono="azul">Suplente</Badge>}
                  <span className="mt-1 block whitespace-nowrap font-semibold tracking-wide text-brand-900">{g.codigo}</span>
                </Td>
                <Td>
                  <span className="font-semibold text-brand-900">{g.nombre}</span>
                  <span className="block whitespace-nowrap text-sm text-ink">{g.wa_visible}</span>
                  <span className="block text-xs text-ink-soft">{g.localidad}</span>
                </Td>
                <Td>
                  <span className="whitespace-nowrap">Entre {g.elegibles} confirmado{g.elegibles === 1 ? "" : "s"}</span>
                  <span className="block text-xs text-ink-soft">Sorteó: {g.sorteado_por ?? "—"}</span>
                </Td>
                <Td right>
                  <a href={`https://wa.me/${g.wa}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center whitespace-nowrap bg-[#1fa855] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#188a45]">Abrir WhatsApp</a>
                </Td>
              </tr>
            ))}
          </Tabla>
        </div>
      </Card>
    </>
  );
}
