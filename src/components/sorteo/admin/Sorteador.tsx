"use client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { sortear } from "@/lib/sorteo/acciones";
import type { ResultadoSorteo } from "@/lib/sorteo/comun";

type Fase = "listo" | "girando" | "resultado" | "error";
const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));
const cuadros = { backgroundImage: "repeating-conic-gradient(#0d1e3a 0 25%, #fff 0 50%)", backgroundSize: "16px 16px" };

/**
 * Sorteo en vivo: el servidor elige al azar (y lo guarda) apenas se toca el botón; la pantalla hace la animación
 * y recién después muestra el resultado. Con "Probar" se ve todo igual pero no se guarda nada.
 */
export function Sorteador({ sorteo, elegibles, muestra }: { sorteo: { id: number; titulo: string; premio: string }; elegibles: number; muestra: string[] }) {
  const router = useRouter();
  const escenario = useRef<HTMLDivElement>(null);
  const [fase, setFase] = useState<Fase>("listo");
  const [visible, setVisible] = useState("BS-····");
  const [resultado, setResultado] = useState<ResultadoSorteo | null>(null);
  const [error, setError] = useState("");
  const [completa, setCompleta] = useState(false);
  const girando = fase === "girando";

  useEffect(() => {
    const f = () => setCompleta(document.fullscreenElement === escenario.current);
    document.addEventListener("fullscreenchange", f);
    return () => document.removeEventListener("fullscreenchange", f);
  }, []);

  // Papelitos para el festejo (posiciones fijas por render, sin azar en el servidor).
  const papelitos = useMemo(
    () => Array.from({ length: 28 }, (_, i) => ({ left: (i * 37) % 100, delay: (i % 7) * 0.12, color: ["#ffbf3f", "#2080c8", "#ffffff", "#f5a50f"][i % 4], giro: (i * 53) % 360 })),
    []
  );

  async function girar(tipo: "ganador" | "suplente", prueba: boolean) {
    if (girando) return;
    const que = tipo === "ganador" ? "el GANADOR" : "un SUPLENTE";
    if (!prueba && !window.confirm(`Se va a sortear ${que} de «${sorteo.titulo}» entre ${elegibles} confirmados.\n\nQueda registrado y no se puede deshacer. ¿Seguimos?`)) return;
    setFase("girando");
    setResultado(null);
    setError("");
    const sinMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lista = muestra.length ? muestra : ["BS-····"];
    let i = Math.floor(Math.random() * lista.length);
    const inicio = performance.now();
    const intervalo = sinMovimiento ? null : setInterval(() => setVisible(lista[i++ % lista.length]), 70);
    if (sinMovimiento) setVisible("…");

    const fd = new FormData();
    fd.set("sorteo_id", String(sorteo.id));
    fd.set("tipo", tipo);
    if (prueba) fd.set("prueba", "1");
    let r: ResultadoSorteo;
    try {
      r = await sortear(fd);
    } catch {
      r = { ok: false, error: "No se pudo conectar con el servidor. Probá de nuevo." };
    }
    if (!sinMovimiento) await dormir(Math.max(0, 3400 - (performance.now() - inicio)));
    if (intervalo) clearInterval(intervalo);
    if (!r.ok || !r.ganador) {
      setFase("error");
      setVisible("BS-····");
      setError(r.error ?? "No se pudo sortear.");
      return;
    }
    if (!sinMovimiento) {
      for (const ms of [90, 120, 160, 210, 270, 340, 430, 540]) {
        setVisible(lista[i++ % lista.length]);
        await dormir(ms);
      }
    }
    setVisible(r.ganador.codigo);
    setResultado(r);
    setFase("resultado");
    if (!r.prueba) router.refresh(); // actualiza el historial y la cantidad de participantes (después de mostrar el resultado)
  }

  const pantallaCompleta = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void escenario.current?.requestFullscreen?.().catch(() => {});
  };

  const g = resultado?.ganador;
  return (
    <div ref={escenario} className={`relative overflow-hidden bg-brand-900 text-white ${completa ? "flex h-screen flex-col justify-center" : ""}`}>
      <style>{`@keyframes bz-caer{0%{transform:translateY(-10vh) rotate(0);opacity:1}100%{transform:translateY(110vh) rotate(720deg);opacity:.9}}@keyframes bz-entrar{0%{transform:scale(.6);opacity:0}70%{transform:scale(1.06);opacity:1}100%{transform:scale(1)}}@media (prefers-reduced-motion: reduce){.bz-anim{animation:none!important}.bz-papel{display:none}}`}</style>
      <div aria-hidden className="h-4" style={cuadros} />
      <div className={`px-5 text-center ${completa ? "py-6" : "py-8 sm:py-10"}`}>
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-sun-400">Sorteo en vivo</p>
        <h2 style={{ fontFamily: "var(--f-head), var(--f-sans), system-ui, sans-serif" }} className={`mt-2 font-extrabold leading-tight ${completa ? "text-5xl" : "text-2xl sm:text-3xl"}`}>{sorteo.titulo}</h2>
        {sorteo.premio && <p className={`mt-2 text-sky-100 ${completa ? "text-2xl" : "text-base sm:text-lg"}`}>Premio: <strong className="text-white">{sorteo.premio}</strong></p>}
        <p className={`mt-1 text-sky-200 ${completa ? "text-xl" : "text-sm"}`}>
          {/* Con el resultado a la vista se muestra entre cuántos se sorteó (la cantidad actual ya descuenta al que salió). */}
          {(() => {
            const pasado = fase === "resultado" && !!resultado?.elegibles;
            const n = pasado ? resultado!.elegibles! : elegibles;
            const verbo = n === 1 ? (pasado ? "Participó" : "Participa") : pasado ? "Participaron" : "Participan";
            return <>{verbo} <strong className="text-white">{n.toLocaleString("es-AR")}</strong> {n === 1 ? "confirmado" : "confirmados"}</>;
          })()}
        </p>

        <div aria-live="polite" className={`mx-auto mt-6 w-fit min-w-[16rem] rounded-2xl border-[6px] px-8 py-5 transition-colors ${fase === "resultado" ? "border-sun-400 bg-white text-brand-900" : "border-white/80 bg-white/5"}`}>
          <p className={`font-head font-extrabold tabular-nums tracking-wider ${completa ? "text-[9rem] leading-none" : "text-6xl sm:text-7xl"}`}>{visible}</p>
        </div>

        {fase === "resultado" && g && (
          <div className="bz-anim mt-6" style={{ animation: "bz-entrar .6s ease-out both" }}>
            <p className={`font-head font-extrabold uppercase tracking-[0.25em] text-sun-400 ${completa ? "text-4xl" : "text-xl"}`}>
              {resultado?.tipo === "suplente" ? "Suplente" : "¡Ganador!"}
            </p>
            <p className={`mt-2 font-head font-extrabold ${completa ? "text-7xl" : "text-3xl sm:text-4xl"}`}>{g.nombre}</p>
            <p className={`mt-1 text-sky-100 ${completa ? "text-3xl" : "text-lg"}`}>{g.localidad}{g.wa_oculto ? ` · ${g.wa_oculto}` : ""}</p>
            {resultado?.prueba && <p className="mx-auto mt-4 w-fit rounded-full bg-amber-300 px-4 py-1.5 text-sm font-bold text-amber-950">PRUEBA: no se guardó</p>}
          </div>
        )}
        {fase === "girando" && <p className="mt-6 text-lg font-semibold text-sky-100">Sorteando…</p>}
        {fase === "error" && <p role="alert" className="mx-auto mt-6 max-w-md rounded-xl bg-red-50 px-4 py-3 font-semibold text-red-900">{error}</p>}

        <div className={`mt-8 flex flex-wrap items-center justify-center gap-3 ${completa ? "opacity-60 hover:opacity-100" : ""}`}>
          <button type="button" disabled={girando || elegibles === 0} onClick={() => girar("ganador", false)}
            className="inline-flex min-h-14 items-center justify-center bg-sun-400 px-7 py-3 text-lg font-extrabold text-brand-900 transition hover:bg-sun-500 disabled:opacity-50">
            Sortear ganador
          </button>
          <button type="button" disabled={girando || elegibles === 0} onClick={() => girar("suplente", false)}
            className="inline-flex min-h-14 items-center justify-center border-2 border-white/70 px-6 py-3 text-base font-bold text-white transition hover:bg-white/10 disabled:opacity-50">
            Sacar suplente
          </button>
          <button type="button" disabled={girando || elegibles === 0} onClick={() => girar("ganador", true)}
            className="inline-flex min-h-12 items-center justify-center px-4 py-2 text-sm font-semibold text-sky-200 underline underline-offset-4 hover:text-white disabled:opacity-50">
            Probar (no se guarda)
          </button>
          <button type="button" onClick={pantallaCompleta} className="inline-flex min-h-12 items-center justify-center px-4 py-2 text-sm font-semibold text-sky-200 underline underline-offset-4 hover:text-white">
            {completa ? "Salir de pantalla completa" : "Pantalla completa"}
          </button>
        </div>
        {elegibles === 0 && fase !== "girando" && <p className="mt-4 text-sm text-sky-200">No quedan participantes confirmados sin sortear{fase === "resultado" ? "." : ": confirmá participantes en «Participantes»."}</p>}
      </div>
      <div aria-hidden className="h-4" style={cuadros} />

      {fase === "resultado" && !resultado?.prueba && (
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          {papelitos.map((p, i) => (
            <span key={i} className="bz-papel absolute top-0 block h-3 w-2"
              style={{ left: `${p.left}%`, background: p.color, transform: `rotate(${p.giro}deg)`, animation: `bz-caer 2.4s ${p.delay}s ease-in both` }} />
          ))}
        </div>
      )}
    </div>
  );
}
