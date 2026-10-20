import Image from "next/image";

const fam = { fontFamily: "var(--f-head), var(--f-sans), system-ui, sans-serif" };

/**
 * Logo de Grupo Bertona: la B del emblema (public/brand/emblema.png) pegada a "ERTONA", con "GRUPO" arriba.
 * El nombre "Grupo Bertona" va solo en el logo y los títulos.
 */
export function Logo({ light = false, compacto = false }: { light?: boolean; compacto?: boolean }) {
  return (
    <span className="inline-flex items-center">
      <Image src="/brand/emblema.png" alt="" width={104} height={104} className={`shrink-0 ${compacto ? "h-9 w-9" : "h-11 w-11 sm:h-[52px] sm:w-[52px]"}`} priority />
      <span className="-ml-px flex flex-col leading-none">
        <span style={fam} className={`pl-0.5 text-[0.55rem] font-bold uppercase tracking-[0.5em] sm:text-[0.62rem] ${light ? "text-sky-200" : "text-ink-soft"}`}>Grupo</span>
        <span style={fam} className={`mt-0.5 font-extrabold uppercase tracking-tight ${compacto ? "text-[1.3rem]" : "text-[1.55rem] sm:text-[1.85rem]"} ${light ? "text-white" : "text-sky-500"}`}>ertona</span>
      </span>
    </span>
  );
}
