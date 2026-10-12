const MAX = 4 * 1024 * 1024; // 4 MB (límite de Vercel para el cuerpo de la solicitud: 4,5 MB)
const MIMES: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export type Archivo = { nombre: string; mime: string; datos: Buffer };

/** Lee y valida un archivo subido (PDF o imagen, hasta 4 MB). Devuelve null si no se envió ninguno. */
export async function leerArchivo(fd: FormData, campo: string): Promise<Archivo | null> {
  const f = fd.get(campo);
  if (!(f instanceof File) || f.size === 0) return null;
  if (f.size > MAX) throw new Error(`"${f.name}" supera los 4 MB permitidos.`);
  const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
  const mime = MIMES[ext];
  if (!mime) throw new Error(`"${f.name}": solo se aceptan PDF, JPG, PNG o WEBP.`);
  const datos = Buffer.from(await f.arrayBuffer());
  const cab = datos.subarray(0, 4).toString("latin1");
  const ok =
    (mime === "application/pdf" && cab === "%PDF") ||
    (mime === "image/jpeg" && datos[0] === 0xff && datos[1] === 0xd8) ||
    (mime === "image/png" && cab.slice(1, 4) === "PNG") ||
    (mime === "image/webp" && cab === "RIFF");
  if (!ok) throw new Error(`"${f.name}" no parece un archivo ${ext.toUpperCase()} válido.`);
  return { nombre: f.name.replace(/[^\w.\- ()áéíóúñÁÉÍÓÚÑ]/g, "_").slice(0, 120), mime, datos };
}
