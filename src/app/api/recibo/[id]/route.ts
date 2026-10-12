import { archivo } from "@/lib/api";

/** Recibo de un pago (lo genera el backend). Con ?sistema=1 se fuerza el recibo generado. */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const sistema = new URL(req.url).searchParams.get("sistema") === "1" ? "?sistema=1" : "";
  return archivo(`recibo/${Number(id)}${sistema}`);
}
