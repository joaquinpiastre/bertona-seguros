/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { formats: ["image/avif", "image/webp"] },
  serverExternalPackages: ["pg", "@electric-sql/pglite", "bcryptjs"],
  experimental: { serverActions: { bodySizeLimit: "4.5mb" } },
  // El sistema corre en Railway. Si alguien entra por el deploy viejo de Vercel, lo mandamos allá.
  async redirects() {
    if (!process.env.VERCEL) return [];
    return [{ source: "/:path*", destination: "https://web-production-8a1cc.up.railway.app/:path*", permanent: false }];
  },
};
export default nextConfig;
