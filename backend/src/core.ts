/** Lógica compartida: pagos, alertas, estado de las pólizas, configuración y usuarios socios. */
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import type { Archivo } from "./archivos";
import { q, q1 } from "./db";
import { fecha, hoy, money, sumarDias } from "./format";
import { cifrar } from "./secreto";

export const soloDigitos = (v: unknown) => String(v ?? "").replace(/\D/g, "");

/** Lista de ids enteros ya validados, lista para usar dentro de IN (...). */
export const enLista = (ids: number[]) => (ids.length ? ids.map((n) => Math.trunc(Number(n))).filter(Number.isFinite).join(",") || "0" : "0");

// ───────── Configuración editable ─────────
export async function getConfig(clave: string, def = ""): Promise<string> {
  const r = await q1("SELECT valor FROM config WHERE clave = $1", [clave]);
  return r ? String(r.valor) : def;
}

export async function setConfig(clave: string, valor: string) {
  await q("INSERT INTO config (clave, valor) VALUES ($1, $2) ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor", [clave, valor]);
}

export async function getConfigs(claves: string[]): Promise<Record<string, string>> {
  const rows = await q("SELECT clave, valor FROM config WHERE clave IN (" + claves.map((_, i) => `$${i + 1}`).join(",") + ")", claves);
  const out: Record<string, string> = {};
  for (const c of claves) out[c] = "";
  for (const r of rows) out[r.clave] = r.valor;
  return out;
}

/** Valor numérico (en días) de una configuración; si falta o no es válido, el valor por defecto. */
async function diasDe(clave: string, def: number): Promise<number> {
  const n = Number(await getConfig(clave, String(def)));
  return Number.isFinite(n) && n >= 0 ? Math.trunc(n) : def;
}

/** Cuántos días después de la última cuota se avisa que hay que refacturar / renovar el seguro. */
export const diasRefacturacion = () => diasDe("dias_refacturacion", 15);
/** Con cuántos días de anticipación se avisa que una póliza está por vencer y hay que renovarla. */
export const diasAvisoRenovacion = () => diasDe("dias_aviso_renovacion", 15);
/** Cuántos días después del último pago se avisa que la póliza quedó paga (no en el momento). */
export const diasAvisoPago = () => diasDe("dias_aviso_pago", 15);
/** Días entre el 1er y el 2.º aviso de cobranza, y entre el 2.º aviso y la alerta si la cuota sigue sin pagarse. */
export const diasEntreAvisos = () => diasDe("dias_entre_avisos", 15);
export const diasGracia = () => diasDe("dias_gracia", 30);

