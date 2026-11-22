import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CopiarCodigo } from "@/components/sorteo/CopiarCodigo";
import { Cuadros, IconoWhatsapp } from "@/components/sorteo/Publico";
import { EMPRESA } from "@/config/empresa";
import { datosPublicos } from "@/lib/sorteo/api";
import { CODIGO_RE, enlaceWhatsapp, fechaSorteoTexto, mensajeConfirmacion } from "@/lib/sorteo/comun";

export const metadata: Metadata = { title: "Último paso", robots: { index: false, follow: false } };

type SP = Promise<{ codigo?: string; ya?: string; confirmado?: string }>;

export default async function Listo({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const codigo = String(sp.codigo ?? "").trim().toUpperCase();
  if (!CODIGO_RE.test(codigo)) redirect("/sorteo");
  const { sorteo } = await datosPublicos();
  const confirmado = sp.confirmado === "1";
  const ya = sp.ya === "1";
  const link = enlaceWhatsapp(sorteo?.whatsapp || EMPRESA.whatsapp, mensajeConfirmacion(sorteo?.mensaje ?? "", codigo));
  const fechaSorteo = fechaSorteoTexto(sorteo?.fecha_sorteo);

  return (
    <section className="rounded-3xl bg-white p-5 text-ink shadow-card-lift sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full bg-sun-400 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.16em] text-brand-900">{confirmado ? "Listo" : "Último paso"}</span>
        <span className="text-xs font-bold text-ink-soft">{confirmado ? "Participación confirmada" : "Paso 2 de 2"}</span>
      </div>

      <h1 className="mt-4 text-[1.9rem] leading-tight text-brand-900">{confirmado ? "¡Ya estás participando!" : "Confirmá por WhatsApp"}</h1>

      {ya && !confirmado && (
        <p className="mt-3 rounded-xl border-l-4 border-sky-500 bg-sky-50 px-4 py-3 text-[0.95rem] text-brand-900">
          Ese número de WhatsApp ya estaba anotado en este sorteo: tu código es el mismo de antes. Solo te falta confirmarlo.
        </p>
      )}
      {confirmado && (
        <p className="mt-3 rounded-xl border-l-4 border-emerald-600 bg-emerald-50 px-4 py-3 text-[0.95rem] text-emerald-900">
          Ese número ya estaba anotado y tu participación <strong>ya está confirmada</strong>. ¡Mucha suerte!
        </p>
      )}

      {/* Código como chapa de número de auto de carrera */}
      <div className="mt-5 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-ink-soft">Tu código</p>
        <div className="mx-auto mt-2 w-fit overflow-hidden rounded-2xl border-[5px] border-brand-900 bg-white shadow-card">
          <Cuadros className="h-2.5" tam={5} />
          <p className="px-6 py-3 font-head text-[2.6rem] font-extrabold leading-none tracking-wider text-brand-900 sm:text-5xl">{codigo}</p>
          <Cuadros className="h-2.5" tam={5} />
        </div>
        <CopiarCodigo codigo={codigo} />
      </div>

      {!confirmado && (
        <>
          <a href={link} target="_blank" rel="noopener noreferrer"
            className="mt-6 flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl bg-[#1fa855] px-6 py-4 text-lg font-extrabold text-white shadow-card transition hover:bg-[#188a45] active:scale-[0.99]">
            <IconoWhatsapp className="h-7 w-7" /> Confirmar por WhatsApp
          </a>
          <div role="note" className="mt-4 rounded-xl border-2 border-amber-300 bg-amber-50 px-4 py-3 text-[0.95rem] leading-snug text-amber-950">
            <strong>Importante:</strong> sin ese mensaje tu participación <strong>no queda confirmada</strong>. Envialo tal cual, sin borrar el código.
          </div>
          <ol className="mt-5 space-y-2.5 text-[0.95rem] text-ink">
            {["Tocá el botón verde.", "Se abre WhatsApp con el mensaje listo.", "Tocá enviar. ¡Y listo, ya participás!"].map((t, i) => (
              <li key={t} className="flex items-center gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-900 text-sm font-extrabold text-white">{i + 1}</span>
                {t}
              </li>
            ))}
          </ol>
        </>
      )}

      <div className="mt-6 border-t border-line pt-4 text-center text-sm text-ink-soft">
        {fechaSorteo && <p>Sorteo: <strong className="text-brand-900">{fechaSorteo}</strong>. Si ganás, te escribimos a este WhatsApp.</p>}
        <p className="mt-2">
          <Link href="/sorteo/bases" className="font-bold text-sky-700 underline underline-offset-4">Bases y condiciones</Link>
          {" · "}
          <Link href="/" className="font-bold text-sky-700 underline underline-offset-4">Conocé Bertona Seguros</Link>
        </p>
      </div>
    </section>
  );
}
