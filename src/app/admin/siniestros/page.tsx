import Link from "next/link";
import { Badge, Card, Flash, LinkBtn, PageHead, Tabla, Td, Th, btnGhost, inputCls } from "@/components/panel/ui";
import { dato, type Row } from "@/lib/api";
import { ESTADOS_SINIESTRO, fecha } from "@/lib/format";

const tono = (e: string) => (e === "cerrado" ? "gris" : e === "en_gestion" ? "ambar" : "rojo");

export default async function Siniestros({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string; estado?: string; q?: string }> }) {
  const sp = await searchParams;
  const { filas } = await dato<{ filas: Row[] }>("siniestros", { estado: sp.estado, q: sp.q });
  return (
    <>
      <PageHead title="Siniestros" sub="Casillero de siniestros: cada uno se va completando con información, novedades y archivos" actions={<LinkBtn variant="gold" href="/admin/siniestros/nuevo">Nuevo siniestro</LinkBtn>} />
      <Flash sp={sp} />
      <form className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={sp.q} placeholder="Cliente, póliza, dominio o N° de siniestro" className={`${inputCls} !mt-0 min-w-72 flex-1 sm:max-w-md`} aria-label="Buscar siniestros" />
        <select name="estado" defaultValue={sp.estado ?? ""} className={`${inputCls} !mt-0 w-auto`} aria-label="Estado">
          <option value="">Todos los estados</option>
          {Object.entries(ESTADOS_SINIESTRO).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <button className={btnGhost}>Filtrar</button>
      </form>
      <Card>
        <div className="-m-5">
          <Tabla head={<><Th>Cliente</Th><Th>Tipo</Th><Th>Fecha del hecho</Th><Th>Póliza</Th><Th>N° compañía</Th><Th>Estado</Th></>} vacio="Todavía no hay siniestros cargados.">
            {filas.map((s) => (
              <tr key={s.id}>
                <Td>
                  <Link href={`/admin/siniestros/${s.id}`} className="font-semibold text-brand-800 hover:underline">{s.cliente}</Link>
                  {s.origen === "cliente" && <> <Badge tono="azul">Lo denunció el cliente</Badge></>}
                  <span className="block text-xs text-ink-soft">{s.lugar || "Sin lugar"}</span>
                </Td>
                <Td>{s.tipo || "—"}</Td>
                <Td>{fecha(s.fecha)}</Td>
                <Td>{s.poliza ? <>{s.poliza}<span className="block text-xs text-ink-soft">{s.compania}{s.dominio ? ` · ${s.dominio}` : ""}</span></> : "—"}</Td>
                <Td>{s.nro_compania || "—"}</Td>
                <Td><Badge tono={tono(s.estado)}>{ESTADOS_SINIESTRO[s.estado] ?? s.estado}</Badge></Td>
              </tr>
            ))}
          </Tabla>
        </div>
      </Card>
    </>
  );
}
