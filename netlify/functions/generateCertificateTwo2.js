const Jimp = require('jimp');

// استخدام رابط RAW لملف ppp.jpg من GitHub مباشرة
const CERTIFICATE_TEMPLATE_URL = 'https://raw.githubusercontent.com/SGIN1/simple-student-app/refs/heads/master/ppp.jpg?raw=true';

// --- رابط مباشر لملف خط TTF (Roboto) ---
const FONT_URL = 'https://fonts.gstatic.com/s/roboto/v40/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf';

exports.handler = async (event, context) => {
    try {
        console.log('محاولة قراءة الملف من URL:', CERTIFICATE_TEMPLATE_URL);
        const image = await Jimp.read(CERTIFICATE_TEMPLATE_URL);
        console.log('تم تحميل الصورة بنجاح من URL:', image ? 'نعم' : 'لا');

        // تحميل الخط مباشرة من URL
        const font = await Jimp.loadFont(FONT_URL);
        console.log('تم تحميل الخط بنجاح من URL:', FONT_URL);

        const studentId = event.queryStringParameters.id;
        // هنا يجب أن تسترجع بيانات الطالب بناءً على studentId من قاعدة البيانات
        // لأغراض التجربة، سنستخدم بيانات وهمية
        const student = {
            serial_number: 'SN2025-001',
            residency_number: '1234567890',
            created_at: new Date().toISOString().substring(0, 10),
            _id: studentId || 'TEMP_ID'
        };

        // حجم وموقع النصوص على الشهادة - تحتاج لتعديل هذه القيم!
        const fontSize = 60;
        const textColor = '#000000'; // أسود
        const serialNumberX = 550;
        const serialNumberY = 400;
        const residencyNumberX = 550;
        const residencyNumberY = 500;
        const enrollmentDateX = 550;
        const enrollmentDateY = 600;
        const studentIdX = 150;
        const studentIdY = 700;

        // إضافة الرقم التسلسلي
        image.print(
            font,
            serialNumberX,
            serialNumberY,
            {
                text: student.serial_number,
                alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
                maxWidth: 400
            },
            400
        );

        // إضافة رقم الإقامة
        image.print(
            font,
            residencyNumberX,
            residencyNumberY,
            {
                text: student.residency_number,
                alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
                maxWidth: 400
            },
            400
        );

        // إضافة تاريخ التسجيل
        image.print(
            font,
            enrollmentDateX,
            enrollmentDateY,
            {
                text: student.created_at,
                alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
                maxWidth: 400
            },
            400
        );

        // إضافة معرف الطالب (للتتبع)
        image.print(
            font,
            studentIdX,
            studentIdY,
            {
                text: `ID: ${student._id}`,
                alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT,
                maxWidth: 300
            },
            300
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