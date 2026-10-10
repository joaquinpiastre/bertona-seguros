import { SubmitButton } from "@/components/panel/Cliente";
import { Card, Field, Flash, LinkBtn, PageHead, TextArea } from "@/components/panel/ui";
import { crearCliente } from "@/lib/actions/admin";

export default async function NuevoCliente({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  return (
    <>
      <PageHead title="Nuevo cliente" actions={<LinkBtn href="/admin/clientes">Volver</LinkBtn>} />
      <Flash sp={sp} />
      <Card>
        <form action={crearCliente} className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre y apellido / razón social" name="nombre" required className="sm:col-span-2" />
          <Field label="DNI / CUIT" name="documento" />
          <Field label="Teléfono / WhatsApp" name="telefono" type="tel" />
          <Field label="Email" name="email" type="email" />
          <Field label="Localidad" name="localidad" />
          <Field label="Dirección" name="direccion" className="sm:col-span-2" />
          <TextArea label="Notas internas" name="notas" className="sm:col-span-2" />
          <div className="sm:col-span-2"><SubmitButton variant="gold">Crear cliente</SubmitButton></div>
        </form>
      </Card>
    </>
  );
}
