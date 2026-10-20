import { archivo } from "@/lib/api";

/** Constancia de cobertura con los datos editados en el formulario (solo el personal; lo verifica el backend). */
export async function GET(req: Request) {
  return archivo(`constancia?${new URL(req.url).searchParams}`);
}
