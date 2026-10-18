import { getUsuario } from "./auth";
import { TEXTO_BLOQUEO, bloqueoPoliza } from "./core";
import { q1 } from "./db";
import { METODOS, esFecha, fecha, hoy } from "./format";
import { generarReciboPdf } from "./pdf";
import { datosRecibo, listarPagos } from "./queries";

const HDR = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
const texto = (s: string, status: number) => new Response(s, { status });
const bytes = (b: Buffer | Uint8Array) => new Uint8Array(b);

export async function documento(id: number): Promise<Response> {
  const u = await getUsuario();
  if (!u) return texto("No autorizado", 401);
  const d = await q1("SELECT cliente_id, poliza_id, siniestro_id, nombre, mime, datos FROM documentos WHERE id = $1", [id]);
  if (!d) return texto("No encontrado", 404);
  if (u.rol !== "admin" && d.cliente_id !== u.cliente_id) return texto("No autorizado", 403);
  if (u.rol !== "admin" && !d.siniestro_id && (await bloqueoPoliza(d.poliza_id))) return texto(TEXTO_BLOQUEO.falta_pago, 403);
  return new Response(bytes(d.datos), {
    headers: { ...HDR, "Content-Type": d.mime, "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(d.nombre)}` },
  });
}

/** Recibo de un pago. Si se cargó un recibo propio se devuelve ese; con sistema=true se fuerza el generado. */
export async function recibo(id: number, sistema: boolean): Promise<Response> {
  const u = await getUsuario();
  if (!u) return texto("No autorizado", 401);
  const d = await datosRecibo(id);
  if (!d) return texto("No encontrado", 404);
  if (u.rol !== "admin" && d.cliente_id !== u.cliente_id) return texto("No autorizado", 403);
  if (u.rol !== "admin") {
    const pg = await q1("SELECT poliza_id FROM pagos WHERE id = $1", [id]);
    if (await bloqueoPoliza(pg?.poliza_id ?? null)) return texto(TEXTO_BLOQUEO.falta_pago, 403);
  }

  if (!sistema && d.estado === "aplicado") {
    const propio = await q1("SELECT nombre, mime, datos FROM documentos WHERE pago_id = $1 AND tipo = 'recibo' ORDER BY id DESC LIMIT 1", [d.id]);
    if (propio) {
      return new Response(bytes(propio.datos), {
        headers: { ...HDR, "Content-Type": propio.mime, "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(propio.nombre)}` },
      });
    }
  }
  const pdf = await generarReciboPdf({
    nro: d.recibo_nro,
    cliente: d.cliente,
    poliza: d.poliza ?? "-",
    fecha: d.fecha,
    riesgo: d.riesgo ?? "",
    cuota: d.cuota_n ? `${d.cuota_n} de ${d.cuotas_cant}` : "A cuenta",
    proxVenc: d.prox ?? "",
    dominio: d.dominio ?? "",
    vtoCuota: d.vto ?? "",
    compania: d.compania ?? "-",
    importe: d.importe,
    metodo: METODOS[d.metodo] ?? d.metodo,
    anulado: d.estado === "anulado",
  });
  return new Response(bytes(pdf), {
    headers: { ...HDR, "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="recibo-${String(d.recibo_nro).padStart(6, "0")}.pdf"` },
  });
}

const celda = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

export async function exportarPagos(sp: URLSearchParams): Promise<Response> {
  const u = await getUsuario();
  if (!u || u.rol !== "admin") return texto("No autorizado", 403);
  const h = hoy();
  const desde = esFecha(sp.get("desde")) ? sp.get("desde")! : h.slice(0, 8) + "01";
  const hasta = esFecha(sp.get("hasta")) ? sp.get("hasta")! : h;
  const filas = await listarPagos({ desde, hasta, metodo: sp.get("metodo") || undefined, busqueda: sp.get("q") || undefined, estado: sp.get("estado") || undefined });
  const cab = ["Recibo", "Fecha", "Cliente", "Póliza", "Compañía", "Dominio", "Cuota", "Forma de pago", "Referencia", "Importe", "Estado", "Registrado por"];
  const lineas = [cab.map(celda).join(";")];
  for (const f of filas) {
    lineas.push(
      [String(f.recibo_nro).padStart(6, "0"), fecha(f.fecha), f.cliente, f.poliza, f.compania, f.dominio, f.cuota_n, METODOS[f.metodo] ?? f.metodo, f.referencia, String(f.importe).replace(".", ","), f.estado, f.registrado_por]
        .map(celda).join(";")
    );
  }
  return new Response("﻿" + lineas.join("\r\n"), {
    headers: { ...HDR, "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="pagos-${desde}_${hasta}.csv"` },
  });
}
