const Jimp = require('jimp');
const path = require('path');

// محاولة استخدام مسار نسبي مباشر من جذر المشروع (قد يحتاج إلى تعديل حسب بيئة Netlify)
const CERTIFICATE_TEMPLATE_PATH = path.join(process.cwd(), 'images', 'ppp.jpg');

exports.handler = async (event, context) => {
    try {
        console.log('محاولة قراءة الملف من المسار:', CERTIFICATE_TEMPLATE_PATH);
        const image = await Jimp.read(CERTIFICATE_TEMPLATE_PATH);
        console.log('تم تحميل الصورة بنجاح:', image ? 'نعم' : 'لا');

        const buffer = await image.getBufferAsync(Jimp.MIME_JPEG);

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'image/jpeg' },
            body: buffer.toString('base64'),
            isBase64Encoded: true,
        };
    } catch (error) {
        console.error('حدث خطأ:', error);
        return {
            statusCode: 500,
            body: `<h1>حدث خطأ أثناء معالجة الصورة</h1><pre>${error.message}</pre>`,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        };
    }
};