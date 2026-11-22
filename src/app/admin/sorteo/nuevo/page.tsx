import { Flash, PageHead } from "@/components/panel/ui";
import { FormSorteo } from "@/components/sorteo/admin/FormSorteo";
import { datoSorteo } from "@/lib/sorteo/api";

export default async function NuevoSorteo({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const { valores } = await datoSorteo<{ valores: Record<string, string> }>("nuevo");
  return (
    <>
      <PageHead title="Nuevo sorteo" sub="Uno por mes, por ejemplo. Solo puede haber uno activo a la vez." />
      <Flash sp={sp} />
      <FormSorteo nuevo s={valores} />
    </>
  );
}
