/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { formats: ["image/avif", "image/webp"] },
  // Los formularios con archivos pasan por Vercel (límite de 4,5 MB por solicitud).
  experimental: { serverActions: { bodySizeLimit: "4.5mb" } },
};
export default nextConfig;
