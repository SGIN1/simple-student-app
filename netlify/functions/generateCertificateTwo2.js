const { MongoClient, ObjectId } = require('mongodb');
const Jimp = require('jimp');
const path = require('path');

const uri = process.env.MONGODB_URI;
const dbName = 'Cluster0';
const collectionName = 'enrolled_students_tbl';

// **مسار صورة الشهادة:** يجب أن يكون موجودًا في مجلد public/images_temp
const CERTIFICATE_IMAGE_PATH = path.join(process.cwd(), 'public/images_temp/wwee.jpg');

// **مسار الخط:** استخدام المسار المطلق (سنبقيه كما هو مؤقتًا)
const FONT_PATH = path.join(process.cwd(), 'netlify/functions/fonts/arial.ttf');

// تعريف أنماط النصوص باستخدام Jimp
const TEXT_COLOR = 0x000000FF; // أسود
const WHITE_COLOR = 0xFFFFFFFF;

// **تعديل fontFamily لتجربة خط عربي شائع**
const STUDENT_NAME_STYLE = { top: 150, fontSize: 48, color: WHITE_COLOR, alignment: Jimp.HORIZONTAL_ALIGN_CENTER, font: 'amiri' };
const SERIAL_NUMBER_STYLE = { top: 220, fontSize: 28, color: WHITE_COLOR, alignment: Jimp.HORIZONTAL_ALIGN_CENTER, font: 'amiri' };
const DOCUMENT_SERIAL_NUMBER_STYLE = { top: 280, fontSize: 20, color: TEXT_COLOR, alignment: Jimp.HORIZONTAL_ALIGN_CENTER, font: 'amiri' };
const PLATE_NUMBER_STYLE = { top: 320, fontSize: 20, color: TEXT_COLOR, alignment: Jimp.HORIZONTAL_ALIGN_CENTER, font: 'amiri' };
const CAR_TYPE_STYLE = { top: 360, fontSize: 20, color: TEXT_COLOR, alignment: Jimp.HORIZONTAL_ALIGN_CENTER, font: 'amiri' };
const COLOR_STYLE = { top: 400, fontSize: 20, color: TEXT_COLOR, alignment: Jimp.HORIZONTAL_ALIGN_CENTER, font: 'amiri' };

exports.handler = async (event, context) => {
    // ... (بقية الكود كما هو)

    try {
        // ... (بقية الكود كما هو)

        // قراءة صورة الشهادة
        const image = await Jimp.read(CERTIFICATE_IMAGE_PATH);

        // تحميل الخط باستخدام المسار المطلق (سنبقيه كما هو مؤقتًا)
        const font = await Jimp.loadFont(FONT_PATH);

        const imageWidth = image.getWidth();

        // كتابة النصوص على الصورة
        image.print(font, 0, STUDENT_NAME_STYLE.top, { text: studentNameArabic, alignmentX: STUDENT_NAME_STYLE.alignment, maxWidth: imageWidth * 0.9 }, imageWidth);
        image.print(font, 0, SERIAL_NUMBER_STYLE.top, { text: serialNumber, alignmentX: SERIAL_NUMBER_STYLE.alignment, maxWidth: 180 }, 180);
        image.print(font, 0, DOCUMENT_SERIAL_NUMBER_STYLE.top, { text: documentSerialNumber, alignmentX: DOCUMENT_SERIAL_NUMBER_STYLE.alignment, maxWidth: imageWidth * 0.9 }, imageWidth);
        image.print(font, 0, PLATE_NUMBER_STYLE.top, { text: `رقم اللوحة: ${plateNumber}`, alignmentX: PLATE_NUMBER_STYLE.alignment, maxWidth: imageWidth * 0.9 }, imageWidth);
        image.print(font, 0, CAR_TYPE_STYLE.top, { text: `نوع السيارة: ${carType}`, alignmentX: CAR_TYPE_STYLE.alignment, maxWidth: imageWidth * 0.9 }, imageWidth);
        image.print(font, 0, COLOR_STYLE.top, { text: `اللون: ${color}`, alignmentX: COLOR_STYLE.alignment, maxWidth: imageWidth * 0.9 }, imageWidth);

        // ... (بقية الكود كما هو)

    } catch (error) {
        console.error('خطأ في وظيفة توليد الشهادة:', error);
        // ... (بقية معالجة الخطأ كما هي)
    } finally {
        // ... (بقية finally كما هي)
    }
};