/**
 * Copia de seguridad completa del sistema, en un .zip que se arma y se envía de a partes
 * (nunca se carga la base entera en memoria):
 *  - base-de-datos.sql  toda la base, incluidos los archivos subidos, lista para restaurar con psql.
 *  - planillas/*.csv    cada tabla para abrir con Excel (sin contraseñas ni archivos).
 *  - documentos/        los archivos subidos, en una carpeta por cliente.
 *  - LEEME.txt          qué hay adentro y cómo restaurar.
 * Todo sale de una misma foto de la base (transacción de solo lectura), así la copia es coherente
 * aunque mientras se descarga alguien cargue un pago.
 */
import { Zip, ZipDeflate, ZipPassThrough } from "fflate";
import { getUsuario, type Usuario } from "./auth";
import { SCHEMA, abrirInstantanea, q, type Instantanea } from "./db";
import { HDR, celda, texto } from "./files";
import { SCHEMA_SORTEO } from "./sorteo/esquema";

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
type Columna = { nombre: string; binaria: boolean };
type Tabla = { nombre: string; columnas: Columna[]; conId: boolean; filas: number };

// Datos de acceso: van en el .sql (hacen falta para que los clientes y el equipo sigan entrando) pero no en las planillas.
const SECRETAS = new Set(["password_hash", "pin_hash", "clave_cifrada"]);

const ident = (s: string) => `"${s.replace(/"/g, '""')}"`;
const literal = (s: string) => `'${s.replace(/'/g, "''")}'`;
const enc = new TextEncoder();
const aBytes = (v: Uint8Array) => Buffer.from(v.buffer, v.byteOffset, v.byteLength);

function valorSql(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (v instanceof Uint8Array) return `decode('${aBytes(v).toString("hex")}', 'hex')`;
  return literal(String(v));
}

