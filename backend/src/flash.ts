/** Mensajes y redirecciones para el frontend: las acciones lanzan Redirigir y el servidor lo devuelve como JSON. */
export class Redirigir extends Error {
  constructor(public url: string) {
    super(url);
  }
}
export class NoEncontrado extends Error {}

export function redirect(url: string): never {
  throw new Redirigir(url);
}

export function ir(path: string, tipo: "ok" | "error", msg: string): never {
  const sep = path.includes("?") ? "&" : "?";
  throw new Redirigir(`${path}${sep}${tipo}=${encodeURIComponent(msg)}`);
}

export const txt = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
export const txtONull = (fd: FormData, k: string) => txt(fd, k) || null;
export const num = (fd: FormData, k: string) => {
  const v = txt(fd, k).replace(/\s/g, "");
  if (v === "") return NaN;
  // Acepta "33000", "33.000,50" y "33000.50"
  const norm = v.includes(",") ? v.replace(/\./g, "").replace(",", ".") : v;
  const n = Number(norm);
  return Number.isFinite(n) ? n : NaN;
};
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
