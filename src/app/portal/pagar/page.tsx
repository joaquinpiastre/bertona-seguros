import Link from "next/link";
import { PagarForm } from "@/components/panel/PagarForm";
import { Card, Flash } from "@/components/panel/ui";
import { pagarCuota } from "@/lib/actions/portal";
import { dato, type Row } from "@/lib/api";
import { portalUsuario } from "@/lib/auth";
import { hoy, money } from "@/lib/format";

export default async function Pagar({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  await portalUsuario();
  const { cuotas, mp } = await dato<{ cuotas: Row[]; mp: string }>("portalPagar");
  const total = cuotas.filter((c) => !c.en_revision).reduce((s, c) => s + c.importe, 0);

  return (
    <>
      <h1 className="text-2xl text-brand-900 sm:text-3xl">Pagar</h1>
      <p className="mb-6 mt-1 text-sm text-ink-soft">Elegí la cuota y cómo vas a pagar. Los pagos pueden demorar hasta 48 hs en acreditarse.</p>
      <Flash sp={sp} />
      {cuotas.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-soft">No tenés cuotas pendientes. ¡Estás al día! <Link href="/portal" className="font-semibold underline">Volver al inicio</Link>.</p>
        </Card>
      ) : (
        <Card title={`Cuotas pendientes · ${money(total)}`}>
          <PagarForm cuotas={cuotas as never} hoy={hoy()} mp={mp} action={pagarCuota} />
        </Card>
      )}
    </>
  );
}
