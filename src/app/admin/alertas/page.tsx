import Link from "next/link";
import { SubmitButton } from "@/components/panel/Cliente";
import { Badge, Card, Flash, PageHead, btnGhost } from "@/components/panel/ui";
import { EMPRESA } from "@/config/empresa";
import { anularPolizaDesdeAlerta, aplicarTramite, resolverAlerta } from "@/lib/actions/admin";
import { dato, type Row } from "@/lib/api";
import { fecha, waCliente } from "@/lib/format";

const TIPOS: Record<string, { label: string; tono: "rojo" | "ambar" | "azul" | "verde" | "gris" }> = {
  baja: { label: "Quiere anular la póliza", tono: "rojo" },
  tramite: { label: "Trámite", tono: "azul" },
  siniestro: { label: "Siniestro", tono: "rojo" },
  pago_informado: { label: "Pago informado", tono: "ambar" },
  pago_final: { label: "Póliza pagada", tono: "verde" },
  poliza_vencida: { label: "Póliza vencida", tono: "rojo" },
  por_renovar: { label: "Por renovar", tono: "ambar" },
  segundo_aviso: { label: "2.º aviso sin pago", tono: "rojo" },
  certificado: { label: "Certificado", tono: "gris" }, // avisos viejos del certificado por período (ya no se generan)
  refacturacion: { label: "Refacturar", tono: "rojo" },
};

const nombre1 = (n: string) => n.split(" ")[0].charAt(0) + n.split(" ")[0].slice(1).toLowerCase();

function whatsapp(a: Row): string {
  const hola = `Hola ${nombre1(a.cliente)}, te escribimos de Bertona Seguros.`;
  const pol = a.poliza ? `póliza N° ${a.poliza} (${a.compania}${a.dominio ? ` · ${a.dominio}` : a.riesgo ? ` · ${a.riesgo}` : ""})` : "tu póliza";
  switch (a.tipo) {
    case "poliza_vencida":
      return `${hola}\nTu ${pol} figura vencida desde el ${fecha(a.hasta)}.\nQueremos ayudarte a renovarla para que no quedes sin cobertura. ¿Te enviamos la nueva propuesta?\nContactanos al ${EMPRESA.telefonoVisible} o respondé este mensaje.`;
    case "por_renovar":
      return `${hola}
Tu ${pol} vence el ${fecha(a.hasta)}. Queremos ayudarte a renovarla a tiempo para que no quedes sin cobertura. ¿Te enviamos la nueva propuesta?
Contactanos al ${EMPRESA.telefonoVisible} o respondé este mensaje.`;
    case "segundo_aviso":
      return `${hola}
Te avisamos hace unos días por el pago de tu ${pol} y todavía no lo registramos. Para que no quedes sin cobertura, ¿podés regularizarlo? Si ya pagaste, mandanos el comprobante.
Contactanos al ${EMPRESA.telefonoVisible} o respondé este mensaje.`;
    case "refacturacion":
      return `${hola}
Terminaron las cuotas de tu ${pol}. Queremos ayudarte a renovar el seguro para que no quedes sin cobertura. ¿Te enviamos la nueva propuesta?
Contactanos al ${EMPRESA.telefonoVisible} o respondé este mensaje.`;
    case "baja":
      return `${hola}\nRecibimos tu pedido de anular la ${pol}. Queríamos comunicarnos para confirmarlo y ver si podemos ayudarte con algo antes. ¿Cuándo podemos hablar?`;
    case "tramite":
      return `${hola}\nRecibimos tu pedido de trámite sobre la ${pol}. Ya lo estamos gestionando y te confirmamos cuando esté listo.`;
    case "siniestro":
      return `${hola}\nRecibimos la denuncia de tu siniestro (${pol}). Vamos a ayudarte con todo el trámite; ¿podés contarnos si estás bien y si hay algo urgente?`;
    case "pago_final":
      return `${hola}\nQueremos avisarte que registramos el pago completo de tu ${pol}. ¡Gracias por tu confianza!`;
    default:
      return hola;
  }
}

