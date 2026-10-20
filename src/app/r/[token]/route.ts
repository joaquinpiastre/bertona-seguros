import { archivo } from "@/lib/api";

/** Recibo por enlace firmado: se manda por WhatsApp y se abre sin ingresar. */
export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  return archivo(`recibo-publico?t=${encodeURIComponent(token)}`);
}
