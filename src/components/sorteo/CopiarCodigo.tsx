"use client";
import { useState } from "react";

/** Botón para copiar el código del participante. */
export function CopiarCodigo({ codigo }: { codigo: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(codigo);
          setCopiado(true);
          setTimeout(() => setCopiado(false), 2500);
        } catch {
          // Sin permiso para copiar: el código igual queda a la vista.
        }
      }}
      className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-bold text-brand-800 transition hover:border-sky-500 hover:text-sky-700"
    >
      {copiado ? "¡Código copiado!" : "Copiar código"}
    </button>
  );
}
