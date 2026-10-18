import Image from "next/image";

/** Logo oficial (public/brand/logo.png) + marca tipográfica. */
export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2 sm:gap-3">
      <Image src="/brand/logo.png" alt="" width={104} height={104} className="h-10 w-10 sm:h-[52px] sm:w-[52px]" priority />
      <span className="leading-none">
        <span className={`block font-display text-lg font-semibold tracking-wide sm:text-xl ${light ? "text-white" : "text-brand-900"}`}>BERTONA</span>
        <span className={`mt-1 block text-[10px] font-semibold uppercase tracking-[0.32em] ${light ? "text-accent-300" : "text-accent-600"}`}>Seguros</span>
      </span>
    </span>
  );
}
