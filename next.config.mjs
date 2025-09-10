/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [{ hostname: "**" }],
  },
  experimental: {
    // Increase body size limit for file uploads
    bodySizeLimit: '50mb',
  },
  // API route config for larger payloads
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
    responseLimit: false,
  },
};

export default nextConfig;
