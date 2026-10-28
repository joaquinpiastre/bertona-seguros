import { archivo } from "@/lib/api";

/** Recibo de un pago (lo genera el backend). Con ?sistema=1 se fuerza el recibo generado; con ?cuota=1 se imprime solo la cuota de ese pago. */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const sp = new URL(req.url).searchParams;
  const qs = new URLSearchParams();
  if (sp.get("sistema") === "1") qs.set("sistema", "1");
  if (sp.get("cuota") === "1") qs.set("cuota", "1");
  return archivo(`recibo/${Number(id)}${qs.size ? `?${qs}` : ""}`);
}
