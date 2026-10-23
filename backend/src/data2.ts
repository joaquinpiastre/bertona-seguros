/**
 * Consultas nuevas o ampliadas: vencimientos, avisos, siniestros, configuración y portal con bloqueo por falta de pago.
 * El servidor las junta con las de data.ts (estas tienen prioridad).
 */
import { firmarTokenRecibo, portalUsuario, requireAdmin } from "./auth";
import { diasAvisoCertificado, enLista, estadoPolizas, generarAlertasVencidas, getConfigs, TEXTO_BLOQUEO } from "./core";
import { DATOS } from "./data";
import { q, q1 } from "./db";
import { NoEncontrado } from "./flash";
import { PRODUCTOR } from "./empresa";
import { ADVERTENCIAS_CONSTANCIA } from "./pdf";
import { datosReciboGrupo } from "./queries";
import { hoy, sumarDias, sumarMeses } from "./format";

type SP = URLSearchParams;
const idDe = (sp: SP) => Number(sp.get("id")) || 0;

const LINEAS_AVISO = `(SELECT json_agg(json_build_object('poliza', p2.numero, 'compania', p2.compania, 'cuota', c2.numero, 'total', p2.cuotas_cant, 'dominio', p2.dominio, 'venc', c2.vencimiento::text, 'importe', c2.importe::float8) ORDER BY p2.id, c2.numero)
                  FROM aviso_cuotas ac JOIN cuotas c2 ON c2.id = ac.cuota_id JOIN polizas p2 ON p2.id = c2.poliza_id WHERE ac.aviso_id = a.id) AS lineas`;

const COLS_POLIZA = `p.id, p.ramo, p.compania, p.numero, p.riesgo, p.dominio, p.cobertura, p.estado, p.periodicidad,
  p.suma_asegurada::float8 AS suma, p.importe_cuota::float8 AS imp,
  p.vigencia_desde::text AS desde, p.vigencia_hasta::text AS hasta`;

