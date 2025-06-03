// your-project-root/pages/api/generateCertificateTwo2.js

import { MongoClient, ObjectId } from 'mongodb';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

// **مهم جدًا:** تأكد من أن المسار هنا صحيح لملف imageUtils.ts
// افترضنا هنا أن ملف generateCertificateTwo2.js موجود في 'pages/api/'
// وأن ملف imageUtils.ts موجود في 'utils/' في جذر المشروع.
import { ARABIC_FONTS, createArabicTextSVG } from '../../utils/imageUtils';

const uri = process.env.MONGODB_URI;
const dbName = 'Cluster0';
const collectionName = 'enrolled_students_tbl';

// تأكد أن هذا هو المسار الصحيح لصورتك
const CERTIFICATE_IMAGE_PATH = path.join(process.cwd(), 'public', 'images', 'full', 'wwee.jpg');

const RED_COLOR_HEX = '#FF0000'; 

// المواقع الجديدة للنصين الترحيبيين بناءً على أبعاد الصورة 978x1280
const CERTIFICATE_TEXT_POSITIONS = {
    WELCOME_TEXT_TOP: {
        text: "أهلاً وسهلاً بكم في هذا الاختبار!", 
        y: 100, // الموضع العمودي للنص
        fontSize: 35, 
        color: RED_COLOR_HEX, 
        textAlign: 'center' // المحاذاة داخل الـ SVG
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
        console.log('أبعاد الصورة الفعلية التي تم تحميلها:', imageWidth, 'x', imageHeight);

        if (imageWidth !== 978 || imageHeight !== 1280) {
             console.warn(`تحذير: أبعاد الصورة الفعلية (${imageWidth}x${imageHeight}) لا تتطابق مع الأبعاد المتوقعة (978x1280). يرجى التأكد من أن الصورة هي wwee.jpg بالأبعاد الصحيحة.`);
        }


        let processedImage = baseImage;

        console.log('جارٍ إضافة النصوص إلى الصورة باستخدام SVG...');
        const fieldsToDisplay = ['WELCOME_TEXT_TOP', 'WELCOME_TEXT_BOTTOM']; 

        for (const key of fieldsToDisplay) {
            const pos = CERTIFICATE_TEXT_POSITIONS?.[key]; 
            if (pos) {
                const textToDisplay = pos.text; 
                // تحديد ارتفاع SVG كافٍ للنص وبعض الهامش
                const svgHeight = (pos.fontSize || 30) * 1.5; 
                const yPosition = pos.y || 0;

                // يمكنك إضافة منطق wrapArabicText هنا إذا كانت النصوص طويلة وتحتاج لتغليف
                // ملاحظة: لإنشاء أسطر متعددة في SVG تحتاج لاستخدام <tspan> أو تكرار <text> لكل سطر
                // أو دمج كل الأسطر في نص واحد مفصول بـ \n إذا كان محرك SVG يتعامل معها (غالباً لا)
                // لذلك، حالياً، createArabicTextSVG تصدر سطرًا واحدًا فقط.

                console.log(`إنشاء SVG للنص: ${key} بـ: "${textToDisplay}" عند Y: ${yPosition}`);

                const svgTextBuffer = Buffer.from(createArabicTextSVG(textToDisplay, {
                    width: imageWidth, // اجعل عرض SVG مساوياً لعرض الصورة لتسهيل التوسيط الأفقي
                    height: svgHeight,
                    fontSize: pos.fontSize,
                    fontFamily: ARABIC_FONTS.noto, // استخدم الخط المفضل من قائمة ARABIC_FONTS
                    color: pos.color,
                    textAlign: pos.textAlign // استخدم textAlign من pos
                }));
                
                console.log(`تم إنشاء Buffer SVG للنص ${key}`);

                processedImage = await processedImage.composite([{
                    input: svgTextBuffer,
                    left: 0, // ضع الـ SVG من اليسار، والتوسيط الأفقي يتم داخله باستخدام text-anchor
                    top: yPosition,
                }]);
                console.log(`تم تركيب النص ${key}`);
            }
        }

        console.log('جارٍ إنشاء الصورة النهائية...');
        const finalImageBuffer = await processedImage
            .flatten({ background: { r: 255, g: 255, b: 255, alpha: 1 } }) // للتأكد من عدم وجود شفافية في الصورة النهائية (إذا كانت الخلفية شفافة)
            .jpeg({
                quality: 85,
                progressive: true
            }).toBuffer();
        console.log('تم إنشاء الصورة النهائية.');

        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate'); // تحسينات ذاكرة التخزين المؤقت
        console.log('تم إرسال الصورة بنجاح.');
        return res.status(200).send(finalImageBuffer);

    } catch (error) {
        console.error('خطأ عام في وظيفة generateCertificateTwo2 (داخل catch):', error);
        console.error('تتبع الخطأ (داخل catch):', error.stack);

        // رسائل خطأ أكثر تحديداً للمساعدة في التصحيح
        if (error.message.includes('expected positive integer for text.height')) {
            return res.status(500).json({
                error: 'خطأ في معالجة أبعاد النص. قد يكون بسبب قيمة ارتفاع النص غير الصحيحة (عشري بدلاً من صحيح).',
                details: error.message,
                stack: error.stack
            });
        }
        // يمكن أن يظهر خطأ Fontconfig هنا إذا كان Sharp يحاول تحميل الخط العربي ولا يجده في بيئة النظام
        else if (error.message.includes('fontconfig') || error.message.includes('freetype') || error.message.includes('VIPS_WARNING')) {
            return res.status(500).json({
                error: 'حدث خطأ في معالجة الخطوط (Fontconfig/FreeType/VIPS). يرجى التأكد من أن الخطوط المستخدمة مدعومة بشكل كامل في بيئة Vercel أو أن هناك مشكلة في بيئة Vercel نفسها.',
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