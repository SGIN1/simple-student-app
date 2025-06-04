/** @type {import('next').NextConfig} */
const nextConfig = {
  // تكوين Next.js
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // تكوين الصور
  images: {
    domains: ['localhost', 'vercel.app'],
    unoptimized: true,
  },
  
  // تكوين وظائف API
  async rewrites() {
    return [
      {
        source: '/certificate/:id',
        destination: '/api/generateCertificateTwo2?id=:id',
      },
    ];
  },
  
  // تكوين webpack لدعم canvas
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': process.cwd(),
    };
    
    return config;
  },
};

export default nextConfig;
