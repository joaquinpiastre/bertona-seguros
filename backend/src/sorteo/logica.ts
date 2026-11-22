/** Sorteo Speedway: registro público, panel (configuración, participantes, métricas, sorteo) y confirmación por código. */
import { randomInt } from "node:crypto";
import { requireAdmin } from "../auth";
import { q, q1 } from "../db";
import { NoEncontrado, ir, txt } from "../flash";
import { esFecha, hoy } from "../format";
import { crearCsv, crearXlsx } from "./planilla";
import { BASES_POR_DEFECTO, MENSAJE_POR_DEFECTO, TITULO_POR_DEFECTO, WHATSAPP_POR_DEFECTO } from "./textos";
import { normalizarWhatsapp, waDigitos, whatsappOculto, whatsappVisible } from "./whatsapp";

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
type SP = URLSearchParams;

export const VEHICULOS: Record<string, string> = { auto: "Auto", moto: "Moto", camioneta: "Camioneta", ninguno: "Ninguno" };
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
export const VENCIMIENTOS: Record<string, string> = {
  ...Object.fromEntries(MESES.map((m, i) => [String(i + 1).padStart(2, "0"), m])),
  sin_seguro: "No tengo seguro",
};

const ZONA = "America/Argentina/Buenos_Aires";
const COLS_SORTEO = `s.id, s.titulo, s.premio, s.descripcion, s.fecha_inicio::text AS fecha_inicio, s.fecha_fin::text AS fecha_fin,
  to_char(s.fecha_sorteo, 'YYYY-MM-DD"T"HH24:MI') AS fecha_sorteo, s.whatsapp, s.mensaje, s.activo`;

export type EstadoSorteo = "abierto" | "proximo" | "finalizado";

/** Abierto entre la fecha de inicio y la de fin (inclusive, hora de Argentina). Sin fechas, abierto. */
export function estadoDe(s: { fecha_inicio?: string | null; fecha_fin?: string | null }, h = hoy()): EstadoSorteo {
  if (s.fecha_inicio && h < s.fecha_inicio) return "proximo";
  if (s.fecha_fin && h > s.fecha_fin) return "finalizado";
  return "abierto";
}

const sorteoActivo = () => q1(`SELECT ${COLS_SORTEO} FROM sorteos s WHERE s.activo LIMIT 1`);

// ───────── Textos que manda la gente ─────────
const limpiar = (v: unknown, max: number) =>
  String(v ?? "")
    .normalize("NFC")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

const MINUSCULAS = new Set(["de", "del", "la", "las", "los", "y", "e", "da", "di", "van", "von"]);
/**
 * "JUAN PEREZ", "juan perez" o "juan PEREZ" → "Juan Perez". Palabra por palabra: la que ya viene con mayúsculas y minúsculas
 * (McDonald, DeLuca) se respeta; "de", "del", "la"... quedan en minúscula salvo al principio.
 */
