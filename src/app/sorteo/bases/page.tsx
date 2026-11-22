import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { basesPublicas } from "@/lib/sorteo/api";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Bases y condiciones",
  description: "Bases y condiciones del Sorteo Speedway de Bertona Seguros.",
  alternates: { canonical: "/sorteo/bases" },
};

/** Texto de las bases: una línea en blanco separa párrafos, "# " es un título y "- " una viñeta. */
function armar(texto: string): { titulo: string | null; bloques: ReactNode[] } {
  const lineas = texto.replace(/\r\n/g, "\n").split("\n");
  const bloques: ReactNode[] = [];
  let titulo: string | null = null;
  let lista: string[] = [];
  const cerrarLista = () => {
    if (!lista.length) return;
    bloques.push(<ul key={bloques.length} className="mt-3 list-disc space-y-1.5 pl-5">{lista.map((l, i) => <li key={i}>{l}</li>)}</ul>);
    lista = [];
  };
  for (const cruda of lineas) {
    const l = cruda.trim();
    if (!l) {
      cerrarLista();
      continue;
    }
    if (l.startsWith("- ") || l.startsWith("• ")) {
      lista.push(l.slice(2).trim());
      continue;
    }
    cerrarLista();
    if (l.startsWith("# ")) {
      if (titulo === null && bloques.length === 0) titulo = l.slice(2).trim();
      else bloques.push(<h2 key={bloques.length} className="mt-7 text-xl text-brand-900">{l.slice(2).trim()}</h2>);
    } else {
      bloques.push(<p key={bloques.length} className="mt-3">{l}</p>);
    }
  }
  cerrarLista();
  return { titulo, bloques };
}

export default async function Bases() {
  const b = await basesPublicas();
  const { titulo, bloques } = armar(b?.bases ?? "");
  return (
    <article className="rounded-3xl bg-white p-5 text-ink shadow-card-lift sm:p-8">
      <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-sky-700">{b?.titulo ?? "Sorteo Speedway"}</p>
      <h1 className="mt-2 text-3xl leading-tight text-brand-900">{titulo ?? "Bases y condiciones"}</h1>
      <div className="text-[0.97rem] leading-relaxed text-ink-soft">
        {bloques.length ? bloques : <p className="mt-3">No pudimos cargar las bases en este momento. Probá de nuevo en unos minutos.</p>}
      </div>
      <p className="mt-8 border-t border-line pt-4">
        <Link href="/sorteo" className="font-bold text-sky-700 underline underline-offset-4">← Volver al sorteo</Link>
      </p>
    </article>
  );
}
