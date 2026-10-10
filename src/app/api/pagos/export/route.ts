import { getUsuario } from "@/lib/auth";
import { METODOS, esFecha, fecha, hoy } from "@/lib/format";
import { listarPagos } from "@/lib/queries";

const celda = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

export async function GET(req: Request) {
  const u = await getUsuario();
  if (!u || u.rol !== "admin") return new Response("No autorizado", { status: 403 });
  const sp = new URL(req.url).searchParams;
  const h = hoy();
  const desde = esFecha(sp.get("desde")) ? sp.get("desde")! : h.slice(0, 8) + "01";
  const hasta = esFecha(sp.get("hasta")) ? sp.get("hasta")! : h;
  const filas = await listarPagos({ desde, hasta, metodo: sp.get("metodo") || undefined, busqueda: sp.get("q") || undefined, estado: sp.get("estado") || undefined });
  const cab = ["Recibo", "Fecha", "Cliente", "Póliza", "Compañía", "Dominio", "Cuota", "Forma de pago", "Referencia", "Importe", "Estado", "Registrado por"];
  const lineas = [cab.map(celda).join(";")];
  for (const f of filas) {
    lineas.push(
      [
        String(f.recibo_nro).padStart(6, "0"), fecha(f.fecha), f.cliente, f.poliza, f.compania, f.dominio, f.cuota_n,
        METODOS[f.metodo] ?? f.metodo, f.referencia, String(f.importe).replace(".", ","), f.estado, f.registrado_por,
      ].map(celda).join(";")
    );
  }
  return new Response("﻿" + lineas.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pagos-${desde}_${hasta}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
