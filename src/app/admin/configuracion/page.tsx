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

        <Card title="Aviso para renovar la póliza">
          <div className="max-w-sm">
            <Field label="Avisar con cuántos días de anticipación" name="dias_aviso_renovacion" type="number" min="0" max="120" defaultValue={cfg.dias_aviso_renovacion || "15"} required
              hint="Cuando a una póliza vigente le faltan estos días o menos para terminar su vigencia, aparece un aviso para ir renovándola antes de que se corte la cobertura." />
          </div>
        </Card>

        <Card title="Aviso para refacturar">
          <div className="max-w-sm">
            <Field label="Avisar cuántos días después de la última cuota" name="dias_refacturacion" type="number" min="0" max="120" defaultValue={cfg.dias_refacturacion || "15"} required
              hint="Cuando terminan las cuotas de una póliza y pasan estos días sin cargar cuotas nuevas, aparece un aviso de que ese seguro ya venció, para refacturarlo o renovarlo." />
          </div>
        </Card>

        <Card title="Aviso de póliza paga">
          <div className="max-w-sm">
            <Field label="Avisar cuántos días después del último pago" name="dias_aviso_pago" type="number" min="0" max="120" defaultValue={cfg.dias_aviso_pago || "15"} required
              hint="Cuando se paga la última cuota de una póliza, el aviso no aparece en el momento sino pasados estos días." />
          </div>
        </Card>

        <Card title="Cobranza: 1er aviso y 2.º aviso">
          <div className="max-w-sm">
            <Field label="Días entre un aviso y el siguiente" name="dias_entre_avisos" type="number" min="0" max="120" defaultValue={cfg.dias_entre_avisos || "15"} required
              hint="En Vencimientos cada cuota tiene su 1er aviso y su 2.º aviso (el 2.º se recomienda a estos días del 1.º). Si pasan estos días desde el 2.º aviso y la cuota sigue sin pagarse, aparece una alerta en Avisos." />
          </div>
        </Card>

        <Card title="Auxilio mecánico (solo llamadas; vino cargado con la información de Meridional)">
          <div className="grid gap-4">
            <Field label="Teléfono 0800" name="auxilio_telefono" defaultValue={cfg.auxilio_telefono} placeholder="Ej: 0800-333-3244" className="max-w-sm" />
            <TextArea label="Cómo funciona el auxilio mecánico" name="auxilio_texto" rows={7} defaultValue={cfg.auxilio_texto}
            />
            <TextArea label="Planes y kilómetros (uno por línea: Plan | Kilómetros | Detalle)" name="auxilio_planes" rows={6} defaultValue={cfg.auxilio_planes} />
            <p className="text-xs text-ink-soft">Ejemplo de línea: <code>Plan Básico | 100 km | Remolque y asistencia mecánica ligera</code>. Mientras esté vacío, el cliente ve un aviso de que la información está en preparación.</p>
          </div>
        </Card>

        <Card title="Pagos por transferencia (lo que ve el cliente al pagar)">
          <TextArea label="Datos para transferir (alias, CBU, titular)" name="mp_instrucciones" rows={4} defaultValue={cfg.mp_instrucciones}
          />
          <p className="mt-2 text-xs text-ink-soft">El cliente ve estos datos al elegir transferencia, sube la captura del comprobante y la empresa lo aprueba.</p>
        </Card>

        <SubmitButton variant="gold" pendiente="Guardando…">Guardar configuración</SubmitButton>
      </form>
    </>
  );
}
