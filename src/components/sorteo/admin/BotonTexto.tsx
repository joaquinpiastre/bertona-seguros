"use client";
import { useFormStatus } from "react-dom";

/** Botón de texto chico (por ejemplo «Eliminar») que pide confirmación antes de enviar su formulario. */
export function BotonTexto({ children, confirmar, className = "" }: { children: React.ReactNode; confirmar: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (!window.confirm(confirmar)) e.preventDefault();
      }}
      className={`min-h-8 text-xs font-semibold underline-offset-2 hover:underline disabled:opacity-60 ${className}`}
    >
      {pending ? "…" : children}
    </button>
  );
}
