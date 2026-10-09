import { ASEGURADORAS } from "@/config/empresa";

/** TODO: reemplazar los placeholders por los logos reales de las aseguradoras (con autorización). */
export function Aseguradoras() {
  return (
    <section aria-labelledby="aseg-t" className="border-y border-line bg-soft py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 id="aseg-t" className="mb-8 text-center font-sans text-xs font-semibold uppercase tracking-[0.22em] text-ink-soft">
          Aseguradoras con las que trabajamos
        </h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {ASEGURADORAS.map((n) => (
            <li key={n} className="grid h-16 place-items-center border border-line bg-white text-sm font-medium text-ink-soft">{n}</li>
          ))}
        </ul>
        <p className="mt-6 text-center text-xs text-ink-soft">Espacios reservados: se reemplazarán por los logos de las aseguradoras reales.</p>
      </div>
    </section>
  );
}