function mayusculas(s: string): string {
  return s
    .split(" ")
    .map((p, i) => {
      if (p !== p.toUpperCase() && p !== p.toLowerCase()) return p;
      const min = p.toLowerCase();
      return i > 0 && MINUSCULAS.has(min) ? min : min.replace(/(^|[-'’])(\p{L})/gu, (_, a, b) => a + b.toUpperCase());
    })
    .join(" ");
}

/** Identificador de QR / campaña: minúsculas, sin tildes, solo letras, números y guiones. */
export function slug(v: unknown, max = 40): string {
  return String(v ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max)
    .replace(/-+$/, "");
}

const pareceBasura = (s: string) => /https?:|www\.|@|<|>/i.test(s);
const verdadero = (v: unknown) => v === true || v === "on" || v === "1" || v === "true";

/** "bs 4821", "BS4821", "4821" o un mensaje entero ("...Mi código es BS-4821") → "BS-4821". */
export function normalizarCodigo(v: unknown): string {
  const s = String(v ?? "");
  const m = s.match(/\bBS[\s-]?(\d{4,6})\b/i) ?? s.trim().match(/^(\d{4,6})$/);
  return m ? `BS-${m[1]}` : "";
}

const nuevoCodigo = (cifras: number) => `BS-${randomInt(10 ** (cifras - 1), 10 ** cifras)}`;

// ───────── Límite de registros por IP (en memoria) ─────────
// Generoso a propósito: en el autódromo mucha gente comparte la misma IP de la compañía de celular.
const VENTANA_MS = 10 * 60_000;
const MAX_INTENTOS = 120; // envíos del formulario por IP cada 10 minutos
const MAX_ALTAS = 30; // inscripciones nuevas por IP cada 10 minutos
const ventanas = new Map<string, { intentos: number; altas: number; hasta: number }>();

function ventanaDe(ip: string) {
  const ahora = Date.now();
  if (ventanas.size > 20_000) for (const [k, v] of ventanas) if (v.hasta <= ahora) ventanas.delete(k);
  let v = ventanas.get(ip);
  if (!v || v.hasta <= ahora) {
    v = { intentos: 0, altas: 0, hasta: ahora + VENTANA_MS };
    ventanas.set(ip, v);
  }
  return v;
}

const DEMASIADOS = "Recibimos muchos registros desde tu conexión. Esperá unos minutos y probá de nuevo.";

// ───────── Público ─────────
export async function datosPublicos() {
  const s = await sorteoActivo();
  if (!s) return { estado: "sin_sorteo", sorteo: null };
  return {
    estado: estadoDe(s),
    sorteo: {
      id: s.id, titulo: s.titulo, premio: s.premio, descripcion: s.descripcion, fecha_inicio: s.fecha_inicio, fecha_fin: s.fecha_fin,
      fecha_sorteo: s.fecha_sorteo, whatsapp: s.whatsapp, mensaje: s.mensaje,
    },
  };
}

/** Bases del sorteo activo; si no hay, las del último sorteo cargado; si no hay ninguno, las de ejemplo. */
export async function basesPublicas() {
  const s = await q1("SELECT titulo, bases FROM sorteos ORDER BY activo DESC, id DESC LIMIT 1");
  return { titulo: s?.titulo || TITULO_POR_DEFECTO, bases: String(s?.bases ?? "").trim() || BASES_POR_DEFECTO };
}

type Respuesta = { ok: true; codigo: string; duplicado: boolean; confirmado: boolean } | { ok: false; error: string; campo?: string };

export async function registrar(b: Row): Promise<Respuesta> {
  // Trampa para robots: campo invisible que una persona nunca completa.
  if (limpiar(b.trampa, 200)) return { ok: false, error: "No pudimos registrar tu participación. Recargá la página y probá de nuevo." };
  const ip = limpiar(b.ip, 64);
  const ventana = ip ? ventanaDe(ip) : null;
  if (ventana && ++ventana.intentos > MAX_INTENTOS) return { ok: false, error: DEMASIADOS };

  const s = await sorteoActivo();
  if (!s) return { ok: false, error: "En este momento no hay un sorteo abierto." };
  const estado = estadoDe(s);
  if (estado === "proximo") return { ok: false, error: "El sorteo todavía no empezó: volvé a entrar desde la fecha de inicio." };
  if (estado === "finalizado") return { ok: false, error: "La inscripción a este sorteo ya cerró." };

  const nombre = mayusculas(limpiar(b.nombre, 80));
  if (nombre.length < 3 || !/\p{L}/u.test(nombre) || pareceBasura(nombre)) return { ok: false, campo: "nombre", error: "Escribí tu nombre y apellido." };
  if (!nombre.includes(" ")) return { ok: false, campo: "nombre", error: "Escribí tu nombre y también tu apellido." };
  const wa = normalizarWhatsapp(b.whatsapp);
  if (!wa.ok) return { ok: false, campo: "whatsapp", error: wa.error };
  const localidad = mayusculas(limpiar(b.localidad, 60));
  if (localidad.length < 2 || !/\p{L}/u.test(localidad) || pareceBasura(localidad)) return { ok: false, campo: "localidad", error: "Escribí tu localidad." };
  const vehiculo = limpiar(b.vehiculo, 20);
  if (!Object.hasOwn(VEHICULOS, vehiculo)) return { ok: false, campo: "vehiculo", error: "Elegí qué vehículo tenés (o «Ninguno»)." };
  const venc = limpiar(b.vencimiento, 20);
  if (venc && !Object.hasOwn(VENCIMIENTOS, venc)) return { ok: false, campo: "vencimiento", error: "Elegí el mes de vencimiento de tu seguro." };
  if (!verdadero(b.acepta)) return { ok: false, campo: "acepta", error: "Para participar tenés que ser mayor de 18 y aceptar las bases y condiciones." };

  const ya = () => q1("SELECT codigo, estado FROM sorteo_participantes WHERE sorteo_id = $1 AND whatsapp = $2", [s.id, wa.numero]);
  const previo = await ya();
  if (previo) return { ok: true, duplicado: true, codigo: previo.codigo, confirmado: previo.estado === "confirmado" };
  if (ventana && ventana.altas >= MAX_ALTAS) return { ok: false, error: DEMASIADOS };

  const utm = (k: string) => limpiar(b[k], 100) || null;
  const datos = [
    s.id, nombre, wa.numero, localidad, vehiculo, venc || null, verdadero(b.alertas), slug(b.origen) || null,
    utm("utm_source"), utm("utm_medium"), utm("utm_campaign"), utm("utm_term"), utm("utm_content"),
  ];
  // Código corto (BS-4821). Si ya existe se prueba otro; si los de 4 cifras se van llenando, pasa a 5 y 6.
  for (let i = 0; i < 30; i++) {
    const r = await q1(
      `INSERT INTO sorteo_participantes (codigo, sorteo_id, nombre, whatsapp, localidad, vehiculo, vencimiento_seguro, acepta_bases, alertas_tormenta,
         origen, utm_source, utm_medium, utm_campaign, utm_term, utm_content)
       VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, $8, $9, $10, $11, $12, $13, $14)
       ON CONFLICT DO NOTHING RETURNING codigo`,
      [nuevoCodigo(i < 15 ? 4 : i < 25 ? 5 : 6), ...datos]
    );
    if (r) {
      if (ventana) ventana.altas++;
      return { ok: true, duplicado: false, codigo: r.codigo, confirmado: false };
    }
    const otro = await ya(); // se registró al mismo tiempo (doble toque): se devuelve ese
    if (otro) return { ok: true, duplicado: true, codigo: otro.codigo, confirmado: otro.estado === "confirmado" };
  }
  throw new Error("No se pudo generar un código único para el sorteo");
}

/** Confirmación automática (bot de WhatsApp): por código y, si se pasa, verificando que el número sea el registrado. */
export async function confirmarPorCodigo(b: Row): Promise<{ status: 200 | 400 | 404 | 409; body: Row }> {
  const codigo = normalizarCodigo(b.codigo || b.texto);
  if (!codigo) return { status: 400, body: { ok: false, error: "Falta el código (por ejemplo BS-4821)." } };
  const p = await q1(
    `SELECT p.id, p.codigo, p.estado, p.whatsapp, p.nombre, s.activo, s.titulo FROM sorteo_participantes p JOIN sorteos s ON s.id = p.sorteo_id WHERE p.codigo = $1`,
    [codigo]
  );
  if (!p) return { status: 404, body: { ok: false, codigo, error: "No existe ese código." } };
  if (!p.activo) return { status: 409, body: { ok: false, codigo, error: "Ese código es de un sorteo que ya no está activo." } };
  if (b.whatsapp) {
    const w = normalizarWhatsapp(b.whatsapp);
    if (!w.ok || w.numero !== p.whatsapp) return { status: 409, body: { ok: false, codigo, error: "El número que escribió no es el que se registró con ese código." } };
  }
  const base = { ok: true, codigo, nombre: p.nombre, sorteo: p.titulo };
  if (p.estado === "confirmado") return { status: 200, body: { ...base, ya_confirmado: true } };
  await q("UPDATE sorteo_participantes SET estado = 'confirmado', confirmado_en = now(), confirmado_por = 'bot' WHERE id = $1 AND estado = 'pendiente'", [p.id]);
  return { status: 200, body: { ...base, ya_confirmado: false } };
}

// ───────── Panel: sorteos ─────────
const idDe = (v: unknown) => Math.max(0, Math.trunc(Number(v)) || 0);

async function listaSorteos() {
  const filas = await q(
    `SELECT ${COLS_SORTEO},
            (SELECT COUNT(*)::int FROM sorteo_participantes p WHERE p.sorteo_id = s.id) AS registrados,
            (SELECT COUNT(*)::int FROM sorteo_participantes p WHERE p.sorteo_id = s.id AND p.estado = 'confirmado') AS confirmados,
            (SELECT COUNT(*)::int FROM sorteo_ganadores g WHERE g.sorteo_id = s.id) AS sorteados
     FROM sorteos s ORDER BY s.activo DESC, s.id DESC`
  );
  const h = hoy();
  return filas.map((s): Row => ({ ...s, estado: estadoDe(s, h) }));
}

/** El sorteo pedido en la dirección; si no se pidió, el activo; si no hay activo, el último. */
const elegir = (sorteos: Row[], pedido: number) => sorteos.find((s) => s.id === pedido) ?? sorteos.find((s) => s.activo) ?? sorteos[0] ?? null;

async function metricas(sorteoId: number) {
  const [tot, origenes, dias, vehiculos, vencimientos] = await Promise.all([
    q1(
      `SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE estado = 'confirmado')::int AS confirmados,
              COUNT(*) FILTER (WHERE alertas_tormenta)::int AS alertas FROM sorteo_participantes WHERE sorteo_id = $1`,
      [sorteoId]
    ),
    q(
      `SELECT COALESCE(origen, '') AS origen, COUNT(*)::int AS total, COUNT(*) FILTER (WHERE estado = 'confirmado')::int AS confirmados
       FROM sorteo_participantes WHERE sorteo_id = $1 GROUP BY 1 ORDER BY 2 DESC, 1`,
      [sorteoId]
    ),
    q(
      `SELECT (creado AT TIME ZONE '${ZONA}')::date::text AS dia, COUNT(*)::int AS total, COUNT(*) FILTER (WHERE estado = 'confirmado')::int AS confirmados
       FROM sorteo_participantes WHERE sorteo_id = $1 GROUP BY 1 ORDER BY 1`,
      [sorteoId]
    ),
    q(`SELECT vehiculo AS clave, COUNT(*)::int AS total FROM sorteo_participantes WHERE sorteo_id = $1 GROUP BY 1 ORDER BY 2 DESC`, [sorteoId]),
    q(`SELECT COALESCE(vencimiento_seguro, '') AS clave, COUNT(*)::int AS total FROM sorteo_participantes WHERE sorteo_id = $1 GROUP BY 1 ORDER BY 1`, [sorteoId]),
  ]);
  return { ...tot, origenes, dias, vehiculos, vencimientos };
}

export const DATOS_ADMIN: Record<string, (sp: SP) => Promise<unknown>> = {
  /** Resumen: lista de sorteos y métricas del elegido. */
  async resumen(sp) {
    await requireAdmin();
    const sorteos = await listaSorteos();
    const elegido = elegir(sorteos, idDe(sp.get("sorteo")));
    return { sorteos, elegido, metricas: elegido ? await metricas(elegido.id) : null };
  },

  /** Un sorteo para editarlo. */
  async sorteo(sp) {
    await requireAdmin();
    const s = await q1(
      `SELECT ${COLS_SORTEO}, s.bases,
              (SELECT COUNT(*)::int FROM sorteo_participantes p WHERE p.sorteo_id = s.id) AS registrados,
              (SELECT COUNT(*)::int FROM sorteo_ganadores g WHERE g.sorteo_id = s.id) AS sorteados
       FROM sorteos s WHERE s.id = $1`,
      [idDe(sp.get("id"))]
    );
    if (!s) throw new NoEncontrado();
    return { sorteo: { ...s, estado: estadoDe(s) } };
  },

  /** Valores con los que arranca un sorteo nuevo. */
  async nuevo() {
    await requireAdmin();
    const ultimo = await q1("SELECT whatsapp, mensaje, bases FROM sorteos ORDER BY id DESC LIMIT 1");
    return {
      valores: {
        titulo: TITULO_POR_DEFECTO,
        whatsapp: ultimo?.whatsapp || WHATSAPP_POR_DEFECTO,
        mensaje: ultimo?.mensaje || MENSAJE_POR_DEFECTO,
        bases: ultimo?.bases || BASES_POR_DEFECTO,
      },
    };
  },

  async participantes(sp) {
    await requireAdmin();
    const sorteos = await listaSorteos();
    const todos = sp.get("sorteo") === "0";
    const elegido = todos ? null : elegir(sorteos, idDe(sp.get("sorteo")));
    const f = filtros(sp, todos ? 0 : elegido?.id ?? -1);
    const pagina = Math.max(1, idDe(sp.get("pagina")) || 1);
    const POR_PAGINA = 100;
    const [cuenta, filas, origenes] = await Promise.all([
      q1(`SELECT COUNT(*)::int AS n FROM sorteo_participantes p WHERE ${f.where}`, f.params),
      q(
        `SELECT ${COLS_PARTICIPANTE} FROM sorteo_participantes p JOIN sorteos s ON s.id = p.sorteo_id
         WHERE ${f.where} ORDER BY p.id DESC LIMIT ${POR_PAGINA} OFFSET ${(pagina - 1) * POR_PAGINA}`,
        f.params
      ),
      q(
        `SELECT DISTINCT origen FROM sorteo_participantes WHERE origen IS NOT NULL ${todos ? "" : "AND sorteo_id = $1"} ORDER BY 1`,
        todos ? [] : [elegido?.id ?? -1]
      ),
    ]);
    return {
      sorteos: sorteos.map((s) => ({ id: s.id, titulo: s.titulo, activo: s.activo })),
      sorteo: todos ? 0 : elegido?.id ?? null,
      total: cuenta!.n,
      pagina,
      paginas: Math.max(1, Math.ceil(cuenta!.n / POR_PAGINA)),
      filas: filas.map(participanteVisible),
      origenes: origenes.map((o) => o.origen),
    };
  },

  /** Pantalla del sorteo: cuántos participan, códigos para la animación e historial de ganadores. */
  async sortear(sp) {
    await requireAdmin();
    const sorteos = await listaSorteos();
    const elegido = elegir(sorteos, idDe(sp.get("sorteo")));
    if (!elegido) return { sorteos: [], elegido: null, elegibles: 0, muestra: [], historial: [] };
    const [cuenta, muestra, historial] = await Promise.all([
      q1(`SELECT COUNT(*)::int AS n FROM sorteo_participantes p WHERE ${ELEGIBLE}`, [elegido.id]),
      q(`SELECT p.codigo FROM sorteo_participantes p WHERE ${ELEGIBLE} ORDER BY random() LIMIT 150`, [elegido.id]),
      historialGanadores(0),
    ]);
    return {
      sorteos: sorteos.map((s) => ({ id: s.id, titulo: s.titulo, activo: s.activo, confirmados: s.confirmados })),
      elegido,
      elegibles: cuenta!.n,
      muestra: muestra.map((m) => m.codigo),
      historial,
    };
  },
};

const COLS_PARTICIPANTE = `p.id, p.sorteo_id, s.titulo AS sorteo_titulo, p.codigo, p.nombre, p.whatsapp, p.localidad, p.vehiculo, p.vencimiento_seguro,
  p.alertas_tormenta, p.estado, p.confirmado_por, p.origen, p.utm_source, p.utm_medium, p.utm_campaign, p.utm_term, p.utm_content,
  to_char(p.creado AT TIME ZONE '${ZONA}', 'DD/MM/YYYY HH24:MI') AS creado,
  to_char(p.confirmado_en AT TIME ZONE '${ZONA}', 'DD/MM/YYYY HH24:MI') AS confirmado_en,
  EXISTS (SELECT 1 FROM sorteo_ganadores g WHERE g.participante_id = p.id) AS sorteado`;

const participanteVisible = (p: Row) => ({ ...p, wa: waDigitos(p.whatsapp), wa_visible: whatsappVisible(p.whatsapp) });

/** Confirmados del sorteo que todavía no salieron sorteados ($1 = sorteo). */
const ELEGIBLE = `p.sorteo_id = $1 AND p.estado = 'confirmado'
  AND NOT EXISTS (SELECT 1 FROM sorteo_ganadores g WHERE g.sorteo_id = p.sorteo_id AND g.participante_id = p.id)`;

/** Filtros de la tabla de participantes (también los usa la exportación). sorteoId 0 = todos los sorteos. */
function filtros(sp: SP, sorteoId: number) {
  const params: unknown[] = [];
  const w: string[] = [];
  const p = (v: unknown) => {
    params.push(v);
    return `$${params.length}`;
  };
  if (sorteoId) w.push(`p.sorteo_id = ${p(sorteoId)}`);
  const estado = sp.get("estado");
  if (estado === "pendiente" || estado === "confirmado") w.push(`p.estado = ${p(estado)}`);
  const origen = sp.get("origen");
  if (origen === "-") w.push("p.origen IS NULL");
  else if (origen) w.push(`p.origen = ${p(slug(origen))}`);
  const vehiculo = sp.get("vehiculo");
  if (vehiculo && Object.hasOwn(VEHICULOS, vehiculo)) w.push(`p.vehiculo = ${p(vehiculo)}`);
  const venc = sp.get("venc");
  if (venc === "-") w.push("p.vencimiento_seguro IS NULL");
  else if (venc && Object.hasOwn(VENCIMIENTOS, venc)) w.push(`p.vencimiento_seguro = ${p(venc)}`);
  if (sp.get("alertas") === "1") w.push("p.alertas_tormenta");
  const busqueda = limpiar(sp.get("q"), 80);
  if (busqueda) {
    const codigo = /^bs[\s-]?\d{4,6}$/i.test(busqueda) ? normalizarCodigo(busqueda) : "";
    const digitos = busqueda.replace(/[\s\-+()]/g, "");
    if (codigo) w.push(`p.codigo = ${p(codigo)}`); // índice único: instantáneo
    else if (/^\d{4,}$/.test(digitos)) w.push(`(p.codigo = ${p(`BS-${digitos}`)} OR p.whatsapp LIKE ${p(`%${digitos}%`)})`);
    else {
      const like = p(`%${busqueda.replace(/[\\%_]/g, (c) => "\\" + c)}%`);
      w.push(`(p.nombre ILIKE ${like} OR p.localidad ILIKE ${like} OR p.codigo ILIKE ${like})`);
    }
  }
  return { where: w.length ? w.join(" AND ") : "TRUE", params };
}

async function historialGanadores(sorteoId: number) {
  const filas = await q(
    `SELECT g.id, g.tipo, g.elegibles, g.sorteado_por, g.sorteo_id, s.titulo AS sorteo_titulo,
            to_char(g.creado AT TIME ZONE '${ZONA}', 'DD/MM/YYYY HH24:MI') AS fecha,
            p.codigo, p.nombre, p.localidad, p.whatsapp, p.estado
     FROM sorteo_ganadores g JOIN sorteos s ON s.id = g.sorteo_id JOIN sorteo_participantes p ON p.id = g.participante_id
     WHERE ($1::int = 0 OR g.sorteo_id = $1::int) ORDER BY g.id DESC LIMIT 200`,
    [sorteoId]
  );
  return filas.map(participanteVisible);
}

// ───────── Panel: acciones ─────────
const VOLVER_OK = /^\/admin\/sorteo(\/|\?|$)/;
const volverDe = (fd: FormData, def: string) => (VOLVER_OK.test(txt(fd, "volver")) ? txt(fd, "volver") : def);

/** "2026-12-12T22:00" del formulario → "2026-12-12 22:00" (hora de Argentina). */
function fechaHora(v: string): string | null | false {
  if (!v) return null;
  const m = v.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}):(\d{2})/);
  if (!m || !esFecha(m[1]) || Number(m[2]) > 23 || Number(m[3]) > 59) return false;
  return `${m[1]} ${m[2]}:${m[3]}`;
}

