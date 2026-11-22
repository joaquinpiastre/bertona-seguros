import { confirmarCodigoEnBackend } from "@/lib/sorteo/api";

/**
 * Confirmación automática de participantes (para conectar un bot de WhatsApp).
 *
 *   POST https://bertonaseguros.com/api/sorteo/confirmar
 *   Authorization: Bearer <SORTEO_BOT_TOKEN>
 *   Content-Type: application/json
 *   { "codigo": "BS-4821", "whatsapp": "+5492604123456" }
 *
 * - En lugar de "codigo" se puede mandar "texto" con el mensaje completo que llegó (el código se busca adentro).
 * - "whatsapp" (opcional, recomendado): el número que mandó el mensaje. Si no es el registrado, no se confirma (409).
 * Respuestas: 200 { ok: true, codigo, ya_confirmado } · 400 sin código · 401 token inválido · 404 código inexistente ·
 * 409 sorteo inactivo o número distinto · 503 sin configurar.
 */
export async function POST(req: Request) {
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return Response.json({ ok: false, error: "Falta el token (Authorization: Bearer ...)." }, { status: 401 });
  const datos = await req.json().catch(() => null);
  if (!datos || typeof datos !== "object") return Response.json({ ok: false, error: "El cuerpo tiene que ser JSON." }, { status: 400 });
  return confirmarCodigoEnBackend(token, datos);
}
