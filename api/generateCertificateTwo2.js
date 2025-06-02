// api/generateCertificateTwo2.js
// هذا الملف يستخدم الآن ES Module syntax

// لا داعي لاستيراد MongoClient و ObjectId إذا لم يتم استخدامهما
// import { MongoClient, ObjectId } from 'mongodb';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

// **ملاحظة هامة:** MONGODB_URI لم تعد ضرورية لعرض نص ثابت ولكن تم إبقاؤها لتجنب الأخطاء إذا كانت مستخدمة في مكان آخر
// const uri = process.env.MONGODB_URI;
// const dbName = 'Cluster0';
// const collectionName = 'enrolled_students_tbl';

// ----------------------------------------------------
// **تعريفات المتغيرات والثوابت - يجب أن تكون هنا في الأعلى**
// ----------------------------------------------------

// **مسار صورة الشهادة:**
const CERTIFICATE_IMAGE_PATH = path.join(process.cwd(), 'public', 'images', 'full', 'wwee.png');

// **مسار الخط الجديد (Arial):**
const FONT_FILENAME = 'arial.ttf'; // <--- تأكد من وجود ملف arial.ttf في public/fonts/
const FONT_PATH = path.join(process.cwd(), 'public', 'fonts', FONT_FILENAME);

// **اسم الخط للاستخدام في CSS داخل SVG:**
const FONT_CSS_FAMILY_NAME = 'ArialUnicode'; // تغيير اسم الخط هنا لتجنب التعارضات الداخلية في Pango

// تعريف ألوان النصوص
const RED_COLOR_HEX = '#FF0000';    // أحمر
const BLUE_COLOR_HEX = '#0000FF';   // أزرق
const GREEN_COLOR_HEX = '#00FF00';  // أخضر

// تعريف إحداثيات ومواصفات نصوص الترحيب
// **هذه الإحداثيات (x, y) هي قيم تقديرية. يجب عليك تعديلها بعناية لتناسب تصميم شهادتك (wwee.png).**
const GREETING_POSITIONS = {
    GREETING1: {
        text: "أهلاً وشكراًببببببببببببببببببببببببببببببببببببببب كيفك حبيبي وينك ي قلبي واو وينك ي شيخ وربي وحشتني  لزيارتكمسهلاً بكم!",
        x: 0,
        y: 400, // يمكنك تعديل هذه القيمة
        fontSize: 70,
        color: RED_COLOR_HEX,
        gravity: 'center'
    },
    GREETING2: {
        text: "نتمنى لكمشكراًببببببببببببببببببببببببببببببببببببببب كيفك حبيبي وينك ي قلبي واو وينك ي شيخ وربي وحشتني  لزيارتكم يوماً سعيداً.",
        x: 50, // يمكنك تعديل هذه القيمة
        y: 550, // يمكنك تعديل هذه القيمة
        fontSize: 50,
        color: BLUE_COLOR_HEX,
        gravity: 'west'
    },
    GREETING3: {
        text: "شكراًببببببببببببببببببببببببببببببببببببببب كيفك حبيبي وينك ي قلبي واو وينك ي شيخ وربي وحشتني  لزيارتكم.",
        x: 0, // يمكنك تعديل هذه القيمة
        y: 700, // يمكنك تعديل هذه القيمة
        fontSize: 40,
        color: GREEN_COLOR_HEX,
        gravity: 'east'
    }
};

/**
 * دالة مساعدة لإنشاء نص كـ Buffer لـ sharp من SVG.
 * **هذه الدالة هي التي تم تعديلها بشكل حاسم لحل مشكلة الخط.**
 *
 * @param {string} text - النص المراد عرضه.
 * @param {number} fontSize - حجم الخط بالبكسل.
 * @param {string} color - لون النص (مثال: '#FF0000').
 * @param {number} svgWidth - العرض الكلي لمساحة النص (يجب أن يكون عرض الصورة).
 * @param {number} svgHeight - الارتفاع الكلي لمساحة النص.
 * @param {string} gravity - محاذاة النص ('center', 'west', 'east').
 * @param {Buffer} fontBuffer - بيانات ملف الخط (buffer).
 * @param {string} fontCssFamilyName - الاسم الذي سيتم استخدامه للخط في CSS.
 * @returns {Buffer} - كائن Buffer يحتوي على بيانات النص كصورة PNG شفافة.
 */
async function createSharpTextBuffer(text, fontSize, color, svgWidth, svgHeight, gravity, fontBuffer, fontCssFamilyName) {
    // تحديد محاذاة النص بناءً على gravity
    let textAnchor = 'middle'; // Center
    let xPosition = svgWidth / 2; // Center

    if (gravity === 'west') {
        textAnchor = 'start'; // Left
        xPosition = 0;
    } else if (gravity === 'east') {
        textAnchor = 'end'; // Right
        xPosition = svgWidth;
    }

    // إنشاء SVG Markup للنص
    // **التعديلات الهامة هنا لضمان عمل الخط العربي:**
    // 1. تضمين الخط كـ Base64 مباشرة في CSS داخل SVG.
    // 2. استخدام خصائص CSS لـ text-anchor و dominant-baseline والمحاذاة.
    // 3. إضافة direction: rtl و unicode-bidi: bidi-override لدعم اللغة العربية.
    const svgText = `
        <svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">
            <style>
                @font-face {
                    font-family: '${fontCssFamilyName}';
                    src: url('data:font/ttf;charset=utf-8;base64,${fontBuffer.toString('base64')}');
                }
                text {
                    font-family: '${fontCssFamilyName}';
                    font-size: ${fontSize}px;
                    fill: ${color};
                    text-anchor: ${textAnchor};
                    dominant-baseline: middle; /* للتوسيط العمودي */
                    direction: rtl; /* لضمان عرض النص العربي من اليمين لليسار */
                    unicode-bidi: bidi-override; /* لتعزيز دعم RTL */
                }
            </style>
            <text x="${xPosition}" y="${svgHeight / 2}">
                ${text}
            </text>
        </svg>
    `;

    // استخدام sharp لتحويل SVG إلى PNG شفاف
    // هذا يضمن أن النص له خلفية شفافة عند وضعه فوق الصورة الأصلية
    return sharp(Buffer.from(svgText))
        .png() // تحويل SVG إلى PNG
        .toBuffer();
}

