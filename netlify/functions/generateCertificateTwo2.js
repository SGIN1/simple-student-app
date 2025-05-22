// netlify/functions/generateCertificateTwo2.js

const { MongoClient, ObjectId } = require('mongodb');
const Jimp = require('jimp');
const path = require('path');

// متغيرات MongoDB
const uri = process.env.MONGODB_URI; // تأكد أن هذا المتغير موجود في إعدادات Netlify
const dbName = 'Cluster0';
const collectionName = 'enrolled_students_tbl';

// **مسار صورة الشهادة:** يجب أن يكون موجودًا في مجلد public/images_temp
// هذا المسار تم تعديله ليكون صحيحًا في بيئة Netlify Functions
const CERTIFICATE_IMAGE_PATH = path.join(__dirname, '..', '..', 'public', 'images_temp', 'wwee.jpg');

// **مسارات الخطوط:** يجب استبدال هذه بأسماء ملفات .fnt التي ولدتها بـ BMFont
// تأكد من أن ملفات .fnt و .png/.tga موجودة في مجلد 'netlify/functions/fonts/'
const FONT_FNT_PATH_48 = path.join(__dirname, 'fonts', 'arial-48.fnt'); // اسم خط حجم 48
const FONT_FNT_PATH_28 = path.join(__dirname, 'fonts', 'arial-28.fnt'); // اسم خط حجم 28
const FONT_FNT_PATH_20 = path.join(__dirname, 'fonts', 'arial-20.fnt'); // اسم خط حجم 20

// تعريف ألوان النصوص (باستخدام صيغة Jimp: 0xRRGGBBAA)
const BLACK_COLOR = 0x000000FF; // أسود مع شفافية كاملة
const WHITE_COLOR = 0xFFFFFFFF; // أبيض مع شفافية كاملة

// تعريف أنماط النصوص وإحداثياتها الدقيقة (X, Y)
// **مهم:** قم بتعديل قيم 'x' و 'y' لتناسب تصميم شهادتك
const TEXT_POSITIONS = {
    STUDENT_NAME: { x: 489, y: 150, fontPath: FONT_FNT_PATH_48, color: WHITE_COLOR, alignment: Jimp.FONT_ALIGN_CENTER, maxWidth: 600 },
    SERIAL_NUMBER: { x: 180, y: 220, fontPath: FONT_FNT_PATH_28, color: WHITE_COLOR, alignment: Jimp.FONT_ALIGN_LEFT, maxWidth: 300 },
    DOCUMENT_SERIAL_NUMBER: { x: 489, y: 280, fontPath: FONT_FNT_PATH_20, color: BLACK_COLOR, alignment: Jimp.FONT_ALIGN_CENTER, maxWidth: 600 },
    PLATE_NUMBER: { x: 489, y: 320, fontPath: FONT_FNT_PATH_20, color: BLACK_COLOR, alignment: Jimp.FONT_ALIGN_CENTER, maxWidth: 600 },
    CAR_TYPE: { x: 489, y: 360, fontPath: FONT_FNT_PATH_20, color: BLACK_COLOR, alignment: Jimp.FONT_ALIGN_CENTER, maxWidth: 600 },
    COLOR: { x: 489, y: 400, fontPath: FONT_FNT_PATH_20, color: BLACK_COLOR, alignment: Jimp.FONT_ALIGN_CENTER, maxWidth: 600 },
};

