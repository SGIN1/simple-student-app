const Jimp = require('jimp');

// استخدام رابط RAW لملف ppp.jpg من GitHub مباشرة
const CERTIFICATE_TEMPLATE_URL = 'https://raw.githubusercontent.com/SGIN1/simple-student-app/refs/heads/master/ppp.jpg';

// --- رابط مباشر لملف خط TTF مجاني (مثال: Almarai-Regular.ttf من Google Fonts CDN) ---
const FONT_URL = 'https://fonts.gstatic.com/s/almarai/v15/taiYGmYF_GGH97WXHSxYcScvYjY.ttf';

exports.handler = async (event, context) => {
    try {
        console.log('محاولة قراءة الملف من URL:', CERTIFICATE_TEMPLATE_URL);
        const image = await Jimp.read(CERTIFICATE_TEMPLATE_URL);
        console.log('تم تحميل الصورة بنجاح من URL:', image ? 'نعم' : 'لا');

        // تحميل الخط مباشرة من URL
        const font = await Jimp.loadFont(FONT_URL);
        console.log('تم تحميل الخط بنجاح من URL:', FONT_URL);

        const serialNumber = 'SN12345'; // هنا يجب أن تحصل على الرقم التسلسلي الديناميكي
        const testText = 'مرحباً بكم على مكتبة Jimp'; // نص توضيحي

        // إضافة الرقم التسلسلي
        image.print(
            font,
            SERIAL_TEXT_X,
            SERIAL_TEXT_Y,
            {
                text: serialNumber,
                alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
                maxWidth: 450
            },
            450
        );

        // إضافة النص التوضيحي
        image.print(
            font,
            150,
            100,
            {
                text: testText,
                alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT
            }
        );

        const buffer = await image.getBufferAsync(Jimp.MIME_JPEG);

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'image/jpeg' },
            body: buffer.toString('base64'),
            isBase64Encoded: true,
        };
    } catch (error) {
        console.error('حدث خطأ أثناء معالجة الصورة أو إضافة النصوص:', error);
        return {
            statusCode: 500,
            body: `<h1>حدث خطأ أثناء معالجة الصورة أو إضافة النصوص</h1><pre>${error.message}</pre>`,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        };
    }
};