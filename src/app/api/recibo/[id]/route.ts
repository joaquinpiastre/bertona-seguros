import { getUsuario } from "@/lib/auth";
import { q1 } from "@/lib/db";
import { METODOS } from "@/lib/format";
import { generarReciboPdf } from "@/lib/pdf";
import { datosRecibo } from "@/lib/queries";

/** Recibo de un pago. Si se cargó un recibo propio se devuelve ese; con ?sistema=1 se fuerza el generado. */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const u = await getUsuario();
  if (!u) return new Response("No autorizado", { status: 401 });
  const { id } = await ctx.params;
  const d = await datosRecibo(Number(id));
  if (!d) return new Response("No encontrado", { status: 404 });
  if (u.rol !== "admin" && d.cliente_id !== u.cliente_id) return new Response("No autorizado", { status: 403 });

  const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
  const forzarSistema = new URL(req.url).searchParams.get("sistema") === "1";
  if (!forzarSistema && d.estado === "aplicado") {
    const propio = await q1(
      "SELECT nombre, mime, datos FROM documentos WHERE pago_id = $1 AND tipo = 'recibo' ORDER BY id DESC LIMIT 1",
      [d.id]
    );
    if (propio) {
      return new Response(new Uint8Array(propio.datos), {
        headers: { ...headers, "Content-Type": propio.mime, "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(propio.nombre)}` },
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
  return new Response(new Uint8Array(pdf), {
    headers: { ...headers, "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="recibo-${String(d.recibo_nro).padStart(6, "0")}.pdf"` },
  });
}
