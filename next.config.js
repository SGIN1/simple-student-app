/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // أعدنا unoptimized: true للصور لضمان عدم وجود مشاكل مع الصور
  images: {
    unoptimized: true,
  },
  // هذا الجزء يحل مشكلة الـ CORS مع الـ API
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ];
  },
  // لا يوجد هنا قسم rewrites، لأننا سنستخدم vercel.json أو pages/index.tsx
};

module.exports = nextConfig;