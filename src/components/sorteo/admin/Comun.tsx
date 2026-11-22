import { Badge } from "@/components/panel/ui";
import type { Row } from "@/lib/api";
import { ESTADO_SORTEO, fechaCorta } from "@/lib/sorteo/comun";

const TONO_ESTADO: Record<string, "verde" | "ambar" | "gris"> = { abierto: "verde", proximo: "ambar", finalizado: "gris" };

/** "Activo" / "Inactivo" y, si está activo, si la inscripción está abierta, todavía no empezó o ya cerró. */
export function EstadoBadges({ s }: { s: Row }) {
  return (
    <span className="inline-flex flex-wrap gap-1.5">
      {s.activo ? <Badge tono="verde">Activo</Badge> : <Badge>Inactivo</Badge>}
      {s.activo && <Badge tono={TONO_ESTADO[s.estado] ?? "gris"}>{ESTADO_SORTEO[s.estado] ?? s.estado}</Badge>}
    </span>
  );
}

/** "01/12/2026 al 31/12/2026". */
export const periodo = (s: Row) =>
  s.fecha_inicio || s.fecha_fin ? `${s.fecha_inicio ? fechaCorta(s.fecha_inicio) : "…"} al ${s.fecha_fin ? fechaCorta(s.fecha_fin) : "…"}` : "Sin fechas";
