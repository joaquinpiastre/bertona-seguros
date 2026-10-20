import { CobroForm } from "@/components/panel/Cliente";
import { dato, type Row } from "@/lib/api";
import { Card, Flash, PageHead, SelectField, btnPrimary } from "@/components/panel/ui";
import { registrarPago } from "@/lib/actions/admin";
import { hoy } from "@/lib/format";

type SP = Promise<{ ok?: string; error?: string; cliente?: string; cuota?: string; aviso?: string; todas?: string }>;

export default async function NuevoCobro({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const h = hoy();
  const cuotaId = Number(sp.cuota) || 0;
  const { clienteId, clientes, cliente, cuotas, polizas, aviso } = await dato<{
    clienteId: number; clientes: Row[]; cliente: Row | null; cuotas: Row[]; polizas: Row[]; aviso: Row | null;
  }>("pagosNuevo", { cliente: sp.cliente, cuota: sp.cuota, aviso: sp.aviso });

  return (
    <>
      <PageHead title="Registrar cobro" sub="Se registran pagos en efectivo o por transferencia, con el importe de la cuota y la fecha de hoy" />
      <Flash sp={sp} />
      <Card title="1. Cliente" className="mb-6">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <SelectField className="min-w-72 flex-1" label="Cliente" name="cliente" defaultValue={clienteId || ""} vacio="Elegí un cliente…" options={clientes.map((c) => [String(c.id), `${c.nombre}${c.documento ? ` (${c.documento})` : ""}`])} />
          <button className={btnPrimary}>Continuar</button>
        </form>
      </Card>
      {cliente && (
        <Card title={`2. Cobro de ${cliente.nombre}`}>
                    <CobroForm
            action={registrarPago}
            clienteId={cliente.id}
            hoy={h}
            cuotaInicial={cuotaId || undefined}
            cuotasIniciales={
              Array.isArray(aviso?.cuotas) && (aviso!.cuotas as number[]).length
                ? (aviso!.cuotas as number[])
                : sp.todas === "vencidas"
                  ? cuotas.filter((c) => c.vencimiento < h).map((c) => c.id as number)
                  : sp.todas
                    ? cuotas.map((c) => c.id as number)
                    : []
            }
            cuotas={cuotas.map((c) => ({ id: c.id, poliza: c.poliza, compania: c.compania, dominio: c.dominio, numero: c.numero, total: c.total, vencimiento: c.vencimiento, importe: c.importe, vencida: c.vencimiento < h }))}
          />
        </Card>
      )}
    </>
  );
}
