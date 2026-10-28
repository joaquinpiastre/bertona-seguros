import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

/** Secreto de la aplicación: firma las sesiones y cifra la contraseña que la oficina le entrega al cliente. */
export function authSecret(): string {
  const s = process.env.AUTH_SECRET || (process.env.NODE_ENV !== "production" ? "dev-secret-bertona-cambiar" : "");
  if (!s) throw new Error("Falta AUTH_SECRET");
  return s;
}

const llave = () => scryptSync(authSecret(), "bertona-clave-cliente", 32);

/** Cifra un texto (AES-256-GCM). El resultado es "iv.etiqueta.datos" en base64. */
export function cifrar(texto: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", llave(), iv);
  const datos = Buffer.concat([c.update(texto, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), datos].map((b) => b.toString("base64")).join(".");
}

/** Descifra lo que devolvió cifrar(). Si no hay valor o no se puede descifrar (ej. cambió AUTH_SECRET), devuelve null. */
export function descifrar(valor: string | null | undefined): string | null {
  if (!valor) return null;
  try {
    const [iv, etiqueta, datos] = valor.split(".").map((p) => Buffer.from(p, "base64"));
    const d = createDecipheriv("aes-256-gcm", llave(), iv);
    d.setAuthTag(etiqueta);
    return Buffer.concat([d.update(datos), d.final()]).toString("utf8");
  } catch {
    return null;
  }
}
