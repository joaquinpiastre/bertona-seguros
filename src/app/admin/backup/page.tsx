import { Icono } from "@/components/panel/Iconos";
import { Card, Flash, PageHead, btnGold } from "@/components/panel/ui";
import { dato } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";

export default async function Backup({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const { ultimo } = await dato<{ ultimo: { fecha: string; por: string; tamano: string } | null }>("backup");
  return (
    <>
      <PageHead title="Copia de seguridad" sub="Descargá todo el sistema en un archivo, para tenerlo guardado por si algo falla" />
      <Flash sp={sp} />
      <div className="space-y-6">
        <Card title="Descargar una copia completa">
          <p className="text-base text-ink">
            Se descarga un archivo <strong>.zip</strong> con toda la información del sistema tal como está en este momento.
            Se abre con doble clic en la computadora (o con WinRAR).
          </p>
          <ul className="mt-4 space-y-2 text-base text-ink">
            <li><strong>base-de-datos.sql</strong>: la base de datos completa (clientes, pólizas, cuotas, pagos y recibos, siniestros, avisos, usuarios, configuración y los archivos subidos). Es la que sirve para recuperar el sistema.</li>
            <li><strong>planillas</strong>: cada tabla para abrir con Excel, sin contraseñas.</li>
            <li><strong>documentos</strong>: los archivos subidos (pólizas, comprobantes, fotos), en una carpeta por cliente.</li>
          </ul>
          <a href="/api/backup" className={`${btnGold} mt-6`}>
            <Icono n="backup" className="h-6 w-6" />
            Descargar copia de seguridad
          </a>
          <p className="mt-3 text-sm text-ink-soft">
            Si hay muchos archivos puede tardar un par de minutos. No cierres la página hasta que el navegador termine la descarga.
          </p>
        </Card>

        <Card title="Última copia descargada">
          {ultimo ? (
            <p className="text-base text-ink">
              El <strong>{ultimo.fecha}</strong>, por {ultimo.por} ({ultimo.tamano}).
            </p>
          ) : (
            <p className="text-base text-ink-soft">Todavía no se descargó ninguna copia.</p>
          )}
        </Card>

        <Card title="Recomendaciones">
          <ul className="list-disc space-y-2 pl-5 text-base text-ink">
            <li>Hacé una copia por semana, y siempre antes de un cambio grande (por ejemplo, cargar muchos clientes juntos).</li>
            <li>Guardala fuera de esta computadora: un disco externo, un pendrive o una nube privada (Google Drive, OneDrive).</li>
            <li>Tiene datos personales de los clientes: no la mandes por WhatsApp ni la compartas.</li>
            <li>No hace falta borrar las copias viejas: cada una lleva la fecha y la hora en el nombre.</li>
          </ul>
        </Card>
      </div>
    </>
  );
}
