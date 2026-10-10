import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/empresa";

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/portal", "/ingresar", "/api"] }, sitemap: `${SITE_URL}/sitemap.xml` };
}
