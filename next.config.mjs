/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { formats: ["image/avif", "image/webp"] },
  serverExternalPackages: ["pg", "@electric-sql/pglite", "bcryptjs"],
  experimental: { serverActions: { bodySizeLimit: "4.5mb" } },
};
export default nextConfig;
