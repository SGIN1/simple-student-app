const Jimp = require('jimp');

// استخدام رابط RAW لملف ppp.jpg من GitHub مباشرة
const CERTIFICATE_TEMPLATE_URL = 'https://raw.githubusercontent.com/SGIN1/simple-student-app/refs/heads/master/ppp.jpg';

exports.handler = async (event, context) => {
    try {
        console.log('محاولة قراءة الملف من URL:', CERTIFICATE_TEMPLATE_URL);
        const image = await Jimp.read(CERTIFICATE_TEMPLATE_URL);
        console.log('تم تحميل الصورة بنجاح من URL:', image ? 'نعم' : 'لا');

        const buffer = await image.getBufferAsync(Jimp.MIME_JPEG);

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'image/jpeg' },
            body: buffer.toString('base64'),
            isBase64Encoded: true,
        };
    } catch (error) {
        console.error('حدث خطأ أثناء معالجة الصورة من URL:', error);
        return {
            statusCode: 500,
            body: `<h1>حدث خطأ أثناء معالجة الصورة</h1><pre>${error.message}</pre>`,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        };
    }
};