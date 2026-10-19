/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { formats: ["image/avif", "image/webp"] },
  // Los formularios con archivos pasan por Vercel (límite de 4,5 MB por solicitud).
  // Un solo dominio: bertonaseguros.com. La dirección vieja de Vercel y www apuntan acá.
  async redirects() {
    return [
      { source: "/:path*", has: [{ type: "host", value: "bertona-seguros.vercel.app" }], destination: "https://bertonaseguros.com/:path*", permanent: true },
      { source: "/:path*", has: [{ type: "host", value: "www.bertonaseguros.com" }], destination: "https://bertonaseguros.com/:path*", permanent: true },
    ];
  },
  experimental: { serverActions: { bodySizeLimit: "4.5mb" } },
};
export default nextConfig;