function Aviso({ a, resuelta }: { a: Row; resuelta?: boolean }) {
  const t = TIPOS[a.tipo] ?? { label: a.tipo, tono: "gris" as const };
  const wa = a.tipo === "certificado" ? "" : waCliente(a.telefono, whatsapp(a));
  return (
    <li className="py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 text-sm">
          <p>
            <Badge tono={t.tono}>{t.label}</Badge>{" "}
            <Link href={`/admin/clientes/${a.cliente_id}`} className="font-semibold text-brand-800 hover:underline">{a.cliente}</Link>
            <span className="text-ink-soft"> · {fecha(a.creado)}</span>
          </p>
          <p className="mt-1 font-semibold text-brand-900">{a.titulo}</p>
          {a.detalle && <p className="mt-1 whitespace-pre-line text-ink-soft">{a.detalle}</p>}
          {a.poliza_id && (
            <Link href={`/admin/polizas/${a.poliza_id}`} className="mt-1 inline-block text-xs font-semibold text-brand-700 underline">Ver póliza {a.poliza}</Link>
          )}
          {a.tipo === "siniestro" && a.datos && <> · <Link href={`/admin/siniestros/${a.datos}`} className="text-xs font-semibold text-brand-700 underline">Ver siniestro</Link></>}
          {a.tipo === "pago_informado" && <> · <Link href="/admin/comprobantes" className="text-xs font-semibold text-brand-700 underline">Ir a pagos informados</Link></>}
          {a.tipo === "segundo_aviso" && <> · <Link href="/admin/vencimientos?vista=todas&aviso=2" className="text-xs font-semibold text-brand-700 underline">Ir a Vencimientos</Link></>}
        </div>
        {!resuelta && (
          <div className="flex flex-wrap items-start gap-2">
            {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className={`${btnGhost} !px-3 !py-1.5 !text-xs`}>Enviar WhatsApp</a>}
            {a.tipo === "tramite" && (
              <form action={aplicarTramite}><input type="hidden" name="id" value={a.id} /><SubmitButton variant="gold" small confirmar="¿Aplicar los cambios pedidos a la póliza?">Aplicar cambios a la póliza</SubmitButton></form>
            )}
            {a.tipo === "baja" && (
              <form action={anularPolizaDesdeAlerta}><input type="hidden" name="id" value={a.id} /><SubmitButton variant="danger" small confirmar="¿Anular esta póliza? Si el cliente tiene solo esa póliza, ya no podrá ingresar.">Anular póliza</SubmitButton></form>
            )}
            <form action={resolverAlerta}><input type="hidden" name="id" value={a.id} /><SubmitButton variant="ghost" small>Marcar resuelto</SubmitButton></form>
          </div>
        )}
      </div>
    </li>
  );
}

export default async function Alertas({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const { pendientes, resueltas } = await dato<{ pendientes: Row[]; resueltas: Row[] }>("alertas");
  return (
    <>
      <PageHead title="Avisos" sub="Pedidos de clientes, pólizas vencidas, pagos completos y siniestros que requieren una acción" />
      <Flash sp={sp} />
      <Card title={`Pendientes (${pendientes.length})`}>
        {pendientes.length === 0 ? <p className="text-sm text-ink-soft">No hay avisos pendientes. ¡Todo al día!</p> : <ul className="-my-4 divide-y divide-line">{pendientes.map((a) => <Aviso key={a.id} a={a} />)}</ul>}
      </Card>
      <Card title="Resueltos recientemente" className="mt-6">
        {resueltas.length === 0 ? <p className="text-sm text-ink-soft">Todavía no hay avisos resueltos.</p> : <ul className="-my-4 divide-y divide-line">{resueltas.map((a) => <Aviso key={a.id} a={a} resuelta />)}</ul>}
      </Card>
    </>
  );
}
