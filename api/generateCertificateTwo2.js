// api/generateCertificateTwo2.js
// هذا الملف يستخدم الآن ES Module syntax

import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

// ----------------------------------------------------
// **تعريفات المتغيرات والثوابت**
// ----------------------------------------------------

// **مسار صورة الشهادة:**
// بناءً على آخر كود أرسلته لي، الصورة هي wwee.jpg
const CERTIFICATE_IMAGE_PATH = path.join(process.cwd(), 'public', 'images', 'full', 'wwee.jpg');

// **مسار الخط (Arial):**
const FONT_FILENAME = 'arial.ttf'; // <--- تأكد من وجود ملف arial.ttf في public/fonts/
const FONT_PATH = path.join(process.cwd(), 'public', 'fonts', FONT_FILENAME);

// **اسم الخط للاستخدام في CSS داخل SVG:**
// **تمت إعادته إلى 'Arial' بناءً على الكود الذي يعمل لديك سابقًا.**
const FONT_CSS_FAMILY_NAME = 'Arial'; 

// تعريف ألوان النصوص
const RED_COLOR_HEX = '#FF0000';    // أحمر
const BLUE_COLOR_HEX = '#0000FF';   // أزرق
const GREEN_COLOR_HEX = '#00FF00';  // أخضر
const BLACK_COLOR_HEX = '#000000';  // أسود

// تعريف إحداثيات ومواصفات نصوص الترحيب
// **تم ضبط هذه القيم لتناسب الأبعاد الفعلية لشهادتك (العرض: 1030 بكسل، الارتفاع: 727 بكسل).**
// **قد تحتاج إلى تعديلات دقيقة لهذه القيم (y, fontSize) بناءً على تصميم شهادتك بالضبط.**
const GREETING_POSITIONS = {
    GREETING1: {
        text: "أهلاً وسهلاً بكم!",
        x: 0, // 0 مع gravity 'center' يعني المنتصف الأفقي
        y: 80, // 80 بكسل من الأعلى
        fontSize: 40, // حجم 40 بكسل
        color: RED_COLOR_HEX,
        gravity: 'center'
    },
    GREETED_NAME: { // نص تجريبي لاسم الطالب
        text: "محمد أحمد علي", // هذا النص مؤقت، سيتم استبداله ببيانات الطالب الفعلية لاحقًا
        x: 0,
        y: 180, // 180 بكسل من الأعلى
        fontSize: 55, // 55 بكسل للأسماء
        color: BLACK_COLOR_HEX,
        gravity: 'center'
    },
    GREETING2: {
        text: "نتمنى لكم يوماً سعيداً.",
        x: 50, // 50 بكسل من اليسار
        y: 300, // 300 بكسل من الأعلى
        fontSize: 30, // 30 بكسل
        color: BLUE_COLOR_HEX,
        gravity: 'west'
    },
    GREETING3: {
        text: "شكراً لزيارتكم.",
        x: 0, // 0 مع gravity 'east' يعني أقصى اليمين من عرض الـ SVG
        y: 450, // 450 بكسل من الأعلى
        fontSize: 25, // 25 بكسل
        color: GREEN_COLOR_HEX,
        gravity: 'east'
    }
};

/**
 * دالة مساعدة لإنشاء نص كـ Buffer لـ sharp من SVG.
 * تم تحسينها لضمان دعم الخط العربي.
 */
async function createSharpTextBuffer(text, fontSize, color, svgWidth, svgHeight, gravity, fontBuffer, fontCssFamilyName) {
    let textAnchor = 'middle';
    let xPosition = svgWidth / 2;

    if (gravity === 'west') {
        textAnchor = 'start';
        xPosition = 0;
    } else if (gravity === 'east') {
        textAnchor = 'end';
        xPosition = svgWidth;
    }

    // بناء SVG النصي مع تضمين الخط (ttf) مباشرة كـ Base64
    // **تمت إزالة الأسطر الفارغة الزائدة والمسافات قدر الإمكان لجعل الـ SVG أكثر إحكامًا.**
    const svgText = `<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg"><style>@font-face{font-family:'${fontCssFamilyName}';src:url('data:font/ttf;base64,${fontBuffer.toString('base64')}') format('truetype');}text{font-family:'${fontCssFamilyName}', sans-serif;font-size:${fontSize}px;fill:${color};text-anchor:${textAnchor};dominant-baseline:middle;direction:rtl;}</style><text x="${xPosition}" y="${svgHeight / 2}">${text}</text></svg>`;
    
    // تحويل SVG إلى صورة (PNG مؤقتة) يمكن لـ Sharp دمجها بسهولة كطبقة
    // **ابقاء .trim() لضمان إزالة أي مسافات بيضاء أو أسطر جديدة غير ضرورية من بداية ونهاية الـ SVG string.**
    return sharp(Buffer.from(svgText.trim())).png().toBuffer();
}

// ----------------------------------------------------
// **وظيفة Vercel Serverless Function**
// ----------------------------------------------------

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

        // 2. قراءة صورة الشهادة الأساسية والحصول على أبعادها تلقائياً
        const baseImage = sharp(CERTIFICATE_IMAGE_PATH);
        const metadata = await baseImage.metadata();
        const imageWidth = metadata.width;
        const imageHeight = metadata.height;

        let processedImage = baseImage;

        // 3. التحقق من وجود ملف الخط وقراءته في الذاكرة
        let fontBuffer;
        try {
            fontBuffer = await fs.readFile(FONT_PATH);
            console.log('الملف الخط موجود وتم قراءته:', FONT_PATH);
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

            // ارتفاع مربع النص يعتمد على حجم الخط لضمان احتواء النص
            const textHeight = pos.fontSize * 2;

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

            // تركيب النص كطبقة علوية
            processedImage = await processedImage.composite([{
                input: textOverlayBuffer,
                left: pos.x,
                top: pos.y,
            }]);
        }

        // بما أنك تستخدم wwee.jpg، سنقوم بالإخراج كـ JPEG
        const finalImageBuffer = await processedImage
            .flatten({ background: { r: 255, g: 255, b: 255, alpha: 1 } })
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

        if (error.message.includes('fontconfig') || error.message.includes('freetype')) {
            return res.status(500).json({
                error: 'يبدو أن هناك مشكلة في معالجة الخطوط على الخادم. قد تكون بيئة النشر لا تدعم Fontconfig/FreeType بشكل كامل لبعض الخطوط.',
                details: error.message,
                stack: error.stack
            });
        }
        if (error.message.includes('Input file is missing or of an unsupported image format')) {
             return res.status(500).json({
                error: `صورة الشهادة (${path.basename(CERTIFICATE_IMAGE_PATH)}) مفقودة أو تالفة. تأكد من مسارها وتضمينها في النشر.`,
                details: error.message,
                stack: error.stack,
                path: CERTIFICATE_IMAGE_PATH
            });
        }

        return res.status(500).json({
            error: 'حدث خطأ أثناء توليد الشهادة.',
            details: error.message,
            stack: error.stack
        });
    }
}