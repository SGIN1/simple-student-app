const fs = require('fs').promises;
const path = require('path');
const Jimp = require('jimp');

// **مسار الخط:** يجب أن يكون موجودًا في مجلد netlify/functions/fonts
const FONT_PATH = './fonts/arial.ttf';

// تعريف أنماط النصوص
const TEXT_STYLE = {
    fontSize: 24,
    color: 0x000000FF, // أسود (RRGGBBAA)
    textAlign: Jimp.HORIZONTAL_ALIGN_CENTER,
    // أي خيارات أخرى للخط يمكنك إضافتها هنا
};

const STUDENT_NAME_STYLE = {
    ...TEXT_STYLE,
    top: 150,
    fontSize: 48,
    color: 0xFFFFFFFF, // أبيض
};

const SERIAL_NUMBER_STYLE = {
    ...TEXT_STYLE,
    top: 220,
    fontSize: 28,
    fontWeight: Jimp.FONT_SANS_32_BLACK, // يمكنك تجربة أحجام وأنماط أخرى
    color: 0xFFFFFFFF, // أبيض
};

const DOCUMENT_SERIAL_NUMBER_STYLE = {
    ...TEXT_STYLE,
    top: 280,
    fontSize: 20,
    color: 0x333333FF, // رمادي غامق
};

const PLATE_NUMBER_STYLE = {
    ...TEXT_STYLE,
    top: 320,
    fontSize: 20,
    color: 0x333333FF, // رمادي غامق
};

const CAR_TYPE_STYLE = {
    ...TEXT_STYLE,
    top: 360,
    fontSize: 20,
    color: 0x333333FF, // رمادي غامق
};

const COLOR_STYLE = {
    ...TEXT_STYLE,
    top: 400,
    fontSize: 20,
    color: 0x333333FF, // رمادي غامق
};

exports.handler = async (event, context) => {
    const studentId = event.path.split('/').pop();
    console.log('ID المستلم في وظيفة generateCertificateTwo2:', studentId);

    try {
        // استخدام المسار المطلق لصورة الشهادة
        const imagePath = path.join(process.cwd(), "public/images_temp/wwee.jpg");
        console.log('محاولة قراءة الصورة من المسار المطلق:', imagePath);
        const image = await Jimp.read(imagePath);
        console.log('تم قراءة الصورة بنجاح.');

        // تحميل الخط
        const font = await Jimp.loadFont(path.join(__dirname, FONT_PATH));
        console.log('تم تحميل الخط بنجاح.');

        // **هنا يجب أن تسترجع بيانات الطالب من قاعدة البيانات باستخدام `studentId`**
        // **سنفترض مؤقتًا وجود كائن `student` يحتوي على البيانات**
        const student = {
            arabic_name: 'اسم الطالب النموذجي',
            serial_number: 'SN-12345',
            document_serial_number: 'DSN-67890',
            plate_number: 'ABC-123',
            car_type: 'سيدان',
            color: 'أزرق',
        };

        // تحديد عرض الصورة (يمكنك الحصول عليها من `image.getWidth()`)
        const imageWidth = image.getWidth();

        // كتابة النصوص على الصورة
        image.print(font, 0, STUDENT_NAME_STYLE.top, {
            text: student.arabic_name,
            alignmentX: STUDENT_NAME_STYLE.textAlign,
            maxWidth: imageWidth * 0.9 // استخدام 90% من عرض الصورة
        }, imageWidth * 0.9);

        image.print(font, 0, SERIAL_NUMBER_STYLE.top, {
            text: student.serial_number,
            alignmentX: SERIAL_NUMBER_STYLE.textAlign,
            maxWidth: 180 // عرض ثابت للرقم التسلسلي
        }, 180);

        image.print(font, 0, DOCUMENT_SERIAL_NUMBER_STYLE.top, {
            text: student.document_serial_number,
            alignmentX: DOCUMENT_SERIAL_NUMBER_STYLE.textAlign,
            maxWidth: imageWidth * 0.9
        }, imageWidth * 0.9);

        image.print(font, 0, PLATE_NUMBER_STYLE.top, {
            text: `رقم اللوحة: ${student.plate_number}`,
            alignmentX: PLATE_NUMBER_STYLE.textAlign,
            maxWidth: imageWidth * 0.9
        }, imageWidth * 0.9);

        image.print(font, 0, CAR_TYPE_STYLE.top, {
            text: `نوع السيارة: ${student.car_type}`,
            alignmentX: CAR_TYPE_STYLE.textAlign,
            maxWidth: imageWidth * 0.9
        }, imageWidth * 0.9);

        image.print(font, 0, COLOR_STYLE.top, {
            text: `اللون: ${student.color}`,
            alignmentX: COLOR_STYLE.textAlign,
            maxWidth: imageWidth * 0.9
        }, imageWidth * 0.9);

        const processedImageBuffer = await image.getBufferAsync(Jimp.MIME_JPEG);

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "image/jpeg"
            },
            body: processedImageBuffer.toString('base64'),
            isBase64Encoded: true
        };
    } catch (error) {
        console.error("Error processing image:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to process image", details: error.message })
        };
    } finally {
        console.log('انتهاء وظيفة generateCertificateTwo2.');
        // **لا تنسَ إضافة كود الاتصال بقاعدة البيانات وإغلاقه هنا**
    }
};