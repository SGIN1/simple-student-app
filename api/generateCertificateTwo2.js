import { MongoClient, ObjectId } from 'mongodb';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

const uri = process.env.MONGODB_URI;
const dbName = 'Cluster0';
const collectionName = 'enrolled_students_tbl';

const CERTIFICATE_IMAGE_PATH = path.join(process.cwd(), 'public', 'images', 'full', 'wwee.jpg');

const FONT_FILENAME = 'arial.ttf';
const FONT_PATH = path.join(process.cwd(), 'public', 'fonts', FONT_FILENAME);

const FONT_CSS_FAMILY_NAME = 'Arial';

const RED_COLOR_HEX = '#FF0000';
const BLUE_COLOR_HEX = '#0000FF';
const GREEN_COLOR_HEX = '#00FF00';
const BLACK_COLOR_HEX = '#000000';

const CERTIFICATE_TEXT_POSITIONS = {
    GREETING1: {
        text: "أهلاً وسهلاً بكم!",
        x: 0,
        y: 80,
        fontSize: 40,
        color: RED_COLOR_HEX,
        gravity: 'center'
    },
    GREETED_NAME: {
        text: "اسم الطالب هنا", // هذا سيتم استبداله باسم الطالب
        x: 0,
        y: 180,
        fontSize: 55,
        color: BLACK_COLOR_HEX,
        gravity: 'center'
    },
    GREETING2: {
        text: "نتمنى لكم يوماً سعيداً.",
        x: 50,
        y: 300,
        fontSize: 30,
        color: BLUE_COLOR_HEX,
        gravity: 'west'
    },
    GREETING3: {
        text: "شكراً لزيارتكم.",
        x: 0,
        y: 450,
        fontSize: 25,
        color: GREEN_COLOR_HEX,
        gravity: 'east'
    },
    // --- الحقول الجديدة من بيانات الطالب ---
    RESIDENCY_NUMBER: {
        label: "رقم الإقامة:",
        field: "residency_number",
        x: 100,
        y: 500, // اضبط هذا الموضع
        fontSize: 30,
        color: BLACK_COLOR_HEX,
        gravity: 'west'
    },
    SERIAL_NUMBER: {
        label: "الرقم التسلسلي:",
        field: "serial_number",
        x: 100,
        y: 550, // اضبط هذا الموضع
        fontSize: 30,
        color: BLACK_COLOR_HEX,
        gravity: 'west'
    },
    PLATE_NUMBER: {
        label: "رقم اللوحة:",
        field: "plate_number",
        x: 100,
        y: 600, // اضبط هذا الموضع
        fontSize: 30,
        color: BLACK_COLOR_HEX,
        gravity: 'west'
    },
    INSPECTION_DATE: {
        label: "تاريخ الفحص:",
        field: "inspection_date",
        x: 100,
        y: 650, // اضبط هذا الموضع
        fontSize: 30,
        color: BLACK_COLOR_HEX,
        gravity: 'west'
    },
    MANUFACTURER: {
        label: "الشركة الصانعة:",
        field: "manufacturer",
        x: 100,
        y: 700, // اضبط هذا الموضع
        fontSize: 30,
        color: BLACK_COLOR_HEX,
        gravity: 'west'
    },
    INSPECTION_EXPIRY_DATE: {
        label: "تاريخ انتهاء الفحص:",
        field: "inspection_expiry_date",
        x: 100,
        y: 750, // اضبط هذا الموضع
        fontSize: 30,
        color: BLACK_COLOR_HEX,
        gravity: 'west'
    },
    CAR_TYPE: {
        label: "نوع السيارة:",
        field: "car_type",
        x: 100,
        y: 800, // اضبط هذا الموضع
        fontSize: 30,
        color: BLACK_COLOR_HEX,
        gravity: 'west'
    },
    COUNTER_READING: {
        label: "قراءة العداد:",
        field: "counter_reading",
        x: 100,
        y: 850, // اضبط هذا الموضع
        fontSize: 30,
        color: BLACK_COLOR_HEX,
        gravity: 'west'
    },
    CHASSIS_NUMBER: {
        label: "رقم الهيكل:",
        field: "chassis_number",
        x: 100,
        y: 900, // اضبط هذا الموضع
        fontSize: 30,
        color: BLACK_COLOR_HEX,
        gravity: 'west'
    },
    VEHICLE_MODEL: {
        label: "طراز المركبة:",
        field: "vehicle_model",
        x: 100,
        y: 950, // اضبط هذا الموضع
        fontSize: 30,
        color: BLACK_COLOR_HEX,
        gravity: 'west'
    },
    COLOR: {
        label: "اللون:",
        field: "color",
        x: 100,
        y: 1000, // اضبط هذا الموضع
        fontSize: 30,
        color: BLACK_COLOR_HEX,
        gravity: 'west'
    },
    SERIAL_NUMBER_DUPLICATE: {
        label: "الرقم التسلسلي (مكرر):",
        field: "serial_number_duplicate",
        x: 100,
        y: 1050, // اضبط هذا الموضع
        fontSize: 30,
        color: BLACK_COLOR_HEX,
        gravity: 'west'
    },
    CREATED_AT: {
        label: "تاريخ الإضافة:",
        field: "created_at",
        x: 100,
        y: 1100, // اضبط هذا الموضع
        fontSize: 30,
        color: BLACK_COLOR_HEX,
        gravity: 'west'
    }
};

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

    const { id } = req.query;

    if (!id) {
        console.log('معرف الطالب غير موجود في الطلب.');
        return res.status(400).json({ error: 'معرف الطالب (ID) مطلوب.' });
    }

    let client;
    try {
        console.log('جارٍ الاتصال بقاعدة البيانات...');
        client = new MongoClient(uri);
        await client.connect();
        console.log('تم الاتصال بقاعدة البيانات بنجاح.');

        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        // *** التعديل الرئيسي هنا: استخدام ObjectId للبحث عن _id ***
        let student;
        try {
            const objectId = new ObjectId(id);
            student = await collection.findOne({ _id: objectId });
            console.log('تم البحث عن الطالب باستخدام _id:', objectId);
        } catch (e) {
            console.error('خطأ في تحويل ID إلى ObjectId:', e.message);
            return res.status(400).json({ error: 'مُعرّف الطالب غير صالح. يجب أن يكون ObjectId صحيحًا.' });
        }
        // *** نهاية التعديل الرئيسي ***


        if (!student) {
            console.log('لم يتم العثور على طالب بالمعرف:', id);
            return res.status(404).json({ error: 'لم يتم العثور على طالب بهذا المعرف.' });
        }
        console.log('تم جلب بيانات الطالب:', student.residency_number);

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
            let textToDisplay = '';

            if (pos.field) {
                // استخدام قيمة الحقل مباشرة، مع fallback لـ '' إذا كانت undefined
                const fieldValue = student[pos.field] || '';
                // تنسيق تاريخ الإضافة إذا كان الحقل هو created_at
                if (pos.field === 'created_at' && fieldValue) {
                    textToDisplay = `${pos.label || ''} ${new Date(fieldValue).toLocaleDateString('ar-SA', { year: 'numeric', month: 'numeric', day: 'numeric' })}`;
                } else {
                    textToDisplay = `${pos.label || ''} ${fieldValue}`;
                }
            } else if (key === 'GREETED_NAME') {
                // استخدام حقل 'arabic_name' لاسم الطالب أو 'اسم الطالب غير متوفر' كافتراضي
                textToDisplay = `${student.arabic_name || 'اسم الطالب غير متوفر'}`;
            } else {
                textToDisplay = pos.text; // للنصوص الثابتة مثل GREETING1, GREETING2, GREETING3
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