/**
 * Rutas del sorteo, montadas en /sorteo. Pasan por el mismo control que el resto de la API (clave interna + sesión),
 * así que solo el frontend puede llamarlas. Las del panel exigen administrador; /confirmar-codigo exige además
 * el token del bot (variable SORTEO_BOT_TOKEN).
 */
import { timingSafeEqual } from "node:crypto";
import { Hono, type Context } from "hono";
import { bodyLimit } from "hono/body-limit";
import { NoEncontrado, Redirigir } from "../flash";
import { asegurarEsquema } from "./esquema";
import { ACCIONES_ADMIN, DATOS_ADMIN, basesPublicas, confirmarPorCodigo, datosPublicos, exportar, registrar } from "./logica";

export const rutasSorteo = new Hono();

const error = (c: Context, donde: string, e: unknown) => {
  if (e instanceof Redirigir) return c.json({ redirect: e.url });
  if (e instanceof NoEncontrado) return c.json({ notFound: true });
  console.error("[sorteo]", donde, e);
  return c.json({ error: "Error interno" }, 500);
};

const json = async (c: Context) => ((await c.req.json().catch(() => null)) ?? {}) as Record<string, unknown>;

// Las tablas del sorteo se crean solas la primera vez (si fallara, solo el sorteo queda sin andar).
rutasSorteo.use("*", async (c, next) => {
  try {
    await asegurarEsquema();
  } catch (e) {
    console.error("[sorteo] no se pudieron crear las tablas", e);
    return c.json({ error: "El sorteo no está disponible en este momento." }, 503);
  }
  await next();
});

// ───── Público ─────
rutasSorteo.get("/publico", async (c) => {
  try {
    return c.json(await datosPublicos());
  } catch (e) {
    return error(c, "publico", e);
  }
});

rutasSorteo.get("/bases", async (c) => {
  try {
    return c.json(await basesPublicas());
  } catch (e) {
    return error(c, "bases", e);
  }
});

rutasSorteo.post("/registro", bodyLimit({ maxSize: 32 * 1024 }), async (c) => {
  try {
    return c.json(await registrar(await json(c)));
  } catch (e) {
    return error(c, "registro", e);
  }
});

// ───── Bot de WhatsApp: confirmar por código ─────
rutasSorteo.post("/confirmar-codigo", bodyLimit({ maxSize: 16 * 1024 }), async (c) => {
  const esperado = Buffer.from(process.env.SORTEO_BOT_TOKEN ?? "");
  if (esperado.length < 16) return c.json({ ok: false, error: "La confirmación automática no está configurada (falta SORTEO_BOT_TOKEN)." }, 503);
  const dado = Buffer.from(c.req.header("x-sorteo-token") ?? "");
  if (dado.length !== esperado.length || !timingSafeEqual(dado, esperado)) return c.json({ ok: false, error: "Token inválido." }, 401);
  try {
    const r = await confirmarPorCodigo(await json(c));
    return c.json(r.body, r.status);
  } catch (e) {
    return error(c, "confirmar-codigo", e);
  }
});

// ───── Panel ─────
rutasSorteo.get("/admin/exportar", async (c) => {
  try {
    return await exportar(new URL(c.req.url).searchParams);
  } catch (e) {
    console.error("[sorteo] exportar", e);
    return new Response("Error interno", { status: 500 });
  }
});

rutasSorteo.get("/admin/:nombre", async (c) => {
  const fn = Object.hasOwn(DATOS_ADMIN, c.req.param("nombre")) ? DATOS_ADMIN[c.req.param("nombre")] : undefined;
  if (!fn) return c.json({ error: "Consulta inexistente" }, 404);
  try {
    return c.json(await fn(new URL(c.req.url).searchParams));
  } catch (e) {
    return error(c, c.req.param("nombre"), e);
  }
});

rutasSorteo.post("/admin/:nombre", bodyLimit({ maxSize: 256 * 1024 }), async (c) => {
  const fn = Object.hasOwn(ACCIONES_ADMIN, c.req.param("nombre")) ? ACCIONES_ADMIN[c.req.param("nombre")] : undefined;
  if (!fn) return c.json({ error: "Acción inexistente" }, 404);
  try {
    const r = await fn(await c.req.formData());
    return c.json(r ?? { ok: true });
  } catch (e) {
    return error(c, c.req.param("nombre"), e);
  }
});
