// netlify/functions/generateCertificateTwo2.js

const { MongoClient, ObjectId } = require('mongodb');
const Jimp = require('jimp');
const path = require('path');

// متغيرات MongoDB
const uri = process.env.MONGODB_URI; // تأكد أن هذا المتغير موجود في إعدادات Netlify
const dbName = 'Cluster0';
const collectionName = 'enrolled_students_tbl';

// **مسار صورة الشهادة (مسارك الأصلي):**
// يجب أن يكون موجودًا في مجلد 'public/images_temp/' بالنسبة لجذر المشروع
const CERTIFICATE_IMAGE_PATH = path.join(process.cwd(), 'public/images_temp/wwee.jpg');

// **مسارات الخطوط (مسارك الأصلي):**
// تأكد من استبدالها بأسماء ملفات .fnt التي ولدتها بـ BMFont
const FONT_FNT_PATH_48 = path.join(process.cwd(), 'netlify/functions/fonts/arial-48.fnt'); // اسم خط حجم 48
const FONT_FNT_PATH_28 = path.join(process.cwd(), 'netlify/functions/fonts/arial-28.fnt'); // اسم خط حجم 28
const FONT_FNT_PATH_20 = path.join(process.cwd(), 'netlify/functions/fonts/arial-20.fnt'); // اسم خط حجم 20


// تعريف أنماط النصوص وإحداثياتها الدقيقة (X, Y)
// قم بتعديل قيم X و Y لتناسب تصميم شهادتك
const TEXT_COLOR = 0x000000FF; // أسود مع شفافية كاملة (RRGGBBAA)
const WHITE_COLOR = 0xFFFFFFFF; // أبيض مع شفافية كاملة (RRGGBBAA)

const TEXT_POSITIONS = {
    STUDENT_NAME: { x: 489, y: 150, fontPath: FONT_FNT_PATH_48, color: WHITE_COLOR, alignment: Jimp.FONT_ALIGN_CENTER, maxWidth: 600 },
    SERIAL_NUMBER: { x: 180, y: 220, fontPath: FONT_FNT_PATH_28, color: WHITE_COLOR, alignment: Jimp.FONT_ALIGN_LEFT, maxWidth: 300 },
    DOCUMENT_SERIAL_NUMBER: { x: 489, y: 280, fontPath: FONT_FNT_PATH_20, color: TEXT_COLOR, alignment: Jimp.FONT_ALIGN_CENTER, maxWidth: 600 },
    PLATE_NUMBER: { x: 489, y: 320, fontPath: FONT_FNT_PATH_20, color: TEXT_COLOR, alignment: Jimp.FONT_ALIGN_CENTER, maxWidth: 600 },
    CAR_TYPE: { x: 489, y: 360, fontPath: FONT_FNT_PATH_20, color: TEXT_COLOR, alignment: Jimp.FONT_ALIGN_CENTER, maxWidth: 600 },
    COLOR: { x: 489, y: 400, fontPath: FONT_FNT_PATH_20, color: TEXT_COLOR, alignment: Jimp.FONT_ALIGN_CENTER, maxWidth: 600 },
};

// تعريف متغيرات الخطوط لتحميلها مرة واحدة
let loadedFonts = {};

exports.handler = async (event, context) => {
    const studentId = event.path.split('/').pop();
    console.log('ID المستلم في وظيفة generateCertificateTwo2:', studentId);

    let client;

    try {
        if (!uri) {
            throw new Error("MONGODB_URI is not set in environment variables. Please set it in Netlify.");
        }
        client = new MongoClient(uri);
        await client.connect();
        const database = client.db(dbName);
        const studentsCollection = database.collection(collectionName);

        let student;
        try {
            student = await studentsCollection.findOne({ _id: new ObjectId(studentId) });
        } catch (objectIdError) {
            console.error('خطأ في إنشاء ObjectId:', objectIdError);
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'معرف الطالب غير صالح' }),
                headers: { 'Content-Type': 'application/json' },
            };
        }

        if (!student) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: `لم يتم العثور على طالب بالمعرف: ${studentId}` }),
                headers: { 'Content-Type': 'application/json' },
            };
        }

        const serialNumber = student.serial_number;
        const studentNameArabic = student.arabic_name || '';
        const documentSerialNumber = student.document_serial_number || '';
        const plateNumber = student.plate_number || '';
        const carType = student.car_type || '';
        const color = student.color || '';

        // قراءة صورة الشهادة
        const image = await Jimp.read(CERTIFICATE_IMAGE_PATH);
        const imageWidth = image.getWidth();

        // **تحميل الخطوط (إذا لم تكن محملة بعد)**
        for (const key in TEXT_POSITIONS) {
            const fontPath = TEXT_POSITIONS[key].fontPath;
            if (!loadedFonts[fontPath]) {
                loadedFonts[fontPath] = await Jimp.loadFont(fontPath);
            }
        }

        // كتابة النصوص على الصورة
        const printText = (img, font, textData, textContent, imgWidth) => {
            const { x, y, alignment, maxWidth, color } = textData;
            let finalX = x;
            img.color([ { apply: 'xor', params: [ color ] } ]);

            if (alignment === Jimp.FONT_ALIGN_CENTER) {
                const textWidth = Jimp.measureText(font, textContent);
                finalX = (imgWidth / 2) - (textWidth / 2);
            }
            img.print(font, finalX, y, { text: textContent, alignmentX: alignment, maxWidth: maxWidth }, imgWidth);
        };

        // طباعة اسم الطالب
        printText(image, loadedFonts[TEXT_POSITIONS.STUDENT_NAME.fontPath], TEXT_POSITIONS.STUDENT_NAME, studentNameArabic, imageWidth);

        // طباعة الرقم التسلسلي
        printText(image, loadedFonts[TEXT_POSITIONS.SERIAL_NUMBER.fontPath], TEXT_POSITIONS.SERIAL_NUMBER, serialNumber, imageWidth);

        // طباعة رقم المستند التسلسلي
        printText(image, loadedFonts[TEXT_POSITIONS.DOCUMENT_SERIAL_NUMBER.fontPath], TEXT_POSITIONS.DOCUMENT_SERIAL_NUMBER, documentSerialNumber, imageWidth);

        // طباعة رقم اللوحة
        printText(image, loadedFonts[TEXT_POSITIONS.PLATE_NUMBER.fontPath], TEXT_POSITIONS.PLATE_NUMBER, `رقم اللوحة: ${plateNumber}`, imageWidth);

        // طباعة نوع السيارة
        printText(image, loadedFonts[TEXT_POSITIONS.CAR_TYPE.fontPath], TEXT_POSITIONS.CAR_TYPE, `نوع السيارة: ${carType}`, imageWidth);

        // طباعة اللون
        printText(image, loadedFonts[TEXT_POSITIONS.COLOR.fontPath], TEXT_POSITIONS.COLOR, `اللون: ${color}`, imageWidth);

        // تحويل الصورة إلى Buffer وإرجاعها كـ Base64
        const processedImageBuffer = await image.getBufferAsync(Jimp.MIME_JPEG);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'image/jpeg',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            },
            body: processedImageBuffer.toString('base64'),
            isBase64Encoded: true,
        };

    } catch (error) {
        console.error('خطأ في وظيفة توليد الشهادة:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'حدث خطأ أثناء توليد الشهادة', details: error.message }),
            headers: { 'Content-Type': 'application/json' },
        };
    } finally {
        if (client) await client.close();
    }
};