import bcrypt from "bcryptjs";
import { requireAdmin } from "../auth";
import { leerArchivo, type Archivo } from "../archivos";
import { q, q1 } from "../db";
import { claveNueva, enLista, fijarClave, guardarDoc, recalcularCuota, registrarPagosCuotas, soloDigitos, sincronizarUsuarioSocio } from "../core";
import { EMAIL_RE, Redirigir, ir, num, txt, txtONull } from "../flash";
import { ACTUALIZACION, COBROS, ESTADOS_POLIZA, PERIODICIDAD, TIPOS_DOC, esFecha, hoy, sumarMeses } from "../format";

// ───────── Utilidades ─────────
async function archivoSeguro(fd: FormData, campo: string, volver: string): Promise<Archivo | null> {
  try {
    return await leerArchivo(fd, campo);
  } catch (e) {
    ir(volver, "error", e instanceof Error ? e.message : "Archivo inválido.");
  }
}

// ───────── Clientes ─────────
function datosCliente(fd: FormData) {
  return {
    nombre: txt(fd, "nombre"),
    documento: txtONull(fd, "documento"),
    email: txtONull(fd, "email"),
    telefono: txtONull(fd, "telefono"),
    direccion: txtONull(fd, "direccion"),
    localidad: txtONull(fd, "localidad"),
    notas: txtONull(fd, "notas"),
    es_agencia: fd.get("es_agencia") === "on",
  };
}

