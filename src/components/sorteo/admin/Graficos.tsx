/**
 * Gráficos del sorteo (HTML y CSS, sin librerías). Colores validados para daltonismo:
 * confirmados #1a6aa9 y pendientes #7fb9e6 (misma gama, de claro a oscuro); una sola serie #2080c8.
 * Cada barra muestra sus números al pasar el mouse o con el teclado, y hay vista de tabla.
 */
import { diaCorto } from "@/lib/sorteo/comun";

const CONFIRMADOS = "#1a6aa9";
const PENDIENTES = "#7fb9e6";
const UNA_SERIE = "#2080c8";

const n = (v: number) => v.toLocaleString("es-AR");
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "—");

/** Tope "redondo" del eje: 1, 2, 5, 10, 20, 50... */
function tope(max: number) {
  if (max <= 4) return Math.max(1, max);
  const p = 10 ** Math.floor(Math.log10(max));
  return ([1, 2, 2.5, 5, 10].map((m) => m * p).find((t) => t >= max) ?? 10 * p);
}

export function Leyenda() {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs font-semibold text-ink-soft">
      <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-[3px]" style={{ background: CONFIRMADOS }} /> Confirmados</li>
      <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-[3px]" style={{ background: PENDIENTES }} /> Pendientes</li>
    </ul>
  );
}

type Dia = { dia: string; total: number; confirmados: number };

