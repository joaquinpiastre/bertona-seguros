import Link from "next/link";
import { PolizaBloqueada, botonPagar } from "@/components/panel/Bloqueo";
import { Badge, Card, Flash, btnGhost } from "@/components/panel/ui";
import { EMPRESA, waLink } from "@/config/empresa";
import { dato, type Row } from "@/lib/api";
import { portalUsuario } from "@/lib/auth";
import { ESTADOS_POLIZA, fecha, hoy, money } from "@/lib/format";

const ACCESOS = [
  { href: "/portal/presentar", titulo: "Presentar documentación", texto: "Mostrá tu cobertura y descargá la póliza y el certificado." },
  { href: "/portal/tramite", titulo: "Trámite", texto: "Cambiá los datos del vehículo, el dominio o la cobertura." },
  { href: "/portal/siniestros", titulo: "Siniestros", texto: "Denunciá un siniestro y seguí su estado." },
  { href: "/portal/auxilio", titulo: "Auxilio mecánico", texto: "Teléfono 0800 y cómo funciona tu asistencia." },
];

export default async function PortalInicio({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const u = await portalUsuario();
  const h = hoy();
  const { c, polizas, cuotas, pagos, nContactos, bloqueadas, deuda } = await dato<{
    c: Row | null; polizas: Row[]; cuotas: Row[]; pagos: Row[]; nContactos: Row; bloqueadas: Row[]; deuda: Row;
  }>("portalInicio");
  const nombre = (c?.nombre ?? u.nombre).split(" ")[0];
  const nombreLindo = nombre.charAt(0) + nombre.slice(1).toLowerCase();
  const total = cuotas.reduce((s, x) => s + x.importe, 0);

  return (
    <>
      <h1 className="text-2xl text-brand-900 sm:text-3xl">Hola, {nombreLindo}</h1>
      <p className="mb-6 mt-1 text-sm text-ink-soft">Este es el resumen de tu cuenta en Bertona Seguros.</p>
      <Flash sp={sp} />

      {bloqueadas.map((p) => (
        <div key={p.id} className="mb-4"><PolizaBloqueada p={p} /></div>
      ))}

      {cuotas.length > 0 ? (
        <section className="mb-6 border-2 border-accent-500 bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">{deuda.n > 0 ? "Tenés cuotas vencidas" : "Lo que tenés por pagar"}</p>
              <p className="mt-1 font-display text-4xl font-semibold text-brand-900">{money(total)}</p>
              {deuda.n > 0 && <p className="mt-1 text-sm font-semibold text-red-700">{deuda.n} cuota{deuda.n > 1 ? "s" : ""} vencida{deuda.n > 1 ? "s" : ""} por {money(deuda.total)}</p>}
            </div>
            <Link href="/portal/pagar" className={botonPagar}>PAGAR</Link>
          </div>
          <ul className="mt-5 divide-y divide-line border-t border-line text-sm">
            {cuotas.map((x) => (
              <li key={x.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <span>
                  <strong className="text-brand-900">{x.compania}</strong> · Póliza {x.poliza} · Cuota {x.numero}/{x.cuotas_cant}
                  <span className="block text-xs text-ink-soft">Vence el {fecha(x.venc)}</span>
                </span>
                <span className="flex items-center gap-3"><strong>{money(x.importe)}</strong>{x.venc < h ? <Badge tono="rojo">Vencida</Badge> : <Badge tono="ambar">A vencer</Badge>}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : polizas.length > 0 ? (
        <div className="mb-6 border-l-4 border-emerald-600 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">No tenés cuotas pendientes. ¡Estás al día!</div>
      ) : null}

      {nContactos.n === 0 && (
        <div className="mb-6 border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Todavía no cargaste contactos de emergencia. <Link href="/portal/contactos" className="font-semibold underline">Agregalos ahora</Link>.
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        {ACCESOS.map((a) => (
          <Link key={a.href} href={a.href} className="group border border-line bg-white p-5 transition hover:border-brand-500 hover:shadow-lift">
            <p className="font-display text-lg font-semibold text-brand-900 group-hover:text-brand-700">{a.titulo} →</p>
            <p className="mt-1 text-sm text-ink-soft">{a.texto}</p>
          </Link>
        ))}
      </div>

      <Card title="Siniestros y consultas" className="mb-6">
        <p className="text-sm text-ink-soft">Ante un siniestro mantené la calma, resguardá a las personas, juntá datos y fotos y avisanos de inmediato. Te guiamos paso a paso.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/portal/siniestros" className="inline-flex bg-accent-500 px-4 py-2.5 text-sm font-semibold text-brand-900 hover:bg-accent-400">Denunciar un siniestro</Link>
          <a href={waLink("Hola! Tuve un siniestro y necesito ayuda.")} target="_blank" rel="noopener noreferrer" className={btnGhost}>Avisar por WhatsApp</a>
          <a href={`tel:${EMPRESA.telefonoTel}`} className={btnGhost}>Llamar a la oficina</a>
        </div>
      </Card>

      <Card title="Mis pólizas" actions={<Link href="/portal/polizas" className="text-sm font-semibold text-brand-700 hover:underline">Ver detalle</Link>}>
        {polizas.length === 0 ? <p className="text-sm text-ink-soft">No tenés pólizas activas para mostrar.</p> : (
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

      <Card title="Últimos pagos" className="mt-6" actions={<Link href="/portal/pagos" className="text-sm font-semibold text-brand-700 hover:underline">Ver todos</Link>}>
        {pagos.length === 0 ? <p className="text-sm text-ink-soft">Todavía no hay pagos registrados.</p> : (
          <ul className="divide-y divide-line">
            {pagos.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <span><strong>{money(p.importe)}</strong> · {fecha(p.fecha)}<span className="block text-xs text-ink-soft">Póliza {p.poliza} · Recibo N° {String(p.recibo_nro).padStart(6, "0")}</span></span>
                <a href={`/api/recibo/${p.id}`} target="_blank" className="text-xs font-semibold text-brand-700 hover:underline">Descargar recibo</a>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
