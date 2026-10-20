import Link from "next/link";
import { dato, type Row } from "@/lib/api";
import { notFound } from "next/navigation";
import { SubmitButton } from "@/components/panel/Cliente";
import { Badge, Card, Field, Flash, LinkBtn, PageHead, SelectField, Tabla, Td, TextArea, Th } from "@/components/panel/ui";
import { actualizarCliente, alternarCliente, eliminarCliente, eliminarPoliza, crearContactoAdmin, eliminarContactoAdmin, definirClaveCliente } from "@/lib/actions/admin";
import { ESTADOS_POLIZA, METODOS, PARENTESCOS, fecha, money, waCliente } from "@/lib/format";
import { PORTAL_URL } from "@/config/empresa";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string; clave?: string }> };

export default async function DetalleCliente({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const cid = Number(id);
  const { c, acceso, contactos, polizas, pagos, deuda, siniestros } = await dato<{
    c: Row; acceso: Row | null; contactos: Row[]; polizas: Row[]; pagos: Row[]; deuda: Row; siniestros: Row[];
  }>("clienteDetalle", { id: cid });

  const volver = `/admin/clientes/${cid}`;
  const wa = sp.clave && c.telefono
    ? waCliente(c.telefono, `Hola ${String(c.nombre).split(" ")[0]}! Ya podés ingresar a tu cuenta de Bertona Seguros: entrá a ${PORTAL_URL} con tu DNI ${acceso?.dni ?? c.documento} y esta contraseña: ${sp.clave}. Después, si querés, la cambiás desde "Mis datos".`)
    : "";

  return (
    <>
      <PageHead
        title={c.nombre}
        sub={`${c.documento ? `DNI ${c.documento} · ` : ""}${c.activo ? "Cliente activo" : "Cliente inactivo"}${c.es_agencia ? " · Cliente de agencia" : ""}`}
        actions={<><LinkBtn variant="gold" href={`/admin/pagos/nuevo?cliente=${cid}`}>Registrar cobro</LinkBtn><LinkBtn href={`/admin/polizas/nueva?cliente=${cid}`}>Nueva póliza</LinkBtn><LinkBtn href="/admin/clientes">Volver</LinkBtn></>}
      />
      <Flash sp={sp} />
      {deuda!.t > 0 && <div className="mb-6 border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-900">Este cliente tiene <strong>{money(deuda!.t)}</strong> en cuotas vencidas.</div>}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Datos del cliente" className="lg:col-span-2">
          <form action={actualizarCliente} className="grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="id" value={cid} />
            <Field label="Nombre y apellido / razón social" name="nombre" defaultValue={c.nombre} required className="sm:col-span-2" />
            <Field label="DNI (con él ingresa el cliente)" name="documento" defaultValue={c.documento} required hint="Solo números. Es su usuario del portal (ingresa con DNI y contraseña)." />
            <Field label="Teléfono / WhatsApp" name="telefono" type="tel" defaultValue={c.telefono} />
            <Field label="Email" name="email" type="email" defaultValue={c.email} />
            <Field label="Localidad" name="localidad" defaultValue={c.localidad} />
            <Field label="Dirección" name="direccion" defaultValue={c.direccion} className="sm:col-span-2" />
            <label className="flex items-center gap-3 text-sm font-semibold text-brand-900 sm:col-span-2">
              <input type="checkbox" name="es_agencia" defaultChecked={!!c.es_agencia} className="h-4 w-4 accent-[var(--brand-700)]" />
              Es cliente de agencia
            </label>
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

        <Card title="Ingreso al portal">
          {acceso ? (
            <div className="space-y-4 text-sm">
              {sp.clave && (
                <div className="border-2 border-accent-500 bg-accent-300/15 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-accent-600">Contraseña para pasarle al cliente</p>
                  <p className="mt-1 font-display text-3xl font-bold tracking-widest text-brand-900">{sp.clave}</p>
                  <p className="mt-1 text-xs text-ink-soft">Anotala o envíasela ahora: después no se puede volver a ver (solo cambiar por otra).</p>
                  {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex bg-[#1fa855] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#188a45]">Enviar acceso por WhatsApp</a>}
                </div>
              )}
              <p>Usuario (DNI): <strong className="text-brand-900">{acceso.dni}</strong></p>
              <p>{acceso.activo ? <Badge tono="verde">Acceso activo</Badge> : <Badge tono="rojo">Acceso desactivado</Badge>} {acceso.tiene_clave ? <Badge tono="azul">Tiene contraseña</Badge> : <Badge tono="ambar">Sin contraseña: todavía no puede ingresar</Badge>}</p>
              <form action={definirClaveCliente} className="space-y-3 border-t border-line pt-4">
                <input type="hidden" name="cliente_id" value={cid} />
                <Field label={acceso.tiene_clave ? "Nueva contraseña" : "Contraseña del cliente"} name="clave" autoComplete="off" hint="Mínimo 4 caracteres. Si la dejás vacía se genera una de 6 números." />
                <SubmitButton variant="gold" small>{acceso.tiene_clave ? "Cambiar contraseña" : "Dar contraseña"}</SubmitButton>
              </form>
              <p className="text-xs text-ink-soft">Si cambiás el DNI en los datos, el ingreso se actualiza solo. Con una sola póliza inactiva el cliente no puede ingresar; con varias, entra y ve bloqueadas las inactivas.</p>
            </div>
          ) : (
            <p className="text-sm text-ink-soft">Todavía no tiene ingreso. Guardá el DNI del cliente en los datos y se habilita automáticamente.</p>
          )}
        </Card>
      </div>

      <Card title="Pólizas" className="mt-6" actions={<LinkBtn sm href={`/admin/polizas/nueva?cliente=${cid}`}>Nueva póliza</LinkBtn>}>
        <div className="-m-5">
          <Tabla head={<><Th>Compañía / ramo</Th><Th>Póliza</Th><Th>Riesgo</Th><Th>Vigencia hasta</Th><Th>Estado</Th><Th>Documentos</Th><Th /></>} vacio="El cliente no tiene pólizas cargadas.">
            {polizas.map((p) => (
              <tr key={p.id}>
                <Td><Link href={`/admin/polizas/${p.id}`} className="font-semibold text-brand-800 hover:underline">{p.compania}</Link><span className="block text-xs text-ink-soft">{p.ramo}</span></Td>
                <Td>{p.numero}</Td>
                <Td>{[p.riesgo, p.dominio].filter(Boolean).join(" · ") || "—"}</Td>
                <Td>{fecha(p.hasta)}</Td>
                <Td><Badge tono={p.estado === "vigente" ? "verde" : p.estado === "en_tramite" ? "ambar" : "gris"}>{ESTADOS_POLIZA[p.estado] ?? p.estado}</Badge></Td>
                <Td>{p.docs ? `${p.docs} cargado${p.docs > 1 ? "s" : ""}` : <span className="text-amber-700">Faltan</span>}</Td>
                <Td right>
                  <div className="flex justify-end gap-2">
                    <LinkBtn sm href={`/admin/polizas/${p.id}`}>Editar</LinkBtn>
                    <form action={eliminarPoliza}><input type="hidden" name="id" value={p.id} /><input type="hidden" name="volver" value={`/admin/clientes/${cid}`} /><SubmitButton variant="danger" small confirmar={`¿Eliminar la póliza ${p.numero}? Se borran también sus cuotas, certificados y documentos.`} pendiente="Eliminando…">Eliminar</SubmitButton></form>
                  </div>
                </Td>
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
      <Card title="Siniestros" className="mt-6" actions={<LinkBtn sm href={`/admin/siniestros/nuevo?cliente=${cid}`}>Nuevo siniestro</LinkBtn>}>
        {siniestros.length === 0 ? <p className="text-sm text-ink-soft">Sin siniestros cargados.</p> : (
          <ul className="divide-y divide-line text-sm">
            {siniestros.map((x) => (
              <li key={x.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <span><Link href={`/admin/siniestros/${x.id}`} className="font-semibold text-brand-800 hover:underline">{x.tipo || "Siniestro"} · {fecha(x.fecha)}</Link><span className="block text-xs text-ink-soft">{x.lugar || "Sin lugar"}{x.poliza ? ` · Póliza ${x.poliza}` : ""}</span></span>
                <Badge tono={x.estado === "cerrado" ? "gris" : x.estado === "en_gestion" ? "ambar" : "rojo"}>{x.estado === "cerrado" ? "Cerrado" : x.estado === "en_gestion" ? "En gestión" : "Denunciado"}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Zona de peligro" className="mt-6">
        <p className="text-sm text-ink-soft">Eliminar borra definitivamente al cliente con sus pólizas, cuotas, pagos, recibos y archivos. Es para cargas de prueba o errores; si el cliente simplemente se fue, usá “Desactivar cliente”.</p>
        <form action={eliminarCliente} className="mt-4 flex flex-wrap items-end gap-3">
          <input type="hidden" name="id" value={cid} />
          <label className="text-sm font-semibold text-brand-900">Escribí ELIMINAR para confirmar
            <input name="confirmar" autoComplete="off" className="mt-1.5 block w-56 border border-line px-3 py-2.5 text-sm" />
          </label>
          <SubmitButton variant="danger" confirmar="¿Eliminar definitivamente este cliente y todo lo suyo?" pendiente="Eliminando…">Eliminar cliente</SubmitButton>
        </form>
      </Card>
    </>
  );
}