/** Registros por día: columnas apiladas (confirmados abajo, pendientes arriba). Completa los días sin registros. */
export function PorDia({ dias }: { dias: Dia[] }) {
  if (!dias.length) return <p className="py-8 text-center text-sm text-ink-soft">Todavía no hay registros.</p>;
  const mapa = new Map(dias.map((d) => [d.dia, d]));
  const serie: Dia[] = [];
  for (let t = Date.parse(dias[0].dia + "T12:00:00Z"), fin = Date.parse(dias[dias.length - 1].dia + "T12:00:00Z"); t <= fin && serie.length < 370; t += 86_400_000) {
    const iso = new Date(t).toISOString().slice(0, 10);
    serie.push(mapa.get(iso) ?? { dia: iso, total: 0, confirmados: 0 });
  }
  const max = tope(Math.max(...serie.map((d) => d.total)));
  const paso = Math.max(1, Math.ceil(serie.length / 4)); // hasta 5 fechas en el eje: entran también en el celular
  const ALTO = 160;
  return (
    <div>
      <div className="flex gap-2">
        {/* Eje Y */}
        <div className="relative w-8 shrink-0 text-right text-[11px] tabular-nums text-ink-soft" style={{ height: ALTO }}>
          {[max, max / 2, 0].map((v, i) => (
            <span key={i} className="absolute right-0 -translate-y-1/2" style={{ top: `${(i / 2) * 100}%` }}>{Number.isInteger(v) ? n(v) : ""}</span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div className="relative" style={{ height: ALTO }}>
            {[0, 0.5, 1].map((f) => <div key={f} aria-hidden className="absolute inset-x-0 border-t border-line" style={{ top: `${f * 100}%` }} />)}
            <div className="absolute inset-0 grid items-end gap-[2px]" style={{ gridTemplateColumns: `repeat(${serie.length}, minmax(0, 1fr))` }}>
              {serie.map((d, i) => {
                const pend = d.total - d.confirmados;
                const alto = (v: number) => `${(v / max) * 100}%`;
                // El globo se abre hacia adentro del gráfico para no salirse por los costados.
                const lado = serie.length < 3 ? "left-1/2 -translate-x-1/2" : i < serie.length / 2 ? "left-0" : "right-0";
                return (
                  <div key={d.dia} tabIndex={0} aria-label={`${diaCorto(d.dia)}: ${d.total} registros, ${d.confirmados} confirmados`}
                    className="group relative flex h-full flex-col items-center justify-end outline-none">
                    <div className="flex h-full w-full max-w-6 flex-col justify-end gap-[2px] group-hover:opacity-85 group-focus-visible:opacity-85">
                      {pend > 0 && <div className="w-full rounded-t-[4px]" style={{ height: alto(pend), background: PENDIENTES }} />}
                      {d.confirmados > 0 && <div className={`w-full ${pend > 0 ? "" : "rounded-t-[4px]"}`} style={{ height: alto(d.confirmados), background: CONFIRMADOS }} />}
                    </div>
                    <div role="tooltip" className={`pointer-events-none invisible absolute bottom-full z-10 mb-1 w-max border border-line bg-white px-3 py-2 text-xs text-ink-soft shadow-lift group-hover:visible group-focus-visible:visible ${lado}`}>
                      <p className="font-semibold text-brand-900">{diaCorto(d.dia)}</p>
                      <p><strong className="text-sm text-brand-900">{n(d.total)}</strong> {d.total === 1 ? "registro" : "registros"}</p>
                      <p className="flex items-center gap-1.5"><span className="h-0.5 w-3" style={{ background: CONFIRMADOS }} /><strong className="text-brand-900">{n(d.confirmados)}</strong> {d.confirmados === 1 ? "confirmado" : "confirmados"}</p>
                      <p className="flex items-center gap-1.5"><span className="h-0.5 w-3" style={{ background: PENDIENTES }} /><strong className="text-brand-900">{n(pend)}</strong> {pend === 1 ? "pendiente" : "pendientes"}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Eje X: una etiqueta cada tantos días; la primera y la última pegadas a los bordes para que nunca se salgan */}
          <div className="relative mt-1.5 h-4 text-[11px] tabular-nums text-ink-soft">
            {serie.map((d, i) => {
              const ultima = i === serie.length - 1;
              if (i % paso !== 0 && !ultima) return null;
              if (!ultima && serie.length - 1 - i < paso / 2) return null; // muy cerca de la última: se superpondrían
              const pos = serie.length === 1 ? { left: "50%" } : i === 0 ? { left: 0 } : ultima ? { right: 0 } : { left: `${((i + 0.5) / serie.length) * 100}%` };
              const centrada = serie.length === 1 || (i !== 0 && !ultima);
              return (
                <span key={d.dia} className={`absolute whitespace-nowrap ${centrada ? "-translate-x-1/2" : ""}`} style={pos}>
                  {d.dia.slice(8, 10)}/{d.dia.slice(5, 7)}
                </span>
              );
            })}
          </div>
        </div>
      </div>
      <details className="mt-4 text-sm">
        <summary className="cursor-pointer font-semibold text-brand-700">Ver como tabla</summary>
        <div className="mt-2 max-h-72 overflow-auto border border-line">
          <table className="w-full text-left tabular-nums">
            <thead className="sticky top-0 bg-soft text-xs uppercase tracking-wider text-ink-soft"><tr><th className="px-3 py-2">Día</th><th className="px-3 py-2 text-right">Registros</th><th className="px-3 py-2 text-right">Confirmados</th><th className="px-3 py-2 text-right">% conf.</th></tr></thead>
            <tbody className="divide-y divide-line">
              {serie.filter((d) => d.total).map((d) => (
                <tr key={d.dia}><td className="px-3 py-1.5">{diaCorto(d.dia)}</td><td className="px-3 py-1.5 text-right">{n(d.total)}</td><td className="px-3 py-1.5 text-right">{n(d.confirmados)}</td><td className="px-3 py-1.5 text-right">{pct(d.confirmados, d.total)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

type Fila = { etiqueta: string; total: number; confirmados?: number };

/** Barras horizontales. Con `confirmados` se apilan (confirmados + pendientes) y se muestra el % de confirmación. */
export function Barras({ filas, apiladas = false, vacio = "Sin datos." }: { filas: Fila[]; apiladas?: boolean; vacio?: string }) {
  if (!filas.length) return <p className="py-6 text-center text-sm text-ink-soft">{vacio}</p>;
  const max = Math.max(...filas.map((f) => f.total), 1);
  return (
    <ul className="space-y-2.5">
      {filas.map((f) => {
        const conf = f.confirmados ?? 0;
        const pend = f.total - conf;
        const ancho = (v: number) => `${(v / max) * 100}%`;
        return (
          <li key={f.etiqueta} tabIndex={0} className="group relative grid grid-cols-[minmax(6rem,9rem)_1fr] items-center gap-3 text-sm outline-none sm:grid-cols-[11rem_1fr]"
            aria-label={apiladas ? `${f.etiqueta}: ${f.total} registros, ${conf} confirmados (${pct(conf, f.total)})` : `${f.etiqueta}: ${f.total}`}>
            <span className="truncate font-semibold text-brand-900" title={f.etiqueta}>{f.etiqueta}</span>
            <span className="flex min-w-0 items-center gap-2">
              <span className="flex h-4 min-w-0 flex-1 items-stretch gap-[2px] group-hover:opacity-85 group-focus-visible:opacity-85">
                {apiladas ? (
                  <>
                    {conf > 0 && <span className={pend > 0 ? "" : "rounded-r-[4px]"} style={{ width: ancho(conf), background: CONFIRMADOS }} />}
                    {pend > 0 && <span className="rounded-r-[4px]" style={{ width: ancho(pend), background: PENDIENTES }} />}
                  </>
                ) : (
                  <span className="rounded-r-[4px]" style={{ width: ancho(f.total), background: UNA_SERIE }} />
                )}
              </span>
              <span className="shrink-0 text-right tabular-nums text-ink-soft">
                <strong className="text-brand-900">{n(f.total)}</strong>
                {apiladas && <span className="ml-1.5 text-xs">({pct(conf, f.total)} conf.)</span>}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
