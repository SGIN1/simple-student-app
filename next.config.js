/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // إعدادات الصور
  images: {
    unoptimized: true,
  },

  // إعادة التوجيه للأسماء العربية
  async rewrites() {
    return [
      {
        source: "/",
        destination: "/بيانات-الطلاب",
      },
    ]
  },

  // إعدادات الأمان
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
    ]
  },
}

module.exports = nextConfig
