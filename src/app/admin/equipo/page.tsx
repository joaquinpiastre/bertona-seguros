import { SubmitButton } from "@/components/panel/Cliente";
import { Badge, Card, Field, Flash, PageHead, Tabla, Td, Th } from "@/components/panel/ui";
import { alternarUsuario, crearAdmin, restablecerPassword } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { q } from "@/lib/db";
import { fecha } from "@/lib/format";

export default async function Equipo({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const yo = await requireAdmin();
  const admins = await q("SELECT id, nombre, email, activo, creado::text AS creado FROM usuarios WHERE rol = 'admin' ORDER BY id");
  return (
    <>
      <PageHead title="Equipo" sub="Personas de la empresa con acceso al panel de administración" />
      <Flash sp={sp} />
      <Card>
        <div className="-m-5">
          <Tabla head={<><Th>Nombre</Th><Th>Email</Th><Th>Alta</Th><Th>Estado</Th><Th>Acciones</Th></>}>
            {admins.map((a) => (
              <tr key={a.id}>
                <Td className="font-semibold">{a.nombre}{a.id === yo.id && <span className="ml-2 text-xs font-normal text-ink-soft">(vos)</span>}</Td>
                <Td>{a.email}</Td>
                <Td>{fecha(a.creado)}</Td>
                <Td>{a.activo ? <Badge tono="verde">Activo</Badge> : <Badge tono="rojo">Desactivado</Badge>}</Td>
                <Td>
                  <div className="flex flex-wrap items-center gap-2">
                    <form action={restablecerPassword} className="flex items-center gap-2">
                      <input type="hidden" name="usuario_id" value={a.id} /><input type="hidden" name="volver" value="/admin/equipo" />
                      <input name="password" placeholder="Nueva contraseña" aria-label={`Nueva contraseña para ${a.nombre}`} className="w-40 border border-line px-2 py-1.5 text-xs" />
                      <SubmitButton variant="ghost" small>Cambiar</SubmitButton>
                    </form>
                    {a.id !== yo.id && (
                      <form action={alternarUsuario}><input type="hidden" name="usuario_id" value={a.id} /><input type="hidden" name="volver" value="/admin/equipo" /><SubmitButton variant="danger" small confirmar="¿Cambiar el estado de este usuario?">{a.activo ? "Desactivar" : "Reactivar"}</SubmitButton></form>
                    )}
                  </div>
                </Td>
              </tr>
            ))}
          </Tabla>
        </div>
      </Card>
      <Card title="Agregar administrador" className="mt-6">
        <form action={crearAdmin} className="grid gap-4 sm:grid-cols-3">
          <Field label="Nombre" name="nombre" required />
          <Field label="Email" name="email" type="email" required />
          <Field label="Contraseña temporal" name="password" type="text" required hint="Mínimo 8 caracteres." />
          <div className="sm:col-span-3"><SubmitButton variant="gold">Crear administrador</SubmitButton></div>
        </form>
      </Card>
    </>
  );
}
