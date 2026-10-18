import Link from "next/link";
import { dato, type Row } from "@/lib/api";
import { Badge, Card, Flash, LinkBtn, PageHead, Tabla, Td, Th, btnGhost, inputCls } from "@/components/panel/ui";
import { money } from "@/lib/format";

type SP = Promise<{ ok?: string; error?: string; q?: string; ver?: string; agencia?: string }>;

export default async function Clientes({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { filas } = await dato<{ filas: Row[] }>("clientes", { q: sp.q, ver: sp.ver, agencia: sp.agencia });
  return (
    <>
      <PageHead title="Clientes" sub="Socios y asegurados" actions={<LinkBtn variant="gold" href="/admin/clientes/nuevo">Nuevo cliente</LinkBtn>} />
      <Flash sp={sp} />
      <form className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={sp.q} placeholder="Nombre, DNI/CUIT, teléfono, póliza o dominio" className={`${inputCls} !mt-0 min-w-72 flex-1 sm:max-w-md`} aria-label="Buscar clientes" />
        <button className={btnGhost}>Buscar</button>
        <Link href={sp.ver === "inactivos" ? "/admin/clientes" : "/admin/clientes?ver=inactivos"} className={btnGhost}>{sp.ver === "inactivos" ? "Ver activos" : "Ver inactivos"}</Link>
        <Link href={sp.agencia ? "/admin/clientes" : "/admin/clientes?agencia=1"} className={btnGhost}>{sp.agencia ? "Ver todos" : "Solo agencias"}</Link>
      </form>
      <Card>
        <div className="-m-5">
          <Tabla head={<><Th>Cliente</Th><Th>Contacto</Th><Th>Pólizas vigentes</Th><Th right>Deuda vencida</Th></>} vacio="No se encontraron clientes.">
            {filas.map((c) => (
              <tr key={c.id}>
                <Td><Link href={`/admin/clientes/${c.id}`} className="font-semibold text-brand-800 hover:underline">{c.nombre}</Link>{c.es_agencia && <> <Badge tono="azul">Agencia</Badge></>}<span className="block text-xs text-ink-soft">{c.documento || "Sin documento"}</span></Td>
                <Td>{c.telefono || "—"}<span className="block text-xs text-ink-soft">{c.email}</span></Td>
                <Td>{c.polizas}</Td>
                <Td right>{c.deuda > 0 ? <strong className="text-red-700">{money(c.deuda)}</strong> : <span className="text-ink-soft">—</span>}</Td>
              </tr>
            ))}
          </Tabla>
        </div>
      </Card>
    </>
  );
}
