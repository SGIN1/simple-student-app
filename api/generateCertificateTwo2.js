// C:\wamp64\www\simple-student-app\api\generateCertificateTwo2.js

import { MongoClient, ObjectId } from 'mongodb';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url'; // استيراد fileURLToPath

// تحديد __dirname و __filename بشكل صحيح لـ ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// **هذا هو سطر الاستيراد المصحح باستخدام المسار المطلق:**
// نستخدم path.join لإنشاء مسار موثوق به من الدليل الحالي (api) للوصول إلى utils
import { ARABIC_FONTS, createArabicTextSVG } from path.join(__dirname, '../utils/imageUtils.js');

const uri = process.env.MONGODB_URI;
const dbName = 'Cluster0';
const collectionName = 'enrolled_students_tbl';

// تأكد أن هذا هو المسار الصحيح لصورة الشهادة في مجلد public
const CERTIFICATE_IMAGE_PATH = path.join(process.cwd(), 'public', 'images', 'full', 'wwee.jpg');

const RED_COLOR_HEX = '#FF0000';

// المواقع والنصوص المراد إضافتها للشهادة
const CERTIFICATE_TEXT_POSITIONS = {
    WELCOME_TEXT_TOP: {
        text: "أهلاً وسهلاً بكم في هذا الاختبار!",
        y: 100, // الموضع العمودي للنص (من أعلى الصورة)
        fontSize: 35,
        color: RED_COLOR_HEX,
        textAlign: 'center' // المحاذاة الأفقية للنص داخل الـ SVG
    },
    WELCOME_TEXT_BOTTOM: {
        text: "نأمل أن تظهر النصوص الآن بوضوح.",
        y: 150,
        fontSize: 30,
        color: RED_COLOR_HEX,
        textAlign: 'center'
    }
};

