import { DenunciaForm } from "@/components/panel/DenunciaForm";
import { Badge, Card, Flash } from "@/components/panel/ui";
import { EMPRESA, waLink } from "@/config/empresa";
import { denunciarSiniestro } from "@/lib/actions/portal";
import { dato, type Row } from "@/lib/api";
import { portalUsuario } from "@/lib/auth";
import { ESTADOS_SINIESTRO, fecha, hoy } from "@/lib/format";

const tono = (e: string) => (e === "cerrado" ? "gris" : e === "en_gestion" ? "ambar" : "rojo");

export default async function Siniestros({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  await portalUsuario();
  const { filas, polizas } = await dato<{ filas: Row[]; polizas: Row[] }>("portalSiniestros");

  return (
    <>
      <h1 className="text-2xl text-brand-900 sm:text-3xl">Siniestros</h1>
      <p className="mb-6 mt-1 text-sm text-ink-soft">Si tuviste un siniestro, completá la denuncia y adjuntá la foto de tu carnet de conducir y de la cédula verde. La oficina se comunica con vos para seguir el trámite.</p>
      <Flash sp={sp} />

      <div className="mb-6 flex flex-wrap items-center gap-3 border-l-4 border-accent-500 bg-accent-300/20 px-4 py-3 text-sm text-brand-900">
        <span>¿Es una urgencia? Llamá a la oficina al <strong>{EMPRESA.telefonoVisible}</strong> o escribinos ahora.</span>
        <a href={waLink("Hola! Tuve un siniestro y necesito ayuda urgente.")} target="_blank" rel="noopener noreferrer" className="bg-[#1fa855] px-4 py-2 font-semibold text-white hover:bg-[#188a45]">WhatsApp</a>
      </div>

      {polizas.length === 0 ? (
        <Card><p className="text-sm text-ink-soft">No tenés pólizas activas para denunciar un siniestro. Comunicate con la oficina.</p></Card>
      ) : (
        <Card title="Denunciar un siniestro">
          <DenunciaForm polizas={polizas as never} hoy={hoy()} action={denunciarSiniestro} />
        </Card>
      )}

      {filas.length > 0 && (
        <Card title="Mis siniestros" className="mt-6">
          <ul className="divide-y divide-line text-sm">
            {filas.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <span>
                  <strong className="text-brand-900">{s.tipo || "Siniestro"}</strong> · {fecha(s.fecha)}
                  <span className="block text-xs text-ink-soft">{s.lugar || "Sin lugar"}{s.poliza ? ` · ${s.compania} · Póliza ${s.poliza}` : ""}{s.nro_compania ? ` · N° de siniestro ${s.nro_compania}` : ""}</span>
                </span>
                <Badge tono={tono(s.estado)}>{ESTADOS_SINIESTRO[s.estado] ?? s.estado}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
