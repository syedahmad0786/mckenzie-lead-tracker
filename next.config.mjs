/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "www.mcsewon.com" },
      { protocol: "https", hostname: "www.mcsewon.com" },
    ],
  },
  experimental: { serverActions: { allowedOrigins: ["*"] } },
};
export default nextConfig;