export default async function handler(req, res) {
    console.log('--- بدأ تنفيذ دالة generateCertificateTwo2 (باستخدام SVG للنصوص) ---');

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


        console.log('جارٍ التحقق من صورة الشهادة الأساسية...');
        try {
            await fs.access(CERTIFICATE_IMAGE_PATH); // التحقق من وجود ملف الصورة
            console.log('صورة الشهادة موجودة في المسار:', CERTIFICATE_IMAGE_PATH);
        } catch (fileError) {
            console.error('خطأ: صورة الشهادة غير موجودة أو لا يمكن الوصول إليها:', fileError.message);
            return res.status(500).json({
                error: 'صورة الشهادة الأساسية غير موجودة أو لا يمكن الوصول إليها. يرجى التحقق من مسار ملف الصورة وتضمينه في النشر.',
                details: fileError.message,
                path: CERTIFICATE_IMAGE_PATH
            });
        }

        console.log('جارٍ تحميل الصورة الأساسية ومعالجة أبعادها...');
        const baseImage = sharp(CERTIFICATE_IMAGE_PATH);
        const metadata = await baseImage.metadata();
        const imageWidth = metadata.width;
        const imageHeight = metadata.height;
        console.log('أبعاد الصورة الفعلية التي تم تحميلها:', imageWidth, 'x', imageHeight);

        // تحذير في حال كانت أبعاد الصورة غير مطابقة للتوقعات
        if (imageWidth !== 978 || imageHeight !== 1280) {
            console.warn(`تحذير: أبعاد الصورة الفعلية (${imageWidth}x${imageHeight}) لا تتطابق مع الأبعاد المتوقعة (978x1280). قد يؤثر هذا على موضع النصوص.`);
        }

        let processedImage = baseImage;

        console.log('جارٍ إضافة النصوص إلى الصورة باستخدام SVG...');
        const fieldsToDisplay = ['WELCOME_TEXT_TOP', 'WELCOME_TEXT_BOTTOM'];

        for (const key of fieldsToDisplay) {
            const pos = CERTIFICATE_TEXT_POSITIONS?.[key];
            if (pos) {
                const textToDisplay = pos.text;
                // تحديد ارتفاع الـ SVG بحيث يكون كافياً للنص مع بعض الهامش العلوي والسفلي
                const svgHeight = (pos.fontSize || 30) * 1.5;
                const yPosition = pos.y || 0; // الموضع الرأسي للنص على الصورة الأساسية

                console.log(`إنشاء SVG للنص: ${key} بـ: "${textToDisplay}" عند Y: ${yPosition}`);

                // إنشاء الـ SVG للنص وتحويله إلى Buffer
                const svgTextBuffer = Buffer.from(createArabicTextSVG(textToDisplay, {
                    width: imageWidth, // اجعل عرض الـ SVG مساوياً لعرض الصورة الأساسية لسهولة التوسيط
                    height: svgHeight,
                    fontSize: pos.fontSize,
                    fontFamily: ARABIC_FONTS.noto, // هذا الآن يستخدم كمعرف فقط وليس لجلب الخط
                    color: pos.color,
                    textAlign: pos.textAlign // استخدم textAlign لتحديد المحاذاة داخل الـ SVG
                }));

                console.log(`تم إنشاء Buffer SVG للنص ${key}`);

                // تركيب الـ SVG (الذي يمثل النص) على الصورة الأساسية
                processedImage = await processedImage.composite([{
                    input: svgTextBuffer,
                    left: 0, // ضع الـ SVG من أقصى اليسار، والمحاذاة الأفقية للنص تتم داخل الـ SVG نفسه (باستخدام text-anchor)
                    top: yPosition, // ضع الـ SVG عند الموضع Y المطلوب على الصورة الأساسية
                }]);
                console.log(`تم تركيب النص ${key}`);
            }
        }

        console.log('جارٍ إنشاء الصورة النهائية...');
        const finalImageBuffer = await processedImage
            .flatten({ background: { r: 255, g: 255, b: 255, alpha: 1 } }) // للتأكد من عدم وجود شفافية في الصورة النهائية
            .jpeg({
                quality: 85, // جودة الصورة النهائية (بين 0 و 100)
                progressive: true // تحميل تدريجي للصورة (أفضل للويب)
            }).toBuffer();
        console.log('تم إنشاء الصورة النهائية.');

        // إرسال الصورة النهائية كاستجابة
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate'); // تحسينات ذاكرة التخزين المؤقت
        console.log('تم إرسال الصورة بنجاح.');
        return res.status(200).send(finalImageBuffer);

    } catch (error) {
        console.error('خطأ عام في وظيفة generateCertificateTwo2 (داخل catch):', error);
        console.error('تتبع الخطأ (داخل catch):', error.stack);

        // رسائل خطأ أكثر تحديداً لمساعدتك في التصحيح
        if (error.message.includes('expected positive integer for text.height')) {
            return res.status(500).json({
                error: 'خطأ في معالجة أبعاد النص. قد يكون بسبب قيمة ارتفاع النص غير الصحيحة (عشري بدلاً من صحيح).',
                details: error.message,
                stack: error.stack
            });
        }
        // هذا الجزء قد يظل مهماً إذا كانت هناك مشكلة في Sharp نفسها وليس فقط الخط
        else if (error.message.includes('fontconfig') || error.message.includes('freetype') || error.message.includes('VIPS_WARNING') || error.message.includes('pango')) {
            return res.status(500).json({
                error: 'حدث خطأ في معالجة الخطوط (Fontconfig/FreeType/VIPS/Pango). بالرغم من تضمين الخط، قد تكون هناك مشكلة أخرى في بيئة Sharp.',
                details: error.message,
                stack: error.stack
            });
        } else if (error.message.includes('Input file is missing') || error.code === 'ENOENT') {
            return res.status(500).json({
                error: 'ملف الصورة الأساسي غير موجود أو لا يمكن الوصول إليه. يرجى التحقق من مسار CERTIFICATE_IMAGE_PATH.',
                details: error.message,
                path: CERTIFICATE_IMAGE_PATH
            });
        }
        // خطأ عام غير متوقع
        return res.status(500).json({
            error: 'حدث خطأ غير متوقع أثناء معالجة الشهادة.',
            details: error.message,
            stack: error.stack
        });
    } finally {
        // إغلاق اتصال قاعدة البيانات في كل الأحوال
        if (client) {
            await client.close();
            console.log('تم إغلاق اتصال قاعدة البيانات.');
        }
    }
}