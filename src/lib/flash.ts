import { redirect } from "next/navigation";

/** Redirige agregando un mensaje (?ok= / ?error=) que muestra el componente Flash. */
export function ir(path: string, tipo: "ok" | "error", msg: string): never {
  const sep = path.includes("?") ? "&" : "?";
  redirect(`${path}${sep}${tipo}=${encodeURIComponent(msg)}`);
}
