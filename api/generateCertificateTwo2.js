// C:\wamp64\www\simple-student-app\api\generateCertificateTwo2.js

import { MongoClient, ObjectId } from 'mongodb';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

// *** الاستيراد الصحيح بمسار مطلق (@) وأسماء دوال صحيحة (حرف A كبير) ***
import { registerArabicFonts, createArabicTextWithCanvas, ARABIC_FONTS } from '@/utils/imageUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uri = process.env.MONGODB_URI;
const dbName = 'Cluster0';
const collectionName = 'enrolled_students_tbl';

// تأكد من أن المسار صحيح لصورتك
const CERTIFICATE_IMAGE_PATH = path.join(process.cwd(), 'public', 'images', 'full', 'wwee.jpg');

// Constants for text positions and colors (من الكود الأصلي الذي كان يعمل لديك)
const CERTIFICATE_TEXT_POSITIONS = {
    STUDENT_NAME: {
        text: "اسم الطالب: ",
        y: 400, // الموضع العمودي للنص
        fontSize: 45,
        color: "#000000",
    },
    COURSE_NAME: {
        text: "الدورة: ",
        y: 500,
        fontSize: 35,
        color: "#000000",
    },
    WELCOME_MESSAGE: {
        text: "بكل فخر نقدم هذه الشهادة للطالب المتميز:",
        y: 300,
        fontSize: 30,
        color: "#34495E",
    },
    DATE_MESSAGE: {
        text: "بتاريخ: " + new Date().toLocaleDateString('ar-SA'),
        y: 600,
        fontSize: 25,
        color: "#555555",
    }
};

export const config = {
    maxDuration: 30, // 30 seconds timeout for Vercel
};

export default async function handler(req, res) {
    console.log('--- بدأ تنفيذ دالة generateCertificateTwo2 (باستخدام Canvas لتركيب النصوص) ---');
    res.setHeader("X-Debug-Info", "Certificate Generation API");

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
        // تسجيل الخطوط في بداية الدالة
        await registerArabicFonts(); // تم تغيير هذه الدالة لتصبح async في imageUtils
        console.log('تم تسجيل الخطوط العربية.');

        console.log('جارٍ الاتصال بقاعدة البيانات...');
        // الخيارات useNewUrlParser و useUnifiedTopology لم تعد ضرورية في الإصدارات الحديثة
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

        const baseImageBuffer = await sharp(CERTIFICATE_IMAGE_PATH).toBuffer();
        const metadata = await sharp(baseImageBuffer).metadata();
        const imageWidth = metadata.width;
        const imageHeight = metadata.height;
        console.log('أبعاد الصورة الأساسية التي تم تحميلها:', imageWidth, 'x', imageHeight);

        const textBuffersToComposite = [];

        // استخدام student.name_arabic و student.course_name مباشرة
        const studentFullName = student.name_arabic || 'غير متوفر'; // أو student.name حسب حقل قاعدة البيانات الفعلي
        const courseActualName = student.course_name || 'غير متوفر';

        // استخدام createArabicTextWithCanvas مع الأسلوب الجديد الذي يستخدم الكائن options
        // وتغيير الخط هنا حسب ما هو معرف في ARABIC_FONTS الجديد.
        // يمكن استخدام Noto Sans Arabic إذا كان الخط لا يزال مفضلاً.
        const welcomeMessageTextBuffer = await createArabicTextWithCanvas({
            text: CERTIFICATE_TEXT_POSITIONS.WELCOME_MESSAGE.text,
            fontSize: CERTIFICATE_TEXT_POSITIONS.WELCOME_MESSAGE.fontSize,
            font: ARABIC_FONTS.ARABIC_REGULAR, // استخدام الخط الجديد، تأكد من تسميته في imageUtils
            color: CERTIFICATE_TEXT_POSITIONS.WELCOME_MESSAGE.color,
            width: 800,
            height: 50,
            textAlign: "center"
        });
        textBuffersToComposite.push({
            input: welcomeMessageTextBuffer,
            left: (imageWidth / 2) - (800 / 2),
            top: CERTIFICATE_TEXT_POSITIONS.WELCOME_MESSAGE.y - (50 / 2),
        });
        console.log(`✅ تم إنشاء صورة نص لرسالة الترحيب`);

        const studentNameTextBuffer = await createArabicTextWithCanvas({
            text: studentFullName,
            fontSize: CERTIFICATE_TEXT_POSITIONS.STUDENT_NAME.fontSize,
            font: ARABIC_FONTS.ARABIC_BOLD, // استخدام الخط الجديد
            color: CERTIFICATE_TEXT_POSITIONS.STUDENT_NAME.color,
            width: 700,
            height: 60,
            textAlign: "center"
        });
        textBuffersToComposite.push({
            input: studentNameTextBuffer,
            left: (imageWidth / 2) - (700 / 2),
            top: CERTIFICATE_TEXT_POSITIONS.STUDENT_NAME.y - (60 / 2),
        });
        console.log(`✅ تم إنشاء صورة نص لاسم الطالب: "${studentFullName}"`);

        const courseNameTextBuffer = await createArabicTextWithCanvas({
            text: courseActualName,
            fontSize: CERTIFICATE_TEXT_POSITIONS.COURSE_NAME.fontSize,
            font: ARABIC_FONTS.ARABIC_REGULAR, // استخدام الخط الجديد
            color: CERTIFICATE_TEXT_POSITIONS.COURSE_NAME.color,
            width: 600,
            height: 50,
            textAlign: "center"
        });
        textBuffersToComposite.push({
            input: courseNameTextBuffer,
            left: (imageWidth / 2) - (600 / 2),
            top: CERTIFICATE_TEXT_POSITIONS.COURSE_NAME.y - (50 / 2),
        });
        console.log(`✅ تم إنشاء صورة نص لاسم الدورة: "${courseActualName}"`);

        const dateMessageTextBuffer = await createArabicTextWithCanvas({
            text: CERTIFICATE_TEXT_POSITIONS.DATE_MESSAGE.text,
            fontSize: CERTIFICATE_TEXT_POSITIONS.DATE_MESSAGE.fontSize,
            font: ARABIC_FONTS.ARABIC_REGULAR, // استخدام الخط الجديد
            color: CERTIFICATE_TEXT_POSITIONS.DATE_MESSAGE.color,
            width: 300,
            height: 40,
            textAlign: "right"
        });
        textBuffersToComposite.push({
            input: dateMessageTextBuffer,
            left: imageWidth - 300 - 50, // 50 بكسل من الحافة اليمنى
            top: CERTIFICATE_TEXT_POSITIONS.DATE_MESSAGE.y - (40 / 2),
        });
        console.log(`✅ تم إنشاء صورة نص للتاريخ`);

        console.log('🔄 جارٍ تركيب جميع النصوص على الصورة الأساسية...');
        const finalImageBuffer = await sharp(baseImageBuffer)
            .composite(textBuffersToComposite)
            .jpeg({ quality: 85, progressive: true })
            .toBuffer();
        console.log('✅ تم تركيب جميع النصوص وإنشاء الصورة النهائية.');

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