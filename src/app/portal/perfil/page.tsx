import { SubmitButton } from "@/components/panel/Cliente";
import { Badge, Card, Dato, Field, Flash } from "@/components/panel/ui";
import { actualizarPerfil, configurarPin } from "@/lib/actions/portal";
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

        <Card title="Seguridad de tu cuenta">
          <p className="text-sm text-ink-soft">Ingresás a tu cuenta solo con tu DNI. Si querés más protección, podés sumar una clave numérica: desde ese momento te la pedimos junto con el DNI.</p>
          <p className="mt-3">{acceso?.tiene_pin ? <Badge tono="verde">Tenés una clave activada</Badge> : <Badge>Sin clave: ingresás solo con el DNI</Badge>}</p>
          <form action={configurarPin} className="mt-4 grid gap-4">
            <Field label={acceso?.tiene_pin ? "Nueva clave (4 a 8 números)" : "Clave (4 a 8 números)"} name="pin" type="password" inputMode="numeric" autoComplete="new-password" />
            <Field label="Repetir clave" name="repetir" type="password" inputMode="numeric" autoComplete="new-password" />
            <div className="flex flex-wrap gap-3">
              <SubmitButton variant="gold">{acceso?.tiene_pin ? "Cambiar clave" : "Activar clave"}</SubmitButton>
            </div>
          </form>
          {acceso?.tiene_pin && (
            <form action={configurarPin} className="mt-3 border-t border-line pt-3">
              <input type="hidden" name="accion" value="quitar" />
              <SubmitButton variant="ghost" small confirmar="¿Quitar la clave? Vas a ingresar solo con el DNI.">Quitar mi clave</SubmitButton>
            </form>
          )}
        </Card>
      </div>
    </>
  );
}
