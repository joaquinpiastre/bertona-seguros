import { q, q1 } from "./db";

export type FiltroPagos = { desde: string; hasta: string; metodo?: string; busqueda?: string; estado?: string };

export async function listarPagos(f: FiltroPagos) {
  const params: unknown[] = [f.desde, f.hasta];
  let where = "pg.fecha BETWEEN $1 AND $2";
  if (f.metodo) {
    params.push(f.metodo);
    where += ` AND pg.metodo = $${params.length}`;
  }
  if (f.estado === "aplicado" || f.estado === "anulado") {
    params.push(f.estado);
    where += ` AND pg.estado = $${params.length}`;
  }
  if (f.busqueda) {
    params.push(`%${f.busqueda}%`, f.busqueda.replace(/^0+/, ""));
    const n = params.length;
    where += ` AND (cl.nombre ILIKE $${n - 1} OR p.numero ILIKE $${n - 1} OR p.dominio ILIKE $${n - 1} OR pg.referencia ILIKE $${n - 1} OR pg.recibo_nro::text = $${n})`;
  }
  return q(
    `SELECT pg.id, pg.recibo_nro, pg.fecha::text AS fecha, pg.importe::float8 AS importe, pg.metodo, pg.estado, pg.referencia,
            cl.id AS cliente_id, cl.nombre AS cliente, p.id AS poliza_id, p.numero AS poliza, p.compania, p.dominio, c.numero AS cuota_n,
            u.nombre AS registrado_por
     FROM pagos pg
     JOIN clientes cl ON cl.id = pg.cliente_id
     LEFT JOIN polizas p ON p.id = pg.poliza_id
     LEFT JOIN cuotas c ON c.id = pg.cuota_id
     LEFT JOIN usuarios u ON u.id = pg.registrado_por
     WHERE ${where}
     ORDER BY pg.fecha DESC, pg.id DESC
     LIMIT 1000`,
    params
  );
}

export async function datosRecibo(pagoId: number) {
  return q1(
    `SELECT pg.id, pg.recibo_nro, pg.fecha::text AS fecha, pg.importe::float8 AS importe, pg.metodo, pg.estado, pg.cliente_id,
            cl.nombre AS cliente, p.numero AS poliza, p.riesgo, p.dominio, p.compania, p.cuotas_cant,
            c.numero AS cuota_n, c.vencimiento::text AS vto,
            (SELECT n.vencimiento::text FROM cuotas n
               WHERE c.id IS NOT NULL AND n.poliza_id = pg.poliza_id AND n.numero > c.numero AND n.estado <> 'anulada'
               ORDER BY n.numero LIMIT 1) AS prox
     FROM pagos pg
     JOIN clientes cl ON cl.id = pg.cliente_id
     LEFT JOIN polizas p ON p.id = pg.poliza_id
     LEFT JOIN cuotas c ON c.id = pg.cuota_id
     WHERE pg.id = $1`,
    [pagoId]
  );
}
