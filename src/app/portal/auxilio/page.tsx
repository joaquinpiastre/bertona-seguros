import { Icono } from "@/components/panel/Iconos";
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
  const wa = cfg.auxilio_whatsapp?.trim();
  const waUrl = wa ? `https://wa.me/${wa.replace(/\D/g, "")}?text=${encodeURIComponent("Hola! Necesito auxilio mecánico. Mi número de póliza es: ")}` : "";
  const sinDatos = !tel && !wa && !cfg.auxilio_texto?.trim() && planes.length === 0;

  return (
    <>
      <h1 className="text-3xl text-brand-900">Auxilio mecánico</h1>
      <p className="mb-6 mt-1 text-base text-ink-soft">Si te quedás en la ruta, pedí ayuda desde acá. Funciona todos los días, a toda hora.</p>

      {sinDatos ? (
        <Card>
          <p className="text-base text-ink-soft">Estamos preparando la información de tu auxilio mecánico. Mientras tanto, consultanos por WhatsApp.</p>
          <a href={waLink("Hola! Quiero saber cómo funciona el auxilio mecánico de mi seguro.")} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block bg-[#1fa855] px-6 py-4 text-lg font-bold text-white hover:bg-[#188a45]">Consultar por WhatsApp</a>
        </Card>
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            {waUrl && (
              <a href={waUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 bg-[#1fa855] p-5 text-white transition hover:bg-[#188a45]">
                <Icono n="ayuda" className="h-12 w-12 shrink-0" />
                <span><strong className="block font-display text-2xl">Pedir auxilio por WhatsApp</strong><span className="text-base opacity-95">{wa}</span></span>
              </a>
            )}
            {tel && (
              <a href={`tel:${tel.replace(/[^\d+]/g, "")}`} className="flex items-center gap-4 bg-brand-900 p-5 text-white transition hover:bg-brand-700">
                <Icono n="telefono" className="h-12 w-12 shrink-0" />
                <span><strong className="block font-display text-2xl">Llamar sin cargo</strong><span className="text-base opacity-95">{tel} · atención al cliente</span></span>
              </a>
            )}
          </div>
          {cfg.auxilio_texto?.trim() && (
            <Card title="Cómo funciona">
              <p className="whitespace-pre-line text-base leading-relaxed text-ink">{cfg.auxilio_texto}</p>
            </Card>
          )}
          {planes.length > 0 && (
            <Card title="Cuántos servicios y kilómetros tenés" className="mt-6">
              <p className="mb-4 text-base text-ink-soft">Depende de la cobertura de tu póliza.</p>
              <ul className="divide-y divide-line border border-line">
                {planes.map((c, i) => (
                  <li key={i} className="p-4">
                    <strong className="block text-lg text-brand-900">{c[0]}</strong>
                    <span className="text-base text-ink-soft">{[c[1], c[2]].filter(Boolean).join(" · ")}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}
    </>
  );
}
