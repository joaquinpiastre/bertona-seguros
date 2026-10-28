/**
 * Consultas que alimentan las pantallas del frontend. Cada función devuelve un objeto JSON.
 * Las de /admin exigen administrador; las de /portal exigen socio.
 */
import { portalUsuario, requireAdmin } from "./auth";
import { enLista } from "./core";
import { q, q1 } from "./db";
import { ESTADOS_POLIZA, METODOS, esFecha, hoy, sumarDias } from "./format";
import { NoEncontrado } from "./flash";
import { listarPagos } from "./queries";

type SP = URLSearchParams;
const idDe = (sp: SP) => Number(sp.get("id")) || 0;

export const DATOS: Record<string, (sp: SP) => Promise<unknown>> = {
  // ───────── Administración ─────────
  async resumen() {
    await requireAdmin();
    const h = hoy();
    const mesIni = h.slice(0, 8) + "01";
    const en7 = sumarDias(h, 7);
    const en30 = sumarDias(h, 30);
    const [mes, dia, venc, prox, polizas, porVencer, clientes, hoyMetodos, vencidas, proximas, ultimos, avisos] = await Promise.all([
      q1("SELECT COALESCE(SUM(importe),0)::float8 AS t, COUNT(*)::int AS n FROM pagos WHERE estado='aplicado' AND fecha >= $1 AND fecha <= $2", [mesIni, h]),
      q1("SELECT COALESCE(SUM(importe),0)::float8 AS t, COUNT(*)::int AS n FROM pagos WHERE estado='aplicado' AND fecha = $1", [h]),
      q1("SELECT COALESCE(SUM(importe),0)::float8 AS t, COUNT(*)::int AS n FROM cuotas WHERE estado='pendiente' AND vencimiento < $1", [h]),
      q1("SELECT COALESCE(SUM(importe),0)::float8 AS t, COUNT(*)::int AS n FROM cuotas WHERE estado='pendiente' AND vencimiento BETWEEN $1 AND $2", [h, en7]),
      q1("SELECT COUNT(*)::int AS n FROM polizas WHERE estado = 'vigente'"),
      q1("SELECT COUNT(*)::int AS n FROM polizas WHERE estado = 'vigente' AND vigencia_hasta BETWEEN $1 AND $2", [h, en30]),
      q1("SELECT COUNT(*)::int AS n FROM clientes WHERE activo"),
      q("SELECT metodo, SUM(importe)::float8 AS t FROM pagos WHERE estado='aplicado' AND fecha = $1 GROUP BY metodo ORDER BY t DESC", [h]),
      q(
        `SELECT c.id, c.numero, c.vencimiento::text AS venc, c.importe::float8 AS importe, p.id AS poliza_id, p.numero AS poliza, p.cuotas_cant, p.compania, p.dominio, cl.id AS cliente_id, cl.nombre AS cliente
         FROM cuotas c JOIN polizas p ON p.id = c.poliza_id JOIN clientes cl ON cl.id = p.cliente_id
         WHERE c.estado = 'pendiente' AND c.vencimiento < $1 ORDER BY c.vencimiento LIMIT 8`, [h]),
      q(
        `SELECT c.id, c.numero, c.vencimiento::text AS venc, c.importe::float8 AS importe, p.id AS poliza_id, p.numero AS poliza, p.cuotas_cant, p.compania, p.dominio, cl.id AS cliente_id, cl.nombre AS cliente
         FROM cuotas c JOIN polizas p ON p.id = c.poliza_id JOIN clientes cl ON cl.id = p.cliente_id
         WHERE c.estado = 'pendiente' AND c.vencimiento BETWEEN $1 AND $2 ORDER BY c.vencimiento LIMIT 8`, [h, en7]),
      q(
        `SELECT pg.id, pg.recibo_nro, pg.fecha::text AS fecha, pg.importe::float8 AS importe, pg.metodo, pg.estado, cl.id AS cliente_id, cl.nombre AS cliente, p.numero AS poliza
         FROM pagos pg JOIN clientes cl ON cl.id = pg.cliente_id LEFT JOIN polizas p ON p.id = pg.poliza_id
         ORDER BY pg.id DESC LIMIT 8`),
      q1("SELECT COUNT(*)::int AS n FROM avisos_pago WHERE estado = 'pendiente'"),
    ]);
    return { mes, dia, venc, prox, polizas, porVencer, clientes, hoyMetodos, vencidas, proximas, ultimos, avisos };
  },

  async cobranzas(sp) {
    await requireAdmin();
    const h = hoy();
    const filtro = sp.get("filtro") === "proximas" || sp.get("filtro") === "todas" ? sp.get("filtro") : "vencidas";
    const params: unknown[] = [];
    let where = "c.estado = 'pendiente'";
    if (filtro === "vencidas") {
      params.push(h);
      where += ` AND c.vencimiento < $${params.length}`;
    } else if (filtro === "proximas") {
      params.push(h, sumarDias(h, 15));
      where += ` AND c.vencimiento BETWEEN $${params.length - 1} AND $${params.length}`;
    }
    const busq = sp.get("q");
    if (busq) {
      params.push(`%${busq}%`);
      where += ` AND (cl.nombre ILIKE $${params.length} OR p.numero ILIKE $${params.length} OR p.dominio ILIKE $${params.length})`;
    }
    const filas = await q(
      `SELECT c.id, c.numero, c.vencimiento::text AS venc, c.importe::float8 AS importe,
              p.id AS poliza_id, p.numero AS poliza, p.cuotas_cant, p.compania, p.dominio, p.riesgo,
              cl.id AS cliente_id, cl.nombre AS cliente, cl.telefono
       FROM cuotas c JOIN polizas p ON p.id = c.poliza_id JOIN clientes cl ON cl.id = p.cliente_id
       WHERE ${where} AND cl.activo AND p.estado <> 'anulada'
       ORDER BY c.vencimiento, cl.nombre LIMIT 300`,
      params
    );
    return { filas };
  },

  async pagos(sp) {
    await requireAdmin();
    const h = hoy();
    const desde = esFecha(sp.get("desde")) ? sp.get("desde")! : h.slice(0, 8) + "01";
    const hasta = esFecha(sp.get("hasta")) ? sp.get("hasta")! : h;
    const m = sp.get("metodo") ?? "";
    const filas = await listarPagos({
      desde, hasta, metodo: METODOS[m] ? m : undefined, busqueda: sp.get("q")?.trim() || undefined, estado: sp.get("estado") || undefined,
    });
    return { filas };
  },

  async pagosNuevo(sp) {
    await requireAdmin();
    let clienteId = Number(sp.get("cliente")) || 0;
    const cuotaId = Number(sp.get("cuota")) || 0;
    const avisoId = Number(sp.get("aviso")) || 0;
    let aviso: Record<string, unknown> | null = null;
    if (avisoId) {
      aviso = await q1(
        `SELECT id, cliente_id, cuota_id, importe::float8 AS importe, fecha::text AS fecha, metodo, nota, documento_id,
                COALESCE((SELECT json_agg(cuota_id) FROM aviso_cuotas WHERE aviso_id = avisos_pago.id), '[]'::json) AS cuotas
         FROM avisos_pago WHERE id = $1 AND estado = 'pendiente'`,
        [avisoId]
      );
      if (aviso && !clienteId) clienteId = Number(aviso.cliente_id);
      if (aviso && Number(aviso.cliente_id) !== clienteId) aviso = null;
    }
    if (!clienteId && cuotaId) {
      const r = await q("SELECT p.cliente_id FROM cuotas c JOIN polizas p ON p.id = c.poliza_id WHERE c.id = $1", [cuotaId]);
      clienteId = r[0]?.cliente_id ?? 0;
    }
    const clientes = await q("SELECT id, nombre, documento FROM clientes WHERE activo ORDER BY nombre");
    const cliente = clienteId ? (await q("SELECT id, nombre, documento, telefono FROM clientes WHERE id = $1", [clienteId]))[0] ?? null : null;
    const cuotas = cliente
      ? await q(
          `SELECT c.id, c.numero, c.vencimiento::text AS vencimiento, c.importe::float8 AS importe, p.numero AS poliza, p.compania,
                  COALESCE(p.dominio,'') AS dominio, p.cuotas_cant AS total
           FROM cuotas c JOIN polizas p ON p.id = c.poliza_id
           WHERE p.cliente_id = $1 AND c.estado = 'pendiente' AND p.estado <> 'anulada'
           ORDER BY c.vencimiento, p.id, c.numero LIMIT 60`,
          [clienteId]
        )
      : [];
    const polizas = cliente ? await q("SELECT id, compania, numero FROM polizas WHERE cliente_id = $1 ORDER BY id DESC", [clienteId]) : [];
    return { clienteId, clientes, cliente, cuotas, polizas, aviso };
  },

  async pagoDetalle(sp) {
    await requireAdmin();
    const p = await q1(
      `SELECT pg.*, pg.fecha::text AS fecha_t, pg.importe::float8 AS imp, cl.nombre AS cliente, cl.telefono, cl.id AS cid, u.nombre AS por
       FROM pagos pg JOIN clientes cl ON cl.id = pg.cliente_id LEFT JOIN usuarios u ON u.id = pg.registrado_por
       WHERE pg.id = $1`,
      [idDe(sp)]
    );
    if (!p) throw new NoEncontrado();
    // Un recibo puede cubrir varias cuotas: se muestran todas.
    const lineas = await q(
      `SELECT pg.id, pg.importe::float8 AS importe, po.id AS poliza_id, po.numero AS poliza, po.compania, po.dominio, po.riesgo, po.cuotas_cant,
              c.numero AS cuota_n, c.vencimiento::text AS vto
       FROM pagos pg LEFT JOIN polizas po ON po.id = pg.poliza_id LEFT JOIN cuotas c ON c.id = pg.cuota_id
       WHERE pg.recibo_nro = $1 AND pg.cliente_id = $2 ORDER BY po.id, c.numero`,
      [p.recibo_nro, p.cliente_id]
    );
    const total = lineas.reduce((s, l) => s + (l.importe as number), 0);
    const docs = await q(
      `SELECT id, tipo, nombre, tamano, creado::text AS creado FROM documentos WHERE pago_id IN (${enLista(lineas.map((l) => l.id as number))}) ORDER BY id`
    );
    return { p, docs, lineas, total };
  },

  async clientes(sp) {
    await requireAdmin();
    const params: unknown[] = [];
    let where = sp.get("ver") === "inactivos" ? "NOT c.activo" : "c.activo";
    const busq = sp.get("q");
    if (busq) {
      params.push(`%${busq}%`);
      where += ` AND (c.nombre ILIKE $1 OR c.documento ILIKE $1 OR c.email ILIKE $1 OR c.telefono ILIKE $1 OR EXISTS (SELECT 1 FROM polizas p WHERE p.cliente_id = c.id AND (p.numero ILIKE $1 OR p.dominio ILIKE $1)))`;
    }
    const filas = await q(
      `SELECT c.id, c.nombre, c.documento, c.telefono, c.email,
              (SELECT COUNT(*)::int FROM polizas p WHERE p.cliente_id = c.id AND p.estado = 'vigente') AS polizas,
              (SELECT COALESCE(SUM(x.importe),0)::float8 FROM cuotas x JOIN polizas p ON p.id = x.poliza_id WHERE p.cliente_id = c.id AND x.estado = 'pendiente' AND x.vencimiento < $${params.length + 1}) AS deuda,
              EXISTS (SELECT 1 FROM usuarios u WHERE u.cliente_id = c.id) AS tiene_acceso
       FROM clientes c WHERE ${where} ORDER BY c.nombre LIMIT 300`,
      [...params, hoy()]
    );
    return { filas };
  },

  async clienteDetalle(sp) {
    await requireAdmin();
    const cid = idDe(sp);
    const c = await q1("SELECT * FROM clientes WHERE id = $1", [cid]);
    if (!c) throw new NoEncontrado();
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
         WHERE p.cliente_id = $1 AND x.estado = 'pendiente' AND x.vencimiento < $2`, [cid, hoy()]),
    ]);
    return { c, acceso, contactos, polizas, pagos, deuda };
  },

  async polizas(sp) {
    await requireAdmin();
    const h = hoy();
    const params: unknown[] = [];
    const cond: string[] = [];
    const busq = sp.get("q");
    if (busq) {
      params.push(`%${busq}%`);
      cond.push(`(cl.nombre ILIKE $${params.length} OR p.numero ILIKE $${params.length} OR p.dominio ILIKE $${params.length} OR p.compania ILIKE $${params.length})`);
    }
    const estado = sp.get("estado");
    if (estado && ESTADOS_POLIZA[estado]) { params.push(estado); cond.push(`p.estado = $${params.length}`); }
    const ramo = sp.get("ramo");
    if (ramo) { params.push(ramo); cond.push(`p.ramo = $${params.length}`); }
    if (sp.get("porvencer")) { params.push(h, sumarDias(h, 30)); cond.push(`p.estado = 'vigente' AND p.vigencia_hasta BETWEEN $${params.length - 1} AND $${params.length}`); }
    const filas = await q(
      `SELECT p.id, p.ramo, p.compania, p.numero, p.dominio, p.riesgo, p.estado, p.vigencia_hasta::text AS hasta, cl.id AS cliente_id, cl.nombre AS cliente,
              (SELECT COUNT(*)::int FROM documentos d WHERE d.poliza_id = p.id AND d.tipo = 'poliza') AS tiene_poliza,
              (SELECT COUNT(*)::int FROM documentos d WHERE d.poliza_id = p.id AND d.tipo = 'certificado') AS tiene_cert,
              (SELECT COUNT(*)::int FROM cuotas c WHERE c.poliza_id = p.id AND c.estado = 'pendiente' AND c.vencimiento < $${params.length + 1}) AS vencidas
       FROM polizas p JOIN clientes cl ON cl.id = p.cliente_id
       ${cond.length ? "WHERE " + cond.join(" AND ") : ""} ORDER BY p.id DESC LIMIT 300`,
      [...params, h]
    );
    return { filas };
  },

  async polizaNueva() {
    await requireAdmin();
    return { clientes: await q("SELECT id, nombre, documento FROM clientes WHERE activo ORDER BY nombre") };
  },

  async polizaDetalle(sp) {
    await requireAdmin();
    const pid = idDe(sp);
    const p = await q1(
      `SELECT p.*, p.vigencia_desde::text AS desde, p.vigencia_hasta::text AS hasta, p.suma_asegurada::float8 AS suma, p.importe_cuota::float8 AS imp,
              cl.nombre AS cliente, cl.telefono,
              (SELECT COUNT(*)::int FROM pagos WHERE poliza_id = p.id) AS npagos
       FROM polizas p JOIN clientes cl ON cl.id = p.cliente_id WHERE p.id = $1`,
      [pid]
    );
    if (!p) throw new NoEncontrado();
    const [cuotas, docs] = await Promise.all([
      q(
        `SELECT c.id, c.numero, c.vencimiento::text AS venc, c.importe::float8 AS importe, c.estado,
                (SELECT pg.id FROM pagos pg WHERE pg.cuota_id = c.id AND pg.estado = 'aplicado' ORDER BY pg.id DESC LIMIT 1) AS pago_id,
                (SELECT pg.recibo_nro FROM pagos pg WHERE pg.cuota_id = c.id AND pg.estado = 'aplicado' ORDER BY pg.id DESC LIMIT 1) AS recibo
         FROM cuotas c WHERE c.poliza_id = $1 ORDER BY c.numero`, [pid]),
      q("SELECT id, tipo, nombre, tamano, creado::text AS creado FROM documentos WHERE poliza_id = $1 AND pago_id IS NULL ORDER BY id", [pid]),
    ]);
    return { p, cuotas, docs };
  },

  async avisos() {
    await requireAdmin();
    const filas = await q(
      `SELECT a.id, a.estado, a.motivo, a.importe::float8 AS importe, a.fecha::text AS fecha, a.metodo, a.nota, a.documento_id, a.creado::text AS creado,
              a.cliente_id, cl.nombre AS cliente, cl.telefono, p.numero AS poliza, p.compania, p.dominio, c.id AS cuota_id, c.numero AS cuota_n,
              c.importe::float8 AS cuota_importe, p.cuotas_cant, a.pago_id,
              (SELECT json_agg(json_build_object('poliza', p2.numero, 'compania', p2.compania, 'cuota', c2.numero, 'total', p2.cuotas_cant, 'dominio', p2.dominio, 'venc', c2.vencimiento::text, 'importe', c2.importe::float8) ORDER BY p2.id, c2.numero)
                  FROM aviso_cuotas ac JOIN cuotas c2 ON c2.id = ac.cuota_id JOIN polizas p2 ON p2.id = c2.poliza_id WHERE ac.aviso_id = a.id) AS lineas
       FROM avisos_pago a JOIN clientes cl ON cl.id = a.cliente_id
       LEFT JOIN polizas p ON p.id = a.poliza_id LEFT JOIN cuotas c ON c.id = a.cuota_id
       WHERE a.estado = 'pendiente' OR a.creado > now() - interval '30 days'
       ORDER BY (a.estado = 'pendiente') DESC, a.id DESC LIMIT 100`
    );
    return { filas };
  },

  async equipo() {
    await requireAdmin();
    return { admins: await q("SELECT id, nombre, email, activo, creado::text AS creado FROM usuarios WHERE rol = 'admin' ORDER BY id") };
  },

  // ───────── Portal de socios ─────────
  async portalLayout() {
    const u = await portalUsuario({ permitirCambio: true });
    return { c: await q1("SELECT nombre FROM clientes WHERE id = $1", [u.cliente_id]) };
  },

  async portalInicio() {
    const u = await portalUsuario();
    const [c, polizas, cuotas, pagos, nContactos] = await Promise.all([
      q1("SELECT nombre FROM clientes WHERE id = $1", [u.cliente_id]),
      q(
        `SELECT p.id, p.ramo, p.compania, p.numero, p.riesgo, p.dominio, p.estado, p.vigencia_hasta::text AS hasta,
                (SELECT id FROM documentos d WHERE d.poliza_id = p.id AND d.tipo = 'poliza' ORDER BY id DESC LIMIT 1) AS doc_poliza,
                (SELECT id FROM documentos d WHERE d.poliza_id = p.id AND d.tipo = 'certificado' ORDER BY id DESC LIMIT 1) AS doc_cert
         FROM polizas p WHERE p.cliente_id = $1 AND p.estado IN ('vigente','en_tramite') ORDER BY p.id DESC`, [u.cliente_id]),
      q(
        `SELECT c.id, c.numero, c.vencimiento::text AS venc, c.importe::float8 AS importe, p.numero AS poliza, p.compania, p.cuotas_cant
         FROM cuotas c JOIN polizas p ON p.id = c.poliza_id
         WHERE p.cliente_id = $1 AND c.estado = 'pendiente' AND p.estado <> 'anulada' ORDER BY c.vencimiento LIMIT 10`, [u.cliente_id]),
      q(
        `SELECT pg.id, pg.recibo_nro, pg.fecha::text AS fecha, pg.importe::float8 AS importe, p.numero AS poliza
         FROM pagos pg LEFT JOIN polizas p ON p.id = pg.poliza_id WHERE pg.cliente_id = $1 AND pg.estado = 'aplicado'
         ORDER BY pg.fecha DESC, pg.id DESC LIMIT 3`, [u.cliente_id]),
      q1("SELECT COUNT(*)::int AS n FROM contactos_emergencia WHERE cliente_id = $1", [u.cliente_id]),
    ]);
    return { c, polizas, cuotas, pagos, nContactos };
  },

  async portalPolizas() {
    const u = await portalUsuario();
    const polizas = await q(
      `SELECT p.*, p.vigencia_desde::text AS desde, p.vigencia_hasta::text AS hasta, p.suma_asegurada::float8 AS suma, p.importe_cuota::float8 AS imp,
              (SELECT COUNT(*)::int FROM cuotas c WHERE c.poliza_id = p.id AND c.estado = 'pagada') AS pagadas,
              (SELECT COUNT(*)::int FROM cuotas c WHERE c.poliza_id = p.id AND c.estado <> 'anulada') AS total
       FROM polizas p WHERE p.cliente_id = $1 ORDER BY (p.estado = 'vigente') DESC, p.id DESC`, [u.cliente_id]);
    const docs = await q(
      "SELECT id, poliza_id, tipo, nombre, tamano FROM documentos WHERE cliente_id = $1 AND pago_id IS NULL AND poliza_id IS NOT NULL ORDER BY id", [u.cliente_id]);
    return { polizas, docs };
  },

  async portalPagos() {
    const u = await portalUsuario();
    const [cuotas, pagos, comprobantes] = await Promise.all([
      q(
        `SELECT c.id, c.numero, c.vencimiento::text AS venc, c.importe::float8 AS importe, p.numero AS poliza, p.compania, p.dominio, p.cuotas_cant
         FROM cuotas c JOIN polizas p ON p.id = c.poliza_id
         WHERE p.cliente_id = $1 AND c.estado = 'pendiente' AND p.estado <> 'anulada' ORDER BY c.vencimiento`, [u.cliente_id]),
      q(
        `SELECT pg.id, pg.recibo_nro, pg.fecha::text AS fecha, pg.importe::float8 AS importe, pg.metodo, p.numero AS poliza, p.compania, c.numero AS cuota_n, p.cuotas_cant
         FROM pagos pg LEFT JOIN polizas p ON p.id = pg.poliza_id LEFT JOIN cuotas c ON c.id = pg.cuota_id
         WHERE pg.cliente_id = $1 AND pg.estado = 'aplicado' ORDER BY pg.fecha DESC, pg.id DESC LIMIT 200`, [u.cliente_id]),
      q("SELECT id, pago_id, nombre FROM documentos WHERE cliente_id = $1 AND tipo = 'comprobante' AND pago_id IS NOT NULL", [u.cliente_id]),
    ]);
    const avisos = await q(
      `SELECT a.id, a.estado, a.motivo, a.importe::float8 AS importe, a.fecha::text AS fecha, a.metodo, a.creado::text AS creado, a.documento_id,
              c.numero AS cuota_n, p.cuotas_cant, p.numero AS poliza, p.compania
       FROM avisos_pago a LEFT JOIN cuotas c ON c.id = a.cuota_id LEFT JOIN polizas p ON p.id = a.poliza_id
       WHERE a.cliente_id = $1 ORDER BY a.id DESC LIMIT 20`, [u.cliente_id]);
    return { cuotas, pagos, comprobantes, avisos };
  },

  async portalPresentar() {
    const u = await portalUsuario();
    const h = hoy();
    const c = await q1("SELECT nombre, documento FROM clientes WHERE id = $1", [u.cliente_id]);
    const polizas = await q(
      `SELECT p.id, p.ramo, p.compania, p.numero, p.riesgo, p.dominio, p.estado, p.suma_asegurada::float8 AS suma,
              p.vigencia_desde::text AS desde, p.vigencia_hasta::text AS hasta,
              (SELECT COUNT(*)::int FROM cuotas x WHERE x.poliza_id = p.id AND x.estado = 'pendiente' AND x.vencimiento < $2) AS vencidas,
              (SELECT x.vencimiento::text FROM cuotas x WHERE x.poliza_id = p.id AND x.estado = 'pendiente' ORDER BY x.vencimiento LIMIT 1) AS prox_venc,
              (SELECT id FROM documentos d WHERE d.poliza_id = p.id AND d.tipo = 'poliza' AND d.pago_id IS NULL ORDER BY id DESC LIMIT 1) AS doc_poliza,
              (SELECT id FROM documentos d WHERE d.poliza_id = p.id AND d.tipo = 'certificado' AND d.pago_id IS NULL ORDER BY id DESC LIMIT 1) AS doc_cert,
              (SELECT pg.id FROM pagos pg WHERE pg.poliza_id = p.id AND pg.estado = 'aplicado' ORDER BY pg.fecha DESC, pg.id DESC LIMIT 1) AS ult_pago_id,
              (SELECT pg.recibo_nro FROM pagos pg WHERE pg.poliza_id = p.id AND pg.estado = 'aplicado' ORDER BY pg.fecha DESC, pg.id DESC LIMIT 1) AS ult_recibo,
              (SELECT pg.fecha::text FROM pagos pg WHERE pg.poliza_id = p.id AND pg.estado = 'aplicado' ORDER BY pg.fecha DESC, pg.id DESC LIMIT 1) AS ult_pago_fecha
       FROM polizas p WHERE p.cliente_id = $1 AND p.estado IN ('vigente','en_tramite')
       ORDER BY (p.dominio IS NULL), p.id DESC`, [u.cliente_id, h]);
    return { c, polizas };
  },

  async portalContactos() {
    const u = await portalUsuario();
    return { contactos: await q("SELECT * FROM contactos_emergencia WHERE cliente_id = $1 ORDER BY id", [u.cliente_id]) };
  },

  async portalPerfil() {
    const u = await portalUsuario({ permitirCambio: true });
    return { c: await q1("SELECT * FROM clientes WHERE id = $1", [u.cliente_id]) };
  },
};