/** Nombre apto para cualquier sistema: sin tildes ni caracteres prohibidos en Windows. */
function limpio(s: unknown, max = 80): string {
  const t = String(s ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[\\/:*?"<>|\u0000-\u001f]+/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max)
    .replace(/[. ]+$/, "");
  return t || "archivo";
}

/** Igual que limpio() pero conserva la extensión aunque haya que acortar el nombre. */
function nombreArchivo(s: unknown): string {
  const t = limpio(s, 200);
  const i = t.lastIndexOf(".");
  const ext = i > 0 && t.length - i <= 8 ? t.slice(i) : "";
  return limpio(ext ? t.slice(0, i) : t, 90 - ext.length) + ext;
}

/** Fecha y hora de Argentina como Date "local", que es lo que el zip guarda como hora de cada archivo. */
function horaArgentina(): Date {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Argentina/Buenos_Aires",
      year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
    }).formatToParts(new Date()).map((x) => [x.type, x.value])
  );
  return new Date(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
}
const dos = (n: number) => String(n).padStart(2, "0");
const sello = (d: Date) => `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}_${dos(d.getHours())}${dos(d.getMinutes())}`;
const legible = (d: Date) => `${dos(d.getDate())}/${dos(d.getMonth() + 1)}/${d.getFullYear()} ${dos(d.getHours())}:${dos(d.getMinutes())}`;
export function tamanoLegible(n: number) {
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  return `${(n / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}

/** Lo que el zip va generando, listo para mandar. */
class Salida {
  private cola: Uint8Array[] = [];
  bytes = 0;
  readonly zip = new Zip((err, dato) => {
    if (err) throw err;
    this.cola.push(dato);
    this.bytes += dato.length;
  });
  *vaciar() {
    const c = this.cola;
    this.cola = [];
    yield* c;
  }
}

/** Archivo de texto comprimido dentro del zip, escrito de a partes. */
class Texto {
  private f: ZipDeflate;
  private partes: string[] = [];
  private largo = 0;
  constructor(zip: Zip, nombre: string, cuando: Date) {
    this.f = new ZipDeflate(nombre, { level: 6 });
    this.f.mtime = cuando;
    zip.add(this.f);
  }
  escribir(s: string) {
    this.partes.push(s);
    this.largo += s.length;
    if (this.largo >= 1 << 20) this.empujar(false);
  }
  private empujar(final: boolean) {
    this.f.push(enc.encode(this.partes.join("")), final);
    this.partes = [];
    this.largo = 0;
  }
  cerrar() {
    this.empujar(true);
  }
}

/** Todas las tablas, ordenadas para que al restaurar cada una se cargue después de las que referencia. */
async function leerTablas(db: Instantanea): Promise<Tabla[]> {
  const nombres: string[] = (
    await db.query("SELECT table_name AS t FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY 1")
  ).map((r) => r.t);
  const cols = await db.query(
    `SELECT table_name AS t, column_name AS c, data_type AS tipo FROM information_schema.columns
     WHERE table_schema = 'public' AND coalesce(is_generated, 'NEVER') = 'NEVER' ORDER BY table_name, ordinal_position`
  );
  const fks = await db.query(
    `SELECT h.relname AS hijo, p.relname AS padre FROM pg_constraint k
     JOIN pg_class h ON h.oid = k.conrelid JOIN pg_class p ON p.oid = k.confrelid JOIN pg_namespace n ON n.oid = h.relnamespace
     WHERE k.contype = 'f' AND n.nspname = 'public'`
  );
  const padres = new Map(nombres.map((n) => [n, new Set<string>()]));
  for (const f of fks) if (f.hijo !== f.padre && padres.has(f.padre)) padres.get(f.hijo)?.add(f.padre);
  const orden: string[] = [];
  const pendientes = [...nombres];
  while (pendientes.length) {
    const i = pendientes.findIndex((n) => [...padres.get(n)!].every((p) => orden.includes(p)));
    orden.push(pendientes.splice(Math.max(i, 0), 1)[0]);
  }
  return orden.map((nombre) => {
    const columnas = cols.filter((c) => c.t === nombre).map((c) => ({ nombre: c.c as string, binaria: c.tipo === "bytea" }));
    const conId = cols.some((c) => c.t === nombre && c.c === "id" && ["integer", "bigint", "smallint"].includes(c.tipo));
    return { nombre, columnas, conId, filas: 0 };
  });
}

/** Filas de una tabla en lotes (las tablas con archivos, de a pocas filas). Todo como texto salvo los archivos. */
async function* recorrer(db: Instantanea, t: Tabla): AsyncGenerator<Row[]> {
  const sel = t.columnas.map((c) => (c.binaria ? `t.${ident(c.nombre)}` : `t.${ident(c.nombre)}::text AS ${ident(c.nombre)}`)).join(", ");
  if (!t.conId) {
    yield await db.query(`SELECT ${sel} FROM ${ident(t.nombre)} AS t`);
    return;
  }
  const lote = t.columnas.some((c) => c.binaria) ? 5 : 2000;
  let desde: string | null = null;
  for (;;) {
    const filas = await db.query(
      `SELECT ${sel} FROM ${ident(t.nombre)} AS t WHERE ($1::bigint IS NULL OR t."id" > $1::bigint) ORDER BY t."id" LIMIT ${lote}`,
      [desde]
    );
    if (filas.length) yield filas;
    if (filas.length < lote) return;
    desde = filas[filas.length - 1].id;
  }
}

async function* generar(db: Instantanea, u: Usuario, cuando: Date, carpeta: string, salida: Salida): AsyncGenerator<Uint8Array> {
  const zip = salida.zip;
  const tablas = await leerTablas(db);

  // ── base-de-datos.sql ──
  const sql = new Texto(zip, `${carpeta}/base-de-datos.sql`, cuando);
  sql.escribir(
    [
      "-- Copia de seguridad de Bertona Seguros",
      `-- Generada el ${legible(cuando)} (hora de Argentina) por ${u.nombre.replace(/\s+/g, " ")}.`,
      "--",
      "-- Para restaurar:  psql \"URL_DE_LA_BASE\" -v ON_ERROR_STOP=1 -f base-de-datos.sql",
      "-- Crea las tablas que falten, BORRA los datos actuales y carga los de esta copia.",
      "-- Es todo o nada: si algo falla, la base queda como estaba.",
      "",
      "SET client_encoding = 'UTF8';",
      "SET standard_conforming_strings = on;",
      "SET datestyle = 'ISO, YMD';",
      "",
      "BEGIN;",
      "",
      "-- ───── 1. Estructura (la misma que crea el sistema al arrancar) ─────",
      SCHEMA.trim(),
      "",
      SCHEMA_SORTEO,
      "",
      "-- ───── 2. Datos ─────",
      `TRUNCATE TABLE ${tablas.map((t) => ident(t.nombre)).join(", ")} RESTART IDENTITY CASCADE;`,
      "",
    ].join("\n") + "\n"
  );
  yield* salida.vaciar();

  const planillas: { nombre: string; lineas: string[] }[] = [];
  for (const t of tablas) {
    const visibles = t.columnas.filter((c) => !c.binaria && !SECRETAS.has(c.nombre));
    const lineas = [visibles.map((c) => celda(c.nombre)).join(";")];
    const cols = t.columnas.map((c) => ident(c.nombre)).join(", ");
    sql.escribir(`\n-- ${t.nombre}\n`);
    for await (const filas of recorrer(db, t)) {
      for (const f of filas) {
        sql.escribir(`INSERT INTO ${ident(t.nombre)} (${cols}) VALUES (${t.columnas.map((c) => valorSql(f[c.nombre])).join(", ")});\n`);
        lineas.push(visibles.map((c) => celda(f[c.nombre])).join(";"));
      }
      t.filas += filas.length;
      yield* salida.vaciar();
    }
    planillas.push({ nombre: t.nombre, lineas });
  }

  // Contadores: próximo N° de recibo e ids, para que lo que se cargue después de restaurar siga la numeración.
  const seqs = await db.query("SELECT sequencename AS s, start_value::text AS ini, last_value::text AS ult FROM pg_sequences WHERE schemaname = 'public' ORDER BY 1");
  sql.escribir("\n-- ───── 3. Numeración (recibos e ids) ─────\n");
  for (const s of seqs) sql.escribir(`SELECT setval(${literal(`public.${ident(s.s)}`)}, ${s.ult ?? s.ini}, ${s.ult != null});\n`);
  sql.escribir("\nCOMMIT;\n");
  sql.cerrar();
  yield* salida.vaciar();

  // ── planillas/*.csv (para Excel) ──
  for (const p of planillas) {
    const f = new Texto(zip, `${carpeta}/planillas/${p.nombre}.csv`, cuando);
    f.escribir("﻿" + p.lineas.join("\r\n") + "\r\n");
    f.cerrar();
    yield* salida.vaciar();
  }

  // ── documentos/ (los archivos tal cual se subieron; ya vienen comprimidos, se guardan sin volver a comprimir) ──
  let archivos = 0;
  if (tablas.some((t) => t.nombre === "documentos")) {
    let desde: string | null = null;
    for (;;) {
      const docs = await db.query(
        `SELECT d.id::text AS id, d.nombre, d.datos, d.cliente_id::text AS cid, c.nombre AS cliente
         FROM documentos d LEFT JOIN clientes c ON c.id = d.cliente_id
         WHERE ($1::bigint IS NULL OR d.id > $1::bigint) ORDER BY d.id LIMIT 5`,
        [desde]
      );
      for (const d of docs) {
        const f = new ZipPassThrough(`${carpeta}/documentos/${limpio(`${d.cid} - ${d.cliente ?? "sin cliente"}`)}/${d.id} - ${nombreArchivo(d.nombre)}`);
        f.mtime = cuando;
        zip.add(f);
        f.push(d.datos instanceof Uint8Array ? d.datos : new Uint8Array(), true);
        archivos++;
        yield* salida.vaciar();
      }
      if (docs.length < 5) break;
      desde = docs[docs.length - 1].id;
    }
  }

  // ── LEEME.txt ──
  const ancho = Math.max(...tablas.map((t) => t.nombre.length)) + 4;
  const leeme = [
    "COPIA DE SEGURIDAD - BERTONA SEGUROS",
    "====================================",
    `Fecha: ${legible(cuando)} (hora de Argentina)`,
    `Descargada por: ${u.nombre}${u.email ? ` (${u.email})` : ""}`,
    "",
    "QUÉ HAY EN ESTA CARPETA",
    "",
    "- base-de-datos.sql",
    "  La base de datos completa: clientes, pólizas, cuotas, pagos y recibos, siniestros,",
    "  avisos, usuarios con sus contraseñas (cifradas), configuración y todos los archivos subidos.",
    "  Es el archivo que sirve para recuperar el sistema tal como estaba en esta fecha.",
    "",
    "- planillas (se abren con Excel)",
    "  Una planilla por tabla, para consultar los datos sin el sistema.",
    "  No incluyen contraseñas ni archivos.",
    "",
    `- documentos (${archivos} archivos)`,
    "  Los archivos subidos al sistema (pólizas, comprobantes, fotos), en una carpeta por cliente.",
    "",
    "CANTIDAD DE REGISTROS",
    "",
    ...tablas.map((t) => `  ${t.nombre.padEnd(ancho, ".")} ${t.filas}`),
    "",
    "CUIDADO",
    "",
    "Tiene datos personales de los clientes. Guardala en un lugar seguro (disco externo,",
    "pendrive o una nube privada) y no la compartas.",
    "",
    "CÓMO RESTAURAR (lo hace la persona que mantiene el sistema)",
    "",
    "  psql \"URL_DE_LA_BASE\" -v ON_ERROR_STOP=1 -f base-de-datos.sql",
    "",
    "- Sirve sobre una base vacía o sobre la actual: crea las tablas que falten,",
    "  BORRA los datos que haya y carga los de esta copia.",
    "- Es todo o nada: si algo falla, la base queda como estaba.",
    "",
  ];
  const f = new Texto(zip, `${carpeta}/LEEME.txt`, cuando);
  f.escribir("﻿" + leeme.join("\r\n"));
  f.cerrar();

  zip.end();
  yield* salida.vaciar();
}

let enCurso = 0; // cuándo arrancó la copia que se está generando (0 = ninguna)

export async function backup(): Promise<Response> {
  const u = await getUsuario();
  if (!u || u.rol !== "admin") return texto("No autorizado", 403);
  // Una sola copia a la vez: es la tarea más pesada del sistema. Si quedó colgada, a los 15 minutos se libera.
  if (enCurso && Date.now() - enCurso < 15 * 60_000) return texto("Ya se está generando una copia de seguridad. Esperá a que termine y probá de nuevo.", 429);
  enCurso = Date.now();
  let db: Instantanea;
  try {
    db = await abrirInstantanea();
  } catch (e) {
    enCurso = 0;
    throw e;
  }
  const cuando = horaArgentina();
  const nombre = `bertona-backup-${sello(cuando)}`;
  const salida = new Salida();
  const gen = generar(db, u, cuando, nombre, salida);
  let cerrada = false;
  const terminar = async () => {
    if (cerrada) return;
    cerrada = true;
    enCurso = 0;
    await db.cerrar();
  };

  const body = new ReadableStream<Uint8Array>({
    async pull(ctrl) {
      try {
        const r = await gen.next();
        if (!r.done) return ctrl.enqueue(r.value);
        await terminar();
        ctrl.close();
        // Queda registrado en Configuración para mostrar cuándo fue la última copia.
        const valor = JSON.stringify({ fecha: legible(cuando), por: u.nombre, tamano: tamanoLegible(salida.bytes) });
        await q("INSERT INTO config (clave, valor) VALUES ('ultimo_backup', $1) ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor", [valor]).catch((e) =>
          console.error("[backup] no se pudo registrar", e)
        );
      } catch (e) {
        console.error("[backup]", e);
        await terminar();
        ctrl.error(e); // corta la descarga: el navegador la marca como fallida en vez de guardar un zip roto
      }
    },
    async cancel() {
      await gen.return(undefined).catch(() => {});
      await terminar();
    },
  });

  return new Response(body, {
    headers: { ...HDR, "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="${nombre}.zip"` },
  });
}