async function activar(id: number) {
  // Primero se desactiva el que esté activo: nunca hay dos activos a la vez.
  await q("UPDATE sorteos SET activo = FALSE, actualizado = now() WHERE activo AND id <> $1", [id]);
  await q("UPDATE sorteos SET activo = TRUE, actualizado = now() WHERE id = $1", [id]);
}

export const ACCIONES_ADMIN: Record<string, (fd: FormData) => Promise<Row | void>> = {
  async guardar(fd) {
    await requireAdmin();
    const id = idDe(txt(fd, "id"));
    const volver = id ? `/admin/sorteo/${id}` : "/admin/sorteo/nuevo";
    const titulo = limpiar(txt(fd, "titulo"), 120);
    if (titulo.length < 3) ir(volver, "error", "Escribí el título del sorteo.");
    const inicio = txt(fd, "fecha_inicio");
    const fin = txt(fd, "fecha_fin");
    if ((inicio && !esFecha(inicio)) || (fin && !esFecha(fin))) ir(volver, "error", "Las fechas de inicio y fin no son válidas.");
    if (inicio && fin && inicio > fin) ir(volver, "error", "La fecha de fin tiene que ser igual o posterior a la de inicio.");
    const sorteo = fechaHora(txt(fd, "fecha_sorteo"));
    if (sorteo === false) ir(volver, "error", "La fecha y hora del sorteo no es válida.");
    const wa = normalizarWhatsapp(txt(fd, "whatsapp"));
    if (!wa.ok) ir(volver, "error", `WhatsApp para confirmar: ${wa.error}`);
    const valores = [
      titulo,
      String(fd.get("premio") ?? "").trim().slice(0, 300),
      String(fd.get("descripcion") ?? "").trim().slice(0, 2000),
      inicio || null,
      fin || null,
      sorteo,
      waDigitos(wa.ok ? wa.numero : ""),
      limpiar(txt(fd, "mensaje"), 500) || MENSAJE_POR_DEFECTO,
      String(fd.get("bases") ?? "").replace(/\r\n/g, "\n").trim().slice(0, 30000),
    ];
    let nuevoId = id;
    if (id) {
      const r = await q1(
        `UPDATE sorteos SET titulo = $2, premio = $3, descripcion = $4, fecha_inicio = $5, fecha_fin = $6, fecha_sorteo = $7,
                whatsapp = $8, mensaje = $9, bases = $10, actualizado = now() WHERE id = $1 RETURNING id`,
        [id, ...valores]
      );
      if (!r) ir("/admin/sorteo", "error", "Ese sorteo no existe.");
    } else {
      const r = await q1(
        `INSERT INTO sorteos (titulo, premio, descripcion, fecha_inicio, fecha_fin, fecha_sorteo, whatsapp, mensaje, bases)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        valores
      );
      nuevoId = r!.id;
      if (fd.get("activar") === "on") await activar(nuevoId);
    }
    ir(`/admin/sorteo/${nuevoId}`, "ok", id ? "Cambios guardados." : "Sorteo creado.");
  },

  async activar(fd) {
    await requireAdmin();
    const id = idDe(txt(fd, "id"));
    const volver = volverDe(fd, `/admin/sorteo/${id}`);
    if (!(await q1("SELECT 1 FROM sorteos WHERE id = $1", [id]))) ir("/admin/sorteo", "error", "Ese sorteo no existe.");
    if (txt(fd, "valor") === "1") {
      try {
        await activar(id);
      } catch {
        ir(volver, "error", "No se pudo activar. Probá de nuevo.");
      }
      ir(volver, "ok", "Sorteo activado: es el que ve la gente al escanear el QR. Si había otro activo, se desactivó.");
    }
    await q("UPDATE sorteos SET activo = FALSE, actualizado = now() WHERE id = $1", [id]);
    ir(volver, "ok", "Sorteo desactivado: la página pública muestra «Próximamente».");
  },

  async eliminar(fd) {
    await requireAdmin();
    const id = idDe(txt(fd, "id"));
    const volver = `/admin/sorteo/${id}`;
    if (txt(fd, "confirmar") !== "ELIMINAR") ir(volver, "error", 'Para eliminar escribí exactamente "ELIMINAR".');
    if (await q1("SELECT 1 FROM sorteo_ganadores WHERE sorteo_id = $1 LIMIT 1", [id])) ir(volver, "error", "Este sorteo ya tiene ganadores sorteados: no se puede eliminar.");
    await q("DELETE FROM sorteo_participantes WHERE sorteo_id = $1", [id]);
    await q("DELETE FROM sorteos WHERE id = $1", [id]);
    ir("/admin/sorteo", "ok", "Sorteo eliminado junto con sus participantes.");
  },

  async confirmar(fd) {
    const yo = await requireAdmin();
    const id = idDe(txt(fd, "id"));
    const volver = volverDe(fd, "/admin/sorteo/participantes");
    const valor = txt(fd, "valor") === "1";
    const p = await q1(
      `UPDATE sorteo_participantes SET estado = $2::text,
              confirmado_en = CASE WHEN $2::text = 'confirmado' THEN now() ELSE NULL END,
              confirmado_por = CASE WHEN $2::text = 'confirmado' THEN $3::text ELSE NULL END
       WHERE id = $1 RETURNING codigo`,
      [id, valor ? "confirmado" : "pendiente", yo.nombre]
    );
    if (!p) ir(volver, "error", "Ese participante no existe.");
    ir(volver, "ok", valor ? `${p!.codigo} confirmado.` : `${p!.codigo} volvió a quedar pendiente.`);
  },

  async eliminarParticipante(fd) {
    await requireAdmin();
    const id = idDe(txt(fd, "id"));
    const volver = volverDe(fd, "/admin/sorteo/participantes");
    if (await q1("SELECT 1 FROM sorteo_ganadores WHERE participante_id = $1", [id])) ir(volver, "error", "Ese participante salió sorteado: queda en el historial y no se puede eliminar.");
    const p = await q1("DELETE FROM sorteo_participantes WHERE id = $1 RETURNING codigo", [id]);
    ir(volver, p ? "ok" : "error", p ? `Se eliminó el registro ${p.codigo}.` : "Ese participante no existe.");
  },

  /** Sortea un ganador (o suplente) entre los confirmados que todavía no salieron. Con prueba=1 no se guarda nada. */
  async sortear(fd) {
    const yo = await requireAdmin();
    const sorteoId = idDe(txt(fd, "sorteo_id"));
    const tipo = txt(fd, "tipo") === "suplente" ? "suplente" : "ganador";
    const prueba = txt(fd, "prueba") === "1";
    if (!(await q1("SELECT 1 FROM sorteos WHERE id = $1", [sorteoId]))) return { ok: false, error: "Ese sorteo no existe." };
    for (let intento = 0; intento < 5; intento++) {
      const elegibles = await q(`SELECT p.id FROM sorteo_participantes p WHERE ${ELEGIBLE} ORDER BY p.id`, [sorteoId]);
      if (!elegibles.length) return { ok: false, error: "No quedan participantes confirmados para sortear." };
      // Generador criptográfico: cada confirmado tiene exactamente la misma probabilidad.
      const elegido = elegibles[randomInt(elegibles.length)].id as number;
      if (!prueba) {
        const r = await q1(
          `INSERT INTO sorteo_ganadores (sorteo_id, participante_id, tipo, elegibles, sorteado_por) VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT DO NOTHING RETURNING id`,
          [sorteoId, elegido, tipo, elegibles.length, yo.nombre]
        );
        if (!r) continue; // otro sorteo simultáneo lo eligió recién: se vuelve a sortear entre los que quedan
      }
      const p = await q1("SELECT codigo, nombre, localidad, whatsapp FROM sorteo_participantes WHERE id = $1", [elegido]);
      return {
        ok: true,
        prueba,
        tipo,
        elegibles: elegibles.length,
        ganador: { codigo: p!.codigo, nombre: p!.nombre, localidad: p!.localidad, wa_oculto: whatsappOculto(p!.whatsapp) },
      };
    }
    return { ok: false, error: "No se pudo sortear. Probá de nuevo." };
  },
};

// ───────── Exportar (Excel o CSV, con los mismos filtros de la tabla) ─────────
export async function exportar(sp: SP): Promise<Response> {
  const u = await requireAdmin().catch(() => null);
  if (!u) return new Response("No autorizado", { status: 403 });
  const todos = sp.get("sorteo") === "0";
  const s = todos ? null : await q1(`SELECT id, titulo FROM sorteos WHERE id = $1`, [idDe(sp.get("sorteo"))]);
  if (!todos && !s) return new Response("Elegí un sorteo.", { status: 400 });
  const f = filtros(sp, todos ? 0 : s!.id);
  const filas = await q(`SELECT ${COLS_PARTICIPANTE} FROM sorteo_participantes p JOIN sorteos s ON s.id = p.sorteo_id WHERE ${f.where} ORDER BY p.id`, f.params);
  const cabecera = [
    "Código", "Fecha de registro", "Nombre y apellido", "WhatsApp", "Localidad", "Vehículo", "Vencimiento del seguro", "Alertas de tormenta",
    "Estado", "Confirmado el", "Confirmado por", "Origen (QR)", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "Sorteo",
  ];
  const csv = sp.get("formato") === "csv";
  const datos = filas.map((p) => [
    p.codigo, p.creado ?? "", p.nombre, csv ? waDigitos(p.whatsapp) : p.whatsapp, p.localidad, VEHICULOS[p.vehiculo] ?? p.vehiculo,
    p.vencimiento_seguro ? VENCIMIENTOS[p.vencimiento_seguro] ?? p.vencimiento_seguro : "", p.alertas_tormenta ? "Sí" : "No",
    p.estado === "confirmado" ? "Confirmado" : "Pendiente", p.confirmado_en ?? "", p.confirmado_por ?? "", p.origen ?? "",
    p.utm_source ?? "", p.utm_medium ?? "", p.utm_campaign ?? "", p.utm_term ?? "", p.utm_content ?? "", p.sorteo_titulo,
  ].map((v) => String(v ?? "")));
  const nombre = `sorteo-${todos ? "todos" : s!.id}-participantes-${hoy()}`;
  const hdr = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
  if (csv) {
    return new Response(crearCsv(cabecera, datos), { headers: { ...hdr, "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${nombre}.csv"` } });
  }
  const xlsx = crearXlsx("Participantes", cabecera, datos, [11, 17, 28, 17, 18, 11, 20, 18, 12, 17, 18, 16, 14, 14, 16, 12, 14, 30]);
  return new Response(new Uint8Array(xlsx), {
    headers: { ...hdr, "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="${nombre}.xlsx"` },
  });
}
