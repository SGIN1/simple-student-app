/** @type {import('next').NextConfig} */
const nextConfig = {
  // تكوين Next.js
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true, // يفضل إصلاح الأخطاء بدلاً من تجاهلها في المشاريع الكبيرة
  },
  typescript: {
    ignoreBuildErrors: true, // يفضل إصلاح الأخطاء بدلاً من تجاهلها في المشاريع الكبيرة
  },
  // تكوين الصور
  images: {
    domains: ['localhost', 'vercel.app'], // أضف أي نطاقات أخرى تستخدمها لصورك
    unoptimized: true, // قد يؤثر على الأداء في الإنتاج
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
  
  // تكوين webpack لدعم المسارات المطلقة مثل '@/'
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(process.cwd()), // استخدم path.resolve لضمان المسار الصحيح
    };
    
    // إضافة إعدادات إضافية لـ next-runtime-node-addon (إذا كنت تستخدمها)
    // لتضمين الوحدات الأصلية في Vercel
    config.externals = [
      ...(config.externals || []),
      {
        'canvas': 'commonjs canvas', // لتضمين مكتبة canvas بشكل صحيح
        'sharp': 'commonjs sharp',   // لتضمين مكتبة sharp بشكل صحيح
        // 'mongodb': 'commonjs mongodb', // إذا كنت تواجه مشاكل مع mongodb
      },
    ];

    // هذه الخطوات مهمة لـ `node-canvas` و `sharp` على Vercel
    // تأكد من أن هذه الحزم مجمعة بشكل صحيح
    // قد تحتاج إلى إضافة هذه الإعدادات بناءً على أخطاء البناء أو التشغيل
    config.module.rules.push({
      test: /\.node$/,
      loader: 'node-loader',
    });

    return config;
  },
};

export default nextConfig;