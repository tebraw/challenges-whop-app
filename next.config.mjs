/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [{ hostname: "**" }],
  },
  // For Next.js 15, body size limits are handled at the API route level
  // experimental: {
  //   bodySizeLimit: '50mb',  // Not supported in Next.js 15
  // },
  
  // API route config moved to individual route files
  // api: {
  //   bodyParser: {
  //     sizeLimit: '50mb',  // Not supported in Next.js 15 at config level
  //   },
  //   responseLimit: false,
  // },
};

export default nextConfig;
