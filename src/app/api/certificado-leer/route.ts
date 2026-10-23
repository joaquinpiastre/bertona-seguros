import { leerCertificado } from "@/lib/api";

/** Lee las fechas de la constancia de cobertura (PDF) que se está por cargar. Solo el personal; lo verifica el backend. */
export async function POST(req: Request) {
  return leerCertificado(await req.formData());
}
