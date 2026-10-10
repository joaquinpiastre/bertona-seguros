import Link from "next/link";
import { Badge, Card, Flash, LinkBtn, btnGhost } from "@/components/panel/ui";
import { EMPRESA, waLink } from "@/config/empresa";
import { portalUsuario } from "@/lib/auth";
import { q, q1 } from "@/lib/db";
import { ESTADOS_POLIZA, fecha, hoy, money } from "@/lib/format";

export default async function PortalInicio({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const u = await portalUsuario();
  const h = hoy();
  const [c, polizas, cuotas, pagos, nContactos] = await Promise.all([
    q1("SELECT nombre FROM clientes WHERE id = $1", [u.cliente_id]),
    q(
      `SELECT p.id, p.ramo, p.compania, p.numero, p.riesgo, p.dominio, p.estado, p.vigencia_hasta::text AS hasta,
              (SELECT id FROM documentos d WHERE d.poliza_id = p.id AND d.tipo = 'poliza' ORDER BY id DESC LIMIT 1) AS doc_poliza,
              (SELECT id FROM documentos d WHERE d.poliza_id = p.id AND d.tipo = 'certificado' ORDER BY id DESC LIMIT 1) AS doc_cert
       FROM polizas p WHERE p.cliente_id = $1 AND p.estado IN ('vigente','en_tramite') ORDER BY p.id DESC`, [u.cliente_id]),
    q(
      `SELECT c.id, c.numero, c.vencimiento::text AS venc, c.importe::float8 AS importe, p.numero AS poliza, p.compania, p.cuotas_cant
       FROM cuotas c JOIN polizas p ON p.id = c.poliza_id
       WHERE p.cliente_id = $1 AND c.estado = 'pendiente' AND p.estado <> 'anulada' ORDER BY c.vencimiento LIMIT 10`, [u.cliente_id]),
    q(
      `SELECT pg.id, pg.recibo_nro, pg.fecha::text AS fecha, pg.importe::float8 AS importe, p.numero AS poliza
       FROM pagos pg LEFT JOIN polizas p ON p.id = pg.poliza_id WHERE pg.cliente_id = $1 AND pg.estado = 'aplicado'
       ORDER BY pg.fecha DESC, pg.id DESC LIMIT 3`, [u.cliente_id]),
    q1("SELECT COUNT(*)::int AS n FROM contactos_emergencia WHERE cliente_id = $1", [u.cliente_id]),
  ]);
  const vencidas = cuotas.filter((x) => x.venc < h);
  const proxima = cuotas.find((x) => x.venc >= h);
  const nombre = (c?.nombre ?? u.nombre).split(" ")[0];

  return (
    <>
      <h1 className="text-2xl text-brand-900 sm:text-3xl">Hola, {nombre}</h1>
      <p className="mb-6 mt-1 text-sm text-ink-soft">Este es el resumen de tu cuenta en Bertona Seguros.</p>
      <Flash sp={sp} />

      {vencidas.length > 0 && (
        <div className="mb-6 border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-900">
          Tenés <strong>{vencidas.length} cuota{vencidas.length > 1 ? "s" : ""} vencida{vencidas.length > 1 ? "s" : ""}</strong> por {money(vencidas.reduce((s, x) => s + x.importe, 0))}. Para regularizar, contactanos:{" "}
          <a className="font-semibold underline" href={waLink("Hola! Quiero regularizar mis cuotas vencidas.")} target="_blank" rel="noopener noreferrer">WhatsApp</a> o al {EMPRESA.telefonoVisible}.
        </div>
      )}
      {nContactos!.n === 0 && (
        <div className="mb-6 border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Todavía no cargaste contactos de emergencia. <Link href="/portal/contactos" className="font-semibold underline">Agregalos ahora</Link>.
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <Card title="Próximo vencimiento" className="md:col-span-1">
          {proxima ? (
            <>
              <p className="font-display text-3xl font-semibold text-brand-900">{money(proxima.importe)}</p>
              <p className="mt-1 text-sm text-ink-soft">Vence el <strong>{fecha(proxima.venc)}</strong></p>
              <p className="mt-1 text-xs text-ink-soft">{proxima.compania} · Póliza {proxima.poliza} · Cuota {proxima.numero}/{proxima.cuotas_cant}</p>
            </>
          ) : <p className="text-sm text-ink-soft">No tenés cuotas pendientes. ¡Estás al día!</p>}
        </Card>
        <Card title="Siniestros y consultas" className="md:col-span-2">
          <p className="text-sm text-ink-soft">Ante un siniestro mantené la calma, resguardá a las personas, juntá datos y fotos y avisanos de inmediato. Te guiamos en la denuncia paso a paso.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href={waLink("Hola! Tuve un siniestro y necesito ayuda con la denuncia.")} target="_blank" rel="noopener noreferrer" className="inline-flex bg-accent-500 px-4 py-2.5 text-sm font-semibold text-brand-900 hover:bg-accent-400">Avisar un siniestro</a>
            <a href={`tel:${EMPRESA.telefonoTel}`} className={btnGhost}>Llamar a la oficina</a>
          </div>
        </Card>
      </div>

      <Card title="Mis pólizas" className="mt-6" actions={<Link href="/portal/polizas" className="text-sm font-semibold text-brand-700 hover:underline">Ver detalle</Link>}>
        {polizas.length === 0 ? <p className="text-sm text-ink-soft">Todavía no tenés pólizas vigentes cargadas.</p> : (
          <ul className="divide-y divide-line">
            {polizas.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <span>
                  <strong className="text-brand-900">{p.compania}</strong> · {p.ramo} <Badge tono={p.estado === "vigente" ? "verde" : "ambar"}>{ESTADOS_POLIZA[p.estado]}</Badge>
                  <span className="block text-xs text-ink-soft">Póliza {p.numero}{p.riesgo ? ` · ${p.riesgo}` : ""}{p.dominio ? ` · ${p.dominio}` : ""}{p.hasta ? ` · vigente hasta ${fecha(p.hasta)}` : ""}</span>
                </span>
                <span className="flex gap-2">
                  {p.doc_poliza && <a href={`/api/documento/${p.doc_poliza}`} target="_blank" className={`${btnGhost} !px-3 !py-1.5 !text-xs`}>Póliza</a>}
                  {p.doc_cert && <a href={`/api/documento/${p.doc_cert}`} target="_blank" className={`${btnGhost} !px-3 !py-1.5 !text-xs`}>Certificado</a>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Últimos pagos" className="mt-6" actions={<LinkBtn sm href="/portal/pagos">Ver todos</LinkBtn>}>
        {pagos.length === 0 ? <p className="text-sm text-ink-soft">Todavía no hay pagos registrados.</p> : (
          <ul className="divide-y divide-line">
            {pagos.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <span><strong>{money(p.importe)}</strong> · {fecha(p.fecha)}<span className="block text-xs text-ink-soft">{p.poliza ? `Póliza ${p.poliza}` : "Pago a cuenta"} · Recibo N° {String(p.recibo_nro).padStart(6, "0")}</span></span>
                <a href={`/api/recibo/${p.id}`} target="_blank" className="text-xs font-semibold text-brand-700 hover:underline">Descargar recibo</a>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