// ───────── Documentos y cuotas ─────────
export async function guardarDoc(
  a: Archivo,
  d: { cliente_id: number; poliza_id?: number | null; pago_id?: number | null; siniestro_id?: number | null; tipo: string; subido_por: number | null }
): Promise<number> {
  const r = await q1(
    `INSERT INTO documentos (cliente_id, poliza_id, pago_id, siniestro_id, tipo, nombre, mime, tamano, datos, subido_por)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
    [d.cliente_id, d.poliza_id ?? null, d.pago_id ?? null, d.siniestro_id ?? null, d.tipo, a.nombre, a.mime, a.datos.length, a.datos, d.subido_por]
  );
  return r!.id as number;
}

export async function recalcularCuota(id: number | null) {
  if (!id) return;
  await q(
    `UPDATE cuotas c SET estado = CASE
       WHEN c.estado = 'anulada' THEN 'anulada'
       WHEN COALESCE((SELECT SUM(importe) FROM pagos WHERE cuota_id = c.id AND estado = 'aplicado'), 0) >= c.importe THEN 'pagada'
       ELSE 'pendiente' END
     WHERE c.id = $1`,
    [id]
  );
}

// ───────── Alertas para la empresa ─────────
export type TipoAlerta = "baja" | "tramite" | "siniestro" | "pago_informado" | "pago_final" | "poliza_vencida" | "por_renovar" | "segundo_aviso" | "refacturacion";

export async function crearAlerta(a: {
  tipo: TipoAlerta;
  cliente_id: number;
  poliza_id?: number | null;
  titulo: string;
  detalle?: string | null;
  datos?: string | null;
  unico?: boolean;
}) {
  if (a.unico) {
    const ya = await q1(
      "SELECT 1 FROM alertas WHERE tipo = $1 AND poliza_id IS NOT DISTINCT FROM $2 AND datos IS NOT DISTINCT FROM $3 LIMIT 1",
      [a.tipo, a.poliza_id ?? null, a.datos ?? null]
    );
    if (ya) return;
  }
  await q("INSERT INTO alertas (tipo, cliente_id, poliza_id, titulo, detalle, datos) VALUES ($1,$2,$3,$4,$5,$6)", [
    a.tipo, a.cliente_id, a.poliza_id ?? null, a.titulo, a.detalle ?? null, a.datos ?? null,
  ]);
}

/**
 * Mantiene al día los avisos automáticos: pólizas vencidas o por renovar, pólizas pagas, 2.º aviso de cobranza sin pago y seguros a refacturar.
 * Se recalcula cada vez que se abre el panel, así que los cambios de configuración y de datos se reflejan al instante.
 */
export async function generarAlertasVencidas() {
  const h = hoy();
  // Si la póliza se renovó (cambió su vigencia) o se anuló, el aviso de "Póliza vencida" ya no corresponde.
  await q(
    `UPDATE alertas a SET estado = 'resuelta', resuelta_en = now()
     WHERE a.tipo = 'poliza_vencida' AND a.estado = 'pendiente' AND a.datos IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM polizas p WHERE p.id = a.poliza_id AND p.estado = 'vigente' AND p.vigencia_hasta::text = a.datos AND p.vigencia_hasta <= $1::date)`,
    [h]
  );
  const filas = await q(
    `SELECT p.id, p.cliente_id, p.numero, p.compania, p.vigencia_hasta::text AS hasta, cl.nombre
     FROM polizas p JOIN clientes cl ON cl.id = p.cliente_id
     WHERE p.estado = 'vigente' AND p.vigencia_hasta IS NOT NULL AND p.vigencia_hasta <= $1::date AND cl.activo
     ORDER BY p.vigencia_hasta DESC LIMIT 200`,
    [h]
  );
  for (const p of filas) {
    await crearAlerta({
      tipo: "poliza_vencida",
      cliente_id: p.cliente_id,
      poliza_id: p.id,
      titulo: "Póliza vencida",
      detalle: `${p.nombre} · ${p.compania} · póliza ${p.numero}. La vigencia terminó el ${fecha(p.hasta)}.`,
      datos: p.hasta,
      unico: true,
    });
  }
  await generarAlertasRenovacion();
  await generarAlertasPagoFinal();
  await generarAlertasSegundoAviso();
  await generarAlertasRefacturacion();
}

/**
 * Avisa de las pólizas que vencen dentro de X días (por defecto 15) para ir renovándolas antes de que se corte la cobertura.
 * Un aviso por póliza y vigencia. Si se renueva (cambia la vigencia), se anula la póliza o llega el vencimiento (ahí rige el aviso
 * "Póliza vencida"), el aviso pendiente se cierra solo.
 */
export async function generarAlertasRenovacion() {
  const h = hoy();
  const limite = sumarDias(h, await diasAvisoRenovacion());
  await q(
    `UPDATE alertas a SET estado = 'resuelta', resuelta_en = now()
     WHERE a.tipo = 'por_renovar' AND a.estado = 'pendiente'
       AND NOT EXISTS (SELECT 1 FROM polizas p WHERE p.id = a.poliza_id AND p.estado = 'vigente' AND p.vigencia_hasta::text = a.datos
                         AND p.vigencia_hasta > $1::date AND p.vigencia_hasta <= $2::date)`,
    [h, limite]
  );
  const filas = await q(
    `SELECT p.id, p.cliente_id, p.numero, p.compania, p.vigencia_hasta::text AS hasta, cl.nombre
     FROM polizas p JOIN clientes cl ON cl.id = p.cliente_id
     WHERE p.estado = 'vigente' AND cl.activo AND p.vigencia_hasta > $1::date AND p.vigencia_hasta <= $2::date
     ORDER BY p.vigencia_hasta LIMIT 200`,
    [h, limite]
  );
  for (const p of filas) {
    await crearAlerta({
      tipo: "por_renovar",
      cliente_id: p.cliente_id,
      poliza_id: p.id,
      titulo: "La póliza está por vencer: hay que renovarla",
      detalle: `${p.nombre} · ${p.compania} · póliza ${p.numero}. La vigencia termina el ${fecha(p.hasta)}.`,
      datos: p.hasta,
      unico: true,
    });
  }
}

/**
 * Avisa de las pólizas cuya última cuota se pagó hace X días (por defecto 15): no en el momento del pago. Solo mira los últimos
 * ~90 días para no llenar los avisos con pólizas viejas. Si la póliza vuelve a tener cuotas pendientes (se anuló o eliminó un cobro,
 * se refacturó), el aviso pendiente se cierra solo.
 */
export async function generarAlertasPagoFinal() {
  const h = hoy();
  const dias = await diasAvisoPago();
  const corte = sumarDias(h, -dias); // el último pago es de esta fecha o antes
  const piso = sumarDias(h, -(dias + 75));
  await q(
    `UPDATE alertas a SET estado = 'resuelta', resuelta_en = now()
     WHERE a.tipo = 'pago_final' AND a.estado = 'pendiente' AND a.datos IS NOT NULL
       AND EXISTS (SELECT 1 FROM cuotas c WHERE c.poliza_id = a.poliza_id AND c.estado = 'pendiente')`
  );
  const filas = await q(
    `SELECT p.id, p.cliente_id, p.numero, p.compania, p.periodicidad, p.cuotas_cant, cl.nombre, u.fecha::text AS fecha
     FROM polizas p
     JOIN clientes cl ON cl.id = p.cliente_id
     JOIN LATERAL (SELECT MAX(pg.fecha) AS fecha FROM pagos pg WHERE pg.poliza_id = p.id AND pg.estado = 'aplicado') u ON TRUE
     WHERE p.estado IN ('vigente','en_tramite') AND cl.activo AND u.fecha IS NOT NULL AND u.fecha <= $1::date AND u.fecha >= $2::date
       AND EXISTS (SELECT 1 FROM cuotas c WHERE c.poliza_id = p.id AND c.estado = 'pagada')
       AND NOT EXISTS (SELECT 1 FROM cuotas c WHERE c.poliza_id = p.id AND c.estado = 'pendiente')
       AND NOT EXISTS (SELECT 1 FROM alertas a WHERE a.tipo = 'pago_final' AND a.poliza_id = p.id AND a.datos IS NULL AND a.creado::date >= u.fecha)
     ORDER BY u.fecha DESC LIMIT 200`,
    [corte, piso]
  );
  for (const p of filas) {
    const anual = p.periodicidad === "anual" || p.cuotas_cant === 1;
    await crearAlerta({
      tipo: "pago_final",
      cliente_id: p.cliente_id,
      poliza_id: p.id,
      titulo: anual ? "Se pagó la póliza anual" : "Se pagó la última cuota de la póliza",
      detalle: `${p.nombre} · ${p.compania} · póliza ${p.numero}. El último pago fue el ${fecha(p.fecha)} y la póliza no tiene más cuotas pendientes.`,
      datos: p.fecha,
      unico: true,
    });
  }
}

/**
 * Cobranza: cuando una cuota ya recibió el 2.º aviso y pasaron X días (por defecto 15) sin que se pague, tira una alerta.
 * Si la cuota se paga o se anula, o se desmarca el 2.º aviso, la alerta pendiente se cierra sola.
 */
export async function generarAlertasSegundoAviso() {
  const limite = sumarDias(hoy(), -(await diasEntreAvisos()));
  await q(
    `UPDATE alertas a SET estado = 'resuelta', resuelta_en = now()
     WHERE a.tipo = 'segundo_aviso' AND a.estado = 'pendiente'
       AND NOT EXISTS (SELECT 1 FROM cuotas c WHERE c.id::text = a.datos AND c.estado = 'pendiente' AND c.aviso2_en IS NOT NULL)`
  );
  const filas = await q(
    `SELECT c.id, c.numero, c.vencimiento::text AS venc, c.importe::float8 AS importe,
            (c.aviso2_en AT TIME ZONE 'America/Argentina/Buenos_Aires')::date::text AS aviso2,
            p.id AS poliza_id, p.numero AS poliza, p.compania, p.cuotas_cant, cl.id AS cliente_id, cl.nombre
     FROM cuotas c JOIN polizas p ON p.id = c.poliza_id JOIN clientes cl ON cl.id = p.cliente_id
     WHERE c.estado = 'pendiente' AND c.aviso2_en IS NOT NULL AND p.estado <> 'anulada' AND cl.activo
       AND (c.aviso2_en AT TIME ZONE 'America/Argentina/Buenos_Aires')::date <= $1::date
     ORDER BY c.aviso2_en LIMIT 200`,
    [limite]
  );
  for (const c of filas) {
    await crearAlerta({
      tipo: "segundo_aviso",
      cliente_id: c.cliente_id,
      poliza_id: c.poliza_id,
      titulo: "Pasó el 2.º aviso y la cuota sigue sin pagarse",
      detalle: `${c.nombre} · ${c.compania} · póliza ${c.poliza}. Cuota ${c.numero} de ${c.cuotas_cant} (${money(c.importe)}), venció el ${fecha(c.venc)}. Se le mandó el 2.º aviso el ${fecha(c.aviso2)} y todavía no pagó.`,
      datos: String(c.id),
      unico: true,
    });
  }
}

/**
 * Avisa de las pólizas cuyas cuotas terminaron hace X días (por defecto 15) para refacturarlas o renovarlas.
 * Solo mira las que terminaron en los últimos ~90 días, para no llenar los avisos con pólizas viejas. Si después se cargan
 * cuotas nuevas (refacturación), el aviso pendiente se resuelve solo.
 */
export async function generarAlertasRefacturacion() {
  const h = hoy();
  const dias = await diasRefacturacion();
  const corte = sumarDias(h, -dias); // la última cuota venció en esta fecha o antes
  const piso = sumarDias(h, -(dias + 75));
  await q(
    `UPDATE alertas a SET estado = 'resuelta', resuelta_en = now()
     WHERE a.tipo = 'refacturacion' AND a.estado = 'pendiente'
       AND EXISTS (SELECT 1 FROM cuotas c WHERE c.poliza_id = a.poliza_id AND c.estado <> 'anulada' AND c.vencimiento > $1::date)`,
    [corte]
  );
  const filas = await q(
    `SELECT p.id, p.cliente_id, p.numero, p.compania, cl.nombre, u.ult::text AS ultima,
            (SELECT COUNT(*)::int FROM cuotas WHERE poliza_id = p.id AND estado = 'pendiente') AS pendientes
     FROM polizas p
     JOIN clientes cl ON cl.id = p.cliente_id
     JOIN LATERAL (SELECT MAX(vencimiento) AS ult FROM cuotas WHERE poliza_id = p.id AND estado <> 'anulada') u ON TRUE
     WHERE p.estado IN ('vigente','en_tramite') AND cl.activo AND u.ult IS NOT NULL AND u.ult <= $1::date AND u.ult >= $2::date
     ORDER BY u.ult DESC LIMIT 200`,
    [corte, piso]
  );
  for (const p of filas) {
    const dmy = String(p.ultima).split("-").reverse().join("/");
    await crearAlerta({
      tipo: "refacturacion",
      cliente_id: p.cliente_id,
      poliza_id: p.id,
      titulo: "Terminaron las cuotas: ese seguro ya venció",
      detalle: `${p.nombre} · ${p.compania} · póliza ${p.numero}. La última cuota venció el ${dmy}.${p.pendientes ? ` Todavía tiene ${p.pendientes} cuota${p.pendientes > 1 ? "s" : ""} sin pagar.` : ""} Hay que refacturar o renovar el seguro.`,
      datos: p.ultima,
      unico: true,
    });
  }
}

// ───────── Estado de las pólizas del cliente ─────────
export type Bloqueo = null | "baja" | "falta_pago";

export const bloqueoDe = (p: { estado: string; atraso: number }, gracia: number): Bloqueo =>
  p.estado === "anulada" ? "baja" : p.atraso > gracia ? "falta_pago" : null;

/** Pólizas del cliente con los días de atraso de su cuota vencida más antigua y su bloqueo. */
export async function estadoPolizas(clienteId: number) {
  const [gracia, filas] = await Promise.all([
    diasGracia(),
    q(
      `SELECT p.id, p.estado,
              COALESCE((SELECT MAX($2::date - x.vencimiento) FROM cuotas x
                        WHERE x.poliza_id = p.id AND x.estado = 'pendiente' AND x.vencimiento < $2::date), 0)::int AS atraso
       FROM polizas p WHERE p.cliente_id = $1`,
      [clienteId, hoy()]
    ),
  ]);
  const todas = filas.map((p) => ({ id: p.id as number, estado: p.estado as string, atraso: p.atraso as number, bloqueo: bloqueoDe(p as never, gracia) }));
  return { gracia, todas, activas: todas.filter((p) => !p.bloqueo).map((p) => p.id), bloqueadas: todas.filter((p) => p.bloqueo) };
}

/** Bloqueo de una póliza puntual (para proteger descargas del cliente). */
export async function bloqueoPoliza(polizaId: number | null): Promise<Bloqueo> {
  if (!polizaId) return null;
  const [gracia, p] = await Promise.all([
    diasGracia(),
    q1(
      `SELECT p.estado,
              COALESCE((SELECT MAX($2::date - x.vencimiento) FROM cuotas x
                        WHERE x.poliza_id = p.id AND x.estado = 'pendiente' AND x.vencimiento < $2::date), 0)::int AS atraso
       FROM polizas p WHERE p.id = $1`,
      [polizaId, hoy()]
    ),
  ]);
  return p ? bloqueoDe(p as never, gracia) : null;
}

export const TEXTO_BLOQUEO: Record<string, string> = {
  baja: "Inhabilitado por falta de pago",
  falta_pago: "Inhabilitado por falta de pago",
};

// ───────── Cobros ─────────
/**
 * Cobra varias cuotas juntas con UN solo recibo: cada cuota queda como una fila de pagos con el mismo N° de recibo.
 * El importe de cada fila es el de su cuota y la fecha la fija quien llama. Devuelve el id del primer pago (cabecera del recibo).
 */
export async function registrarPagosCuotas(a: {
  clienteId: number;
  cuotaIds: number[];
  fecha: string;
  metodo: string;
  referencia?: string | null;
  observaciones?: string | null;
  userId: number | null;
  comprobante?: Archivo | null;
  reciboPropio?: Archivo | null;
  documentoId?: number | null;
}): Promise<number> {
  const ids = [...new Set(a.cuotaIds.map((n) => Math.trunc(Number(n))).filter((n) => n > 0))];
  const cuotas = await q(
    `SELECT c.id, c.poliza_id, c.importe::float8 AS importe FROM cuotas c JOIN polizas p ON p.id = c.poliza_id
     WHERE c.id IN (${enLista(ids)}) AND p.cliente_id = $1 AND c.estado = 'pendiente' ORDER BY p.id, c.numero`,
    [a.clienteId]
  );
  if (!cuotas.length || cuotas.length !== ids.length) throw new Error("Alguna de las cuotas no existe o ya está paga.");
  const nro = (await q1("SELECT nextval('recibo_seq')::int AS n"))!.n as number;
  let primero = 0;
  for (const c of cuotas) {
    const r = await q1(
      `INSERT INTO pagos (recibo_nro, cliente_id, poliza_id, cuota_id, fecha, importe, metodo, referencia, observaciones, registrado_por)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [nro, a.clienteId, c.poliza_id, c.id, a.fecha, c.importe, a.metodo, a.referencia ?? null, a.observaciones ?? null, a.userId]
    );
    if (!primero) primero = r!.id as number;
    await recalcularCuota(c.id);
  }
  const polizaCab = cuotas[0].poliza_id as number;
  if (a.documentoId) await q("UPDATE documentos SET pago_id = $2, poliza_id = COALESCE(poliza_id, $3) WHERE id = $1", [a.documentoId, primero, polizaCab]);
  if (a.comprobante) await guardarDoc(a.comprobante, { cliente_id: a.clienteId, poliza_id: polizaCab, pago_id: primero, tipo: "comprobante", subido_por: a.userId });
  if (a.reciboPropio) await guardarDoc(a.reciboPropio, { cliente_id: a.clienteId, poliza_id: polizaCab, pago_id: primero, tipo: "recibo", subido_por: a.userId });
  return primero;
}

