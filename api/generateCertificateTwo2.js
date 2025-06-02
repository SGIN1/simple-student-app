import { MongoClient, ObjectId } from 'mongodb'; // هذه المكتبة الآن ستصبح ضرورية لجلب البيانات
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

// **ملاحظة هامة:** يجب تعريف MONGODB_URI كمتغير بيئة في Vercel
const uri = process.env.MONGODB_URI;
const dbName = 'Cluster0'; // تأكد من اسم قاعدة البيانات الصحيح
const collectionName = 'enrolled_students_tbl'; // تأكد من اسم الـ collection الصحيح

// مسار صورة الشهادة
const CERTIFICATE_IMAGE_PATH = path.join(process.cwd(), 'public', 'images', 'full', 'wwee.jpg'); // تأكد من أنه .jpg أو .png حسب ملفك الفعلي

// مسار الخط (Arial)
const FONT_FILENAME = 'arial.ttf';
const FONT_PATH = path.join(process.cwd(), 'public', 'fonts', FONT_FILENAME); // تأكد من وجود arial.ttf هنا

// اسم الخط للاستخدام في CSS (مهم لـ sharp.text())
const FONT_CSS_FAMILY_NAME = 'Arial';

// تعريف ألوان النصوص
const RED_COLOR_HEX = '#FF0000';
const BLUE_COLOR_HEX = '#0000FF';
const GREEN_COLOR_HEX = '#00FF00';
const BLACK_COLOR_HEX = '#000000';

// تعريف إحداثيات ومواصفات نصوص الترحيب والحقول الجديدة
// **هذه الإحداثيات (x, y) هي قيم تقديرية. يجب عليك تعديلها بعناية لتناسب تصميم شهادتك (wwee.jpg).**
const CERTIFICATE_TEXT_POSITIONS = {
    // نصوص الترحيب الحالية
    GREETING1: {
        text: "أهلاً وسهلاً بكم!",
        x: 0,
        y: 80, // هذا يجب أن يكون موضع y الذي تريده لـ GREETING1
        fontSize: 40,
        color: RED_COLOR_HEX,
        gravity: 'center'
    },
    GREETED_NAME: {
        text: "محمد أحمد علي", // هذا سيتم استبداله باسم الطالب
        x: 0,
        y: 180, // هذا يجب أن يكون موضع y الذي تريده للاسم
        fontSize: 55,
        color: BLACK_COLOR_HEX,
        gravity: 'center'
    },
    GREETING2: {
        text: "نتمنى لكم يوماً سعيداً.",
        x: 50, // هذا يجب أن يكون موضع x الذي تريده لـ GREETING2
        y: 300, // هذا يجب أن يكون موضع y الذي تريده لـ GREETING2
        fontSize: 30,
        color: BLUE_COLOR_HEX,
        gravity: 'west'
    },
    GREETING3: {
        text: "شكراً لزيارتكم.",
        x: 0, // هذا يجب أن يكون موضع x الذي تريده لـ GREETING3 (يتمركز على اليمين)
        y: 450, // هذا يجب أن يكون موضع y الذي تريده لـ GREETING3
        fontSize: 25,
        color: GREEN_COLOR_HEX,
        gravity: 'east'
    },
    // --- الحقول الجديدة من بيانات الطالب ---
    RESIDENCY_NUMBER: {
        label: "رقم الإقامة:",
        field: "residency_number", // اسم الحقل في قاعدة البيانات
        x: 100, // مثال لموضع الحقل، اضبطه حسب تصميمك
        y: 500, // مثال لموضع الحقل، اضبطه حسب تصميمك
        fontSize: 30,
        color: BLACK_COLOR_HEX,
        gravity: 'west'
    },
    SERIAL_NUMBER: {
        label: "الرقم التسلسلي:",
        field: "serial_number", // اسم الحقل في قاعدة البيانات
        x: 100,
        y: 550,
        fontSize: 30,
        color: BLACK_COLOR_HEX,
        gravity: 'west'
    },
    PLATE_NUMBER: {
        label: "رقم اللوحة:",
        field: "plate_number", // اسم الحقل في قاعدة البيانات
        x: 100,
        y: 600,
        fontSize: 30,
        color: BLACK_COLOR_HEX,
        gravity: 'west'
    },
    INSPECTION_DATE: {
        label: "تاريخ الفحص:",
        field: "inspection_date", // اسم الحقل في قاعدة البيانات
        x: 100,
        y: 650,
        fontSize: 30,
        color: BLACK_COLOR_HEX,
        gravity: 'west'
    }
    // يمكنك إضافة المزيد من الحقول هنا بنفس الطريقة
    // على سبيل المثال:
    // CAR_TYPE: {
    //     label: "نوع السيارة:",
    //     field: "car_type",
    //     x: 100,
    //     y: 700,
    //     fontSize: 30,
    //     color: BLACK_COLOR_HEX,
    //     gravity: 'west'
    // },
    // CHASSIS_NUMBER: {
    //     label: "رقم الهيكل:",
    //     field: "chassis_number",
    //     x: 100,
    //     y: 750,
    //     fontSize: 30,
    //     color: BLACK_COLOR_HEX,
    //     gravity: 'west'
    // }
};

