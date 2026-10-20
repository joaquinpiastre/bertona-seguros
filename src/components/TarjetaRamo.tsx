import Image from "next/image";
import Link from "next/link";
import { type Ramo } from "@/config/empresa";
import { IMG_RAMO } from "@/config/imagenes";
import { ArrowIcon, RAMO_ICONS } from "./Icons";

/** Tarjeta grande con foto (o degradé con ícono si todavía no hay foto) que lleva a la página del seguro. */
export function TarjetaRamo({ r, prioridad = false }: { r: Ramo; prioridad?: boolean }) {
  const img = IMG_RAMO[r.id];
  const Icon = RAMO_ICONS[r.id];
  return (
    <Link href={`/seguros/${r.id}`} className="group relative isolate block aspect-[4/3] overflow-hidden rounded-3xl bg-brand-900 shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-card-lift sm:aspect-[5/4]">
      {img ? (
        <Image src={img.src} alt="" fill priority={prioridad} sizes="(min-width:1024px) 380px, (min-width:640px) 50vw, 100vw" className="-z-20 object-cover transition duration-700 group-hover:scale-[1.06]" />
      ) : (
        <>
          <div className="absolute inset-0 -z-20 bg-gradient-to-br from-sky-500 to-brand-900" aria-hidden />
          <Icon className="absolute -right-6 -top-6 -z-10 h-48 w-48 text-white/10" />
        </>
      )}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-brand-900/90 via-brand-900/30 to-transparent" aria-hidden />
      <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-6">
        <span className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-white/15 text-white backdrop-blur"><Icon className="h-6 w-6" /></span>
        <h3 className="text-xl leading-tight sm:text-2xl">{r.nombre}</h3>
        <p className="mt-1 flex items-center justify-between gap-3 text-sm text-sky-100">
          {r.corto}
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sun-400 text-brand-900 transition group-hover:translate-x-1"><ArrowIcon className="h-4 w-4" /></span>
        </p>
      </div>
    </Link>
  );
}
