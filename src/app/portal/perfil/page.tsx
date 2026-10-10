import { SubmitButton } from "@/components/panel/Cliente";
import { Card, Dato, Field, Flash } from "@/components/panel/ui";
import { actualizarPerfil, cambiarPassword } from "@/lib/actions/portal";
import { portalUsuario } from "@/lib/auth";
import { q1 } from "@/lib/db";

export default async function Perfil({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string; cambiar?: string }> }) {
  const sp = await searchParams;
  const u = await portalUsuario({ permitirCambio: true });
  const c = await q1("SELECT * FROM clientes WHERE id = $1", [u.cliente_id]);
  return (
    <>
      <h1 className="mb-6 text-2xl text-brand-900 sm:text-3xl">Mis datos</h1>
      <Flash sp={sp} />
      {u.debe_cambiar_password && (
        <div className="mb-6 border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm text-amber-900">Por seguridad, cambiá la contraseña temporal que te dimos antes de continuar.</div>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Información personal">
          <dl className="mb-5 grid gap-4 sm:grid-cols-2">
            <Dato label="Nombre">{c?.nombre}</Dato>
            <Dato label="Documento">{c?.documento}</Dato>
            <Dato label="Email de acceso">{u.email}</Dato>
          </dl>
          <form action={actualizarPerfil} className="grid gap-4 border-t border-line pt-4">
            <Field label="Teléfono" name="telefono" type="tel" defaultValue={c?.telefono} />
            <Field label="Dirección" name="direccion" defaultValue={c?.direccion} />
            <Field label="Localidad" name="localidad" defaultValue={c?.localidad} />
            <div><SubmitButton>Guardar</SubmitButton></div>
            <p className="text-xs text-ink-soft">Para corregir tu nombre, documento o email, contactanos.</p>
          </form>
        </Card>
        <Card title="Cambiar contraseña">
          <form action={cambiarPassword} className="grid gap-4">
            <Field label="Contraseña actual" name="actual" type="password" required autoComplete="current-password" />
            <Field label="Nueva contraseña" name="nueva" type="password" required autoComplete="new-password" hint="Mínimo 8 caracteres." />
            <Field label="Repetir nueva contraseña" name="repetir" type="password" required autoComplete="new-password" />
            <div><SubmitButton variant="gold">Actualizar contraseña</SubmitButton></div>
          </form>
        </Card>
      </div>
    </>
  );
}
