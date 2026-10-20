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

CREATE TABLE IF NOT EXISTS avisos_pago (
  id SERIAL PRIMARY KEY,
  cliente_id INT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  poliza_id INT REFERENCES polizas(id) ON DELETE SET NULL,
  cuota_id INT REFERENCES cuotas(id) ON DELETE SET NULL,
  importe NUMERIC(14,2),
  fecha DATE,
  metodo TEXT,
  nota TEXT,
  documento_id INT REFERENCES documentos(id) ON DELETE SET NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  motivo TEXT,
  pago_id INT REFERENCES pagos(id) ON DELETE SET NULL,
  creado TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Ingreso de clientes con DNI, agencia, cobertura ──
ALTER TABLE usuarios ALTER COLUMN email DROP NOT NULL;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS dni TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS pin_hash TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS ux_usuarios_dni ON usuarios(dni) WHERE dni IS NOT NULL;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS es_agencia BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE polizas ADD COLUMN IF NOT EXISTS cobertura TEXT;

-- ── Configuración editable desde el panel ──
CREATE TABLE IF NOT EXISTS config (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL DEFAULT ''
);

-- ── Siniestros ──
CREATE TABLE IF NOT EXISTS siniestros (
  id SERIAL PRIMARY KEY,
  cliente_id INT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  poliza_id INT REFERENCES polizas(id) ON DELETE SET NULL,
  fecha_hecho DATE,
  hora TEXT,
  lugar TEXT,
  tipo TEXT,
  descripcion TEXT,
  terceros TEXT,
  denuncia_policial TEXT,
  nro_compania TEXT,
  estado TEXT NOT NULL DEFAULT 'denunciado',
  origen TEXT NOT NULL DEFAULT 'admin',
  creado TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS siniestro_notas (
  id SERIAL PRIMARY KEY,
  siniestro_id INT NOT NULL REFERENCES siniestros(id) ON DELETE CASCADE,
  texto TEXT NOT NULL,
  autor TEXT,
  creado TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE documentos ADD COLUMN IF NOT EXISTS siniestro_id INT REFERENCES siniestros(id) ON DELETE CASCADE;

-- ── Avisos para la empresa (trámites, bajas, siniestros, pagos informados, pólizas vencidas...) ──
CREATE TABLE IF NOT EXISTS alertas (
  id SERIAL PRIMARY KEY,
  tipo TEXT NOT NULL,
  cliente_id INT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  poliza_id INT REFERENCES polizas(id) ON DELETE SET NULL,
  titulo TEXT NOT NULL,
  detalle TEXT,
  datos TEXT,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  creado TIMESTAMPTZ NOT NULL DEFAULT now(),
  resuelta_en TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_alertas_estado ON alertas(estado);
CREATE INDEX IF NOT EXISTS idx_siniestros_cliente ON siniestros(cliente_id);

CREATE INDEX IF NOT EXISTS idx_avisos_estado ON avisos_pago(estado);
CREATE INDEX IF NOT EXISTS idx_polizas_cliente ON polizas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cuotas_poliza ON cuotas(poliza_id);
CREATE INDEX IF NOT EXISTS idx_cuotas_venc ON cuotas(vencimiento) WHERE estado = 'pendiente';
CREATE INDEX IF NOT EXISTS idx_pagos_cliente ON pagos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pagos_fecha ON pagos(fecha);
CREATE INDEX IF NOT EXISTS idx_docs_poliza ON documentos(poliza_id);
CREATE INDEX IF NOT EXISTS idx_docs_pago ON documentos(pago_id);

-- ── Recibo único para varias cuotas pagadas juntas (mismo N° de recibo en cada fila) ──
ALTER TABLE pagos DROP CONSTRAINT IF EXISTS pagos_recibo_nro_key;
CREATE INDEX IF NOT EXISTS idx_pagos_recibo ON pagos(recibo_nro);
CREATE TABLE IF NOT EXISTS aviso_cuotas (
  aviso_id INT NOT NULL REFERENCES avisos_pago(id) ON DELETE CASCADE,
  cuota_id INT NOT NULL REFERENCES cuotas(id) ON DELETE CASCADE,
  PRIMARY KEY (aviso_id, cuota_id)
);
INSERT INTO aviso_cuotas (aviso_id, cuota_id) SELECT id, cuota_id FROM avisos_pago WHERE cuota_id IS NOT NULL ON CONFLICT DO NOTHING;

-- ── Contraseña de ingreso de los socios (la define la oficina) ──
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS tiene_clave BOOLEAN NOT NULL DEFAULT FALSE;
UPDATE usuarios SET password_hash = pin_hash, tiene_clave = TRUE WHERE rol = 'socio' AND pin_hash IS NOT NULL AND NOT tiene_clave;
UPDATE usuarios SET pin_hash = NULL WHERE rol = 'socio' AND tiene_clave AND pin_hash IS NOT NULL;

-- ── Cobro por tarjeta y actualización periódica (ej. cuatrimestral) con certificado por período ──
-- cobro: 'oficina' (lo cobramos nosotros) | 'credito' | 'debito' (lo cobra la compañía con la tarjeta del cliente).
-- periodicidad pasa a ser solo la frecuencia de las cuotas; actualizacion_meses es cada cuánto se actualiza la póliza (0 = nunca).
ALTER TABLE polizas ADD COLUMN IF NOT EXISTS cobro TEXT NOT NULL DEFAULT 'oficina';
ALTER TABLE polizas ADD COLUMN IF NOT EXISTS actualizacion_meses INT NOT NULL DEFAULT 0;
CREATE TABLE IF NOT EXISTS certificados (
  id SERIAL PRIMARY KEY,
  poliza_id INT NOT NULL REFERENCES polizas(id) ON DELETE CASCADE,
  desde DATE NOT NULL,
  hasta DATE NOT NULL,
  documento_id INT REFERENCES documentos(id) ON DELETE SET NULL,
  nota TEXT,
  creado TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_certificados_poliza ON certificados(poliza_id);
`;

async function inicializar(r: Runner) {
  await r.exec(SCHEMA);
  // Contenido inicial del auxilio mecánico (información de Meridional Seguros). Se puede editar en Configuración.
  const semillas: Record<string, string> = {
    auxilio_telefono: "0800-333-3244",
    auxilio_texto: [
      "El servicio funciona las 24 horas, los 365 días del año.",
      "",
      "Cómo se pide:",
      "1. Llamá por teléfono al número de atención al cliente.",
      "2. Tené a mano el número de tu póliza, el nombre del titular, los datos del vehículo y un teléfono de contacto.",
      "3. Si querés reintegro de algún gasto, la central tiene que autorizarlo antes; después presentás las facturas originales.",
      "",
      "Tené en cuenta:",
      "- Hasta 2 servicios por mes.",
      "- No incluye segundos traslados ni remolques de taller a taller.",
      "- Si el vehículo lleva mercadería, hay que descargarla antes del remolque.",
      "- Los repuestos que necesite la reparación los paga el asegurado.",
      "- Los kilómetros gratuitos dependen de la cobertura que contrataste: mirá tu póliza.",
      "",
      "Asistencia al viajero (seguros de automotor): asistencia médica de urgencia por accidente, alojamiento o traslado si el vehículo queda inmovilizado, asistencia legal por accidente en el exterior y acompañamiento de menores.",
    ].join("\n"),
    auxilio_planes: [
      "Responsabilidad civil | 8 servicios por año | hasta 100 km lineales (200 km en total)",
      "Incendio y robo total | 8 servicios por año | hasta 100 km lineales (200 km en total)",
      "Resto de las coberturas | 8 servicios por año | hasta 100 km lineales (200 km en total)",
      "Clientes Gold | 6 servicios por año | hasta 200 km lineales (400 km en total)",
      "Clientes Gold (otra opción) | 2 servicios por año | hasta 400 km lineales (800 km en total)",
    ].join("\n"),
  };
  for (const [k, v] of Object.entries(semillas)) {
    await r.query("INSERT INTO config (clave, valor) VALUES ($1, $2) ON CONFLICT (clave) DO NOTHING", [k, v]);
  }
  // Clientes que ya tenían usuario: su DNI pasa a ser el usuario de ingreso.
  try {
    await r.query(
      `UPDATE usuarios u SET dni = regexp_replace(c.documento, '[^0-9]', '', 'g')
       FROM clientes c WHERE u.cliente_id = c.id AND u.rol = 'socio' AND u.dni IS NULL
         AND length(regexp_replace(c.documento, '[^0-9]', '', 'g')) >= 7`
    );
  } catch (e) {
    console.warn("[db] No se pudo migrar algún DNI:", (e as Error).message);
  }
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
