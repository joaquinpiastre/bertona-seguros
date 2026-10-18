"use client";
import { useEffect, useState } from "react";
import { Icono } from "./Iconos";

/** Botón para agrandar la letra de todo el panel (se recuerda en el dispositivo). */
export function TamanoLetra({ claro = false }: { claro?: boolean }) {
  const [grande, setGrande] = useState(false);
  useEffect(() => {
    try {
      const g = localStorage.getItem("bz_letra") === "grande";
      setGrande(g);
      document.documentElement.dataset.letra = g ? "grande" : "normal";
    } catch {
      /* sin almacenamiento: queda en tamaño normal */
    }
  }, []);
  function alternar() {
    const g = !grande;
    setGrande(g);
    document.documentElement.dataset.letra = g ? "grande" : "normal";
    try {
      localStorage.setItem("bz_letra", g ? "grande" : "normal");
    } catch {
      /* ignorar */
    }
  }
  return (
    <button
      type="button"
      onClick={alternar}
      aria-pressed={grande}
      title="Agrandar o achicar la letra"
      className={`inline-flex min-h-11 items-center gap-2 border px-3 text-sm font-semibold ${claro ? "border-white/40 text-white hover:bg-white/10" : "border-line text-brand-800 hover:border-brand-500"}`}
    >
      <Icono n="letra" className="h-5 w-5" />
      <span className="hidden sm:inline">{grande ? "Letra normal" : "Letra grande"}</span>
    </button>
  );
}
