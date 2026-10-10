import { SubmitButton } from "@/components/panel/Cliente";
import { Card, Field, Flash, LinkBtn, PageHead, SelectField, TextArea } from "@/components/panel/ui";
import { crearPoliza } from "@/lib/actions/admin";
import { q } from "@/lib/db";
import { ESTADOS_POLIZA, PERIODICIDAD, RAMOS_LISTA, hoy } from "@/lib/format";

export default async function NuevaPoliza({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string; cliente?: string }> }) {
  const sp = await searchParams;
  const clientes = await q("SELECT id, nombre, documento FROM clientes WHERE activo ORDER BY nombre");
  const h = hoy();
  return (
    <>
      <PageHead title="Nueva póliza" sub="Al guardar se generan automáticamente las cuotas a cobrar" actions={<LinkBtn href="/admin/polizas">Volver</LinkBtn>} />
      <Flash sp={sp} />
      <form action={crearPoliza} className="space-y-6">
        <Card title="Datos de la póliza">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SelectField className="lg:col-span-3" label="Cliente" name="cliente_id" required defaultValue={sp.cliente} vacio="Elegí un cliente…" options={clientes.map((c) => [String(c.id), `${c.nombre}${c.documento ? ` (${c.documento})` : ""}`])} />
            <SelectField label="Ramo" name="ramo" required defaultValue="Autos" options={RAMOS_LISTA.map((r) => [r, r])} />
            <Field label="Compañía aseguradora" name="compania" required placeholder="Ej: Meridional Seguros" />
            <Field label="N° de póliza" name="numero" required />
            <Field label="Riesgo / bien asegurado" name="riesgo" placeholder="Ej: JEEP A.F.F" className="lg:col-span-2" />
            <Field label="Dominio (patente)" name="dominio" placeholder="Solo vehículos" />
            <Field label="Suma asegurada (ARS)" name="suma_asegurada" />
            <Field label="Vigencia desde" name="vigencia_desde" type="date" />
            <Field label="Vigencia hasta" name="vigencia_hasta" type="date" />
            <SelectField label="Estado" name="estado" defaultValue="vigente" options={Object.entries(ESTADOS_POLIZA)} />
            <TextArea label="Notas internas" name="notas" className="sm:col-span-2 lg:col-span-3" />
          </div>
        </Card>
        <Card title="Plan de cuotas">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SelectField label="Periodicidad" name="periodicidad" defaultValue="mensual" options={Object.entries(PERIODICIDAD).map(([v, p]) => [v, p.label])} />
            <Field label="Cantidad de cuotas" name="cuotas_cant" type="number" min="1" max="60" defaultValue={12} required />
            <Field label="Importe de cada cuota (ARS)" name="importe_cuota" required placeholder="33000" />
            <Field label="Vencimiento de la 1.ª cuota" name="primer_vencimiento" type="date" defaultValue={h} required />
          </div>
        </Card>
        <Card title="Documentos (opcional, se pueden cargar después)">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Póliza (PDF o imagen, máx. 4 MB)" name="archivo_poliza" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" />
            <Field label="Certificado de cobertura (PDF o imagen, máx. 4 MB)" name="archivo_certificado" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" />
          </div>
        </Card>
        <SubmitButton variant="gold" pendiente="Creando póliza…">Crear póliza y generar cuotas</SubmitButton>
      </form>
    </>
  );
}