/**
 * دالة مساعدة لإنشاء نص كـ Buffer لـ sharp باستخدام sharp.text().
 */
async function createSharpTextBuffer(text, fontSize, color, svgWidth, svgHeight, gravity, fontCssFamilyName) {
    let align = 'centre';
    if (gravity === 'west') {
        align = 'left';
    } else if (gravity === 'east') {
        align = 'right';
    }

    return sharp({
        text: {
            text: `<span foreground="${color}">${text}</span>`,
            font: fontCssFamilyName,
            fontfile: FONT_PATH,
            width: svgWidth,
            height: svgHeight,
            align: align,
            rgba: true
        }
    }).png().toBuffer();
}


export default async function handler(req, res) {
    console.log('--- بدأ تنفيذ دالة generateCertificateTwo2 ---');

    if (req.method !== 'GET') {
        console.log('طلب غير مسموح به:', req.method);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { id } = req.query; // جلب الـ ID من URL

    if (!id) {
        console.log('معرف الطالب غير موجود في الطلب.');
        return res.status(400).json({ error: 'معرف الطالب (ID) مطلوب.' });
    }

    let client;
    try {
        // 1. الاتصال بقاعدة البيانات وجلب بيانات الطالب
        console.log('جارٍ الاتصال بقاعدة البيانات...');
        client = new MongoClient(uri);
        await client.connect();
        console.log('تم الاتصال بقاعدة البيانات بنجاح.');

        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        // جلب الطالب باستخدام الـ ID. تأكد أن الـ ID في MongoDB هو ObjectId إذا كان هذا هو نوعه.
        // إذا كان ID في MongoDB هو string عادي، استخدم { id: id }
        const student = await collection.findOne({ id: id }); // افتراض أن الـ ID هو string

        if (!student) {
            console.log('لم يتم العثور على طالب بالمعرف:', id);
            return res.status(404).json({ error: 'لم يتم العثور على طالب بهذا المعرف.' });
        }
        console.log('تم جلب بيانات الطالب:', student.residency_number);


        // 2. التحقق من وجود صورة الشهادة
        console.log('جارٍ التحقق من صورة الشهادة...');
        try {
            await fs.access(CERTIFICATE_IMAGE_PATH);
            console.log('صورة الشهادة موجودة.', CERTIFICATE_IMAGE_PATH);
        } catch (fileError) {
            console.error('خطأ: صورة الشهادة غير موجودة أو لا يمكن الوصول إليها:', fileError.message);
            return res.status(500).json({
                error: 'صورة الشهادة غير موجودة أو لا يمكن الوصول إليها. يرجى التحقق من مسار ملف الصورة في النشر.',
                details: fileError.message,
                path: CERTIFICATE_IMAGE_PATH
            });
        }

        console.log('جارٍ معالجة الصورة الأساسية...');
        const baseImage = sharp(CERTIFICATE_IMAGE_PATH);
        const metadata = await baseImage.metadata();
        const imageWidth = metadata.width;
        const imageHeight = metadata.height;
        console.log('أبعاد الصورة:', imageWidth, 'x', imageHeight);

        let processedImage = baseImage;

        console.log('جارٍ التحقق من ملف الخط...');
        try {
            await fs.access(FONT_PATH);
            console.log('ملف الخط موجود في المسار المحدد:', FONT_PATH);
        } catch (fontError) {
            console.error('خطأ: ملف الخط غير موجود أو لا يمكن الوصول إليه:', fontError.message);
            return res.status(500).json({
                error: 'ملف الخط غير موجود أو لا يمكن الوصول إليه. يرجى التأكد من وضعه في المسار الصحيح وتضمينه في النشر.',
                details: fontError.message,
                path: FONT_PATH
            });
        }

        console.log('جارٍ إضافة النصوص إلى الصورة...');
        for (const key in CERTIFICATE_TEXT_POSITIONS) {
            const pos = CERTIFICATE_TEXT_POSITIONS[key];
            let textToDisplay = pos.text; // النص الافتراضي لنصوص الترحيب

            // إذا كان هذا الحقل هو من بيانات الطالب، قم باستبدال النص
            if (pos.field && student[pos.field]) {
                textToDisplay = `${pos.label || ''} ${student[pos.field]}`;
            } else if (key === 'GREETED_NAME') {
                // يمكنك جلب الاسم من بيانات الطالب هنا.
                // سأفترض أن لديك حقل 'name' أو 'student_name' في بيانات الطالب.
                // إذا لم يكن كذلك، يرجى إخباري باسم الحقل الصحيح.
                textToDisplay = `الاسم: ${student.student_name || 'اسم الطالب غير متوفر'}`;
                // يمكنك أيضًا تحديد الاسم الكامل للطالب إذا كانت البيانات مفصولة
                // textToDisplay = `${student.first_name || ''} ${student.middle_name || ''} ${student.last_name || ''}`.trim();
            }

            const textHeight = pos.fontSize * 2; // ضعف حجم الخط كارتفاع تقريبي للمربع

            console.log(`إنشاء نص لـ: ${key} بـ: ${textToDisplay}`);

            const textOverlayBuffer = await createSharpTextBuffer(
                textToDisplay,
                pos.fontSize,
                pos.color,
                imageWidth,
                textHeight,
                pos.gravity,
                FONT_CSS_FAMILY_NAME
            );
            console.log(`تم إنشاء Buffer للنص ${key}`);

            processedImage = await processedImage.composite([{
                input: textOverlayBuffer,
                left: pos.x,
                top: pos.y,
            }]);
            console.log(`تم تركيب النص ${key}`);
        }

        console.log('جارٍ إنشاء الصورة النهائية...');
        const finalImageBuffer = await processedImage
            .flatten({ background: { r: 255, g: 255, b: 255, alpha: 1 } })
            .jpeg({
                quality: 85,
                progressive: true
            }).toBuffer();
        console.log('تم إنشاء الصورة النهائية.');

        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');
        console.log('تم إرسال الصورة بنجاح.');
        return res.status(200).send(finalImageBuffer);

    } catch (error) {
        console.error('خطأ عام في وظيفة generateCertificateTwo2 (داخل catch):', error);
        console.error('تتبع الخطأ (داخل catch):', error.stack);

        if (error.message.includes('fontconfig') || error.message.includes('freetype')) {
            return res.status(500).json({
                error: 'حدث خطأ في معالجة الخطوط (Fontconfig/FreeType). يرجى التأكد من أن الخطوط المستخدمة مدعومة بشكل كامل في بيئة Vercel.',
                details: error.message,
                stack: error.stack
            });
        } else if (error.message.includes('Input file is missing')) {
            return res.status(500).json({
                error: 'ملف الصورة الأساسي غير موجود أو لا يمكن الوصول إليه.',
                details: error.message
            });
        }
        return res.status(500).json({
            error: 'حدث خطأ غير متوقع أثناء معالجة الشهادة.',
            details: error.message,
            stack: error.stack
        });
    } finally {
        if (client) {
            await client.close();
            console.log('تم إغلاق اتصال قاعدة البيانات.');
        }
    }
}