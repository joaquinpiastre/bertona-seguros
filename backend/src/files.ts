import { getUsuario, pagoDeTokenRecibo } from "./auth";
import { TEXTO_BLOQUEO, bloqueoPoliza } from "./core";
import { q1 } from "./db";
import { METODOS, PERIODICIDAD, esFecha, fecha, hoy, sumarMeses } from "./format";
import { ADVERTENCIAS_CONSTANCIA, generarConstanciaPdf, generarReciboPdf, type ConstanciaData } from "./pdf";
import { datosReciboGrupo, listarPagos } from "./queries";

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

/**
 * Arma el PDF del recibo (todas las cuotas que cubre) a partir de un pago cualquiera del recibo.
 * Con soloEsta = true imprime únicamente la cuota de ese pago (para entregar un comprobante por cuota).
 */
async function reciboPdf(pagoId: number, soloEsta = false) {
  const g = await datosReciboGrupo(pagoId);
  if (!g) return null;
  if (soloEsta) g.lineas = g.lineas.filter((l) => l.id === pagoId);
  // Próximo vencimiento: la siguiente cuota pendiente; si se pagó la última, el que sigue (mismo día del mes siguiente, según la frecuencia de las cuotas).
  const prox = g.lineas
    .map((l) => l.prox || (l.vto ? sumarMeses(l.vto, PERIODICIDAD[l.periodicidad]?.meses ?? 1) : ""))
    .filter(Boolean)
    .sort()[0] ?? "";
  const pdf = await generarReciboPdf({
    nro: g.cab.recibo_nro,
    cliente: g.cab.cliente,
    documento: g.cab.documento ?? "",
    fecha: g.cab.fecha,
    metodo: METODOS[g.cab.metodo] ?? g.cab.metodo,
    anulado: g.cab.estado === "anulado",
    proxVenc: prox,
    lineas: g.lineas.map((l) => ({
      poliza: l.poliza ?? "-",
      compania: l.compania ?? "",
      riesgo: l.riesgo ?? "",
      dominio: l.dominio ?? "",
      cuota: l.cuota_n ? `${l.cuota_n} de ${l.cuotas_cant}` : "A cuenta",
      vtoCuota: l.vto ?? "",
      importe: l.importe,
    })),
  });
  return { pdf, nro: g.cab.recibo_nro as number };
}

const respuestaRecibo = (r: { pdf: Uint8Array; nro: number }) =>
  new Response(bytes(r.pdf), {
    headers: { ...HDR, "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="recibo-${String(r.nro).padStart(6, "0")}.pdf"` },
  });

/**
 * Recibo de un pago. Si se cargó un recibo propio se devuelve ese; con sistema=true se fuerza el generado.
 * Con soloEsta = true se imprime solo la cuota de ese pago (siempre con el recibo generado por el sistema).
 */
export async function recibo(id: number, sistema: boolean, soloEsta = false): Promise<Response> {
  const u = await getUsuario();
  if (!u) return texto("No autorizado", 401);
  const d = await q1("SELECT id, recibo_nro, cliente_id, poliza_id, estado FROM pagos WHERE id = $1", [id]);
  if (!d) return texto("No encontrado", 404);
  if (u.rol !== "admin" && d.cliente_id !== u.cliente_id) return texto("No autorizado", 403);
  if (u.rol !== "admin" && (await bloqueoPoliza(d.poliza_id ?? null))) return texto(TEXTO_BLOQUEO.falta_pago, 403);

  if (!sistema && !soloEsta && d.estado === "aplicado") {
    const propio = await q1(
      `SELECT nombre, mime, datos FROM documentos WHERE tipo = 'recibo'
         AND pago_id IN (SELECT id FROM pagos WHERE recibo_nro = $1 AND cliente_id = $2) ORDER BY id DESC LIMIT 1`,
      [d.recibo_nro, d.cliente_id]
    );
    if (propio) {
      return new Response(bytes(propio.datos), {
        headers: { ...HDR, "Content-Type": propio.mime, "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(propio.nombre)}` },
      });
    }
  }
  const r = await reciboPdf(id, soloEsta);
  return r ? respuestaRecibo(r) : texto("No encontrado", 404);
}

/** Recibo por enlace firmado (para mandarlo por WhatsApp): no requiere ingresar. */
export async function reciboPublico(token: string): Promise<Response> {
  const id = await pagoDeTokenRecibo(token);
  if (!id) return texto("El enlace no es válido o venció.", 404);
  const r = await reciboPdf(id);
  return r ? respuestaRecibo(r) : texto("No encontrado", 404);
}

// ───────── Constancia de cobertura ─────────
export function constanciaDeParametros(get: (k: string) => string | null | undefined): ConstanciaData {
  const t = (k: string) => String(get(k) ?? "").trim();
  return {
    emitida: esFecha(t("emitida")) ? t("emitida") : hoy(),
    vence: esFecha(t("vence")) ? t("vence") : "",
    numero: t("numero"),
    asegurado: t("asegurado"),
    dni: t("dni"),
    domicilio: t("domicilio"),
    localidad: t("localidad"),
    poliza: t("poliza"),
    compania: t("compania"),
    ramo: t("ramo"),
    desde: esFecha(t("desde")) ? t("desde") : "",
    hasta: esFecha(t("hasta")) ? t("hasta") : "",
    vehiculo: t("vehiculo"),
    uso: t("uso"),
    patente: t("patente").toUpperCase(),
    anio: t("anio"),
    motor: t("motor"),
    chasis: t("chasis"),
    suma: t("suma"),
    cobertura: t("cobertura"),
    detalle: t("detalle"),
    productor: t("productor"),
    advertencias: t("advertencias") || ADVERTENCIAS_CONSTANCIA,
  };
}

/** Vista previa / descarga de la constancia con los datos (editables) que llegan por la dirección. Solo el personal. */
export async function constancia(sp: URLSearchParams): Promise<Response> {
  const u = await getUsuario();
  if (!u || u.rol !== "admin") return texto("No autorizado", 403);
  const d = constanciaDeParametros((k) => sp.get(k));
  if (!d.asegurado || !d.poliza) return texto("Faltan el nombre del asegurado y el número de póliza.", 400);
  const pdf = await generarConstanciaPdf(d);
  return new Response(bytes(pdf), {
    headers: { ...HDR, "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="constancia-${d.poliza.replace(/[^\w-]/g, "")}.pdf"` },
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
