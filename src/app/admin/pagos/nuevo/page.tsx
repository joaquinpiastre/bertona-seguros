import { CobroForm } from "@/components/panel/Cliente";
import { dato, type Row } from "@/lib/api";
import { Card, Flash, PageHead, SelectField, btnPrimary } from "@/components/panel/ui";
import { registrarPago } from "@/lib/actions/admin";
import { METODOS, hoy } from "@/lib/format";

type SP = Promise<{ ok?: string; error?: string; cliente?: string; cuota?: string }>;

export default async function NuevoCobro({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const h = hoy();
  const cuotaId = Number(sp.cuota) || 0;
  const { clienteId, clientes, cliente, cuotas, polizas } = await dato<{
    clienteId: number; clientes: Row[]; cliente: Row | null; cuotas: Row[]; polizas: Row[];
  }>("pagosNuevo", { cliente: sp.cliente, cuota: sp.cuota });

  return (
    <>
      <PageHead title="Registrar cobro" sub="Impactá pagos en efectivo, transferencia u otros medios y emití el recibo" />
      <Flash sp={sp} />
      <Card title="1. Cliente" className="mb-6">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <SelectField className="min-w-72 flex-1" label="Cliente" name="cliente" defaultValue={clienteId || ""} vacio="Elegí un cliente…" options={clientes.map((c) => [String(c.id), `${c.nombre}${c.documento ? ` (${c.documento})` : ""}`])} />
          <button className={btnPrimary}>Continuar</button>
        </form>
      </Card>
      {cliente && (
        <Card title={`2. Cobro de ${cliente.nombre}`}>
          {cuotas.length === 0 && <p className="mb-4 text-sm text-ink-soft">Este cliente no tiene cuotas pendientes. Podés registrar un pago a cuenta.</p>}
          <CobroForm
            action={registrarPago}
            clienteId={cliente.id}
            hoy={h}
            metodos={Object.entries(METODOS)}
            polizas={polizas.map((p) => ({ id: p.id, label: `${p.compania} · ${p.numero}` }))}
            cuotaInicial={cuotaId || undefined}
            cuotas={cuotas.map((c) => ({ id: c.id, poliza: c.poliza, compania: c.compania, dominio: c.dominio, numero: c.numero, total: c.total, vencimiento: c.vencimiento, importe: c.importe, vencida: c.vencimiento < h }))}
          />
        </Card>
      )}
    </>
  );
}