// تعريف متغيرات الخطوط لتحميلها مرة واحدة عند أول استدعاء للوظيفة
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
        const imageHeight = image.getHeight();

        // **تحميل الخطوط (إذا لم تكن محملة بعد)**
        for (const key in TEXT_POSITIONS) {
            const fontPath = TEXT_POSITIONS[key].fontPath;
            if (!loadedFonts[fontPath]) {
                loadedFonts[fontPath] = await Jimp.loadFont(fontPath);
            }
        }

        // وظيفة مساعدة لكتابة النص وتطبيق اللون والمحاذاة
        const printText = (img, font, textData, textContent, imgWidth, imgHeight) => {
            const { x, y, alignment, maxWidth, color } = textData;
            
            const textOptions = {
                text: textContent,
                alignmentX: alignment,
                maxWidth: maxWidth
            };

            let finalX = x;

            if (alignment === Jimp.FONT_ALIGN_CENTER) {
                const textWidth = Jimp.measureText(font, textContent, maxWidth);
                if (maxWidth && textWidth > maxWidth) {
                    finalX = (imgWidth / 2) - (maxWidth / 2);
                } else {
                    finalX = (imgWidth / 2) - (textWidth / 2);
                }
            } else if (alignment === Jimp.FONT_ALIGN_RIGHT) {
                // Jimp لا يتعامل جيدًا مع المحاذاة لليمين للنص العربي مباشرة
                // لذا يفضل استخدام FONT_ALIGN_CENTER أو FONT_ALIGN_LEFT وتحديد x يدوياً
                // أو تحديد maxWidth والاعتماد على Jimp لعمل wrap
            }

            // لطباعة النص بلون محدد، يمكن استخدام هذا الأسلوب:
            // Jimp.print() يقوم بطباعة النص بلونه الأصلي (الموجود في ملف الـ PNG الخاص بالخط).
            // إذا أردت تغيير اللون، يجب أن يكون ملف الخط (.fnt/.png) نفسه بالأبيض أو الرمادي الشفاف،
            // ثم يمكنك تطبيق اللون على المنطقة قبل الطباعة.
            // ولكن الطريقة الأكثر شيوعًا مع Jimp هي أن الخط نفسه يكون ملونًا أو ألفا فقط.
            // إذا كان خطك باللون الأسود، سيبقى أسود. إذا كان أبيض، يمكنك جعله أي لون.
            // الكود التالي لتلوين الخطوط البيضاء:
            // img.composite(
            //     new Jimp(Jimp.measureText(font, textContent, maxWidth), Jimp.measureTextHeight(font, textContent, maxWidth), color),
            //     finalX, y,
            //     {
            //         mode: Jimp.BLEND_SOURCE_OVER,
            //         opacitySource: 1,
            //         opacityDest: 1
            //     }
            // ).print(font, finalX, y, textOptions, imgWidth, imgHeight);

            // لتجنب التعقيد، سأفترض أن الخط نفسه (الملف الذي ولّدته) تم إنشاؤه باللون المطلوب أو أبيض يمكن تلوينه لاحقًا.
            // Jimp.print سيستخدم اللون الأصلي للخط من ملف الـ PNG الخاص بالخط.
            // إذا كنت تريد تطبيق لون ثابت، فمن الأفضل توليد الخط نفسه باللون الأبيض في BMFont، ثم يمكنك استخدام
            // image.color([ { apply: 'xor', params: [ color ] } ]);
            // لكن هذا يؤثر على الصورة كلها، لذا أفضل إزالة هذا السطر هنا.

            img.print(font, finalX, y, textOptions, imgWidth, imageHeight);
        };

        // طباعة اسم الطالب
        printText(image, loadedFonts[TEXT_POSITIONS.STUDENT_NAME.fontPath], TEXT_POSITIONS.STUDENT_NAME, studentNameArabic, imageWidth, imageHeight);

        // طباعة الرقم التسلسلي
        printText(image, loadedFonts[TEXT_POSITIONS.SERIAL_NUMBER.fontPath], TEXT_POSITIONS.SERIAL_NUMBER, serialNumber, imageWidth, imageHeight);

        // طباعة رقم المستند التسلسلي
        printText(image, loadedFonts[TEXT_POSITIONS.DOCUMENT_SERIAL_NUMBER.fontPath], TEXT_POSITIONS.DOCUMENT_SERIAL_NUMBER, documentSerialNumber, imageWidth, imageHeight);

        // طباعة رقم اللوحة
        printText(image, loadedFonts[TEXT_POSITIONS.PLATE_NUMBER.fontPath], TEXT_POSITIONS.PLATE_NUMBER, `رقم اللوحة: ${plateNumber}`, imageWidth, imageHeight);

        // طباعة نوع السيارة
        printText(image, loadedFonts[TEXT_POSITIONS.CAR_TYPE.fontPath], TEXT_POSITIONS.CAR_TYPE, `نوع السيارة: ${carType}`, imageWidth, imageHeight);

        // طباعة اللون
        printText(image, loadedFonts[TEXT_POSITIONS.COLOR.fontPath], TEXT_POSITIONS.COLOR, `اللون: ${color}`, imageWidth, imageHeight);

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