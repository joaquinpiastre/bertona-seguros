/** Acciones del panel: pagos informados, avisos, siniestros y configuración. */
import { requireAdmin } from "../auth";
import { leerArchivo, type Archivo } from "../archivos";
import { guardarDoc, registrarPagoCore, setConfig } from "../core";
import { q, q1 } from "../db";
import { ir, num, txt, txtONull } from "../flash";
import { ESTADOS_SINIESTRO, TIPOS_SINIESTRO, esFecha, hoy } from "../format";

async function archivoSeguro(fd: FormData, campo: string, volver: string): Promise<Archivo | null> {
  try {
    return await leerArchivo(fd, campo);
  } catch (e) {
    ir(volver, "error", e instanceof Error ? e.message : "Archivo inválido.");
  }
}

// ───────── Pagos informados por clientes ─────────
/** Aprueba un pago informado: registra el cobro (importe de la cuota) y emite el recibo. */
export async function aprobarAviso(fd: FormData) {
  const yo = await requireAdmin();
  const id = Number(txt(fd, "id"));
  const volver = "/admin/comprobantes";
  const a = await q1(
    `SELECT a.id, a.cliente_id, a.metodo, a.documento_id, a.cuota_id,
            (a.creado AT TIME ZONE 'America/Argentina/Buenos_Aires')::date::text AS fecha_aviso,
            c.estado AS cuota_estado, c.importe::float8 AS importe, c.poliza_id
     FROM avisos_pago a LEFT JOIN cuotas c ON c.id = a.cuota_id
     WHERE a.id = $1 AND a.estado = 'pendiente'`,
    [id]
  );
  if (!a) ir(volver, "error", "Ese pago ya fue resuelto o no existe.");
  if (!a!.cuota_id) ir(volver, "error", "El cliente no indicó la cuota: rechazá el aviso y pedile que lo informe de nuevo.");
  if (a!.cuota_estado !== "pendiente") ir(volver, "error", "Esa cuota ya figura paga: rechazá el aviso con el motivo.");
  const metodo = ["efectivo", "mercadopago"].includes(a!.metodo) ? a!.metodo : "mercadopago";
  const pagoId = await registrarPagoCore({
    clienteId: a!.cliente_id,
    polizaId: a!.poliza_id,
    cuotaId: a!.cuota_id,
    importe: a!.importe,
    fecha: metodo === "mercadopago" ? a!.fecha_aviso : hoy(),
    metodo,
    userId: yo.id,
    documentoId: a!.documento_id,
  });
  await q("UPDATE avisos_pago SET estado = 'confirmado', pago_id = $2 WHERE id = $1", [id, pagoId]);
  await q("UPDATE alertas SET estado = 'resuelta', resuelta_en = now() WHERE tipo = 'pago_informado' AND datos = $1", [String(id)]);
  ir(volver, "ok", "Pago aprobado: se registró el cobro y se emitió el recibo.");
}

// ───────── Avisos ─────────
export async function resolverAlerta(fd: FormData) {
  await requireAdmin();
  await q("UPDATE alertas SET estado = 'resuelta', resuelta_en = now() WHERE id = $1", [Number(txt(fd, "id"))]);
  ir(txt(fd, "volver") || "/admin/alertas", "ok", "Aviso marcado como resuelto.");
}

export async function anularPolizaDesdeAlerta(fd: FormData) {
  await requireAdmin();
  const id = Number(txt(fd, "id"));
  const a = await q1("SELECT poliza_id FROM alertas WHERE id = $1 AND tipo = 'baja'", [id]);
  if (!a || !a.poliza_id) ir("/admin/alertas", "error", "No se encontró la póliza de esta solicitud.");
  await q("UPDATE polizas SET estado = 'anulada' WHERE id = $1", [a!.poliza_id]);
  await q("UPDATE alertas SET estado = 'resuelta', resuelta_en = now() WHERE id = $1", [id]);
  ir("/admin/alertas", "ok", "Póliza anulada. Si el cliente tiene solo esa póliza, ya no podrá ingresar.");
}

/** Aplica a la póliza los cambios que pidió el cliente en un trámite. */
export async function aplicarTramite(fd: FormData) {
  await requireAdmin();
  const id = Number(txt(fd, "id"));
  const a = await q1("SELECT poliza_id, datos FROM alertas WHERE id = $1 AND tipo = 'tramite'", [id]);
  if (!a || !a.poliza_id) ir("/admin/alertas", "error", "No se encontró la póliza de este trámite.");
  let d: { riesgo?: string; dominio?: string; cobertura?: string } = {};
  try {
    d = JSON.parse(a!.datos ?? "{}").cambios ?? {};
  } catch {
    ir("/admin/alertas", "error", "El trámite no tiene datos válidos.");
  }
  await q(
    `UPDATE polizas SET riesgo = COALESCE($2, riesgo), dominio = COALESCE($3, dominio), cobertura = COALESCE($4, cobertura) WHERE id = $1`,
    [a!.poliza_id, d.riesgo ?? null, d.dominio ? d.dominio.toUpperCase() : null, d.cobertura ?? null]
  );
  await q("UPDATE alertas SET estado = 'resuelta', resuelta_en = now() WHERE id = $1", [id]);
  ir("/admin/alertas", "ok", "Cambios aplicados a la póliza.");
}

