import type { AppProps } from 'next/app';
import '../public/القالب_المشترك.css'; // تأكد من المسار الصحيح لملفات CSS
import '../public/القالب_المشترك2.css'; // إذا كان لديك أكثر من ملف CSS

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default MyApp;