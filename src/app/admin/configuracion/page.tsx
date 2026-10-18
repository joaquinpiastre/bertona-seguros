import { SubmitButton } from "@/components/panel/Cliente";
import { Card, Field, Flash, PageHead, TextArea } from "@/components/panel/ui";
import { guardarConfig } from "@/lib/actions/admin";
import { dato } from "@/lib/api";

export default async function Configuracion({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const { cfg } = await dato<{ cfg: Record<string, string> }>("configuracion");
  return (
    <>
      <PageHead title="Configuración" sub="Textos y reglas que usa el portal de clientes" />
      <Flash sp={sp} />
      <form action={guardarConfig} className="space-y-6">
        <Card title="Inhabilitación por falta de pago">
          <div className="max-w-sm">
            <Field label="Días de gracia" name="dias_gracia" type="number" min="0" max="365" defaultValue={cfg.dias_gracia || "30"} required
              hint="Si una cuota lleva más días que estos sin pagarse, la póliza queda inhabilitada para el cliente (no puede ver ni descargar sus datos). Una póliza anulada también queda inhabilitada." />
          </div>
        </Card>

        <Card title="Auxilio mecánico (lo que ve el cliente; vino cargado con la información de Meridional)">
          <div className="grid gap-4">
            <Field label="WhatsApp del auxilio (con código de país)" name="auxilio_whatsapp" defaultValue={cfg.auxilio_whatsapp} placeholder="Ej: +54 9 11 6740 8247" className="max-w-sm" />
            <Field label="Teléfono 0800" name="auxilio_telefono" defaultValue={cfg.auxilio_telefono} placeholder="Ej: 0800-333-3244" className="max-w-sm" />
            <TextArea label="Cómo funciona el auxilio mecánico" name="auxilio_texto" rows={7} defaultValue={cfg.auxilio_texto}
            />
            <TextArea label="Planes y kilómetros (uno por línea: Plan | Kilómetros | Detalle)" name="auxilio_planes" rows={6} defaultValue={cfg.auxilio_planes} />
            <p className="text-xs text-ink-soft">Ejemplo de línea: <code>Plan Básico | 100 km | Remolque y asistencia mecánica ligera</code>. Mientras esté vacío, el cliente ve un aviso de que la información está en preparación.</p>
          </div>
        </Card>

        <Card title="Pagos por Mercado Pago (lo que ve el cliente al pagar)">
          <TextArea label="Instrucciones para pagar por Mercado Pago" name="mp_instrucciones" rows={4} defaultValue={cfg.mp_instrucciones}
          />
          <p className="mt-2 text-xs text-ink-soft">Por ejemplo el alias o el link de pago de la empresa. El cliente sube la captura del comprobante y la empresa la aprueba.</p>
        </Card>

        <SubmitButton variant="gold" pendiente="Guardando…">Guardar configuración</SubmitButton>
      </form>
    </>
  );
}