// ───────── Configuración ─────────
export async function guardarConfig(fd: FormData) {
  await requireAdmin();
  const dias = Math.round(num(fd, "dias_gracia"));
  if (!(dias >= 0 && dias <= 365)) ir("/admin/configuracion", "error", "Los días de gracia deben estar entre 0 y 365.");
  await setConfig("dias_gracia", String(dias));
  for (const k of ["auxilio_telefono", "auxilio_whatsapp", "auxilio_texto", "auxilio_planes", "mp_instrucciones"]) await setConfig(k, txt(fd, k));
  ir("/admin/configuracion", "ok", "Configuración guardada.");
}

// ───────── Siniestros ─────────
function datosSiniestro(fd: FormData) {
  return {
    fecha: txt(fd, "fecha_hecho"),
    hora: txtONull(fd, "hora"),
    lugar: txtONull(fd, "lugar"),
    tipo: txt(fd, "tipo"),
    descripcion: txtONull(fd, "descripcion"),
    terceros: txtONull(fd, "terceros"),
    denuncia: txtONull(fd, "denuncia_policial"),
    nroCia: txtONull(fd, "nro_compania"),
    estado: txt(fd, "estado") || "denunciado",
  };
}

export async function crearSiniestro(fd: FormData) {
  await requireAdmin();
  const cid = Number(txt(fd, "cliente_id"));
  const volver = `/admin/siniestros/nuevo?cliente=${cid || ""}`;
  const d = datosSiniestro(fd);
  const pid = Number(txt(fd, "poliza_id")) || null;
  if (!cid || !(await q1("SELECT 1 FROM clientes WHERE id = $1", [cid]))) ir(volver, "error", "Elegí un cliente.");
  if (d.fecha && !esFecha(d.fecha)) ir(volver, "error", "La fecha del hecho no es válida.");
  if (d.tipo && !TIPOS_SINIESTRO.includes(d.tipo)) ir(volver, "error", "Tipo de siniestro inválido.");
  if (!ESTADOS_SINIESTRO[d.estado]) ir(volver, "error", "Estado inválido.");
  const r = await q1(
    `INSERT INTO siniestros (cliente_id, poliza_id, fecha_hecho, hora, lugar, tipo, descripcion, terceros, denuncia_policial, nro_compania, estado)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
    [cid, pid, d.fecha || null, d.hora, d.lugar, d.tipo || null, d.descripcion, d.terceros, d.denuncia, d.nroCia, d.estado]
  );
  ir(`/admin/siniestros/${r!.id}`, "ok", "Siniestro cargado. Podés ir completando la información.");
}

export async function actualizarSiniestro(fd: FormData) {
  await requireAdmin();
  const id = Number(txt(fd, "id"));
  const volver = `/admin/siniestros/${id}`;
  const d = datosSiniestro(fd);
  if (d.fecha && !esFecha(d.fecha)) ir(volver, "error", "La fecha del hecho no es válida.");
  if (d.tipo && !TIPOS_SINIESTRO.includes(d.tipo)) ir(volver, "error", "Tipo de siniestro inválido.");
  if (!ESTADOS_SINIESTRO[d.estado]) ir(volver, "error", "Estado inválido.");
  await q(
    `UPDATE siniestros SET fecha_hecho=$2, hora=$3, lugar=$4, tipo=$5, descripcion=$6, terceros=$7, denuncia_policial=$8, nro_compania=$9, estado=$10 WHERE id=$1`,
    [id, d.fecha || null, d.hora, d.lugar, d.tipo || null, d.descripcion, d.terceros, d.denuncia, d.nroCia, d.estado]
  );
  ir(volver, "ok", "Siniestro actualizado.");
}

export async function agregarNotaSiniestro(fd: FormData) {
  const yo = await requireAdmin();
  const id = Number(txt(fd, "id"));
  const texto = txt(fd, "texto");
  if (texto.length < 2) ir(`/admin/siniestros/${id}`, "error", "Escribí la novedad.");
  await q("INSERT INTO siniestro_notas (siniestro_id, texto, autor) VALUES ($1,$2,$3)", [id, texto, yo.nombre]);
  ir(`/admin/siniestros/${id}`, "ok", "Novedad agregada al seguimiento.");
}

export async function subirArchivoSiniestro(fd: FormData) {
  const yo = await requireAdmin();
  const id = Number(txt(fd, "id"));
  const volver = `/admin/siniestros/${id}`;
  const s = await q1("SELECT cliente_id, poliza_id FROM siniestros WHERE id = $1", [id]);
  if (!s) ir("/admin/siniestros", "error", "Siniestro inexistente.");
  const a = await archivoSeguro(fd, "archivo", volver);
  if (!a) ir(volver, "error", "Elegí un archivo (foto, denuncia, presupuesto...).");
  await guardarDoc(a!, { cliente_id: s!.cliente_id, poliza_id: s!.poliza_id, siniestro_id: id, tipo: "siniestro", subido_por: yo.id });
  ir(volver, "ok", "Archivo agregado al siniestro.");
}

export async function eliminarSiniestro(fd: FormData) {
  await requireAdmin();
  const id = Number(txt(fd, "id"));
  if (txt(fd, "confirmar") !== "ELIMINAR") ir(`/admin/siniestros/${id}`, "error", 'Para eliminar escribí exactamente "ELIMINAR".');
  await q("DELETE FROM documentos WHERE siniestro_id = $1", [id]);
  await q("DELETE FROM siniestros WHERE id = $1", [id]);
  ir("/admin/siniestros", "ok", "Siniestro eliminado.");
}
