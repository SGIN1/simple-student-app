const Jimp = require('jimp');
const path = require('path');

// استخدام رابط RAW لملف ppp.jpg من GitHub مباشرة
const CERTIFICATE_TEMPLATE_URL = 'https://raw.githubusercontent.com/SGIN1/simple-student-app/refs/heads/master/ppp.jpg';

// --- مسار الخط (معدل لبيئة Netlify باستخدام LAMBDA_TASK_ROOT) ---
const FONT_PATH = path.join(process.env.LAMBDA_TASK_ROOT, 'arial.ttf');

// --- خيارات النص للرقم التسلسلي ---
const SERIAL_TEXT_X = 550;
const SERIAL_TEXT_Y = 350;
const SERIAL_FONT_SIZE = 52;
const SERIAL_FONT_COLOR = '#000000';
const SERIAL_TEXT_ALIGN = Jimp.HORIZONTAL_ALIGN_CENTER;
const SERIAL_TEXT_MAX_WIDTH = 450;

// --- خيارات النص التجريبي ---
const TEST_TEXT_X = 150;
const TEST_TEXT_Y = 100;
const TEST_FONT_SIZE = 36;
const TEST_FONT_COLOR = '#FF0000';
const TEST_TEXT_ALIGN_TEST = Jimp.HORIZONTAL_ALIGN_LEFT;

exports.handler = async (event, context) => {
    try {
        console.log('محاولة قراءة الملف من URL:', CERTIFICATE_TEMPLATE_URL);
        const image = await Jimp.read(CERTIFICATE_TEMPLATE_URL);
        console.log('تم تحميل الصورة بنجاح من URL:', image ? 'نعم' : 'لا');

        // تحميل الخط من المسار المتوقع في Netlify باستخدام LAMBDA_TASK_ROOT
        const font = await Jimp.loadFont(FONT_PATH);
        console.log('تم تحميل الخط بنجاح من المسار:', FONT_PATH);

        const serialNumber = 'SN12345'; // هنا يجب أن تحصل على الرقم التسلسلي الديناميكي
        const testText = 'مرحباً بكم على مكتبة Jimp'; // نص توضيحي

        // إضافة الرقم التسلسلي
        image.print(
            font,
            SERIAL_TEXT_X,
            SERIAL_TEXT_Y,
            {
                text: serialNumber,
                alignmentX: SERIAL_TEXT_ALIGN,
                maxWidth: SERIAL_TEXT_MAX_WIDTH
            },
            SERIAL_TEXT_MAX_WIDTH
        );

        // إضافة النص التوضيحي
        image.print(
            font,
            TEST_TEXT_X,
            TEST_TEXT_Y,
            {
                text: testText,
                alignmentX: TEST_TEXT_ALIGN_TEST
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