/**
 * Capa de datos. PostgreSQL en producción (DATABASE_URL, ej. Neon) y PGlite
 * (Postgres embebido, carpeta .data/) en desarrollo local. Mismo SQL en ambos.
 */
import bcrypt from "bcryptjs";

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
type Runner = {
  query: (text: string, params?: unknown[]) => Promise<Row[]>;
  exec: (text: string) => Promise<void>;
};

const g = globalThis as unknown as { __bz?: { runner?: Promise<Runner>; ready?: Promise<void> } };
g.__bz ??= {};

async function crearRunner(): Promise<Runner> {
  if (process.env.DATABASE_URL) {
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3 });
    return {
      query: async (t, p) => (await pool.query(t, p as unknown[])).rows,
      exec: async (t) => {
        await pool.query(t);
      },
    };
  }
  if (process.env.NODE_ENV === "production") throw new Error("Falta DATABASE_URL en producción");
  const { mkdirSync } = await import("node:fs");
  mkdirSync("./.data", { recursive: true });
  const { PGlite } = await import("@electric-sql/pglite");
  const db = new PGlite("./.data/pglite");
  return {
    query: async (t, p) => (await db.query(t, p as unknown[])).rows as Row[],
    exec: async (t) => {
      await db.exec(t);
    },
  };
}

const SCHEMA = `
CREATE SEQUENCE IF NOT EXISTS recibo_seq START 1;

CREATE TABLE IF NOT EXISTS clientes (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  documento TEXT,
  email TEXT,
  telefono TEXT,
  direccion TEXT,
  localidad TEXT,
  notas TEXT,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('admin','socio')),
  cliente_id INT REFERENCES clientes(id) ON DELETE CASCADE,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  debe_cambiar_password BOOLEAN NOT NULL DEFAULT FALSE,
  creado TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contactos_emergencia (
  id SERIAL PRIMARY KEY,
  cliente_id INT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  parentesco TEXT,
  telefono TEXT NOT NULL,
  email TEXT,
  notas TEXT,
  creado TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS polizas (
  id SERIAL PRIMARY KEY,
  cliente_id INT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  ramo TEXT NOT NULL,
  compania TEXT NOT NULL,
  numero TEXT NOT NULL,
  riesgo TEXT,
  dominio TEXT,
  suma_asegurada NUMERIC(16,2),
  periodicidad TEXT NOT NULL DEFAULT 'mensual',
  cuotas_cant INT NOT NULL DEFAULT 1,
  importe_cuota NUMERIC(14,2) NOT NULL DEFAULT 0,
  vigencia_desde DATE,
  vigencia_hasta DATE,
  estado TEXT NOT NULL DEFAULT 'vigente',
  notas TEXT,
  creado TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cuotas (
  id SERIAL PRIMARY KEY,
  poliza_id INT NOT NULL REFERENCES polizas(id) ON DELETE CASCADE,
  numero INT NOT NULL,
  vencimiento DATE NOT NULL,
  importe NUMERIC(14,2) NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  UNIQUE (poliza_id, numero)
);

CREATE TABLE IF NOT EXISTS pagos (
  id SERIAL PRIMARY KEY,
  recibo_nro INT NOT NULL UNIQUE DEFAULT nextval('recibo_seq'),
  cliente_id INT NOT NULL REFERENCES clientes(id),
  poliza_id INT REFERENCES polizas(id) ON DELETE SET NULL,
  cuota_id INT REFERENCES cuotas(id) ON DELETE SET NULL,
  fecha DATE NOT NULL,
  importe NUMERIC(14,2) NOT NULL,
  metodo TEXT NOT NULL,
  referencia TEXT,
  observaciones TEXT,
  estado TEXT NOT NULL DEFAULT 'aplicado',
  anulado_motivo TEXT,
  registrado_por INT REFERENCES usuarios(id) ON DELETE SET NULL,
  creado TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS documentos (
  id SERIAL PRIMARY KEY,
  cliente_id INT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  poliza_id INT REFERENCES polizas(id) ON DELETE CASCADE,
  pago_id INT REFERENCES pagos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  nombre TEXT NOT NULL,
  mime TEXT NOT NULL,
  tamano INT NOT NULL,
  datos BYTEA NOT NULL,
  subido_por INT REFERENCES usuarios(id) ON DELETE SET NULL,
  creado TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_polizas_cliente ON polizas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cuotas_poliza ON cuotas(poliza_id);
CREATE INDEX IF NOT EXISTS idx_cuotas_venc ON cuotas(vencimiento) WHERE estado = 'pendiente';
CREATE INDEX IF NOT EXISTS idx_pagos_cliente ON pagos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pagos_fecha ON pagos(fecha);
CREATE INDEX IF NOT EXISTS idx_docs_poliza ON documentos(poliza_id);
CREATE INDEX IF NOT EXISTS idx_docs_pago ON documentos(pago_id);
`;

async function inicializar(r: Runner) {
  await r.exec(SCHEMA);
  const hay = await r.query("SELECT 1 FROM usuarios WHERE rol = 'admin' LIMIT 1");
  if (hay.length) return;
  let email = process.env.ADMIN_EMAIL;
  let pass = process.env.ADMIN_PASSWORD;
  if (!email || !pass) {
    if (process.env.NODE_ENV === "production") return; // sin admin: configurar ADMIN_EMAIL / ADMIN_PASSWORD
    email = "admin@bertona.local";
    pass = "admin1234";
    console.warn("[db] Admin de desarrollo creado: admin@bertona.local / admin1234");
  }
  await r.query(
    "INSERT INTO usuarios (email, nombre, password_hash, rol) VALUES ($1, $2, $3, 'admin') ON CONFLICT (email) DO NOTHING",
    [email.toLowerCase(), "Administrador", await bcrypt.hash(pass, 10)]
  );
}

async function runner(): Promise<Runner> {
  const reset = (e: unknown) => {
    g.__bz = {}; // no cachear fallos de conexión / inicialización
    throw e;
  };
  g.__bz!.runner ??= crearRunner().catch(reset);
  const r = await g.__bz!.runner;
  g.__bz!.ready ??= inicializar(r).catch(reset);
  await g.__bz!.ready;
  return r;
}

/** Ejecuta una consulta parametrizada y devuelve las filas. */
export async function q(text: string, params: unknown[] = []): Promise<Row[]> {
  return (await runner()).query(text, params);
}

export async function q1(text: string, params: unknown[] = []): Promise<Row | null> {
  return (await q(text, params))[0] ?? null;
}
