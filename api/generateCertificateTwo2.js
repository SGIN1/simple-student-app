// api/generateCertificateTwo2.js
// هذا الملف يستخدم الآن ES Module syntax

import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

// ----------------------------------------------------
// **تعريفات المتغيرات والثوابت**
// ----------------------------------------------------

// **مسار صورة الشهادة:**
// تم التغيير من wwee.png إلى wwee.jpg
const CERTIFICATE_IMAGE_PATH = path.join(process.cwd(), 'public', 'images', 'full', 'wwee.jpg');

// **مسار الخط (Arial):**
const FONT_FILENAME = 'arial.ttf'; // <--- تأكد من وجود ملف arial.ttf في public/fonts/
const FONT_PATH = path.join(process.cwd(), 'public', 'fonts', FONT_FILENAME);

// **اسم الخط للاستخدام في CSS داخل SVG:**
const FONT_CSS_FAMILY_NAME = 'ArialUnicode'; // اسم الخط الذي يعمل الآن

// تعريف ألوان النصوص
const RED_COLOR_HEX = '#FF0000';    // أحمر
const BLUE_COLOR_HEX = '#0000FF';   // أزرق
const GREEN_COLOR_HEX = '#00FF00';  // أخضر
const BLACK_COLOR_HEX = '#000000';  // أسود

// تعريف إحداثيات ومواصفات نصوص الترحيب
// **ملاحظة هامة:** هذه القيم تحتاج لضبط يدوي لتناسب تصميم شهادتك wwee.jpg
// بعد نشر الكود، افتح الشهادة في المتصفح، وسجل أبعادها الحقيقية.
// ثم قم بتعديل هذه القيم (y, fontSize) لتناسب مكان النص وحجمه على تصميمك.
const GREETING_POSITIONS = {
    GREETING1: {
        text: "أهلاً وسهلاً بكم!",
        x: 0, // 0 مع gravity 'center' يعني المنتصف الأفقي
        y: 200, // **مثال**: اضبط هذه القيمة بناءً على ارتفاع wwee.jpg
        fontSize: 50, // **مثال**: اضبط هذه القيمة بناءً على عرض wwee.jpg
        color: RED_COLOR_HEX,
        gravity: 'center'
    },
    GREETED_NAME: { // نص تجريبي لاسم الطالب
        text: "محمد أحمد علي", // ستستبدل هذا ببيانات الطالب لاحقاً
        x: 0,
        y: 350, // **مثال**: اضبط هذه القيمة
        fontSize: 70, // **مثال**: اضبط هذه القيمة
        color: BLACK_COLOR_HEX,
        gravity: 'center'
    },
    GREETING2: {
        text: "نتمنى لكم يوماً سعيداً.",
        x: 50, // 50 بكسل من اليسار
        y: 500, // **مثال**: اضبط هذه القيمة
        fontSize: 40, // **مثال**: اضبط هذه القيمة
        color: BLUE_COLOR_HEX,
        gravity: 'west'
    },
    GREETING3: {
        text: "شكراً لزيارتكم.",
        x: 0, // 0 مع gravity 'east' يعني أقصى اليمين من عرض الـ SVG
        y: 650, // **مثال**: اضبط هذه القيمة
        fontSize: 30, // **مثال**: اضبط هذه القيمة
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
                    dominant-baseline: middle;
                    direction: rtl;
                    unicode-bidi: bidi-override;
                }
            </style>
            <text x="${xPosition}" y="${svgHeight / 2}">
                ${text}
            </text>
        </svg>
    `;
    return sharp(Buffer.from(svgText)).png().toBuffer();
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

            // ارتفاع مربع النص يعتمد على حجم الخط لضمان احتواء النص
            const textHeight = pos.fontSize * 2;

            const textOverlayBuffer = await createSharpTextBuffer(
                pos.text,
                pos.fontSize,
                pos.color,
                imageWidth, // نستخدم عرض الصورة الفعلية
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

        // بما أن الصورة الأصلية هي JPG، سنخرجها كـ JPEG للحفاظ على الجودة و progressive
        const finalImageBuffer = await processedImage
            // بما أن JPG لا يدعم الشفافية، لا حاجة لـ flatten إلا إذا كانت هناك شفافية متبقية من overlays
            // لكن إبقاؤها لا يضر ويضمن خلفية بيضاء إذا كانت هناك أي شفافية غير متوقعة
            .flatten({ background: { r: 255, g: 255, b: 255, alpha: 1 } })
            .jpeg({
                quality: 85, // جودة الصورة (يمكنك تعديلها من 0 إلى 100)
                progressive: true // يجعلها progressive JPEG للعرض التدريجي
            }).toBuffer();

        res.setHeader('Content-Type', 'image/jpeg'); // نوع المحتوى image/jpeg
        res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate'); // تحكم في التخزين المؤقت
        return res.status(200).send(finalImageBuffer);

    } catch (error) {
        console.error('خطأ عام في وظيفة generateCertificateTwo2:', error);
        console.error('تتبع الخطأ:', error.stack);

        if (error.message.includes('fontconfig') || error.message.includes('freetype')) {
            return res.status(500).json({
                error: 'حدث خطأ في معالجة الخطوط. قد تكون بيئة النشر لا تدعم Fontconfig أو FreeType بالشكل المطلوب لخطوط مخصصة. حاول استخدام خط بديل أو تأكد من تضمين الخط بالكامل في الـ SVG.',
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