// ----------------------------------------------------
// **وظيفة Vercel Serverless Function**
// ----------------------------------------------------

/**
 * وظيفة Vercel Serverless Function لإنشاء الشهادة.
 *
 * @param {Object} req - كائن الطلب (HTTP request).
 * @param {Object} res - كائن الاستجابة (HTTP request).
 */
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // 1. التحقق من وجود صورة الشهادة
        try {
            await fs.access(CERTIFICATE_IMAGE_PATH);
            console.log('صورة الشهادة موجودة في المسار المحدد:', CERTIFICATE_IMAGE_PATH);
        } catch (fileError) {
            console.error('خطأ: صورة الشهادة غير موجودة أو لا يمكن الوصول إليها:', fileError.message);
            return res.status(500).json({
                error: 'صورة الشهادة غير موجودة أو لا يمكن الوصول إليها. يرجى التحقق من مسار ملف الصورة في النشر.',
                details: fileError.message,
                path: CERTIFICATE_IMAGE_PATH
            });
        }

        // 2. قراءة صورة الشهادة الأساسية
        const baseImage = sharp(CERTIFICATE_IMAGE_PATH);
        const metadata = await baseImage.metadata();
        const imageWidth = metadata.width;
        const imageHeight = metadata.height;

        let processedImage = baseImage;

        // 3. التحقق من وجود ملف الخط وقراءته في الذاكرة
        let fontBuffer;
        try {
            fontBuffer = await fs.readFile(FONT_PATH);
            console.log('ملف الخط موجود وتم قراءته:', FONT_PATH);
        } catch (fontError) {
            console.error('خطأ: ملف الخط غير موجود أو لا يمكن الوصول إليه:', fontError.message);
            return res.status(500).json({
                error: 'ملف الخط غير موجود أو لا يمكن الوصول إليه. يرجى التأكد من وضعه في المسار الصحيح وتضمينه في النشر.',
                details: fontError.message,
                path: FONT_PATH
            });
        }

        // --- إضافة نصوص الترحيب إلى الصورة ---
        for (const key in GREETING_POSITIONS) {
            const pos = GREETING_POSITIONS[key];

            const textHeight = pos.fontSize * 2; // ارتفاع تقديري لمربع النص

            const textOverlayBuffer = await createSharpTextBuffer(
                pos.text,
                pos.fontSize,
                pos.color,
                imageWidth,
                textHeight,
                pos.gravity,
                fontBuffer,
                FONT_CSS_FAMILY_NAME
            );

            // تركيب النص كـ overlay. sharp سيستخدم الوضع الافتراضي لدمج PNG الشفاف.
            // تمت إزالة 'blend' صراحةً للسماح لـ sharp بالتعامل مع PNG الشفاف بشكل صحيح.
            processedImage = await processedImage.composite([{
                input: textOverlayBuffer,
                left: pos.x,
                top: pos.y,
            }]);
        }

        // إزالة الشفافية وملء الخلفية باللون الأبيض قبل التحويل إلى JPEG
        // هذا يحل مشكلة ظهور الخلفية باللون الأسود إذا كانت الصورة الأصلية PNG بشفافية
        const finalImageBuffer = await processedImage
            .flatten({ background: { r: 255, g: 255, b: 255, alpha: 1 } }) // ضمان خلفية بيضاء صلبة
            .jpeg({
                quality: 85, // جودة الصورة
                progressive: true // يجعلها progressive JPEG
            }).toBuffer();

        res.setHeader('Content-Type', 'image/jpeg'); // نوع المحتوى image/jpeg
        res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate'); // تحكم في التخزين المؤقت
        return res.status(200).send(finalImageBuffer);

    } catch (error) {
        console.error('خطأ عام في وظيفة generateCertificateTwo2:', error);
        console.error('تتبع الخطأ:', error.stack);

        // رسائل خطأ أكثر تفصيلاً للتشخيص
        if (error.message.includes('fontconfig') || error.message.includes('freetype')) {
            return res.status(500).json({
                error: 'حدث خطأ في معالجة الخطوط. قد تكون بيئة النشر لا تدعم Fontconfig أو FreeType بالشكل المطلوب لخطوط مخصصة. حاول استخدام خط بديل أو تأكد من تضمين الخط بالكامل في الـ SVG.',
                details: error.message,
                stack: error.stack
            });
        }
        if (error.message.includes('Input file is missing or of an unsupported image format')) {
             return res.status(500).json({
                error: 'صورة الشهادة (wwee.png) مفقودة أو تالفة. تأكد من مسارها وتضمينها في النشر.',
                details: error.message,
                stack: error.stack
            });
        }

        return res.status(500).json({
            error: 'حدث خطأ أثناء توليد الشهادة.',
            details: error.message,
            stack: error.stack
        });
    }
}