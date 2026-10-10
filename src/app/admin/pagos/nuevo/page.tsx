import { CobroForm } from "@/components/panel/Cliente";
import { Card, Flash, PageHead, SelectField, btnPrimary } from "@/components/panel/ui";
import { registrarPago } from "@/lib/actions/admin";
import { q } from "@/lib/db";
import { METODOS, hoy } from "@/lib/format";

type SP = Promise<{ ok?: string; error?: string; cliente?: string; cuota?: string }>;

export default async function NuevoCobro({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const h = hoy();
  let clienteId = Number(sp.cliente) || 0;
  const cuotaId = Number(sp.cuota) || 0;
  if (!clienteId && cuotaId) {
    const r = await q("SELECT p.cliente_id FROM cuotas c JOIN polizas p ON p.id = c.poliza_id WHERE c.id = $1", [cuotaId]);
    clienteId = r[0]?.cliente_id ?? 0;
  }

  const clientes = await q("SELECT id, nombre, documento FROM clientes WHERE activo ORDER BY nombre");
  const cliente = clienteId ? (await q("SELECT id, nombre, documento, telefono FROM clientes WHERE id = $1", [clienteId]))[0] : null;
  const cuotas = cliente
    ? await q(
        `SELECT c.id, c.numero, c.vencimiento::text AS vencimiento, c.importe::float8 AS importe, p.numero AS poliza, p.compania,
                COALESCE(p.dominio,'') AS dominio, p.cuotas_cant AS total
         FROM cuotas c JOIN polizas p ON p.id = c.poliza_id
         WHERE p.cliente_id = $1 AND c.estado = 'pendiente' AND p.estado <> 'anulada'
         ORDER BY c.vencimiento, p.id, c.numero LIMIT 60`,
        [clienteId]
      )
    : [];
  const polizas = cliente ? await q("SELECT id, compania, numero FROM polizas WHERE cliente_id = $1 ORDER BY id DESC", [clienteId]) : [];

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
