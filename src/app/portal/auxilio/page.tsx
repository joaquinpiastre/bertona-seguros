import { Icono } from "@/components/panel/Iconos";
import { Card } from "@/components/panel/ui";
import { EMPRESA } from "@/config/empresa";
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

  return (
    <>
      <h1 className="text-3xl text-brand-900">Auxilio mecánico</h1>
      <p className="mb-6 mt-1 text-base text-ink-soft">Si te quedás en la ruta, llamá y te ayudan. Funciona todos los días, a toda hora.</p>

      <a
        href={`tel:${(tel || EMPRESA.telefonoTel).replace(/[^\d+]/g, "")}`}
        className="mb-6 flex items-center gap-4 bg-brand-900 p-6 text-white transition hover:bg-brand-700"
      >
        <Icono n="telefono" className="h-14 w-14 shrink-0" />
        <span>
          <strong className="block text-sm font-semibold uppercase tracking-wider text-accent-300">Tocá para llamar</strong>
          <span className="block font-display text-4xl font-bold tracking-wide sm:text-5xl">{tel || EMPRESA.telefonoVisible}</span>
          <span className="text-base opacity-90">{tel ? "Atención al cliente · llamada sin cargo" : "Oficina de Bertona Seguros"}</span>
        </span>
      </a>

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
  );
}
