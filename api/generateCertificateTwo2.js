// C:\wamp64\www\simple-student-app\api\generateCertificateTwo2.js

import { MongoClient, ObjectId } from 'mongodb';
import sharp from 'sharp'; // Sharp لا يزال مطلوبًا لتحميل الصورة الأساسية وتركيب النصوص
import path from 'path';
import fs from 'fs/promises'; // استخدم fs.promises لضمان async/await
import { fileURLToPath } from 'url';

// استيراد الدوال الجديدة من imageUtils.js
import { registerArabicFonts, generateCertificateWithArabicText, ARABIC_FONTS } from '../../utils/imageUtils.js';

// تحديد __dirname و __filename بشكل صحيح لـ ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uri = process.env.MONGODB_URI;
const dbName = 'Cluster0';
const collectionName = 'enrolled_students_tbl';

// تأكد أن هذا هو المسار الصحيح لصورة الشهادة في مجلد public
const CERTIFICATE_IMAGE_PATH = path.join(process.cwd(), 'public', 'images', 'full', 'wwee.jpg');

const RED_COLOR_HEX = '#FF0000'; // مثال للون

// المواقع والنصوص المراد إضافتها للشهادة
// ملاحظة: مع استخدام Canvas، الموضع (y) هنا سيكون هو الموضع الكلي لكتلة النص على الصورة الأساسية،
// وليس موضع كل سطر داخل الـ SVG كما كان سابقًا.
const CERTIFICATE_TEXT_POSITIONS = {
    STUDENT_NAME: {
        text: "اسم الطالب: ", // سيتم دمج اسم الطالب هنا
        y: 400, // مثال لموضع اسم الطالب
        fontSize: 45,
        color: "#000000", // لون داكن
    },
    COURSE_NAME: {
        text: "الدورة: ", // سيتم دمج اسم الدورة هنا
        y: 500, // مثال لموضع اسم الدورة
        fontSize: 35,
        color: "#000000",
    },
    WELCOME_MESSAGE: {
        text: "بكل فخر نقدم هذه الشهادة للطالب المتميز:",
        y: 300, // رسالة ترحيب قبل الاسم
        fontSize: 30,
        color: "#34495E", // لون أزرق داكن
    },
    DATE_MESSAGE: {
        text: "بتاريخ: " + new Date().toLocaleDateString('ar-SA'), // تاريخ اليوم
        y: 600, // موضع التاريخ
        fontSize: 25,
        color: "#555555",
    }
};

