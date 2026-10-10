import { getUsuario } from "@/lib/auth";
import { q1 } from "@/lib/db";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const u = await getUsuario();
  if (!u) return new Response("No autorizado", { status: 401 });
  const { id } = await ctx.params;
  const d = await q1("SELECT cliente_id, nombre, mime, datos FROM documentos WHERE id = $1", [Number(id)]);
  if (!d) return new Response("No encontrado", { status: 404 });
  if (u.rol !== "admin" && d.cliente_id !== u.cliente_id) return new Response("No autorizado", { status: 403 });
  return new Response(new Uint8Array(d.datos), {
    headers: {
      "Content-Type": d.mime,
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(d.nombre)}`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
