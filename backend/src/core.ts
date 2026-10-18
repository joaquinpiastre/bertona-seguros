/** Lógica compartida: pagos, alertas, estado de las pólizas, configuración y usuarios socios. */
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import type { Archivo } from "./archivos";
import { q, q1 } from "./db";
import { hoy } from "./format";

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

export async function diasGracia(): Promise<number> {
  const n = Number(await getConfig("dias_gracia", "30"));
  return Number.isFinite(n) && n >= 0 ? Math.trunc(n) : 30;
}

// ───────── Documentos y cuotas ─────────
export async function guardarDoc(
  a: Archivo,
  d: { cliente_id: number; poliza_id?: number | null; pago_id?: number | null; siniestro_id?: number | null; tipo: string; subido_por: number | null }
) {
  await q(
    `INSERT INTO documentos (cliente_id, poliza_id, pago_id, siniestro_id, tipo, nombre, mime, tamano, datos, subido_por)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [d.cliente_id, d.poliza_id ?? null, d.pago_id ?? null, d.siniestro_id ?? null, d.tipo, a.nombre, a.mime, a.datos.length, a.datos, d.subido_por]
  );
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
export type TipoAlerta = "baja" | "tramite" | "siniestro" | "pago_informado" | "pago_final" | "poliza_vencida";

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

/** Avisa a la empresa cuando se pagó la última cuota (o el pago anual) de una póliza. */
export async function verificarPolizaPagada(polizaId: number | null) {
  if (!polizaId) return;
  const p = await q1(
    `SELECT p.id, p.cliente_id, p.numero, p.compania, p.periodicidad, p.cuotas_cant, cl.nombre,
            (SELECT COUNT(*)::int FROM cuotas WHERE poliza_id = p.id AND estado = 'pendiente') AS pend,
            (SELECT COUNT(*)::int FROM cuotas WHERE poliza_id = p.id AND estado = 'pagada') AS pagadas
     FROM polizas p JOIN clientes cl ON cl.id = p.cliente_id WHERE p.id = $1`,
    [polizaId]
  );
  if (!p || p.pend > 0 || p.pagadas === 0) return;
  const anual = p.periodicidad === "anual" || p.cuotas_cant === 1;
  await crearAlerta({
    tipo: "pago_final",
    cliente_id: p.cliente_id,
    poliza_id: p.id,
    titulo: anual ? "Se pagó la póliza anual" : "Se pagó la última cuota de la póliza",
    detalle: `${p.nombre} · ${p.compania} · póliza ${p.numero}. La póliza no tiene más cuotas pendientes.`,
    unico: true,
  });
}

/** Crea el aviso de pólizas cuya vigencia ya terminó (una sola vez por vencimiento). */
export async function generarAlertasVencidas() {
  const h = hoy();
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
      detalle: `${p.nombre} · ${p.compania} · póliza ${p.numero}. La vigencia terminó el ${p.hasta.split("-").reverse().join("/")}.`,
      datos: p.hasta,
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
export async function registrarPagoCore(a: {
  clienteId: number;
  polizaId: number | null;
  cuotaId: number | null;
  importe: number;
  fecha: string;
  metodo: string;
  referencia?: string | null;
  observaciones?: string | null;
  userId: number | null;
  comprobante?: Archivo | null;
  reciboPropio?: Archivo | null;
  documentoId?: number | null;
}): Promise<number> {
  const r = await q1(
    `INSERT INTO pagos (cliente_id, poliza_id, cuota_id, fecha, importe, metodo, referencia, observaciones, registrado_por)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
    [a.clienteId, a.polizaId, a.cuotaId, a.fecha, a.importe, a.metodo, a.referencia ?? null, a.observaciones ?? null, a.userId]
  );
  const pagoId = r!.id as number;
  await recalcularCuota(a.cuotaId);
  if (a.documentoId) await q("UPDATE documentos SET pago_id = $2, poliza_id = COALESCE(poliza_id, $3) WHERE id = $1", [a.documentoId, pagoId, a.polizaId]);
  if (a.comprobante) await guardarDoc(a.comprobante, { cliente_id: a.clienteId, poliza_id: a.polizaId, pago_id: pagoId, tipo: "comprobante", subido_por: a.userId });
  if (a.reciboPropio) await guardarDoc(a.reciboPropio, { cliente_id: a.clienteId, poliza_id: a.polizaId, pago_id: pagoId, tipo: "recibo", subido_por: a.userId });
  await verificarPolizaPagada(a.polizaId);
  return pagoId;
}

// ───────── Usuarios socios (ingreso con DNI) ─────────
/** Crea o actualiza el usuario del cliente a partir de su documento: el DNI es su usuario de ingreso. */
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
