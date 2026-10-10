import Link from "next/link";
import { notFound } from "next/navigation";
import { SubmitButton } from "@/components/panel/Cliente";
import { Badge, Card, Field, Flash, LinkBtn, PageHead, SelectField, Tabla, Td, TextArea, Th } from "@/components/panel/ui";
import {
  actualizarCliente, alternarCliente, alternarUsuario, crearAccesoCliente, crearContactoAdmin, eliminarContactoAdmin, restablecerPassword,
} from "@/lib/actions/admin";
import { q, q1 } from "@/lib/db";
import { ESTADOS_POLIZA, METODOS, PARENTESCOS, fecha, money } from "@/lib/format";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> };

export default async function DetalleCliente({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const cid = Number(id);
  const c = await q1("SELECT * FROM clientes WHERE id = $1", [cid]);
  if (!c) notFound();
  const [acceso, contactos, polizas, pagos, deuda] = await Promise.all([
    q1("SELECT id, email, activo, debe_cambiar_password FROM usuarios WHERE cliente_id = $1 LIMIT 1", [cid]),
    q("SELECT * FROM contactos_emergencia WHERE cliente_id = $1 ORDER BY id", [cid]),
    q(
      `SELECT p.id, p.ramo, p.compania, p.numero, p.dominio, p.riesgo, p.estado, p.vigencia_hasta::text AS hasta,
              (SELECT COUNT(*)::int FROM documentos d WHERE d.poliza_id = p.id AND d.tipo IN ('poliza','certificado')) AS docs
       FROM polizas p WHERE p.cliente_id = $1 ORDER BY p.id DESC`, [cid]),
    q(
      `SELECT pg.id, pg.recibo_nro, pg.fecha::text AS fecha, pg.importe::float8 AS importe, pg.metodo, pg.estado FROM pagos pg
       WHERE pg.cliente_id = $1 ORDER BY pg.fecha DESC, pg.id DESC LIMIT 10`, [cid]),
    q1(
      `SELECT COALESCE(SUM(x.importe),0)::float8 AS t FROM cuotas x JOIN polizas p ON p.id = x.poliza_id
       WHERE p.cliente_id = $1 AND x.estado = 'pendiente' AND x.vencimiento < CURRENT_DATE`, [cid]),
  ]);
  const volver = `/admin/clientes/${cid}`;

  return (
    <>
      <PageHead
        title={c.nombre}
        sub={`${c.documento ? `Documento ${c.documento} · ` : ""}${c.activo ? "Cliente activo" : "Cliente inactivo"}`}
        actions={<><LinkBtn variant="gold" href={`/admin/pagos/nuevo?cliente=${cid}`}>Registrar cobro</LinkBtn><LinkBtn href={`/admin/polizas/nueva?cliente=${cid}`}>Nueva póliza</LinkBtn><LinkBtn href="/admin/clientes">Volver</LinkBtn></>}
      />
      <Flash sp={sp} />
      {deuda!.t > 0 && <div className="mb-6 border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-900">Este cliente tiene <strong>{money(deuda!.t)}</strong> en cuotas vencidas.</div>}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Datos del cliente" className="lg:col-span-2">
          <form action={actualizarCliente} className="grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="id" value={cid} />
            <Field label="Nombre y apellido / razón social" name="nombre" defaultValue={c.nombre} required className="sm:col-span-2" />
            <Field label="DNI / CUIT" name="documento" defaultValue={c.documento} />
            <Field label="Teléfono / WhatsApp" name="telefono" type="tel" defaultValue={c.telefono} />
            <Field label="Email" name="email" type="email" defaultValue={c.email} />
            <Field label="Localidad" name="localidad" defaultValue={c.localidad} />
            <Field label="Dirección" name="direccion" defaultValue={c.direccion} className="sm:col-span-2" />
            <TextArea label="Notas internas" name="notas" defaultValue={c.notas} className="sm:col-span-2" />
            <div className="flex flex-wrap gap-3 sm:col-span-2">
              <SubmitButton>Guardar cambios</SubmitButton>
            </div>
          </form>
          <form action={alternarCliente} className="mt-3 border-t border-line pt-3">
            <input type="hidden" name="id" value={cid} />
            <SubmitButton variant="ghost" small confirmar={c.activo ? "¿Desactivar este cliente? También se desactiva su acceso al portal." : "¿Reactivar este cliente?"}>{c.activo ? "Desactivar cliente" : "Reactivar cliente"}</SubmitButton>
          </form>
        </Card>

        <Card title="Acceso al portal de socios">
          {acceso ? (
            <div className="space-y-4 text-sm">
              <p><strong className="text-brand-900">{acceso.email}</strong><br />{acceso.activo ? <Badge tono="verde">Activo</Badge> : <Badge tono="rojo">Desactivado</Badge>} {acceso.debe_cambiar_password && <Badge tono="ambar">Contraseña temporal</Badge>}</p>
              <form action={restablecerPassword} className="space-y-2">
                <input type="hidden" name="usuario_id" value={acceso.id} />
                <input type="hidden" name="volver" value={volver} />
                <Field label="Nueva contraseña temporal" name="password" type="text" hint="Mínimo 8 caracteres. Se le pedirá cambiarla." />
                <SubmitButton variant="ghost" small>Restablecer contraseña</SubmitButton>
              </form>
              <form action={alternarUsuario}>
                <input type="hidden" name="usuario_id" value={acceso.id} />
                <input type="hidden" name="volver" value={volver} />
                <SubmitButton variant="ghost" small>{acceso.activo ? "Desactivar acceso" : "Reactivar acceso"}</SubmitButton>
              </form>
            </div>
          ) : (
            <form action={crearAccesoCliente} className="space-y-3">
              <p className="text-sm text-ink-soft">El cliente todavía no puede ingresar. Creale un acceso para que vea sus pólizas, pagos y recibos.</p>
              <input type="hidden" name="cliente_id" value={cid} />
              <Field label="Email de acceso" name="email" type="email" defaultValue={c.email} required />
              <Field label="Contraseña temporal" name="password" type="text" required hint="Mínimo 8 caracteres. Deberá cambiarla al ingresar." />
              <SubmitButton variant="gold">Crear acceso</SubmitButton>
            </form>
          )}
        </Card>
      </div>

      <Card title="Pólizas" className="mt-6" actions={<LinkBtn sm href={`/admin/polizas/nueva?cliente=${cid}`}>Nueva póliza</LinkBtn>}>
        <div className="-m-5">
          <Tabla head={<><Th>Compañía / ramo</Th><Th>Póliza</Th><Th>Riesgo</Th><Th>Vigencia hasta</Th><Th>Estado</Th><Th>Documentos</Th></>} vacio="El cliente no tiene pólizas cargadas.">
            {polizas.map((p) => (
              <tr key={p.id}>
                <Td><Link href={`/admin/polizas/${p.id}`} className="font-semibold text-brand-800 hover:underline">{p.compania}</Link><span className="block text-xs text-ink-soft">{p.ramo}</span></Td>
                <Td>{p.numero}</Td>
                <Td>{[p.riesgo, p.dominio].filter(Boolean).join(" · ") || "—"}</Td>
                <Td>{fecha(p.hasta)}</Td>
                <Td><Badge tono={p.estado === "vigente" ? "verde" : p.estado === "en_tramite" ? "ambar" : "gris"}>{ESTADOS_POLIZA[p.estado] ?? p.estado}</Badge></Td>
                <Td>{p.docs ? `${p.docs} cargado${p.docs > 1 ? "s" : ""}` : <span className="text-amber-700">Faltan</span>}</Td>
              </tr>
            ))}
          </Tabla>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Contactos de emergencia">
          {contactos.length === 0 && <p className="mb-4 text-sm text-ink-soft">Sin contactos cargados.</p>}
          <ul className="divide-y divide-line">
            {contactos.map((k) => (
              <li key={k.id} className="flex items-start justify-between gap-3 py-3 text-sm">
                <span><strong className="text-brand-900">{k.nombre}</strong>{k.parentesco && <span className="text-ink-soft"> · {k.parentesco}</span>}<br /><a className="hover:underline" href={`tel:${k.telefono}`}>{k.telefono}</a>{k.email && <> · {k.email}</>}{k.notas && <span className="block text-xs text-ink-soft">{k.notas}</span>}</span>
                <form action={eliminarContactoAdmin}><input type="hidden" name="id" value={k.id} /><input type="hidden" name="cliente_id" value={cid} /><SubmitButton variant="danger" small confirmar="¿Eliminar contacto?">Quitar</SubmitButton></form>
              </li>
            ))}
          </ul>
          <form action={crearContactoAdmin} className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-2">
            <input type="hidden" name="cliente_id" value={cid} />
            <Field label="Nombre" name="nombre" required />
            <SelectField label="Parentesco" name="parentesco" vacio="—" options={PARENTESCOS.map((p) => [p, p])} />
            <Field label="Teléfono" name="telefono" type="tel" required />
            <Field label="Email" name="email" type="email" />
            <div className="sm:col-span-2"><SubmitButton variant="ghost" small>Agregar contacto</SubmitButton></div>
          </form>
        </Card>

        <Card title="Últimos pagos" actions={<Link href={`/admin/pagos?q=${encodeURIComponent(c.nombre)}&desde=2000-01-01&hasta=2100-01-01`} className="text-sm font-semibold text-brand-700 hover:underline">Ver todos</Link>}>
          <div className="-m-5">
            <Tabla head={<><Th>Recibo</Th><Th>Fecha</Th><Th>Forma</Th><Th right>Importe</Th></>} vacio="Sin pagos registrados.">
              {pagos.map((p) => (
                <tr key={p.id}>
                  <Td><Link href={`/admin/pagos/${p.id}`} className="font-semibold text-brand-800 hover:underline">N° {String(p.recibo_nro).padStart(6, "0")}</Link>{p.estado === "anulado" && <> <Badge tono="rojo">Anulado</Badge></>}</Td>
                  <Td>{fecha(p.fecha)}</Td>
                  <Td>{METODOS[p.metodo] ?? p.metodo}</Td>
                  <Td right className="font-semibold">{money(p.importe)}</Td>
                </tr>
              ))}
            </Tabla>
          </div>
        </Card>
      </div>
    </>
  );
}
