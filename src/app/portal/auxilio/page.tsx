import { Card } from "@/components/panel/ui";
import { waLink } from "@/config/empresa";
import { dato } from "@/lib/api";
import { portalUsuario } from "@/lib/auth";

export default async function Auxilio() {
  await portalUsuario();
  const { cfg } = await dato<{ cfg: Record<string, string> }>("portalAuxilio");
  const planes = (cfg.auxilio_planes || "")
    .split("\n")
    .map((l) => l.split("|").map((x) => x.trim()))
    .filter((c) => c[0]);
  const tel = cfg.auxilio_telefono?.trim();
  const sinDatos = !tel && !cfg.auxilio_texto?.trim() && planes.length === 0;

  return (
    <>
      <h1 className="text-2xl text-brand-900 sm:text-3xl">Auxilio mecánico</h1>
      <p className="mb-6 mt-1 text-sm text-ink-soft">Asistencia en ruta para tu vehículo: llamá al número de abajo y te ayudamos.</p>

      {sinDatos ? (
        <Card>
          <p className="text-sm text-ink-soft">Estamos preparando la información de tu auxilio mecánico. Mientras tanto, consultanos por WhatsApp.</p>
          <a href={waLink("Hola! Quiero saber cómo funciona el auxilio mecánico de mi seguro.")} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block bg-[#1fa855] px-5 py-3 font-semibold text-white hover:bg-[#188a45]">Consultar por WhatsApp</a>
        </Card>
      ) : (
        <>
          {tel && (
            <section className="mb-6 border-2 border-accent-500 bg-white p-6 text-center sm:text-left">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Llamá sin cargo</p>
              <a href={`tel:${tel.replace(/[^\d+]/g, "")}`} className="mt-1 block font-display text-4xl font-bold tracking-wide text-brand-900 sm:text-5xl">{tel}</a>
            </section>
          )}
          {cfg.auxilio_texto?.trim() && (
            <Card title="Cómo funciona">
              <p className="whitespace-pre-line text-sm leading-relaxed text-ink">{cfg.auxilio_texto}</p>
            </Card>
          )}
          {planes.length > 0 && (
            <Card title="Planes y kilómetros" className="mt-6">
              <div className="-m-5 overflow-x-auto">
                <table className="w-full min-w-[420px] text-sm">
                  <thead className="border-b border-line bg-soft"><tr>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-ink-soft">Plan</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-ink-soft">Kilómetros</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-ink-soft">Detalle</th>
                  </tr></thead>
                  <tbody className="divide-y divide-line">
                    {planes.map((c, i) => (
                      <tr key={i}><td className="px-4 py-3 font-semibold text-brand-900">{c[0]}</td><td className="px-4 py-3">{c[1] ?? ""}</td><td className="px-4 py-3 text-ink-soft">{c[2] ?? ""}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </>
  );
}
