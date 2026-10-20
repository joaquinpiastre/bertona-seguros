import { SubmitButton } from "@/components/panel/Cliente";
import { Badge, Card, Dato, Field, Flash } from "@/components/panel/ui";
import { actualizarPerfil, cambiarClave } from "@/lib/actions/portal";
import { dato, type Row } from "@/lib/api";
import { portalUsuario } from "@/lib/auth";

export default async function Perfil({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  await portalUsuario();
  const { c, acceso } = await dato<{ c: Row | null; acceso: Row | null }>("portalPerfil");
  return (
    <>
      <h1 className="mb-6 text-2xl text-brand-900 sm:text-3xl">Mis datos</h1>
      <Flash sp={sp} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Información personal">
          <dl className="mb-5 grid gap-4 sm:grid-cols-2">
            <Dato label="Nombre">{c?.nombre}</Dato>
            <Dato label="DNI">{c?.documento}</Dato>
          </dl>
          <form action={actualizarPerfil} className="grid gap-4 border-t border-line pt-4">
            <Field label="Teléfono" name="telefono" type="tel" defaultValue={c?.telefono} />
            <Field label="Dirección" name="direccion" defaultValue={c?.direccion} />
            <Field label="Localidad" name="localidad" defaultValue={c?.localidad} />
            <div><SubmitButton>Guardar</SubmitButton></div>
            <p className="text-xs text-ink-soft">Para corregir tu nombre o DNI, comunicate con la oficina.</p>
          </form>
        </Card>

        <Card title="Cambiar mi contraseña">
          <p className="text-sm text-ink-soft">Ingresás con tu DNI y la contraseña que te dio la oficina. Si querés, cambiala por una que recuerdes mejor.</p>
          <p className="mt-3">{acceso?.tiene_clave ? <Badge tono="verde">Tu cuenta tiene contraseña</Badge> : <Badge tono="ambar">Todavía no tenés contraseña</Badge>}</p>
          <form action={cambiarClave} className="mt-4 grid gap-4">
            <Field label="Contraseña actual" name="actual" type="password" required autoComplete="current-password" />
            <Field label="Contraseña nueva (mínimo 4 caracteres)" name="nueva" type="password" required autoComplete="new-password" />
            <Field label="Repetir la contraseña nueva" name="repetir" type="password" required autoComplete="new-password" />
            <div><SubmitButton variant="gold">Cambiar contraseña</SubmitButton></div>
          </form>
        </Card>
      </div>
    </>
  );
}
