import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/empresa";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE_URL.replace(/\/$/, "");
  const detalles = ["autos", "motos", "hogar", "comercio", "accidentes"];
  return [
    { url: base, lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
    { url: `${base}/ayuda`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    ...detalles.map((d) => ({ url: `${base}/seguros/${d}`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 })),
  ];
}