/** Contraseña numérica de 6 dígitos para entregar al cliente. */
export const claveNueva = () => String(100000 + (randomBytes(4).readUInt32BE(0) % 900000));

/**
 * Guarda la contraseña de ingreso del cliente. Si la define la oficina (entregada = true) se guarda además cifrada, para poder volver
 * a compartírsela por WhatsApp; si la cambia el propio cliente, esa copia se borra (solo él la conoce).
 */
export async function fijarClave(usuarioId: number, clave: string, entregada = false) {
  await q("UPDATE usuarios SET password_hash = $2, tiene_clave = TRUE, pin_hash = NULL, clave_cifrada = $3 WHERE id = $1", [
    usuarioId, await bcrypt.hash(clave, 10), entregada ? cifrar(clave) : null,
  ]);
}

// ───────── Usuarios socios (ingreso con DNI y contraseña) ─────────
/** Crea o actualiza el usuario del cliente a partir de su documento: el DNI es su usuario de ingreso (la contraseña la fija la oficina). */
export async function sincronizarUsuarioSocio(clienteId: number): Promise<{ ok: boolean; motivo?: string }> {
  const c = await q1("SELECT id, nombre, documento, activo FROM clientes WHERE id = $1", [clienteId]);
  if (!c) return { ok: false, motivo: "Cliente inexistente." };
  const dni = soloDigitos(c.documento);
  if (dni.length < 7) return { ok: false, motivo: "El DNI debe tener al menos 7 números." };
  try {
    const u = await q1("SELECT id FROM usuarios WHERE cliente_id = $1 AND rol = 'socio' ORDER BY id LIMIT 1", [clienteId]);
    if (u) {
      await q("UPDATE usuarios SET dni = $2, nombre = $3, activo = $4 WHERE id = $1", [u.id, dni, c.nombre, c.activo]);
    } else {
      const hash = await bcrypt.hash(randomBytes(24).toString("hex"), 10);
      await q(
        `INSERT INTO usuarios (email, nombre, password_hash, rol, cliente_id, dni, activo, debe_cambiar_password)
         VALUES (NULL, $1, $2, 'socio', $3, $4, $5, FALSE)`,
        [c.nombre, hash, clienteId, dni, c.activo]
      );
    }
  } catch (e) {
    if ((e as { code?: string }).code === "23505") return { ok: false, motivo: "Ese DNI ya está cargado en otro cliente." };
    throw e;
  }
  return { ok: true };
}
