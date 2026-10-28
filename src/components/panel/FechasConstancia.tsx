"use client";
import { useState } from "react";
import { inputCls } from "./ui";

/**
 * Cartel gris de la constancia con la fecha y el vencimiento. Se completan con la vigencia de la póliza (desde y hasta) y siguen
 * a la vigencia mientras no se editen a mano; después son libres.
 */
export function FechasConstancia({ desde: desde0, hasta: hasta0, hoy }: { desde: string; hasta: string; hoy: string }) {
  const [desde, setDesde] = useState(desde0);
  const [hasta, setHasta] = useState(hasta0);
  const [fecha, setFecha] = useState(desde0 || hoy);
  const [vence, setVence] = useState(hasta0);
  const [fechaEditada, setFechaEditada] = useState(false);
  const [venceEditado, setVenceEditado] = useState(false);

  const label = "block text-base font-semibold text-brand-900";
  return (
    <div className="space-y-4">
      <div className="grid gap-4 border-l-4 border-slate-500 bg-slate-200 p-4 sm:grid-cols-2">
        <label className={label}>
          Fecha
          <input type="date" name="emitida" value={fecha} onChange={(e) => { setFecha(e.target.value); setFechaEditada(true); }} className={inputCls} />
        </label>
        <label className={label}>
          Vencimiento
          <input type="date" name="vence" value={vence} onChange={(e) => { setVence(e.target.value); setVenceEditado(true); }} className={inputCls} />
        </label>
        <p className="text-sm text-slate-700 sm:col-span-2">Salen en el cartel gris de arriba de la constancia. Se completan solos con la vigencia de la póliza; si los cambiás a mano, quedan como los pusiste.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={label}>
          Vigencia desde
          <input type="date" name="desde" value={desde} onChange={(e) => { setDesde(e.target.value); if (!fechaEditada) setFecha(e.target.value || hoy); }} className={inputCls} />
        </label>
        <label className={label}>
          Vigencia hasta
          <input type="date" name="hasta" value={hasta} onChange={(e) => { setHasta(e.target.value); if (!venceEditado) setVence(e.target.value); }} className={inputCls} />
        </label>
      </div>
    </div>
  );
}
