import { FechasConstancia } from "@/components/panel/FechasConstancia";
import { Card, Field, Flash, LinkBtn, PageHead, TextArea } from "@/components/panel/ui";
import { guardarConstancia } from "@/lib/actions/admin";
import { dato, type Row } from "@/lib/api";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> };

export default async function Constancia({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const { p, advertencias, productor, hoy } = await dato<{ p: Row; advertencias: string; productor: string; hoy: string }>("constanciaDatos", { id });
  const boton = "inline-flex min-h-12 items-center justify-center gap-2 px-5 py-3 text-base font-semibold transition";

  return (
    <>
      <PageHead title="Constancia de cobertura" sub={`Póliza ${p.numero} · ${p.compania} · ${p.nombre}`} actions={<LinkBtn href={`/admin/polizas/${id}`}>Volver a la póliza</LinkBtn>} />
      <Flash sp={sp} />
      <div className="mb-6 border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Se completa con los datos de la póliza y <strong>podés editar todo</strong>. La fecha y el vencimiento del cartel gris salen de la vigencia. Es una constancia de Grupo Bertona: no reemplaza al certificado de la compañía. Cargá solo datos que figuren en la póliza real.
      </div>
      <form action="/api/constancia" method="get" target="_blank" className="space-y-6">
        <input type="hidden" name="poliza_id" value={id} />
        <Card title="Asegurado">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre y apellido" name="asegurado" defaultValue={p.nombre} required />
            <Field label="DNI" name="dni" defaultValue={p.documento} />
            <Field label="Domicilio" name="domicilio" defaultValue={p.direccion} />
            <Field label="Localidad" name="localidad" defaultValue={p.localidad} />
          </div>
        </Card>
        <Card title="Fecha y vencimiento (cartel gris)">
          <FechasConstancia desde={p.desde ?? ""} hasta={p.hasta ?? ""} hoy={hoy} />
        </Card>
        <Card title="Póliza">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Compañía aseguradora" name="compania" defaultValue={p.compania} required />
            <Field label="N° de póliza" name="poliza" defaultValue={p.numero} required />
            <Field label="Ramo" name="ramo" defaultValue={p.ramo} />
            <Field label="Suma asegurada" name="suma" defaultValue={p.suma ? p.suma.toLocaleString("es-AR", { style: "currency", currency: "ARS" }) : ""} />
            <Field label="N° de constancia (opcional)" name="numero" />
            <Field label="Productor asesor" name="productor" defaultValue={productor} />
          </div>
        </Card>
        <Card title="Vehículo o bien asegurado">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Vehículo / bien" name="vehiculo" defaultValue={p.riesgo} className="lg:col-span-2" />
            <Field label="Patente" name="patente" defaultValue={p.dominio} />
            <Field label="Uso" name="uso" placeholder="Ej: Particular" />
            <Field label="Año" name="anio" />
            <Field label="Motor N°" name="motor" />
            <Field label="Chasis N°" name="chasis" />
          </div>
        </Card>
        <Card title="Cobertura">
          <div className="grid gap-4">
            <Field label="Tipo de cobertura" name="cobertura" defaultValue={p.cobertura} />
            <TextArea label="Detalle de coberturas (una por línea, con el formato «Concepto: valor»)" name="detalle" rows={6} />
            <p className="-mt-2 text-xs text-ink-soft">Ejemplo: «Incendio total: SI» o «Límite R. Civil: $ 208.000.000,00». Se imprime tal cual lo escribas.</p>
          </div>
        </Card>
        <Card title="Advertencias al asegurado">
          <TextArea label="Texto que se imprime al pie (editable)" name="advertencias" defaultValue={advertencias} rows={6} />
        </Card>
        <div className="flex flex-wrap gap-3">
          <button type="submit" className={`${boton} bg-brand-900 text-white hover:bg-brand-700`}>Ver / descargar PDF</button>
          <button type="submit" formAction={guardarConstancia} formMethod="post" formTarget="_self" className={`${boton} bg-accent-500 text-brand-900 hover:bg-accent-400`}>Guardar para el cliente</button>
        </div>
        <p className="text-xs text-ink-soft">«Guardar para el cliente» agrega la constancia a los papeles de la póliza: el cliente la ve y la descarga desde su cuenta.</p>
      </form>
    </>
  );
}
