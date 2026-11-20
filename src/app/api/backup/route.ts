import { redirect } from "next/navigation";
import { archivo } from "@/lib/api";

// La copia se arma y se envía de a partes; con muchos archivos puede tardar un par de minutos.
export const maxDuration = 300;

export async function GET() {
  const r = await archivo("backup");
  if (r.ok) return r;
  if (r.status === 401 || r.status === 403) redirect("/ingresar");
  const msg = r.status === 429 ? await r.text() : "No se pudo generar la copia de seguridad. Probá de nuevo en unos minutos.";
  redirect(`/admin/backup?error=${encodeURIComponent(msg)}`);
}
