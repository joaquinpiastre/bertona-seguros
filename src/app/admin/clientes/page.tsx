import Link from "next/link";
import { Badge, Card, Flash, LinkBtn, PageHead, Tabla, Td, Th, btnGhost, inputCls } from "@/components/panel/ui";
import { q } from "@/lib/db";
import { money } from "@/lib/format";

type SP = Promise<{ ok?: string; error?: string; q?: string; ver?: string }>;

export default async function Clientes({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const params: unknown[] = [];
  let where = sp.ver === "inactivos" ? "NOT c.activo" : "c.activo";
  if (sp.q) {
    params.push(`%${sp.q}%`);
    where += ` AND (c.nombre ILIKE $1 OR c.documento ILIKE $1 OR c.email ILIKE $1 OR c.telefono ILIKE $1 OR EXISTS (SELECT 1 FROM polizas p WHERE p.cliente_id = c.id AND (p.numero ILIKE $1 OR p.dominio ILIKE $1)))`;
  }
  const filas = await q(
    `SELECT c.id, c.nombre, c.documento, c.telefono, c.email,
            (SELECT COUNT(*)::int FROM polizas p WHERE p.cliente_id = c.id AND p.estado = 'vigente') AS polizas,
            (SELECT COALESCE(SUM(x.importe),0)::float8 FROM cuotas x JOIN polizas p ON p.id = x.poliza_id WHERE p.cliente_id = c.id AND x.estado = 'pendiente' AND x.vencimiento < CURRENT_DATE) AS deuda,
            EXISTS (SELECT 1 FROM usuarios u WHERE u.cliente_id = c.id) AS tiene_acceso
     FROM clientes c WHERE ${where} ORDER BY c.nombre LIMIT 300`,
    params
  );
  return (
    <>
      <PageHead title="Clientes" sub="Socios y asegurados" actions={<LinkBtn variant="gold" href="/admin/clientes/nuevo">Nuevo cliente</LinkBtn>} />
      <Flash sp={sp} />
      <form className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={sp.q} placeholder="Nombre, DNI/CUIT, teléfono, póliza o dominio" className={`${inputCls} !mt-0 min-w-72 flex-1 sm:max-w-md`} aria-label="Buscar clientes" />
        <button className={btnGhost}>Buscar</button>
        <Link href={sp.ver === "inactivos" ? "/admin/clientes" : "/admin/clientes?ver=inactivos"} className={btnGhost}>{sp.ver === "inactivos" ? "Ver activos" : "Ver inactivos"}</Link>
      </form>
      <Card>
        <div className="-m-5">
          <Tabla head={<><Th>Cliente</Th><Th>Contacto</Th><Th>Pólizas vigentes</Th><Th right>Deuda vencida</Th><Th>Portal</Th></>} vacio="No se encontraron clientes.">
            {filas.map((c) => (
              <tr key={c.id}>
                <Td><Link href={`/admin/clientes/${c.id}`} className="font-semibold text-brand-800 hover:underline">{c.nombre}</Link><span className="block text-xs text-ink-soft">{c.documento || "Sin documento"}</span></Td>
                <Td>{c.telefono || "—"}<span className="block text-xs text-ink-soft">{c.email}</span></Td>
                <Td>{c.polizas}</Td>
                <Td right>{c.deuda > 0 ? <strong className="text-red-700">{money(c.deuda)}</strong> : <span className="text-ink-soft">—</span>}</Td>
                <Td>{c.tiene_acceso ? <Badge tono="verde">Con acceso</Badge> : <Badge>Sin acceso</Badge>}</Td>
              </tr>
            ))}
          </Tabla>
        </div>
      </Card>
    </>
  );
}
