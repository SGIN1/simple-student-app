/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // تحسين الأداء
  experimental: {
    optimizeCss: true,
  },

  // إعدادات الصور
  images: {
    domains: ["localhost"],
    unoptimized: true,
  },

  // إعدادات البيئة
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
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

  // إعدادات webpack
  webpack: (config, { isServer }) => {
    // تحسين حجم الحزمة
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }

    return config
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