export async function crearCliente(fd: FormData) {
  await requireAdmin();
  const d = datosCliente(fd);
  const volver = "/admin/clientes/nuevo";
  if (!d.nombre) ir(volver, "error", "El nombre es obligatorio.");
  if (soloDigitos(d.documento).length < 7) ir(volver, "error", "El DNI es obligatorio (con él ingresa el cliente al portal).");
  if (d.email && !EMAIL_RE.test(d.email)) ir(volver, "error", "El email no es válido.");
  if (await q1("SELECT 1 FROM usuarios WHERE dni = $1", [soloDigitos(d.documento)])) ir(volver, "error", "Ese DNI ya está cargado en otro cliente.");
  const r = await q1(
    `INSERT INTO clientes (nombre, documento, email, telefono, direccion, localidad, notas, es_agencia)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
    [d.nombre, d.documento, d.email, d.telefono, d.direccion, d.localidad, d.notas, d.es_agencia]
  );
  const sync = await sincronizarUsuarioSocio(r!.id);
  if (!sync.ok) ir(`/admin/clientes/${r!.id}`, "error", `Cliente creado, pero no se pudo habilitar el ingreso: ${sync.motivo}`);
  const u = await q1("SELECT id FROM usuarios WHERE cliente_id = $1 AND rol = 'socio' LIMIT 1", [r!.id]);
  const clave = fd.get("clave") ? String(fd.get("clave")).trim() : claveNueva();
  if (clave.length < 4) ir(`/admin/clientes/${r!.id}`, "error", "Cliente creado, pero la contraseña debe tener al menos 4 caracteres: definila desde acá.");
  await fijarClave(u!.id, clave);
  throw new Redirigir(`/admin/clientes/${r!.id}?ok=${encodeURIComponent("Cliente creado. Ya puede ingresar con su DNI y la contraseña que figura abajo.")}&clave=${encodeURIComponent(clave)}`);
}

export async function actualizarCliente(fd: FormData) {
  await requireAdmin();
  const id = Number(txt(fd, "id"));
  const volver = `/admin/clientes/${id}`;
  const d = datosCliente(fd);
  if (!d.nombre) ir(volver, "error", "El nombre es obligatorio.");
  if (soloDigitos(d.documento).length < 7) ir(volver, "error", "El DNI es obligatorio (con él ingresa el cliente al portal).");
  if (d.email && !EMAIL_RE.test(d.email)) ir(volver, "error", "El email no es válido.");
  if (await q1("SELECT 1 FROM usuarios WHERE dni = $1 AND cliente_id <> $2", [soloDigitos(d.documento), id])) ir(volver, "error", "Ese DNI ya está cargado en otro cliente.");
  await q(
    `UPDATE clientes SET nombre=$2, documento=$3, email=$4, telefono=$5, direccion=$6, localidad=$7, notas=$8, es_agencia=$9 WHERE id=$1`,
    [id, d.nombre, d.documento, d.email, d.telefono, d.direccion, d.localidad, d.notas, d.es_agencia]
  );
  const sync = await sincronizarUsuarioSocio(id);
  if (!sync.ok) ir(volver, "error", `Datos guardados, pero no se pudo actualizar el ingreso: ${sync.motivo}`);
  ir(volver, "ok", "Datos guardados.");
}

export async function alternarCliente(fd: FormData) {
  await requireAdmin();
  const id = Number(txt(fd, "id"));
  await q("UPDATE clientes SET activo = NOT activo WHERE id = $1", [id]);
  await q("UPDATE usuarios SET activo = (SELECT activo FROM clientes WHERE id = $1) WHERE cliente_id = $1", [id]);
  ir(`/admin/clientes/${id}`, "ok", "Estado del cliente actualizado.");
}

/** La oficina define (o cambia) la contraseña de ingreso del cliente. Si se deja vacía se genera una de 6 números. */
export async function definirClaveCliente(fd: FormData) {
  await requireAdmin();
  const cid = Number(txt(fd, "cliente_id"));
  const volver = `/admin/clientes/${cid}`;
  const u = await q1("SELECT id FROM usuarios WHERE cliente_id = $1 AND rol = 'socio' LIMIT 1", [cid]);
  if (!u) ir(volver, "error", "El cliente no tiene acceso habilitado: revisá que tenga DNI cargado y guardá sus datos.");
  const clave = txt(fd, "clave") || claveNueva();
  if (clave.length < 4) ir(volver, "error", "La contraseña debe tener al menos 4 caracteres.");
  await fijarClave(u!.id, clave);
  throw new Redirigir(`${volver}?ok=${encodeURIComponent("Contraseña guardada. Pasásela al cliente.")}&clave=${encodeURIComponent(clave)}`);
}

export async function restablecerPassword(fd: FormData) {
  await requireAdmin();
  const uid = Number(txt(fd, "usuario_id"));
  const volver = txt(fd, "volver") || "/admin";
  const pass = String(fd.get("password") ?? "");
  if (pass.length < 8) ir(volver, "error", "La contraseña debe tener al menos 8 caracteres.");
  await q("UPDATE usuarios SET password_hash = $2, debe_cambiar_password = TRUE WHERE id = $1", [uid, await bcrypt.hash(pass, 10)]);
  ir(volver, "ok", "Contraseña restablecida. Se pedirá cambiarla al próximo ingreso.");
}

export async function alternarUsuario(fd: FormData) {
  const yo = await requireAdmin();
  const uid = Number(txt(fd, "usuario_id"));
  const volver = txt(fd, "volver") || "/admin";
  if (uid === yo.id) ir(volver, "error", "No podés desactivar tu propio usuario.");
  await q("UPDATE usuarios SET activo = NOT activo WHERE id = $1", [uid]);
  ir(volver, "ok", "Usuario actualizado.");
}

export async function crearAdmin(fd: FormData) {
  await requireAdmin();
  const nombre = txt(fd, "nombre");
  const email = txt(fd, "email").toLowerCase();
  const pass = String(fd.get("password") ?? "");
  if (!nombre) ir("/admin/equipo", "error", "Ingresá el nombre.");
  if (!EMAIL_RE.test(email)) ir("/admin/equipo", "error", "Email inválido.");
  if (pass.length < 8) ir("/admin/equipo", "error", "La contraseña debe tener al menos 8 caracteres.");
  if (await q1("SELECT 1 FROM usuarios WHERE email = $1", [email])) ir("/admin/equipo", "error", "Ese email ya está en uso.");
  await q(
    "INSERT INTO usuarios (email, nombre, password_hash, rol, debe_cambiar_password) VALUES ($1,$2,$3,'admin',TRUE)",
    [email, nombre, await bcrypt.hash(pass, 10)]
  );
  ir("/admin/equipo", "ok", "Administrador creado.");
}

// ───────── Contactos de emergencia (desde el panel admin) ─────────
export async function crearContactoAdmin(fd: FormData) {
  await requireAdmin();
  const cid = Number(txt(fd, "cliente_id"));
  const volver = `/admin/clientes/${cid}`;
  const nombre = txt(fd, "nombre");
  const telefono = txt(fd, "telefono");
  if (!nombre || !telefono) ir(volver, "error", "Nombre y teléfono del contacto son obligatorios.");
  await q(
    "INSERT INTO contactos_emergencia (cliente_id, nombre, parentesco, telefono, email, notas) VALUES ($1,$2,$3,$4,$5,$6)",
    [cid, nombre, txtONull(fd, "parentesco"), telefono, txtONull(fd, "email"), txtONull(fd, "notas")]
  );
  ir(volver, "ok", "Contacto agregado.");
}

export async function eliminarContactoAdmin(fd: FormData) {
  await requireAdmin();
  const cid = Number(txt(fd, "cliente_id"));
  await q("DELETE FROM contactos_emergencia WHERE id = $1 AND cliente_id = $2", [Number(txt(fd, "id")), cid]);
  ir(`/admin/clientes/${cid}`, "ok", "Contacto eliminado.");
}

// ───────── Pólizas ─────────
export async function crearPoliza(fd: FormData) {
  const yo = await requireAdmin();
  const cid = Number(txt(fd, "cliente_id"));
  const volver = `/admin/polizas/nueva?cliente=${cid || ""}`;
  const ramo = txt(fd, "ramo");
  const compania = txt(fd, "compania");
  const numero = txt(fd, "numero");
  const periodicidad = txt(fd, "periodicidad") || "mensual";
  const cobro = txt(fd, "cobro") || "oficina";
  const actualizacion = Number(txt(fd, "actualizacion_meses") || 0);
  const conCuotas = cobro === "oficina"; // con tarjeta cobra la compañía: no hay cuotas que gestionar acá
  const cuotasCant = conCuotas ? Math.round(num(fd, "cuotas_cant")) : 0;
  const importe = num(fd, "importe_cuota") || 0;
  const primerVenc = txt(fd, "primer_vencimiento");
  const desde = txt(fd, "vigencia_desde");
  const hasta = txt(fd, "vigencia_hasta");
  const estado = txt(fd, "estado") || "vigente";
  if (!cid || !(await q1("SELECT 1 FROM clientes WHERE id = $1", [cid]))) ir(volver, "error", "Elegí un cliente.");
  if (!ramo || !compania || !numero) ir(volver, "error", "Ramo, compañía y número de póliza son obligatorios.");
  if (!PERIODICIDAD[periodicidad] || !ESTADOS_POLIZA[estado] || !COBROS[cobro] || !ACTUALIZACION[String(actualizacion)]) ir(volver, "error", "Datos de póliza inválidos.");
  if (conCuotas && !(cuotasCant >= 1 && cuotasCant <= 60)) ir(volver, "error", "La cantidad de cuotas debe estar entre 1 y 60.");
  if (!(importe >= 0)) ir(volver, "error", "El importe de la cuota no es válido.");
  if (conCuotas && !esFecha(primerVenc)) ir(volver, "error", "Indicá el vencimiento de la primera cuota.");
  if ((desde && !esFecha(desde)) || (hasta && !esFecha(hasta))) ir(volver, "error", "Fechas de vigencia inválidas.");
  const fPoliza = await archivoSeguro(fd, "archivo_poliza", volver);
  const fCert = await archivoSeguro(fd, "archivo_certificado", volver);
  const suma = num(fd, "suma_asegurada");

  const p = await q1(
    `INSERT INTO polizas (cliente_id, ramo, compania, numero, riesgo, dominio, suma_asegurada, periodicidad,
       cuotas_cant, importe_cuota, vigencia_desde, vigencia_hasta, estado, notas, cobertura, cobro, actualizacion_meses)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING id`,
    [cid, ramo, compania, numero, txtONull(fd, "riesgo"), txtONull(fd, "dominio")?.toUpperCase() ?? null,
     Number.isFinite(suma) ? suma : null, periodicidad, cuotasCant, importe, desde || null, hasta || null, estado, txtONull(fd, "notas"), txtONull(fd, "cobertura"), cobro, actualizacion]
  );
  const pid = p!.id as number;
  const paso = PERIODICIDAD[periodicidad].meses;
  for (let i = 0; i < cuotasCant; i++) {
    await q("INSERT INTO cuotas (poliza_id, numero, vencimiento, importe) VALUES ($1,$2,$3,$4)", [pid, i + 1, sumarMeses(primerVenc, i * paso), importe]);
  }
  if (fPoliza) await guardarDoc(fPoliza, { cliente_id: cid, poliza_id: pid, tipo: "poliza", subido_por: yo.id });
  const docCert = fCert ? await guardarDoc(fCert, { cliente_id: cid, poliza_id: pid, tipo: "certificado", subido_por: yo.id }) : null;
  // Con actualización periódica se abre el primer período de certificado (el archivo, si se subió, queda asociado).
  if (actualizacion > 0) {
    const ini = desde || hoy();
    await q("INSERT INTO certificados (poliza_id, desde, hasta, documento_id) VALUES ($1,$2,$3,$4)", [pid, ini, sumarMeses(ini, actualizacion), docCert]);
  }
  const resumen = conCuotas ? `${cuotasCant} cuota${cuotasCant > 1 ? "s" : ""}` : "cobro por tarjeta (sin cuotas)";
  ir(`/admin/polizas/${pid}`, "ok", `Póliza creada con ${resumen}${actualizacion > 0 ? " y su primer certificado" : ""}.`);
}

export async function actualizarPoliza(fd: FormData) {
  await requireAdmin();
  const id = Number(txt(fd, "id"));
  const volver = `/admin/polizas/${id}`;
  const ramo = txt(fd, "ramo");
  const compania = txt(fd, "compania");
  const numero = txt(fd, "numero");
  const estado = txt(fd, "estado");
  const desde = txt(fd, "vigencia_desde");
  const hasta = txt(fd, "vigencia_hasta");
  const cobro = txt(fd, "cobro") || "oficina";
  const periodicidad = txt(fd, "periodicidad") || "mensual";
  const actualizacion = Number(txt(fd, "actualizacion_meses") || 0);
  if (!ramo || !compania || !numero) ir(volver, "error", "Ramo, compañía y número son obligatorios.");
  if (!ESTADOS_POLIZA[estado] || !COBROS[cobro] || !PERIODICIDAD[periodicidad] || !ACTUALIZACION[String(actualizacion)]) ir(volver, "error", "Estado, cobro, frecuencia de cuotas o actualización inválidos.");
  if ((desde && !esFecha(desde)) || (hasta && !esFecha(hasta))) ir(volver, "error", "Fechas de vigencia inválidas.");
  const suma = num(fd, "suma_asegurada");
  await q(
    `UPDATE polizas SET ramo=$2, compania=$3, numero=$4, riesgo=$5, dominio=$6, suma_asegurada=$7,
       vigencia_desde=$8, vigencia_hasta=$9, estado=$10, notas=$11, cobertura=$12, cobro=$13, actualizacion_meses=$14, periodicidad=$15 WHERE id=$1`,
    [id, ramo, compania, numero, txtONull(fd, "riesgo"), txtONull(fd, "dominio")?.toUpperCase() ?? null,
     Number.isFinite(suma) ? suma : null, desde || null, hasta || null, estado, txtONull(fd, "notas"), txtONull(fd, "cobertura"), cobro, actualizacion, periodicidad]
  );
  ir(volver, "ok", "Póliza actualizada.");
}

/**
 * Elimina la póliza con sus cuotas, certificados y documentos. Si tiene pagos registrados, también se borran sus recibos
 * y por eso hay que escribir ELIMINAR (para no perder cobros por error, en ese caso conviene anularla).
 */
export async function eliminarPoliza(fd: FormData) {
  await requireAdmin();
  const id = Number(txt(fd, "id"));
  const volver = txt(fd, "volver") || "/admin/polizas";
  const p = await q1("SELECT cliente_id, (SELECT COUNT(*)::int FROM pagos WHERE poliza_id = polizas.id) AS pagos FROM polizas WHERE id = $1", [id]);
  if (!p) ir(volver, "error", "La póliza ya no existe.");
  if (p!.pagos > 0 && txt(fd, "confirmar") !== "ELIMINAR") {
    ir(`/admin/polizas/${id}`, "error", `Esta póliza tiene ${p!.pagos} pago${p!.pagos > 1 ? "s" : ""} registrado${p!.pagos > 1 ? "s" : ""}. Para eliminarla junto con sus recibos escribí ELIMINAR en la sección "Eliminar la póliza" (si no, es mejor anularla).`);
  }
  await q("UPDATE alertas SET estado = 'resuelta', resuelta_en = now() WHERE poliza_id = $1 AND estado = 'pendiente'", [id]);
  await q("DELETE FROM pagos WHERE poliza_id = $1", [id]);
  await q("DELETE FROM polizas WHERE id = $1", [id]);
  ir(volver.startsWith("/admin/polizas/") ? "/admin/polizas" : volver, "ok", "Póliza eliminada.");
}

export async function agregarCuota(fd: FormData) {
  await requireAdmin();
  const pid = Number(txt(fd, "poliza_id"));
  const volver = `/admin/polizas/${pid}`;
  const p = await q1("SELECT periodicidad, importe_cuota::float8 AS importe FROM polizas WHERE id = $1", [pid]);
  if (!p) ir("/admin/polizas", "error", "Póliza inexistente.");
  const ult = await q1("SELECT numero, vencimiento::text AS venc FROM cuotas WHERE poliza_id = $1 ORDER BY numero DESC LIMIT 1", [pid]);
  const paso = PERIODICIDAD[p!.periodicidad]?.meses ?? 1;
  const hoyIso = new Date().toISOString().slice(0, 10);
  await q("INSERT INTO cuotas (poliza_id, numero, vencimiento, importe) VALUES ($1,$2,$3,$4)", [
    pid, (ult?.numero ?? 0) + 1, ult ? sumarMeses(ult.venc, paso) : hoyIso, p!.importe,
  ]);
  await q("UPDATE polizas SET cuotas_cant = (SELECT COUNT(*) FROM cuotas WHERE poliza_id = $1) WHERE id = $1", [pid]);
  ir(volver, "ok", "Cuota agregada.");
}

export async function actualizarCuota(fd: FormData) {
  await requireAdmin();
  const id = Number(txt(fd, "id"));
  const pid = Number(txt(fd, "poliza_id"));
  const volver = `/admin/polizas/${pid}`;
  const venc = txt(fd, "vencimiento");
  const importe = num(fd, "importe");
  if (!esFecha(venc) || !(importe >= 0)) ir(volver, "error", "Vencimiento o importe inválido.");
  await q("UPDATE cuotas SET vencimiento = $2, importe = $3 WHERE id = $1 AND poliza_id = $4", [id, venc, importe, pid]);
  await recalcularCuota(id);
  ir(volver, "ok", "Cuota actualizada.");
}

export async function anularCuota(fd: FormData) {
  await requireAdmin();
  const id = Number(txt(fd, "id"));
  const pid = Number(txt(fd, "poliza_id"));
  const volver = `/admin/polizas/${pid}`;
  const pagos = await q1("SELECT 1 FROM pagos WHERE cuota_id = $1 AND estado = 'aplicado'", [id]);
  if (pagos) ir(volver, "error", "La cuota tiene pagos aplicados: anulá primero el pago.");
  await q("UPDATE cuotas SET estado = 'anulada' WHERE id = $1 AND poliza_id = $2", [id, pid]);
  ir(volver, "ok", "Cuota anulada.");
}

// ───────── Certificados por período (pólizas con actualización periódica, ej. cuatrimestral) ─────────
/** Carga el certificado de un nuevo período (con su archivo, si se sube) y resuelve el aviso de vencimiento. */
export async function cargarCertificado(fd: FormData) {
  const yo = await requireAdmin();
  const pid = Number(txt(fd, "poliza_id"));
  const volver = `/admin/polizas/${pid}`;
  const desde = txt(fd, "desde");
  const hasta = txt(fd, "hasta");
  const p = await q1("SELECT cliente_id FROM polizas WHERE id = $1", [pid]);
  if (!p) ir("/admin/polizas", "error", "Póliza inexistente.");
  if (!esFecha(desde) || !esFecha(hasta) || hasta <= desde) ir(volver, "error", "Indicá el período del certificado: la fecha «hasta» tiene que ser posterior a «desde».");
  const a = await archivoSeguro(fd, "archivo", volver);
  const docId = a ? await guardarDoc(a, { cliente_id: p!.cliente_id, poliza_id: pid, tipo: "certificado", subido_por: yo.id }) : null;
  await q("INSERT INTO certificados (poliza_id, desde, hasta, documento_id, nota) VALUES ($1,$2,$3,$4,$5)", [pid, desde, hasta, docId, txtONull(fd, "nota")]);
  await q("UPDATE alertas SET estado = 'resuelta', resuelta_en = now() WHERE tipo = 'certificado' AND poliza_id = $1 AND estado = 'pendiente'", [pid]);
  ir(volver, "ok", "Certificado cargado.");
}

export async function eliminarCertificado(fd: FormData) {
  await requireAdmin();
  const id = Number(txt(fd, "id"));
  const pid = Number(txt(fd, "poliza_id"));
  const c = await q1("SELECT documento_id FROM certificados WHERE id = $1 AND poliza_id = $2", [id, pid]);
  if (!c) ir(`/admin/polizas/${pid}`, "error", "Certificado inexistente.");
  await q("DELETE FROM certificados WHERE id = $1", [id]);
  if (c!.documento_id) await q("DELETE FROM documentos WHERE id = $1", [c!.documento_id]);
  ir(`/admin/polizas/${pid}`, "ok", "Certificado eliminado.");
}

// ───────── Cobranza: marcar a quién ya se le escribió ─────────
/** Marca (o desmarca) como "escrito" las cuotas pendientes de un cliente. Cada cuota nueva que se acerca o vence arranca sin marcar. */
export async function marcarEscrito(fd: FormData) {
  await requireAdmin();
  const ids = fd.getAll("cuota_id").map((v) => Number(v)).filter((n) => n > 0);
  const volverPedido = txt(fd, "volver");
  const volver = volverPedido.startsWith("/admin/vencimientos") ? volverPedido : "/admin/vencimientos";
  if (!ids.length) ir(volver, "error", "No hay cuotas para marcar.");
  await q(`UPDATE cuotas SET escrito_en = ${txt(fd, "escrito") === "1" ? "now()" : "NULL"} WHERE id IN (${enLista(ids)}) AND estado = 'pendiente'`);
  throw new Redirigir(volver);
}

// ───────── Documentos ─────────
export async function subirDocumento(fd: FormData) {
  const yo = await requireAdmin();
  const pid = Number(txt(fd, "poliza_id"));
  const volver = `/admin/polizas/${pid}`;
  const tipo = txt(fd, "tipo");
  if (!TIPOS_DOC[tipo]) ir(volver, "error", "Tipo de documento inválido.");
  const p = await q1("SELECT cliente_id FROM polizas WHERE id = $1", [pid]);
  if (!p) ir("/admin/polizas", "error", "Póliza inexistente.");
  const a = await archivoSeguro(fd, "archivo", volver);
  if (!a) ir(volver, "error", "Elegí un archivo para subir.");
  await guardarDoc(a!, { cliente_id: p!.cliente_id, poliza_id: pid, tipo, subido_por: yo.id });
  ir(volver, "ok", `${TIPOS_DOC[tipo]} cargado.`);
}

export async function eliminarDocumento(fd: FormData) {
  await requireAdmin();
  await q("DELETE FROM documentos WHERE id = $1", [Number(txt(fd, "id"))]);
  ir(txt(fd, "volver") || "/admin", "ok", "Documento eliminado.");
}

// ───────── Cobros ─────────
const METODOS_PERMITIDOS = ["efectivo", "transferencia"] as const;

export async function registrarPago(fd: FormData) {
  const yo = await requireAdmin();
  const cid = Number(txt(fd, "cliente_id"));
  const volver = `/admin/pagos/nuevo?cliente=${cid}`;
  const metodo = txt(fd, "metodo");
  const cuotaIds = fd.getAll("cuota_id").map((v) => Number(v)).filter((n) => n > 0);
  if (!(METODOS_PERMITIDOS as readonly string[]).includes(metodo)) ir(volver, "error", "Solo se pueden registrar pagos en efectivo o por transferencia.");
  if (!cuotaIds.length) ir(volver, "error", "Elegí al menos una cuota de las que se están pagando.");
  const comprobante = await archivoSeguro(fd, "comprobante", volver);
  const reciboPropio = await archivoSeguro(fd, "recibo_propio", volver);
  let pagoId: number;
  try {
    // El importe de cada cuota es el suyo y la fecha es la de hoy: no se pueden modificar. Un solo recibo por todas.
    pagoId = await registrarPagosCuotas({
      clienteId: cid,
      cuotaIds,
      fecha: hoy(),
      metodo,
      referencia: txtONull(fd, "referencia"),
      observaciones: txtONull(fd, "observaciones"),
      userId: yo.id,
      comprobante,
      reciboPropio,
    });
  } catch (e) {
    ir(volver, "error", e instanceof Error ? e.message : "No se pudo registrar el cobro.");
  }
  ir(`/admin/pagos/${pagoId}`, "ok", cuotaIds.length > 1 ? `Cobro registrado: ${cuotaIds.length} cuotas con un solo recibo.` : "Cobro registrado y recibo emitido.");
}

export async function anularPago(fd: FormData) {
  await requireAdmin();
  const id = Number(txt(fd, "id"));
  const volver = `/admin/pagos/${id}`;
  const motivo = txt(fd, "motivo");
  if (motivo.length < 3) ir(volver, "error", "Indicá el motivo de la anulación.");
  const p = await q1("SELECT recibo_nro, cliente_id, estado FROM pagos WHERE id = $1", [id]);
  if (!p) ir("/admin/pagos", "error", "Pago inexistente.");
  if (p!.estado === "anulado") ir(volver, "error", "El pago ya estaba anulado.");
  // Si el recibo cubre varias cuotas, se anulan todas juntas.
  const grupo = await q("SELECT id, cuota_id FROM pagos WHERE recibo_nro = $1 AND cliente_id = $2 AND estado = 'aplicado'", [p!.recibo_nro, p!.cliente_id]);
  for (const g of grupo) {
    await q("UPDATE pagos SET estado = 'anulado', anulado_motivo = $2 WHERE id = $1", [g.id, motivo]);
    await recalcularCuota(g.cuota_id);
  }
  ir(volver, "ok", grupo.length > 1 ? "Recibo anulado. Las cuotas volvieron a quedar pendientes." : "Pago anulado. La cuota volvió a quedar pendiente.");
}

export async function subirArchivoPago(fd: FormData) {
  const yo = await requireAdmin();
  const id = Number(txt(fd, "pago_id"));
  const volver = `/admin/pagos/${id}`;
  const tipo = txt(fd, "tipo") === "recibo" ? "recibo" : "comprobante";
  const p = await q1("SELECT cliente_id, poliza_id FROM pagos WHERE id = $1", [id]);
  if (!p) ir("/admin/pagos", "error", "Pago inexistente.");
  const a = await archivoSeguro(fd, "archivo", volver);
  if (!a) ir(volver, "error", "Elegí un archivo.");
  await guardarDoc(a!, { cliente_id: p!.cliente_id, poliza_id: p!.poliza_id, pago_id: id, tipo, subido_por: yo.id });
  ir(volver, "ok", "Archivo cargado.");
}

export async function rechazarAviso(fd: FormData) {
  await requireAdmin();
  const id = Number(txt(fd, "id"));
  const motivo = txt(fd, "motivo");
  if (motivo.length < 3) ir("/admin/comprobantes", "error", "Indicá el motivo del rechazo (el cliente lo va a ver).");
  await q("UPDATE avisos_pago SET estado = 'rechazado', motivo = $2 WHERE id = $1 AND estado = 'pendiente'", [id, motivo]);
  await q("UPDATE alertas SET estado = 'resuelta', resuelta_en = now() WHERE tipo = 'pago_informado' AND datos = $1", [String(id)]);
  ir("/admin/comprobantes", "ok", "Comprobante rechazado. El cliente verá el motivo.");
}

/** Borra por completo un cliente y todo lo suyo (pólizas, cuotas, pagos, archivos, acceso). */
export async function eliminarCliente(fd: FormData) {
  await requireAdmin();
  const id = Number(txt(fd, "id"));
  const volver = `/admin/clientes/${id}`;
  if (txt(fd, "confirmar") !== "ELIMINAR") ir(volver, "error", 'Para eliminar escribí exactamente "ELIMINAR".');
  await q("DELETE FROM pagos WHERE cliente_id = $1", [id]);
  await q("DELETE FROM clientes WHERE id = $1", [id]);
  ir("/admin/clientes", "ok", "Cliente eliminado definitivamente.");
}

// ───────── Anular / reactivar pólizas ─────────
/** Anula la póliza: queda inactiva (el cliente no puede usarla), pero se puede reactivar cuando haga falta. */
export async function anularPoliza(fd: FormData) {
  await requireAdmin();
  const id = Number(txt(fd, "id"));
  const volver = txt(fd, "volver") || `/admin/polizas/${id}`;
  const p = await q1("SELECT estado FROM polizas WHERE id = $1", [id]);
  if (!p) ir("/admin/polizas", "error", "Póliza inexistente.");
  if (p!.estado === "anulada") ir(volver, "error", "La póliza ya estaba anulada.");
  await q("UPDATE polizas SET estado = 'anulada' WHERE id = $1", [id]);
  await q("UPDATE alertas SET estado = 'resuelta', resuelta_en = now() WHERE tipo = 'baja' AND poliza_id = $1 AND estado = 'pendiente'", [id]);
  ir(volver, "ok", "Póliza anulada. Queda inactiva y se puede reactivar cuando quieras.");
}

export async function reactivarPoliza(fd: FormData) {
  await requireAdmin();
  const id = Number(txt(fd, "id"));
  const volver = txt(fd, "volver") || `/admin/polizas/${id}`;
  const p = await q1("SELECT estado FROM polizas WHERE id = $1", [id]);
  if (!p) ir("/admin/polizas", "error", "Póliza inexistente.");
  if (p!.estado !== "anulada") ir(volver, "error", "La póliza no está anulada.");
  await q("UPDATE polizas SET estado = 'vigente' WHERE id = $1", [id]);
  ir(volver, "ok", "Póliza reactivada: vuelve a estar vigente.");
}