export default async function handler(req, res) {
    console.log('--- بدأ تنفيذ دالة generateCertificateTwo2 (باستخدام Canvas لتركيب النصوص) ---');

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

        let student;
        try {
            const objectId = new ObjectId(id);
            student = await collection.findOne({ _id: objectId });
            console.log('تم البحث عن الطالب باستخدام _id:', objectId);
        } catch (e) {
            console.error('خطأ في تحويل ID إلى ObjectId:', e.message);
            return res.status(400).json({ error: 'مُعرّف الطالب غير صالح. يجب أن يكون ObjectId صحيحًا.' });
        }

        if (!student) {
            console.log('لم يتم العثور على طالب بالمعرف:', id);
            return res.status(404).json({ error: 'لم يتم العثور على طالب بهذا المعرف.' });
        }
        console.log('تم جلب بيانات الطالب:', JSON.stringify(student, null, 2));

        // **هام:** تحقق من وجود صورة الشهادة الأساسية
        console.log('جارٍ التحقق من صورة الشهادة الأساسية...');
        try {
            await fs.access(CERTIFICATE_IMAGE_PATH);
            console.log('صورة الشهادة موجودة في المسار:', CERTIFICATE_IMAGE_PATH);
        } catch (fileError) {
            console.error('خطأ: صورة الشهادة غير موجودة أو لا يمكن الوصول إليها:', fileError.message);
            return res.status(500).json({
                error: 'صورة الشهادة الأساسية غير موجودة أو لا يمكن الوصول إليها. يرجى التحقق من مسار ملف الصورة.',
                details: fileError.message,
                path: CERTIFICATE_IMAGE_PATH
            });
        }

        // قراءة الصورة الأساسية مرة واحدة
        const baseImageBuffer = await sharp(CERTIFICATE_IMAGE_PATH).toBuffer();
        const metadata = await sharp(baseImageBuffer).metadata();
        const imageWidth = metadata.width;
        const imageHeight = metadata.height;
        console.log('أبعاد الصورة الأساسية التي تم تحميلها:', imageWidth, 'x', imageHeight);

        // قم بتسجيل الخطوط (يمكن وضعها هنا أو في ملف imageUtils نفسه)
        // registerArabicFonts(); // هذه الدالة يتم استدعاؤها داخل createArabicTextWithCanvas


        let processedImage = sharp(baseImageBuffer);
        const textBuffersToComposite = [];

        // معالجة النصوص وتركيبها
        // يمكنك تعديل هذه الأمثلة لتناسب تصميم شهادتك
        const textFields = [
            { key: 'WELCOME_MESSAGE', text: CERTIFICATE_TEXT_POSITIONS.WELCOME_MESSAGE.text },
            { key: 'STUDENT_NAME', text: `${CERTIFICATE_TEXT_POSITIONS.STUDENT_NAME.text}${student.name_arabic || 'غير متوفر'}` },
            { key: 'COURSE_NAME', text: `${CERTIFICATE_TEXT_POSITIONS.COURSE_NAME.text}${student.course_name || 'غير متوفر'}` },
            { key: 'DATE_MESSAGE', text: CERTIFICATE_TEXT_POSITIONS.DATE_MESSAGE.text }
        ];

        for (const field of textFields) {
            const pos = CERTIFICATE_TEXT_POSITIONS[field.key];
            if (pos) {
                console.log(`🔄 إنشاء نص: "${field.text}" لـ ${field.key}`);

                // عرض منطقة النص الافتراضية
                const textRenderWidth = imageWidth; // يمكن للنص أن يمتد على عرض الصورة
                const textRenderHeight = pos.fontSize * 2; // ارتفاع كافٍ للنص

                const textBuffer = await generateCertificateWithArabicText(
                    // لا تحتاج ل baseImagePath هنا لأننا نستخدم createArabicTextWithCanvas مباشرة
                    // ولكننا نمرر النص والخيارات
                    '', // لا تحتاج لمسار الصورة الأساسية هنا
                    field.text,
                    {
                        fontSize: pos.fontSize,
                        fontFamily: ARABIC_FONTS.arial, // استخدم الخط الذي سجلناه
                        color: pos.color,
                        textWidth: textRenderWidth,
                        textHeight: textRenderHeight,
                        position: { left: 0, top: pos.y } // الموضع الفعلي سيتم تحديده لاحقًا في composite
                    }
                );
                console.log(`✅ تم إنشاء صورة النص لـ ${field.key}`);

                textBuffersToComposite.push({
                    input: textBuffer,
                    // position: { left: 0, top: pos.y } // هذا ليس الموضع النهائي للـ SVG
                    left: 0, // وضع الـ buffer من أقصى اليسار
                    top: pos.y, // موضع Y على الصورة الأساسية
                    // blend: 'overlay' // استخدم blend: 'over' أو لا تحددها
                });
            }
        }

        // تركيب جميع صور النصوص على الصورة الأساسية
        console.log('🔄 جارٍ تركيب جميع النصوص على الصورة الأساسية...');
        processedImage = await sharp(baseImageBuffer).composite(textBuffersToComposite);
        console.log('✅ تم تركيب جميع النصوص.');

        console.log('جارٍ إنشاء الصورة النهائية...');
        const finalImageBuffer = await processedImage
            .flatten({ background: { r: 255, g: 255, b: 255, alpha: 1 } }) // للتأكد من عدم وجود شفافية
            .jpeg({ quality: 85, progressive: true })
            .toBuffer();
        console.log('تم إنشاء الصورة النهائية.');

        // إرسال الصورة النهائية كاستجابة
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');
        console.log('تم إرسال الصورة بنجاح.');
        return res.status(200).send(finalImageBuffer);

    } catch (error) {
        console.error('❌ خطأ عام في وظيفة generateCertificateTwo2:', error);
        console.error('❌ تتبع الخطأ:', error.stack);

        res.status(500).json({
            error: 'حدث خطأ غير متوقع أثناء معالجة الشهادة.',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    } finally {
        if (client) {
            await client.close();
            console.log('تم إغلاق اتصال قاعدة البيانات.');
        }
    }
}