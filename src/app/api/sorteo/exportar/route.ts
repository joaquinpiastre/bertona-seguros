import { archivoSorteo } from "@/lib/sorteo/api";

/** Participantes del sorteo en Excel (o CSV con ?formato=csv), con los filtros de la tabla. Solo administradores (lo valida el backend). */
export async function GET(req: Request) {
  return archivoSorteo(`admin/exportar${new URL(req.url).search}`);
}
