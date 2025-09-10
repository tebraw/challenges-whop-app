/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [{ hostname: "**" }],
  },
  
  // Reduce console warnings in production
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },
  
  // Reduce build warnings
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  
  // Optimize performance and reduce warnings
  experimental: {
    optimizePackageImports: ['@whop/react'],
  },
  
  // Headers to control resource loading
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
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
