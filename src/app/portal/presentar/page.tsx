import Image from "next/image";
import { PolizaBloqueada } from "@/components/panel/Bloqueo";
import { Card, Flash } from "@/components/panel/ui";
import { EMPRESA } from "@/config/empresa";
import { dato, type Row } from "@/lib/api";
import { portalUsuario } from "@/lib/auth";
import { fecha, hoy, money } from "@/lib/format";

type Estado = { tono: "ok" | "aviso" | "error"; titulo: string; detalle: string };

function estadoDe(p: Row, h: string): Estado {
  if (p.estado === "en_tramite") return { tono: "aviso", titulo: "Póliza en trámite", detalle: "Presentá el certificado de cobertura provisorio si ya lo tenés." };
  if (p.hasta && p.hasta < h) return { tono: "error", titulo: "Vigencia vencida", detalle: `La vigencia terminó el ${fecha(p.hasta)}. Contactanos para renovar.` };
  if (p.vencidas > 0) return { tono: "aviso", titulo: "Vigente · con cuotas vencidas", detalle: "Regularizá tus cuotas para mantener la cobertura sin inconvenientes." };
  return { tono: "ok", titulo: "Cobertura vigente · al día", detalle: "No registrás cuotas vencidas." };
}

const BANDA = { ok: "bg-emerald-700", aviso: "bg-amber-600", error: "bg-red-700" };

export default async function Presentar({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  await portalUsuario();
  const h = hoy();
  const { c, polizas, bloqueadas } = await dato<{ c: Row | null; polizas: Row[]; bloqueadas: Row[] }>("portalPresentar");

  return (
    <>
      <h1 className="text-2xl text-brand-900 sm:text-3xl">Presentar documentación</h1>
      <p className="mb-6 mt-1 text-sm text-ink-soft">
        Si te piden los papeles en un control, mostrá esta pantalla y el certificado de cobertura. Te recomendamos descargar los PDF para tenerlos también sin conexión.
      </p>
      <Flash sp={sp} />

      {bloqueadas.map((b) => <div key={b.id} className="mb-4"><PolizaBloqueada p={b} /></div>)}

      {polizas.length === 0 && bloqueadas.length === 0 && (
        <Card><p className="text-sm text-ink-soft">No tenés pólizas vigentes cargadas. Si ya contrataste un seguro con nosotros, escribinos y lo cargamos.</p></Card>
      )}

      <div className="space-y-6">
        {polizas.map((p) => {
          const e = estadoDe(p, h);
          return (
            <article key={p.id} className="overflow-hidden border border-line bg-white shadow-soft">
              <div className={`${BANDA[e.tono]} px-5 py-4 text-white`}>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-90">{p.ramo} · {p.compania}</p>
                <p className="mt-1 font-display text-2xl font-semibold sm:text-3xl">{e.titulo}</p>
                <p className="mt-1 text-sm opacity-95">{e.detalle}</p>
              </div>

              <div className="p-5">
                {p.dominio && (
                  <p className="mb-4 inline-block border-2 border-brand-900 px-4 py-1 font-mono text-3xl font-bold tracking-[0.18em] text-brand-900">{p.dominio}</p>
                )}
                <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                  <Item k="Asegurado">{c?.nombre}{c?.documento ? ` · ${c.documento}` : ""}</Item>
                  <Item k="Compañía aseguradora">{p.compania}</Item>
                  <Item k="N° de póliza"><span className="font-mono text-lg font-semibold">{p.numero}</span></Item>
                  <Item k="Riesgo asegurado">{p.riesgo}</Item>
                  <Item k="Vigencia">{p.desde || p.hasta ? `${fecha(p.desde)} al ${fecha(p.hasta)}` : null}</Item>
                  <Item k="Suma asegurada">{p.suma ? money(p.suma) : null}</Item>
                  <Item k="Último pago registrado">
                    {p.ult_pago_id ? (
                      <>{fecha(p.ult_pago_fecha)} · <a href={`/api/recibo/${p.ult_pago_id}`} target="_blank" className="font-semibold text-brand-700 underline">Recibo N° {String(p.ult_recibo).padStart(6, "0")}</a></>
                    ) : null}
                  </Item>
                  <Item k="Próximo vencimiento">{p.prox_venc ? fecha(p.prox_venc) : null}</Item>
                </dl>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {p.doc_cert ? (
                    <a href={`/api/documento/${p.doc_cert}`} target="_blank" className="flex items-center justify-center bg-brand-900 px-5 py-4 text-center text-base font-semibold text-white hover:bg-brand-700">
                      Certificado de cobertura (PDF)
                    </a>
                  ) : (
                    <p className="border border-dashed border-line px-4 py-3 text-sm text-ink-soft">Certificado de cobertura: todavía no cargado. Pedilo por WhatsApp.</p>
                  )}
                  {p.doc_poliza ? (
                    <a href={`/api/documento/${p.doc_poliza}`} target="_blank" className="flex items-center justify-center border-2 border-brand-900 px-5 py-4 text-center text-base font-semibold text-brand-900 hover:bg-brand-50">
                      Póliza completa (PDF)
                    </a>
                  ) : (
                    <p className="border border-dashed border-line px-4 py-3 text-sm text-ink-soft">Póliza: todavía no cargada.</p>
                  )}
                  {p.ult_pago_id && (
                    <a href={`/api/recibo/${p.ult_pago_id}`} target="_blank" className="flex items-center justify-center border border-line px-5 py-3 text-center text-sm font-semibold text-brand-800 hover:border-brand-500 sm:col-span-2">
                      Último recibo de pago
                    </a>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <div className="border border-line bg-white px-3 py-2"><Image src="/brand/ssn.png" alt="Superintendencia de Seguros de la Nación" width={120} height={70} className="h-12 w-auto" /></div>
        <p className="max-w-xl text-xs leading-relaxed text-ink-soft">
        Esta pantalla es informativa y refleja los datos que tenemos cargados. Los documentos válidos son los emitidos por la aseguradora (póliza y certificado de cobertura).
        Ante cualquier duda: {EMPRESA.telefonoVisible}.
        </p>
      </div>
    </>
  );
}

function Item({ k, children }: { k: string; children?: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-ink-soft">{k}</dt>
      <dd className="mt-0.5 text-base text-ink">{children || "—"}</dd>
    </div>
  );
}