export const DATOS2: Record<string, (sp: SP) => Promise<unknown>> = {
  // ───────── Administración ─────────
  async resumen(sp) {
    const base = (await DATOS.resumen(sp)) as Record<string, unknown>;
    await generarAlertasVencidas();
    const alertas = await q1("SELECT COUNT(*)::int AS n FROM alertas WHERE estado = 'pendiente'");
    return { ...base, alertas };
  },

  async contadores() {
    await requireAdmin();
    await generarAlertasVencidas();
    const [alertas, pagos] = await Promise.all([
      q1("SELECT COUNT(*)::int AS n FROM alertas WHERE estado = 'pendiente'"),
      q1("SELECT COUNT(*)::int AS n FROM avisos_pago WHERE estado = 'pendiente'"),
    ]);
    return { alertas: alertas!.n, pagos: pagos!.n };
  },

  async vencimientos(sp) {
    await requireAdmin();
    const h = hoy();
    const vista = ["proximas", "todas", "polizas", "certificados"].includes(sp.get("vista") ?? "") ? sp.get("vista")! : "vencidas";
    const busq = sp.get("q");

    // Pólizas con actualización periódica cuyo certificado venció, vence pronto o nunca se cargó.
    if (vista === "certificados") {
      const dias = await diasAvisoCertificado();
      const params: unknown[] = [sumarDias(h, dias)];
      let where = "p.actualizacion_meses > 0 AND p.estado IN ('vigente','en_tramite') AND cl.activo";
      if (busq) {
        params.push(`%${busq}%`);
        where += ` AND (cl.nombre ILIKE $2 OR p.numero ILIKE $2 OR p.dominio ILIKE $2)`;
      }
      const certificados = await q(
        `SELECT * FROM (
           SELECT p.id, p.numero, p.compania, p.ramo, p.riesgo, p.dominio, p.cobro, p.actualizacion_meses,
                  cl.id AS cliente_id, cl.nombre AS cliente, cl.telefono, cl.es_agencia,
                  (SELECT MAX(hasta) FROM certificados WHERE poliza_id = p.id)::text AS hasta
           FROM polizas p JOIN clientes cl ON cl.id = p.cliente_id WHERE ${where}
         ) x WHERE x.hasta IS NULL OR x.hasta::date <= $1::date
         ORDER BY x.hasta NULLS FIRST LIMIT 300`,
        params
      );
      return {
        vista,
        dias,
        certificados: certificados.map((c) => ({ ...c, atraso: c.hasta ? Math.round((Date.parse(h) - Date.parse(c.hasta)) / 86400000) : null })),
      };
    }

    if (vista === "polizas") {
      const params: unknown[] = [h, sumarDias(h, 30)];
      let where = "p.estado = 'vigente' AND p.vigencia_hasta IS NOT NULL AND p.vigencia_hasta <= $2::date AND cl.activo";
      if (busq) {
        params.push(`%${busq}%`);
        where += ` AND (cl.nombre ILIKE $3 OR p.numero ILIKE $3 OR p.dominio ILIKE $3)`;
      }
      const polizas = await q(
        `SELECT p.id, p.numero, p.compania, p.ramo, p.riesgo, p.dominio, p.vigencia_hasta::text AS hasta,
                ($1::date - p.vigencia_hasta)::int AS atraso,
                cl.id AS cliente_id, cl.nombre AS cliente, cl.telefono, cl.es_agencia,
                (SELECT COUNT(*)::int FROM cuotas x WHERE x.poliza_id = p.id AND x.estado = 'pendiente') AS cuotas_pend
         FROM polizas p JOIN clientes cl ON cl.id = p.cliente_id
         WHERE ${where} ORDER BY p.vigencia_hasta LIMIT 300`,
        params
      );
      return { vista, polizas };
    }

    const params: unknown[] = [h];
    let where = "c.estado = 'pendiente' AND cl.activo AND p.estado <> 'anulada'";
    const escrito = sp.get("escrito");
    if (escrito === "no") where += " AND c.escrito_en IS NULL";
    else if (escrito === "si") where += " AND c.escrito_en IS NOT NULL";
    if (vista === "vencidas") where += " AND c.vencimiento < $1::date";
    else if (vista === "proximas") {
      params.push(sumarDias(h, 15));
      where += " AND c.vencimiento BETWEEN $1::date AND $2::date";
    }
    if (busq) {
      params.push(`%${busq}%`);
      where += ` AND (cl.nombre ILIKE $${params.length} OR p.numero ILIKE $${params.length} OR p.dominio ILIKE $${params.length})`;
    }
    const filas = await q(
      `SELECT c.id, c.numero, c.vencimiento::text AS venc, c.importe::float8 AS importe, ($1::date - c.vencimiento)::int AS atraso,
              (c.escrito_en AT TIME ZONE 'America/Argentina/Buenos_Aires')::date::text AS escrito,
              p.id AS poliza_id, p.numero AS poliza, p.cuotas_cant, p.compania, p.dominio, p.riesgo,
              cl.id AS cliente_id, cl.nombre AS cliente, cl.telefono, cl.es_agencia,
              (SELECT COALESCE(SUM(x.importe),0)::float8 FROM cuotas x JOIN polizas px ON px.id = x.poliza_id
                WHERE px.cliente_id = cl.id AND x.estado = 'pendiente' AND x.vencimiento < $1::date) AS deuda_total,
              (SELECT COUNT(*)::int FROM cuotas x JOIN polizas px ON px.id = x.poliza_id
                WHERE px.cliente_id = cl.id AND x.estado = 'pendiente' AND x.vencimiento < $1::date) AS vencidas_n
       FROM cuotas c JOIN polizas p ON p.id = c.poliza_id JOIN clientes cl ON cl.id = p.cliente_id
       WHERE ${where} ORDER BY c.vencimiento, cl.nombre LIMIT 400`,
      params
    );
    return { vista, filas, transferir: (await getConfigs(["mp_instrucciones"])).mp_instrucciones };
  },

  async alertas() {
    await requireAdmin();
    await generarAlertasVencidas();
    const cols = `a.id, a.tipo, a.titulo, a.detalle, a.datos, a.estado, a.creado::text AS creado, a.cliente_id, a.poliza_id,
      cl.nombre AS cliente, cl.telefono, p.numero AS poliza, p.compania, p.dominio, p.riesgo, p.vigencia_hasta::text AS hasta`;
    const base = `FROM alertas a JOIN clientes cl ON cl.id = a.cliente_id LEFT JOIN polizas p ON p.id = a.poliza_id`;
    const [pendientes, resueltas] = await Promise.all([
      q(`SELECT ${cols} ${base} WHERE a.estado = 'pendiente' ORDER BY a.id DESC LIMIT 200`),
      q(`SELECT ${cols} ${base} WHERE a.estado = 'resuelta' ORDER BY a.resuelta_en DESC NULLS LAST LIMIT 25`),
    ]);
    return { pendientes, resueltas };
  },

  async clientes(sp) {
    await requireAdmin();
    const params: unknown[] = [hoy()];
    let where = sp.get("ver") === "inactivos" ? "NOT c.activo" : "c.activo";
    if (sp.get("agencia")) where += " AND c.es_agencia";
    const busq = sp.get("q");
    if (busq) {
      params.push(`%${busq}%`);
      where += ` AND (c.nombre ILIKE $2 OR c.documento ILIKE $2 OR c.email ILIKE $2 OR c.telefono ILIKE $2 OR EXISTS (SELECT 1 FROM polizas p WHERE p.cliente_id = c.id AND (p.numero ILIKE $2 OR p.dominio ILIKE $2)))`;
    }
    const filas = await q(
      `SELECT c.id, c.nombre, c.documento, c.telefono, c.email, c.es_agencia,
              (SELECT COUNT(*)::int FROM polizas p WHERE p.cliente_id = c.id AND p.estado = 'vigente') AS polizas,
              (SELECT COALESCE(SUM(x.importe),0)::float8 FROM cuotas x JOIN polizas p ON p.id = x.poliza_id
                WHERE p.cliente_id = c.id AND x.estado = 'pendiente' AND x.vencimiento < $1::date) AS deuda
       FROM clientes c WHERE ${where} ORDER BY c.nombre LIMIT 300`,
      params
    );
    return { filas };
  },

  async clienteDetalle(sp) {
    const base = (await DATOS.clienteDetalle(sp)) as Record<string, unknown>;
    const acceso = await q1("SELECT tiene_clave, dni, activo FROM usuarios WHERE cliente_id = $1 AND rol = 'socio' LIMIT 1", [idDe(sp)]);
    const siniestros = await q(
      "SELECT s.id, s.estado, s.tipo, s.fecha_hecho::text AS fecha, s.lugar, p.numero AS poliza FROM siniestros s LEFT JOIN polizas p ON p.id = s.poliza_id WHERE s.cliente_id = $1 ORDER BY s.id DESC LIMIT 10",
      [idDe(sp)]
    );
    return { ...base, acceso, siniestros };
  },

  async siniestros(sp) {
    await requireAdmin();
    const params: unknown[] = [];
    const cond: string[] = [];
    const estado = sp.get("estado");
    if (estado) {
      params.push(estado);
      cond.push(`s.estado = $${params.length}`);
    }
    const busq = sp.get("q");
    if (busq) {
      params.push(`%${busq}%`);
      cond.push(`(cl.nombre ILIKE $${params.length} OR p.numero ILIKE $${params.length} OR p.dominio ILIKE $${params.length} OR s.nro_compania ILIKE $${params.length})`);
    }
    const filas = await q(
      `SELECT s.id, s.estado, s.tipo, s.origen, s.fecha_hecho::text AS fecha, s.lugar, s.nro_compania, s.creado::text AS creado,
              cl.id AS cliente_id, cl.nombre AS cliente, p.numero AS poliza, p.compania, p.dominio
       FROM siniestros s JOIN clientes cl ON cl.id = s.cliente_id LEFT JOIN polizas p ON p.id = s.poliza_id
       ${cond.length ? "WHERE " + cond.join(" AND ") : ""} ORDER BY (s.estado = 'cerrado'), s.id DESC LIMIT 300`,
      params
    );
    return { filas };
  },

  async siniestroNuevo(sp) {
    await requireAdmin();
    const cid = Number(sp.get("cliente")) || 0;
    const clientes = await q("SELECT id, nombre, documento FROM clientes WHERE activo ORDER BY nombre");
    const polizas = cid ? await q("SELECT id, compania, numero, dominio, riesgo FROM polizas WHERE cliente_id = $1 ORDER BY id DESC", [cid]) : [];
    return { clienteId: cid, clientes, polizas };
  },

  async siniestroDetalle(sp) {
    await requireAdmin();
    const id = idDe(sp);
    const s = await q1(
      `SELECT s.id, s.estado, s.tipo, s.origen, s.fecha_hecho::text AS fecha, s.hora, s.lugar, s.descripcion, s.terceros, s.denuncia_policial, s.nro_compania,
              s.creado::text AS creado, cl.id AS cliente_id, cl.nombre AS cliente, cl.telefono, cl.documento,
              p.id AS poliza_id, p.numero AS poliza, p.compania, p.dominio, p.riesgo, p.cobertura
       FROM siniestros s JOIN clientes cl ON cl.id = s.cliente_id LEFT JOIN polizas p ON p.id = s.poliza_id WHERE s.id = $1`,
      [id]
    );
    if (!s) throw new NoEncontrado();
    const [notas, docs] = await Promise.all([
      q("SELECT id, texto, autor, creado::text AS creado FROM siniestro_notas WHERE siniestro_id = $1 ORDER BY id DESC", [id]),
      q("SELECT id, tipo, nombre, mime, tamano, creado::text AS creado FROM documentos WHERE siniestro_id = $1 ORDER BY id", [id]),
    ]);
    return { s, notas, docs };
  },

  async constanciaDatos(sp) {
    await requireAdmin();
    const p = await q1(
      `SELECT p.id, p.numero, p.compania, p.ramo, p.riesgo, p.dominio, p.cobertura, p.suma_asegurada::float8 AS suma,
              p.vigencia_desde::text AS desde, p.vigencia_hasta::text AS hasta,
              cl.id AS cliente_id, cl.nombre, cl.documento, cl.direccion, cl.localidad
       FROM polizas p JOIN clientes cl ON cl.id = p.cliente_id WHERE p.id = $1`,
      [idDe(sp)]
    );
    if (!p) throw new NoEncontrado();
    const meses = (await q1("SELECT actualizacion_meses AS m FROM polizas WHERE id = $1", [p.id]))?.m ?? 0;
    return { p, advertencias: ADVERTENCIAS_CONSTANCIA, productor: `${PRODUCTOR.matricula} - ${PRODUCTOR.nombre}`, hoy: hoy(), venceSugerido: meses > 0 ? sumarMeses(hoy(), meses) : "" };
  },

  async reciboEnlace(sp) {
    await requireAdmin();
    const g = await datosReciboGrupo(idDe(sp));
    if (!g) throw new NoEncontrado();
    const total = g.lineas.reduce((s, l) => s + (l.importe as number), 0);
    const c = await q1("SELECT telefono FROM clientes WHERE id = $1", [g.cab.cliente_id]);
    return {
      token: await firmarTokenRecibo(idDe(sp)),
      nro: g.cab.recibo_nro,
      cliente: g.cab.cliente,
      telefono: c?.telefono ?? "",
      total,
      lineas: g.lineas.map((l) => ({ poliza: l.poliza, compania: l.compania, dominio: l.dominio, riesgo: l.riesgo, cuota: l.cuota_n, total: l.cuotas_cant, importe: l.importe })),
    };
  },

  async configuracion() {
    await requireAdmin();
    return { cfg: await getConfigs(["dias_gracia", "dias_aviso_certificado", "dias_refacturacion", "auxilio_telefono", "auxilio_texto", "auxilio_planes", "mp_instrucciones"]) };
  },

  // ───────── Portal del cliente ─────────
  async portalInicio() {
    const u = await portalUsuario();
    const est = await estadoPolizas(u.cliente_id);
    const act = enLista(est.activas);
    const h = hoy();
    const [c, polizas, cuotas, pagos, nContactos, bloqueadas, deuda] = await Promise.all([
      q1("SELECT nombre FROM clientes WHERE id = $1", [u.cliente_id]),
      q(
        `SELECT ${COLS_POLIZA},
                (SELECT id FROM documentos d WHERE d.poliza_id = p.id AND d.tipo = 'poliza' AND d.pago_id IS NULL ORDER BY id DESC LIMIT 1) AS doc_poliza,
                (SELECT id FROM documentos d WHERE d.poliza_id = p.id AND d.tipo = 'certificado' AND d.pago_id IS NULL ORDER BY id DESC LIMIT 1) AS doc_cert
         FROM polizas p WHERE p.id IN (${act}) AND p.estado IN ('vigente','en_tramite') ORDER BY p.id DESC`
      ),
      // Solo la próxima cuota a pagar de cada póliza (no todas las pendientes).
      q(
        `SELECT DISTINCT ON (p.id) c.id, c.numero, c.vencimiento::text AS venc, c.importe::float8 AS importe, p.numero AS poliza, p.compania, p.cuotas_cant, p.dominio, p.riesgo,
                (SELECT COUNT(*)::int FROM cuotas x WHERE x.poliza_id = p.id AND x.estado = 'pendiente') AS pendientes
         FROM cuotas c JOIN polizas p ON p.id = c.poliza_id
         WHERE p.id IN (${act}) AND c.estado = 'pendiente' ORDER BY p.id, c.vencimiento, c.numero`
      ),
      q(
        `SELECT MIN(pg.id) AS id, pg.recibo_nro, MIN(pg.fecha)::text AS fecha, SUM(pg.importe)::float8 AS importe, MIN(p.numero) AS poliza, COUNT(*)::int AS cuotas_n
         FROM pagos pg JOIN polizas p ON p.id = pg.poliza_id WHERE p.id IN (${act}) AND pg.estado = 'aplicado'
         GROUP BY pg.recibo_nro ORDER BY MIN(pg.fecha) DESC, MIN(pg.id) DESC LIMIT 3`
      ),
      q1("SELECT COUNT(*)::int AS n FROM contactos_emergencia WHERE cliente_id = $1", [u.cliente_id]),
      q(`SELECT id, ramo, compania FROM polizas WHERE id IN (${enLista(est.bloqueadas.map((b) => b.id))}) ORDER BY id DESC`),
      q1(
        `SELECT COALESCE(SUM(c.importe),0)::float8 AS total, COUNT(*)::int AS n FROM cuotas c
         WHERE c.poliza_id IN (${act}) AND c.estado = 'pendiente' AND c.vencimiento < $1::date`,
        [h]
      ),
    ]);
    cuotas.sort((a, b) => String(a.venc).localeCompare(String(b.venc)));
    return { c, polizas, cuotas, pagos, nContactos, bloqueadas: bloqueadas.map((b) => ({ ...b, bloqueo: TEXTO_BLOQUEO.falta_pago })), deuda };
  },

  async portalPolizas() {
    const u = await portalUsuario();
    const est = await estadoPolizas(u.cliente_id);
    const act = enLista(est.activas);
    const [polizas, docs, bajas, bloqueadas] = await Promise.all([
      q(
        `SELECT ${COLS_POLIZA},
                (SELECT COUNT(*)::int FROM cuotas c WHERE c.poliza_id = p.id AND c.estado = 'pagada') AS pagadas,
                (SELECT COUNT(*)::int FROM cuotas c WHERE c.poliza_id = p.id AND c.estado <> 'anulada') AS total
         FROM polizas p WHERE p.id IN (${act}) ORDER BY (p.estado = 'vigente') DESC, p.id DESC`
      ),
      q(
        `SELECT id, poliza_id, tipo, nombre, tamano FROM documentos
         WHERE poliza_id IN (${act}) AND pago_id IS NULL AND siniestro_id IS NULL ORDER BY id`
      ),
      q("SELECT poliza_id FROM alertas WHERE tipo = 'baja' AND estado = 'pendiente' AND cliente_id = $1", [u.cliente_id]),
      q(`SELECT id, ramo, compania FROM polizas WHERE id IN (${enLista(est.bloqueadas.map((b) => b.id))}) ORDER BY id DESC`),
    ]);
    const conBaja = new Set(bajas.map((b) => b.poliza_id));
    return {
      polizas: polizas.map((p) => ({ ...p, baja_pedida: conBaja.has(p.id) })),
      docs,
      bloqueadas: bloqueadas.map((b) => ({ ...b, bloqueo: TEXTO_BLOQUEO.falta_pago })),
    };
  },

  async portalPresentar() {
    const u = await portalUsuario();
    const est = await estadoPolizas(u.cliente_id);
    const act = enLista(est.activas);
    const h = hoy();
    const [c, polizas, bloqueadas] = await Promise.all([
      q1("SELECT nombre, documento FROM clientes WHERE id = $1", [u.cliente_id]),
      q(
        `SELECT ${COLS_POLIZA},
                (SELECT COUNT(*)::int FROM cuotas x WHERE x.poliza_id = p.id AND x.estado = 'pendiente' AND x.vencimiento < $1::date) AS vencidas,
                (SELECT x.vencimiento::text FROM cuotas x WHERE x.poliza_id = p.id AND x.estado = 'pendiente' ORDER BY x.vencimiento LIMIT 1) AS prox_venc,
                (SELECT id FROM documentos d WHERE d.poliza_id = p.id AND d.tipo = 'poliza' AND d.pago_id IS NULL ORDER BY id DESC LIMIT 1) AS doc_poliza,
                (SELECT id FROM documentos d WHERE d.poliza_id = p.id AND d.tipo = 'certificado' AND d.pago_id IS NULL ORDER BY id DESC LIMIT 1) AS doc_cert,
                (SELECT pg.id FROM pagos pg WHERE pg.poliza_id = p.id AND pg.estado = 'aplicado' ORDER BY pg.fecha DESC, pg.id DESC LIMIT 1) AS ult_pago_id,
                (SELECT pg.recibo_nro FROM pagos pg WHERE pg.poliza_id = p.id AND pg.estado = 'aplicado' ORDER BY pg.fecha DESC, pg.id DESC LIMIT 1) AS ult_recibo,
                (SELECT pg.fecha::text FROM pagos pg WHERE pg.poliza_id = p.id AND pg.estado = 'aplicado' ORDER BY pg.fecha DESC, pg.id DESC LIMIT 1) AS ult_pago_fecha
         FROM polizas p WHERE p.id IN (${act}) AND p.estado IN ('vigente','en_tramite')
         ORDER BY (p.dominio IS NULL), p.id DESC`,
        [h]
      ),
      q(`SELECT id, ramo, compania FROM polizas WHERE id IN (${enLista(est.bloqueadas.map((b) => b.id))}) ORDER BY id DESC`),
    ]);
    return { c, polizas, bloqueadas: bloqueadas.map((b) => ({ ...b, bloqueo: TEXTO_BLOQUEO.falta_pago })) };
  },

  async portalPagos() {
    const u = await portalUsuario();
    const est = await estadoPolizas(u.cliente_id);
    const act = enLista(est.activas);
    const [cuotas, pagos, comprobantes, avisos, bloqueadas] = await Promise.all([
      q(
        `SELECT c.id, c.numero, c.vencimiento::text AS venc, c.importe::float8 AS importe, p.numero AS poliza, p.compania, p.dominio, p.cuotas_cant
         FROM cuotas c JOIN polizas p ON p.id = c.poliza_id
         WHERE p.id IN (${act}) AND c.estado = 'pendiente' ORDER BY c.vencimiento`
      ),
      q(
        `SELECT MIN(pg.id) AS id, pg.recibo_nro, MIN(pg.fecha)::text AS fecha, SUM(pg.importe)::float8 AS importe, MIN(pg.metodo) AS metodo, COUNT(*)::int AS cuotas_n,
                json_agg(json_build_object('poliza', p.numero, 'compania', p.compania, 'cuota', c.numero, 'total', p.cuotas_cant) ORDER BY p.id, c.numero) AS lineas
         FROM pagos pg JOIN polizas p ON p.id = pg.poliza_id LEFT JOIN cuotas c ON c.id = pg.cuota_id
         WHERE p.id IN (${act}) AND pg.cliente_id = $1 AND pg.estado = 'aplicado'
         GROUP BY pg.recibo_nro ORDER BY MIN(pg.fecha) DESC, MIN(pg.id) DESC LIMIT 200`,
        [u.cliente_id]
      ),
      q("SELECT id, pago_id, nombre FROM documentos WHERE cliente_id = $1 AND tipo = 'comprobante' AND pago_id IS NOT NULL", [u.cliente_id]),
      q(
        `SELECT a.id, a.estado, a.motivo, a.importe::float8 AS importe, a.fecha::text AS fecha, a.metodo, a.creado::text AS creado, a.documento_id,
                %s
         FROM avisos_pago a
         WHERE a.cliente_id = $1 AND a.poliza_id IN (${act}) ORDER BY a.id DESC LIMIT 20`.replace("%s", LINEAS_AVISO),
        [u.cliente_id]
      ),
      q(`SELECT id, ramo, compania FROM polizas WHERE id IN (${enLista(est.bloqueadas.map((b) => b.id))}) ORDER BY id DESC`),
    ]);
    return { cuotas, pagos, comprobantes, avisos, bloqueadas: bloqueadas.map((b) => ({ ...b, bloqueo: TEXTO_BLOQUEO.falta_pago })) };
  },

  async portalPagar() {
    const u = await portalUsuario();
    const est = await estadoPolizas(u.cliente_id);
    const act = enLista(est.activas);
    const [cuotas, pendientes, cfg] = await Promise.all([
      q(
        `SELECT c.id, c.numero, c.vencimiento::text AS venc, c.importe::float8 AS importe, p.numero AS poliza, p.compania, p.dominio, p.cuotas_cant
         FROM cuotas c JOIN polizas p ON p.id = c.poliza_id
         WHERE p.id IN (${act}) AND c.estado = 'pendiente' ORDER BY c.vencimiento`
      ),
      q("SELECT ac.cuota_id FROM aviso_cuotas ac JOIN avisos_pago a ON a.id = ac.aviso_id WHERE a.cliente_id = $1 AND a.estado = 'pendiente'", [u.cliente_id]),
      getConfigs(["mp_instrucciones"]),
    ]);
    const enRevision = new Set(pendientes.map((p) => p.cuota_id));
    return { cuotas: cuotas.map((c) => ({ ...c, en_revision: enRevision.has(c.id) })), mp: cfg.mp_instrucciones };
  },

  async portalTramite(sp) {
    const u = await portalUsuario();
    const est = await estadoPolizas(u.cliente_id);
    const polizas = await q(
      `SELECT p.id, p.numero, p.compania, p.ramo, p.riesgo, p.dominio, p.cobertura FROM polizas p
       WHERE p.id IN (${enLista(est.activas)}) AND p.estado IN ('vigente','en_tramite') ORDER BY (p.dominio IS NULL), p.id DESC`
    );
    const previos = await q(
      `SELECT a.id, a.estado, a.detalle, a.creado::text AS creado, p.numero AS poliza FROM alertas a LEFT JOIN polizas p ON p.id = a.poliza_id
       WHERE a.cliente_id = $1 AND a.tipo = 'tramite' ORDER BY a.id DESC LIMIT 8`,
      [u.cliente_id]
    );
    return { polizas, previos, seleccionada: Number(sp.get("poliza")) || (polizas[0]?.id ?? 0) };
  },

  async portalSiniestros() {
    const u = await portalUsuario();
    const est = await estadoPolizas(u.cliente_id);
    const [filas, polizas] = await Promise.all([
      q(
        `SELECT s.id, s.estado, s.tipo, s.fecha_hecho::text AS fecha, s.lugar, s.nro_compania, p.numero AS poliza, p.compania
         FROM siniestros s LEFT JOIN polizas p ON p.id = s.poliza_id WHERE s.cliente_id = $1 ORDER BY s.id DESC LIMIT 50`,
        [u.cliente_id]
      ),
      q(
        `SELECT id, numero, compania, ramo, dominio, riesgo FROM polizas
         WHERE id IN (${enLista(est.activas)}) AND estado IN ('vigente','en_tramite') ORDER BY (dominio IS NULL), id DESC`
      ),
    ]);
    return { filas, polizas };
  },

  async portalAuxilio() {
    await portalUsuario();
    return { cfg: await getConfigs(["auxilio_telefono", "auxilio_texto", "auxilio_planes"]) };
  },

  async portalPerfil() {
    const u = await portalUsuario();
    const base = (await DATOS.portalPerfil(new URLSearchParams())) as Record<string, unknown>;
    const acceso = await q1("SELECT tiene_clave, dni FROM usuarios WHERE id = $1", [u.id]);
    return { ...base, acceso };
  },
};
