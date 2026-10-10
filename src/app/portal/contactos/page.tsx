import { SubmitButton } from "@/components/panel/Cliente";
import { Card, Field, Flash, SelectField } from "@/components/panel/ui";
import { actualizarContacto, crearContacto, eliminarContacto } from "@/lib/actions/portal";
import { portalUsuario } from "@/lib/auth";
import { q } from "@/lib/db";
import { PARENTESCOS } from "@/lib/format";

export default async function Contactos({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const u = await portalUsuario();
  const contactos = await q("SELECT * FROM contactos_emergencia WHERE cliente_id = $1 ORDER BY id", [u.cliente_id]);
  return (
    <>
      <h1 className="text-2xl text-brand-900 sm:text-3xl">Contactos de emergencia</h1>
      <p className="mb-6 mt-1 text-sm text-ink-soft">Personas a quienes podemos avisar si te ocurre un siniestro o no logramos comunicarnos con vos.</p>
      <Flash sp={sp} />
      <div className="space-y-4">
        {contactos.length === 0 && <Card><p className="text-sm text-ink-soft">Todavía no cargaste ningún contacto.</p></Card>}
        {contactos.map((k) => (
          <Card key={k.id}>
            <details>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
                <span>
                  <strong className="text-brand-900">{k.nombre}</strong>{k.parentesco && <span className="text-sm text-ink-soft"> · {k.parentesco}</span>}
                  <span className="block text-sm"><a href={`tel:${k.telefono}`} className="text-brand-700 hover:underline">{k.telefono}</a>{k.email && <span className="text-ink-soft"> · {k.email}</span>}</span>
                  {k.notas && <span className="block text-xs text-ink-soft">{k.notas}</span>}
                </span>
                <span className="text-sm font-semibold text-brand-700">Editar</span>
              </summary>
              <form action={actualizarContacto} className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-2">
                <input type="hidden" name="id" value={k.id} />
                <Field label="Nombre" name="nombre" defaultValue={k.nombre} required />
                <SelectField label="Parentesco" name="parentesco" defaultValue={k.parentesco} vacio="—" options={[...new Set([...(k.parentesco ? [k.parentesco] : []), ...PARENTESCOS])].map((p) => [p, p])} />
                <Field label="Teléfono" name="telefono" type="tel" defaultValue={k.telefono} required />
                <Field label="Email" name="email" type="email" defaultValue={k.email} />
                <Field label="Aclaraciones" name="notas" defaultValue={k.notas} className="sm:col-span-2" />
                <div className="sm:col-span-2"><SubmitButton small>Guardar cambios</SubmitButton></div>
              </form>
              <form action={eliminarContacto} className="mt-2"><input type="hidden" name="id" value={k.id} /><SubmitButton variant="danger" small confirmar="¿Eliminar este contacto?">Eliminar contacto</SubmitButton></form>
            </details>
          </Card>
        ))}
      </div>
      <Card title="Agregar un contacto" className="mt-6">
        <form action={crearContacto} className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre y apellido" name="nombre" required />
          <SelectField label="Parentesco" name="parentesco" vacio="Elegí una opción" options={PARENTESCOS.map((p) => [p, p])} />
          <Field label="Teléfono" name="telefono" type="tel" required placeholder="Con código de área" />
          <Field label="Email (opcional)" name="email" type="email" />
          <Field label="Aclaraciones (opcional)" name="notas" className="sm:col-span-2" placeholder="Ej: disponible de lunes a viernes por la tarde" />
          <div className="sm:col-span-2"><SubmitButton variant="gold">Agregar contacto</SubmitButton></div>
        </form>
      </Card>
    </>
  );
}
