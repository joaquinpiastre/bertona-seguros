import { NextResponse } from "next/server";
import { COOKIE } from "@/lib/api";

/** Cierra la sesión y vuelve al ingreso con un mensaje (por ejemplo "tu póliza no está activada"). */
export async function GET(req: Request) {
  const error = new URL(req.url).searchParams.get("error");
  const destino = new URL(error ? `/ingresar?error=${encodeURIComponent(error)}` : "/ingresar", req.url);
  const res = NextResponse.redirect(destino);
  res.cookies.delete(COOKIE);
  return res;
}
