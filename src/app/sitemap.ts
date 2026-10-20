import type { MetadataRoute } from "next";
import { RAMOS, SITE_URL } from "@/config/empresa";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE_URL.replace(/\/$/, "");
  return [
    { url: base, lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
    { url: `${base}/seguros`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/nosotros`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.6 },
    { url: `${base}/contacto`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.6 },
    { url: `${base}/ayuda`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    ...RAMOS.map((r) => ({ url: `${base}/seguros/${r.id}`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 })),
  ];
}
