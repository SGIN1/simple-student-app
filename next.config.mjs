import path from 'path'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['localhost', 'vercel.app'],
    unoptimized: true,
  },
  
  async rewrites() {
    return [
      {
        source: '/certificate/:id',
        destination: '/api/generateCertificateTwo2?id=:id',
      },
    ]
  },
  
  webpack: (config, { isServer }) => {
    // إعداد alias للمسار المطلق '@'
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(process.cwd()),
    }
    
    // التعامل مع المكتبات الأصلية فقط في بيئة الخادم
    if (isServer) {
      config.externals = [
        ...(config.externals || []),
        {
          'canvas': 'commonjs canvas',
          'sharp': 'commonjs sharp',
        },
      ]
    }

    // تحميل ملفات .node
    config.module.rules.push({
      test: /\.node$/,
      loader: 'node-loader',
    })

    return config
  },
}

export default nextConfig
