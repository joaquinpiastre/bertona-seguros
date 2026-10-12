import { archivo } from "@/lib/api";

export async function GET(req: Request) {
  const qs = new URL(req.url).search;
  return archivo(`export${qs}`);
}
