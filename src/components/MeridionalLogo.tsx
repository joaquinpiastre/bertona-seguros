import Image from "next/image";

/** Logo de Meridional Seguros (la compañía que respalda a Grupo Bertona). */
export function MeridionalLogo({ className = "h-8 w-auto", alt = "Meridional Seguros" }: { className?: string; alt?: string }) {
  return <Image src="/brand/meridional-logo.png" alt={alt} width={620} height={156} className={className} />;
}
