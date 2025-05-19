const Jimp = require('jimp');

exports.handler = async (event, context) => {
    const imagePath = './images_temp/wwee.jpg'; // مسار نسبي لصورة الشهادة

    try {
        console.log('محاولة قراءة الصورة من المسار:', imagePath);
        const image = await Jimp.read(imagePath);
        console.log('تم قراءة الصورة بنجاح.');

        // يمكنك إضافة أي معالجة للصور هنا لاحقًا (مثل تغيير الحجم أو إضافة نصوص)

        console.log('محاولة تحويل الصورة إلى Buffer JPEG.');
        const buffer = await image.getBufferAsync(Jimp.MIME_JPEG);
        console.log('تم تحويل الصورة إلى Buffer بنجاح. حجم Buffer:', buffer.length);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'image/jpeg',
            },
            body: buffer.toString('base64'), // يجب تحويل Buffer إلى base64 لإرساله كـ body في Lambda
            isBase64Encoded: true,
        };

    } catch (error) {
        console.error('حدث خطأ أثناء معالجة الصورة:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
            },
            body: `<h1>حدث خطأ أثناء معالجة صورة الشهادة</h1><p>${error.message}</p><pre>${error.stack}</pre>`,
        };
    } finally {
        console.log('انتهاء وظيفة generateCertificateTwo2.');
        // لا نقوم بإغلاق عميل MongoDB هنا مؤقتًا
    }
};