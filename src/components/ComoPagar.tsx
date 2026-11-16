import Link from "next/link";
import { btnPrimario } from "./PageShell";

const PASOS = [
  <>Ingresá a tu cuenta con tu <strong>DNI</strong> y tu <strong>contraseña</strong>.</>,
  <>Tocá el botón <strong>PAGAR</strong>.</>,
  <>Elegí la cuota (o las cuotas) que querés pagar. El total y la fecha de hoy se completan solos.</>,
  <>Elegí <strong>Transferencia</strong> (subís el comprobante) o <strong>Efectivo</strong> (pagás en la oficina).</>,
  <>Tocá <strong>Enviar comprobante de pago</strong>. Tu pago queda «En revisión» hasta que lo aprobamos y se emite tu recibo.</>,
];

/**
 * Video tutorial «cómo informar un pago desde tu cuenta» con los pasos escritos.
 * `lado`: en pantallas grandes el video queda a la izquierda y los pasos a la derecha (para la portada).
 */
export function ComoPagar({ lado = false }: { lado?: boolean }) {
  return (
    <div className={`overflow-hidden rounded-3xl border border-line bg-white shadow-card ${lado ? "lg:grid lg:grid-cols-5" : ""}`}>
      <video
        controls
        playsInline
        preload="none"
        poster="/videos/como-pagar-pc-portada.png"
        aria-label="Video: cómo informar un pago desde tu cuenta de Bertona Seguros"
        className={`aspect-video w-full bg-brand-900 ${lado ? "lg:col-span-3 lg:h-full lg:object-cover" : ""}`}
      >
        <source src="/videos/como-pagar-pc.webm" type="video/webm" />
        Tu navegador no puede reproducir el video. Seguí los pasos escritos.
      </video>
      <div className={`p-5 sm:p-6 ${lado ? "lg:col-span-2 lg:flex lg:flex-col lg:justify-center lg:p-8" : ""}`}>
        <h3 className="text-xl text-brand-900 sm:text-2xl">Mirá cómo informar tu pago en 30 segundos</h3>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-ink-soft">
          {PASOS.map((p, i) => <li key={i}>{p}</li>)}
        </ol>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/ingresar" className={btnPrimario}>Ingresar a mi cuenta</Link>
        </div>
      </div>
    </div>
  );
}
