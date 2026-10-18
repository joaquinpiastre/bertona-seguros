import { waLink } from "@/config/empresa";
import type { Row } from "@/lib/api";

/** Tarjeta de una póliza inhabilitada (baja o falta de pago): sin datos ni descargas. */
export function PolizaBloqueada({ p }: { p: Row }) {
  return (
    <div className="border border-red-200 bg-red-50 p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-red-800">🔒 {p.bloqueo ?? "Inhabilitado por falta de pago"}</p>
      <p className="mt-1 font-display text-lg font-semibold text-brand-900">{p.compania}{p.ramo ? ` · ${p.ramo}` : ""}</p>
      <p className="mt-1 text-sm text-red-900">
        Los datos de esta póliza, sus pagos y sus documentos están bloqueados. Para regularizar tu situación comunicate con la oficina.
      </p>
      <a
        href={waLink(`Hola! Mi póliza de ${p.compania ?? ""} figura inhabilitada y quiero regularizarla.`)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-block bg-brand-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
      >
        Hablar con la oficina
      </a>
    </div>
  );
}

export const botonPagar =
  "flex w-full items-center justify-center bg-accent-500 px-8 py-5 font-display text-3xl font-bold tracking-wide text-brand-900 shadow-lift transition hover:bg-accent-400 sm:w-auto";
