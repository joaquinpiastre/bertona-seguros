import Link from "next/link";
import { SubmitButton } from "@/components/panel/Cliente";
import { Card, Flash, TextArea } from "@/components/panel/ui";
import { solicitarBaja } from "@/lib/actions/portal";
import { dato, type Row } from "@/lib/api";
import { portalUsuario } from "@/lib/auth";

export default async function Anular({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string; poliza?: string }> }) {
  const sp = await searchParams;
  await portalUsuario();
  const { polizas } = await dato<{ polizas: Row[] }>("portalPolizas");
  const p = polizas.find((x) => String(x.id) === sp.poliza);

  return (
    <>
      <h1 className="mb-6 text-2xl text-brand-900 sm:text-3xl">Anular póliza</h1>
      <Flash sp={sp} />
      {!p ? (
        <Card><p className="text-sm text-ink-soft">No encontramos esa póliza. <Link href="/portal/polizas" className="font-semibold underline">Volver a Mis pólizas</Link>.</p></Card>
      ) : (
        <Card title={`${p.compania} · ${p.ramo}`}>
          <p className="text-sm text-ink-soft">Póliza <strong className="text-brand-900">{p.numero}</strong>{p.riesgo ? ` · ${p.riesgo}` : ""}{p.dominio ? ` · ${p.dominio}` : ""}</p>
          <div className="my-5 border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-900">
            Al confirmar, le avisamos a la oficina que querés anular esta póliza. <strong>La póliza no se anula en el momento</strong>: te van a contactar para confirmarlo. Mientras tanto seguís cubierto.
          </div>
          <form action={solicitarBaja} className="space-y-4">
            <input type="hidden" name="poliza_id" value={p.id} />
            <TextArea label="¿Por qué querés anularla? (opcional)" name="motivo" rows={3} />
            <div className="flex flex-col gap-3 sm:flex-row">
              <SubmitButton variant="danger" confirmar="¿Seguro que querés pedir la anulación de esta póliza?" pendiente="Enviando…">Sí, quiero anular mi póliza</SubmitButton>
              <Link href="/portal/polizas" className="inline-flex items-center justify-center border border-line bg-white px-4 py-2.5 text-sm font-semibold text-brand-800 hover:border-brand-500">No, volver</Link>
            </div>
          </form>
        </Card>
      )}
    </>
  );
}
