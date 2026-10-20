import { SubmitButton } from "@/components/panel/Cliente";
import { dato, type Row } from "@/lib/api";
import { Card, Field, Flash, LinkBtn, PageHead, SelectField, TextArea } from "@/components/panel/ui";
import { crearPoliza } from "@/lib/actions/admin";
import { ACTUALIZACION, COBROS, ESTADOS_POLIZA, PERIODICIDAD, RAMOS_LISTA, hoy } from "@/lib/format";

export default async function NuevaPoliza({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string; cliente?: string }> }) {
  const sp = await searchParams;
  const { clientes } = await dato<{ clientes: Row[] }>("polizaNueva");
  const h = hoy();
  return (
    <>
      <PageHead title="Nueva póliza" sub="Al guardar se generan las cuotas a cobrar y, si se actualiza cada tanto, se abre el primer certificado" actions={<LinkBtn href="/admin/polizas">Volver</LinkBtn>} />
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
            <Field label="Cobertura" name="cobertura" placeholder="Ej: Todo riesgo con franquicia" className="lg:col-span-2" />
            <Field label="Suma asegurada (ARS)" name="suma_asegurada" />
            <Field label="Vigencia desde" name="vigencia_desde" type="date" />
            <Field label="Vigencia hasta" name="vigencia_hasta" type="date" />
            <SelectField label="Estado" name="estado" defaultValue="vigente" options={Object.entries(ESTADOS_POLIZA)} />
            <TextArea label="Notas internas" name="notas" className="sm:col-span-2 lg:col-span-3" />
          </div>
        </Card>
        <Card title="Cobro y actualización">
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField label="¿Quién cobra la póliza?" name="cobro" defaultValue="oficina" options={Object.entries(COBROS)}
              hint="Con tarjeta de crédito o débito la cobra la compañía: no se generan cuotas y solo se gestiona el certificado." />
            <SelectField label="La póliza se actualiza cada" name="actualizacion_meses" defaultValue="4" options={Object.entries(ACTUALIZACION)}
              hint="En cada actualización hay que cargar un certificado nuevo. El sistema avisa antes de que venza el anterior." />
          </div>
        </Card>
        <Card title="Plan de cuotas (solo si las cobramos nosotros)">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SelectField label="Las cuotas vencen cada" name="periodicidad" defaultValue="mensual" options={Object.entries(PERIODICIDAD).map(([v, p]) => [v, p.label])} />
            <Field label="Cantidad de cuotas" name="cuotas_cant" type="number" min="1" max="60" defaultValue={4} hint="Las del primer período (ej.: 4 meses = 4 cuotas mensuales)." />
            <Field label="Importe de cada cuota (ARS)" name="importe_cuota" placeholder="33000" />
            <Field label="Vencimiento de la 1.ª cuota" name="primer_vencimiento" type="date" defaultValue={h} />
          </div>
        </Card>
        <Card title="Documentos (opcional, se pueden cargar después)">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Póliza (PDF o imagen, máx. 4 MB)" name="archivo_poliza" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" />
            <Field label="Certificado de cobertura del primer período (PDF o imagen, máx. 4 MB)" name="archivo_certificado" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" />
          </div>
        </Card>
        <SubmitButton variant="gold" pendiente="Creando póliza…">Crear póliza</SubmitButton>
      </form>
    </>
  );
}
