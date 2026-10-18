import { serve } from "@hono/node-server";
import bcrypt from "bcryptjs";
import { timingSafeEqual } from "node:crypto";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import * as admin from "./actions/admin";
import * as gestion from "./actions/gestion";
import * as portal from "./actions/portal";
import { MSG_NO_ACTIVADA, contexto, firmarToken, loginBloqueado, loginFallido, loginOk, usuarioDeToken } from "./auth";
import { estadoPolizas, soloDigitos } from "./core";
import { DATOS } from "./data";
import { DATOS2 } from "./data2";
import { q1 } from "./db";
import { documento, exportarPagos, recibo } from "./files";
import { NoEncontrado, Redirigir } from "./flash";

const ACCIONES: Record<string, (fd: FormData) => Promise<void>> = { ...admin, ...gestion, ...portal };
const app = new Hono();

app.get("/health", (c) => c.text("ok"));

// Solo el frontend (que conoce INTERNAL_API_KEY) puede hablar con esta API.
app.use("*", async (c, next) => {
  const esperada = process.env.INTERNAL_API_KEY;
  if (!esperada) return c.json({ error: "API sin configurar" }, 503);
  const dada = c.req.header("x-internal-key") ?? "";
  const ok = dada.length === esperada.length && timingSafeEqual(Buffer.from(dada), Buffer.from(esperada));
  if (!ok) return c.json({ error: "No autorizado" }, 401);
  const token = c.req.header("authorization")?.replace(/^Bearer\s+/i, "");
  const user = await usuarioDeToken(token);
  return contexto.run({ user }, () => next());
});

app.post("/auth/login", async (c) => {
  const { email: e, password } = (await c.req.json().catch(() => ({}))) as { email?: string; password?: string };
  const email = String(e ?? "").trim().toLowerCase();
  const pass = String(password ?? "");
  if (!email || !pass) return c.json({ error: "Ingresá tu email y contraseña." });
  if (loginBloqueado(email)) return c.json({ error: "Demasiados intentos. Probá de nuevo en unos minutos." });
  const u = await q1("SELECT id, rol, password_hash, activo FROM usuarios WHERE email = $1", [email]);
  const ok = u && u.activo && (await bcrypt.compare(pass, u.password_hash));
  if (!ok) {
    loginFallido(email);
    return c.json({ error: "Email o contraseña incorrectos." });
  }
  loginOk(email);
  return c.json({ token: await firmarToken(u!.id), rol: u!.rol });
});

// Ingreso de clientes: solo con el DNI (y una clave opcional si el cliente la activó).
app.post("/auth/login-dni", async (c) => {
  const b = (await c.req.json().catch(() => ({}))) as { dni?: string; pin?: string; ip?: string };
  const dni = soloDigitos(b.dni);
  const ip = String(b.ip ?? "sin-ip").slice(0, 64);
  const claveIp = "ip:" + ip;
  const claveDni = "dni:" + dni;
  if (loginBloqueado(claveIp) || loginBloqueado(claveDni)) return c.json({ error: "Demasiados intentos. Probá de nuevo en unos minutos." });
  if (dni.length < 7 || dni.length > 11) return c.json({ error: "Ingresá tu DNI, solo números." });
  const u = await q1(
    `SELECT u.id, u.pin_hash, u.cliente_id FROM usuarios u JOIN clientes c ON c.id = u.cliente_id
     WHERE u.rol = 'socio' AND u.activo AND c.activo AND (u.dni = $1 OR (length(u.dni) = 11 AND substring(u.dni from 3 for 8) = $1)) LIMIT 1`,
    [dni]
  );
  if (!u) {
    loginFallido(claveIp);
    return c.json({ error: "No encontramos un cliente con ese DNI. Si ya sos cliente, comunicate con la oficina." });
  }
  if (u.pin_hash) {
    if (!b.pin) return c.json({ needsPin: true });
    if (!(await bcrypt.compare(String(b.pin), u.pin_hash))) {
      loginFallido(claveDni);
      loginFallido(claveIp);
      return c.json({ needsPin: true, error: "La clave no es correcta." });
    }
  }
  const { todas, activas } = await estadoPolizas(u.cliente_id);
  if (todas.length <= 1 && activas.length === 0) return c.json({ error: MSG_NO_ACTIVADA });
  loginOk(claveDni);
  return c.json({ token: await firmarToken(u.id), rol: "socio" });
});

app.get("/me", async (c) => {
  const user = contexto.getStore()?.user;
  return user ? c.json({ user }) : c.json({ user: null }, 401);
});

app.post("/actions/:name", bodyLimit({ maxSize: 12 * 1024 * 1024 }), async (c) => {
  const fn = ACCIONES[c.req.param("name")];
  if (!fn) return c.json({ error: "Acción inexistente" }, 404);
  try {
    await fn(await c.req.formData());
    return c.json({ ok: true });
  } catch (e) {
    if (e instanceof Redirigir) return c.json({ redirect: e.url });
    console.error("[accion]", c.req.param("name"), e);
    return c.json({ error: "Error interno" }, 500);
  }
});

app.get("/data/:name", async (c) => {
  const fn = DATOS2[c.req.param("name")] ?? DATOS[c.req.param("name")];
  if (!fn) return c.json({ error: "Consulta inexistente" }, 404);
  try {
    return c.json(await fn(new URL(c.req.url).searchParams));
  } catch (e) {
    if (e instanceof Redirigir) return c.json({ redirect: e.url });
    if (e instanceof NoEncontrado) return c.json({ notFound: true });
    console.error("[data]", c.req.param("name"), e);
    return c.json({ error: "Error interno" }, 500);
  }
});

const guard = async (fn: () => Promise<Response>) => {
  try {
    return await fn();
  } catch (e) {
    console.error("[files]", e);
    return new Response("Error interno", { status: 500 });
  }
};
app.get("/files/documento/:id", (c) => guard(() => documento(Number(c.req.param("id")))));
app.get("/files/recibo/:id", (c) => guard(() => recibo(Number(c.req.param("id")), c.req.query("sistema") === "1")));
app.get("/files/export", (c) => guard(() => exportarPagos(new URL(c.req.url).searchParams)));

const port = Number(process.env.PORT) || 4000;
serve({ fetch: app.fetch, port }, () => console.log(`API Bertona escuchando en :${port}`));
