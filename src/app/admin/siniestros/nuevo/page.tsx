import { SiniestroCampos } from "@/components/panel/SiniestroCampos";
import { SubmitButton } from "@/components/panel/Cliente";
import { Card, Flash, LinkBtn, PageHead, SelectField, btnPrimary } from "@/components/panel/ui";
import { crearSiniestro } from "@/lib/actions/admin";
import { dato, type Row } from "@/lib/api";

export default async function NuevoSiniestro({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string; cliente?: string }> }) {
  const sp = await searchParams;
  const { clienteId, clientes, polizas } = await dato<{ clienteId: number; clientes: Row[]; polizas: Row[] }>("siniestroNuevo", { cliente: sp.cliente });
  return (
    <>
      <PageHead title="Nuevo siniestro" sub="Cargá lo que se sepa ahora: después se puede seguir completando" actions={<LinkBtn href="/admin/siniestros">Volver</LinkBtn>} />
      <Flash sp={sp} />
      <Card title="1. Cliente" className="mb-6">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <SelectField className="min-w-72 flex-1" label="Cliente" name="cliente" defaultValue={clienteId || ""} vacio="Elegí un cliente…" options={clientes.map((c) => [String(c.id), `${c.nombre}${c.documento ? ` (${c.documento})` : ""}`])} />
          <button className={btnPrimary}>Continuar</button>
        </form>
      </Card>
      {clienteId > 0 && (
        <form action={crearSiniestro} className="space-y-6">
          <input type="hidden" name="cliente_id" value={clienteId} />
          <Card title="2. Póliza afectada">
            <SelectField label="Póliza" name="poliza_id" vacio="Sin póliza asociada" options={polizas.map((p) => [String(p.id), `${p.compania} · ${p.numero}${p.dominio ? ` · ${p.dominio}` : p.riesgo ? ` · ${p.riesgo}` : ""}`])} className="max-w-xl" />
          </Card>
          <Card title="3. Datos del siniestro"><SiniestroCampos /></Card>
          <SubmitButton variant="gold" pendiente="Guardando…">Cargar siniestro</SubmitButton>
        </form>
      )}
    </>
  );
}
