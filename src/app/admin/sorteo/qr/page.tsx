import { PageHead } from "@/components/panel/ui";
import { GeneradorQR } from "@/components/sorteo/admin/GeneradorQR";
import { SITE_URL } from "@/config/empresa";
import { requireAdmin } from "@/lib/auth";
import { ORIGENES_SUGERIDOS } from "@/lib/sorteo/comun";

export default async function CodigosQR() {
  await requireAdmin();
  return (
    <>
      <PageHead title="Códigos QR" sub="Un QR distinto para cada lugar (cartel en la pista, flyer, redes, locutor): en las métricas ves cuál trae más gente." />
      <GeneradorQR base={SITE_URL} sugeridos={ORIGENES_SUGERIDOS} />
    </>
  );
}
