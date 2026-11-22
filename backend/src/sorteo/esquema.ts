/**
 * Sorteo Speedway: tablas propias, independientes del resto del sistema (no se toca ninguna tabla existente).
 * Migración idempotente (IF NOT EXISTS): corre sola la primera vez que se usa el módulo después de cada arranque.
 * Si algo de acá fallara, solo deja de andar el sorteo; el resto del sistema sigue igual.
 * La copia de seguridad incluye este mismo texto para poder restaurar en una base vacía.
 */
import { q } from "../db";

const SENTENCIAS: string[] = [
  `CREATE TABLE IF NOT EXISTS sorteos (
  id SERIAL PRIMARY KEY,
  titulo TEXT NOT NULL,
  premio TEXT NOT NULL DEFAULT '',
  descripcion TEXT NOT NULL DEFAULT '',
  fecha_inicio DATE,
  fecha_fin DATE,
  fecha_sorteo TIMESTAMP,
  whatsapp TEXT NOT NULL DEFAULT '',
  mensaje TEXT NOT NULL DEFAULT '',
  bases TEXT NOT NULL DEFAULT '',
  activo BOOLEAN NOT NULL DEFAULT FALSE,
  creado TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado TIMESTAMPTZ NOT NULL DEFAULT now()
)`,
  // Un solo sorteo activo a la vez.
  `CREATE UNIQUE INDEX IF NOT EXISTS ux_sorteos_un_activo ON sorteos (activo) WHERE activo`,

  `CREATE TABLE IF NOT EXISTS sorteo_participantes (
  id SERIAL PRIMARY KEY,
  sorteo_id INT NOT NULL REFERENCES sorteos(id),
  codigo TEXT NOT NULL,
  nombre TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  localidad TEXT NOT NULL,
  vehiculo TEXT NOT NULL,
  vencimiento_seguro TEXT,
  acepta_bases BOOLEAN NOT NULL DEFAULT FALSE,
  alertas_tormenta BOOLEAN NOT NULL DEFAULT FALSE,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  confirmado_en TIMESTAMPTZ,
  confirmado_por TEXT,
  origen TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  creado TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT sorteo_participantes_estado_chk CHECK (estado IN ('pendiente', 'confirmado')),
  CONSTRAINT sorteo_participantes_sorteo_whatsapp_key UNIQUE (sorteo_id, whatsapp)
)`,
  // El código es único en todo el sistema: buscarlo (o confirmarlo desde el bot) es instantáneo.
  `CREATE UNIQUE INDEX IF NOT EXISTS ux_sorteo_participantes_codigo ON sorteo_participantes (codigo)`,
  `CREATE INDEX IF NOT EXISTS idx_sorteo_participantes_sorteo ON sorteo_participantes (sorteo_id, creado)`,

  `CREATE TABLE IF NOT EXISTS sorteo_ganadores (
  id SERIAL PRIMARY KEY,
  sorteo_id INT NOT NULL REFERENCES sorteos(id),
  participante_id INT NOT NULL REFERENCES sorteo_participantes(id),
  tipo TEXT NOT NULL,
  elegibles INT NOT NULL,
  sorteado_por TEXT,
  creado TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT sorteo_ganadores_tipo_chk CHECK (tipo IN ('ganador', 'suplente')),
  -- Un ganador (o suplente) no puede volver a salir en el mismo sorteo.
  CONSTRAINT sorteo_ganadores_unico UNIQUE (sorteo_id, participante_id)
)`,
];

/** Estructura de las tablas del sorteo como texto SQL (para la copia de seguridad). */
export const SCHEMA_SORTEO = "-- ── Sorteo Speedway (tablas propias del módulo de sorteos) ──\n" + SENTENCIAS.map((s) => s + ";").join("\n");

let listo: Promise<void> | null = null;

/** Crea las tablas del sorteo si faltan. Una sola vez por arranque; si falla, se reintenta en la próxima solicitud. */
export function asegurarEsquema(): Promise<void> {
  listo ??= (async () => {
    for (const s of SENTENCIAS) await q(s);
  })().catch((e) => {
    listo = null;
    throw e;
  });
  return listo;
}
