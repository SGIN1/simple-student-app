// api/generateCertificateTwo2.js
// تأكد من وجود ملفاتك:
// public/images/full/wwee.png (أو wwee.jpg إذا كنت تستخدمها)
// public/fonts/arial.ttf

import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

// ----------------------------------------------------
// **تعريفات المتغيرات والثوابت**
// ----------------------------------------------------

// المسارات الثابتة للملفات
// بناءً على الكود الذي زودتني به مؤخرًا، الصورة هي wwee.png
const CERTIFICATE_IMAGE_PATH = path.join(process.cwd(), 'public', 'images', 'full', 'wwee.png');
const FONT_FILENAME = 'arial.ttf';
const FONT_PATH = path.join(process.cwd(), 'public', 'fonts', FONT_FILENAME);
const FONT_CSS_FAMILY_NAME = 'ArialUnicode'; // اسم الخط الذي تم ضبطه لضمان عمله مع SVG

// تعريف ألوان النصوص
const RED_COLOR_HEX = '#FF0000';    // أحمر
const BLUE_COLOR_HEX = '#0000FF';   // أزرق
const GREEN_COLOR_HEX = '#00FF00';  // أخضر
const BLACK_COLOR_HEX = '#000000';  // أسود

// تعريف إحداثيات ومواصفات نصوص الترحيب على الشهادة
// **تم ضبط هذه القيم لتناسب الأبعاد الجديدة للشهادة (العرض: 1030 بكسل، الارتفاع: 727 بكسل).**
// **قد تحتاج إلى تعديلات دقيقة لهذه القيم (y, fontSize) بناءً على تصميم شهادتك بالضبط.**
const GREETING_POSITIONS = {
    GREETING1: {
        text: "أهلاً وسهلاً بكم!",
        x: 0, // 0 مع gravity 'center' يعني المنتصف الأفقي
        y: 100, // **ضبط**: مثلاً 100 بكسل من الأعلى (جرب قيمًا مختلفة: 80, 120)
        fontSize: 45, // **ضبط**: مثلاً 45 بكسل (جرب قيمًا مختلفة: 40, 50)
        color: RED_COLOR_HEX,
        gravity: 'center'
    },
    GREETED_NAME: { // نص تجريبي لاسم الطالب
        text: "محمد أحمد علي", // هذا النص مؤقت، سيتم استبداله ببيانات الطالب الفعلية لاحقًا
        x: 0,
        y: 200, // **ضبط**: مثلاً 200 بكسل من الأعلى
        fontSize: 60, // **ضبط**: مثلاً 60 بكسل للأسماء (جرب 55, 65)
        color: BLACK_COLOR_HEX,
        gravity: 'center'
    },
    GREETING2: {
        text: "نتمنى لكم يوماً سعيداً.",
        x: 50, // 50 بكسل من اليسار (لـ 'west' - أي start)
        y: 350, // **ضبط**: مثلاً 350 بكسل من الأعلى
        fontSize: 35, // **ضبط**: مثلاً 35 بكسل
        color: BLUE_COLOR_HEX,
        gravity: 'west'
    },
    GREETING3: {
        text: "شكراً لزيارتكم.",
        x: 0, // 0 مع gravity 'east' يعني أقصى اليمين من عرض الـ SVG
        y: 500, // **ضبط**: مثلاً 500 بكسل من الأعلى
        fontSize: 28, // **ضبط**: مثلاً 28 بكسل
        color: GREEN_COLOR_HEX,
        gravity: 'east'
    }
};

/**
 * دالة مساعدة لإنشاء نص كـ Buffer لـ sharp باستخدام SVG مع الخط المضمن (Base64).
 * هذه الطريقة هي الأكثر موثوقية لتطبيق الخطوط والألوان مع Sharp.
 * @param {string} text - النص المراد عرضه.
 * @param {number} fontSize - حجم الخط بالبكسل.
 * @param {string} color - لون النص (مثال: '#FF0000').
 * @param {number} svgWidth - العرض الكلي لمساحة SVG التي ستحتوي النص.
 * @param {number} svgHeight - الارتفاع الكلي لمساحة SVG التي ستحتوي النص.
 * @param {string} gravity - محاذاة النص ('center', 'west', 'east').
 * @param {Buffer} fontBuffer - محتوى ملف الخط كـ Buffer.
 * @param {string} fontCssFamilyName - اسم عائلة الخط لاستخدامه في CSS.
 * @returns {Promise<Buffer>} - Buffer لصورة PNG تحتوي على النص.
 */
async function createSharpTextBuffer(text, fontSize, color, svgWidth, svgHeight, gravity, fontBuffer, fontCssFamilyName) {
    // تحديد محاذاة النص داخل SVG بناءً على 'gravity'
    const textAnchor = gravity === 'center' ? 'middle' : (gravity === 'west' ? 'start' : 'end');
    const xPosition = gravity === 'center' ? svgWidth / 2 : (gravity === 'west' ? 0 : svgWidth);

    // بناء SVG النصي مع تضمين الخط (ttf) مباشرة كـ Base64
    // هذا يضمن أن الخط سيكون متاحًا لـ Sharp بغض النظر عن بيئة التشغيل
    const svgText = `<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">
        <style>
            @font-face {
                font-family: '${fontCssFamilyName}';
                src: url('data:font/ttf;base64,${fontBuffer.toString('base64')}') format('truetype');
            }
            text {
                font-family: '${fontCssFamilyName}', sans-serif;
                font-size: ${fontSize}px;
                fill: ${color};
                dominant-baseline: middle; /* لتحسين المحاذاة الرأسية للنص */
                text-anchor: ${textAnchor}; /* لتحديد المحاذاة الأفقية للنص */
                direction: rtl; /* لضمان عرض النص العربي من اليمين لليسار */
                unicode-bidi: bidi-override; /* لتعزيز دعم RTL */
            }
        </style>
        <text x="${xPosition}" y="${svgHeight / 2}">
            ${text}
        </text>
    </svg>`;

    // تحويل SVG إلى صورة (PNG مؤقتة) يمكن لـ Sharp دمجها بسهولة كطبقة
    return sharp(Buffer.from(svgText))
        .png()
        .toBuffer();
}

/**
 * وظيفة Vercel Serverless Function الرئيسية لتوليد الشهادة.
 * @param {Object} req - كائن الطلب (HTTP request).
 * @param {Object} res - كائن الاستجابة (HTTP response).
 */
export default async function handler(req, res) {
    // التأكد من أن نوع الطلب هو GET فقط
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // 1. التحقق من وجود صورة الشهادة الأساسية في المسار المحدد
        try {
            await fs.access(CERTIFICATE_IMAGE_PATH);
            console.log('صورة الشهادة موجودة في المسار المحدد:', CERTIFICATE_IMAGE_PATH);
        } catch (fileError) {
            console.error('Error: Base certificate image not found or inaccessible:', fileError.message);
            return res.status(500).json({
                error: 'صورة الشهادة الأساسية غير موجودة أو لا يمكن الوصول إليها. يرجى التحقق من مسار ملف الصورة في النشر.',
                details: fileError.message,
                path: CERTIFICATE_IMAGE_PATH
            });
        }

        // 2. قراءة صورة الشهادة الأساسية والحصول على أبعادها
        const baseImage = sharp(CERTIFICATE_IMAGE_PATH);
        let metadata = await baseImage.metadata();
        let imageWidth = metadata.width;
        let imageHeight = metadata.height;

        let processedImage = baseImage;

        // 3. التحقق من وجود ملف الخط وقراءته في الذاكرة
        let fontBuffer;
        try {
            fontBuffer = await fs.readFile(FONT_PATH);
            console.log('ملف الخط موجود وتم قراءته:', FONT_PATH);
        } catch (fontError) {
            console.error('Error: Font file not found or inaccessible:', fontError.message);
            return res.status(500).json({
                error: 'ملف الخط غير موجود أو لا يمكن الوصول إليه. يرجى التأكد من وضعه في المسار الصحيح وتضمينه في النشر.',
                details: fontError.message,
                path: FONT_PATH
            });
        }

        // 4. إضافة نصوص الترحيب إلى الصورة كطبقات (overlays)
        for (const key in GREETING_POSITIONS) {
            const pos = GREETING_POSITIONS[key];
            const textHeight = pos.fontSize * 2; // إعطاء مساحة كافية لـ SVG النصي

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

            // دمج طبقة النص فوق الصورة الأساسية
            processedImage = await processedImage.composite([{
                input: textOverlayBuffer,
                left: pos.x, // إحداثي X لموضع النص
                top: pos.y,  // إحداثي Y لموضع النص
                blend: 'over' // وضع النص فوق الصورة الحالية (هذا هو الوضع الافتراضي لـ PNG الشفاف)
            }]);
        }

        // 5. توليد الصورة النهائية بصيغة WebP لتحسين الأداء ومنع الوميض/التدرج
        // تأكد من استخدام .png() أو .jpeg() بناءً على امتداد الصورة الأصلية ونوع الإخراج المطلوب.
        // بما أنك ذكرت أن الصورة الأصلية هي "wwee.png"، سنبقي على .png() أو يمكنك التغيير إلى .jpeg() إذا غيرت الصورة لـ JPG.
        // إذا كنت تستخدم wwee.png كمدخل، وتريد إخراج PNG، فالكود التالي مناسب.
        // إذا كنت تستخدم wwee.jpg كمدخل، وتريد إخراج JPEG، فاستخدم `.jpeg({ quality: 85 })`
        const finalImageBuffer = await processedImage
            .flatten({ background: { r: 255, g: 255, b: 255, alpha: 1 } }) // ضمان خلفية بيضاء صلبة (مفيد إذا كانت الصورة الأصلية PNG ذات شفافية)
            .png() // إخراج الصورة النهائية كـ PNG
            .toBuffer();

        // 6. تعيين Headers المناسبة للاستجابة
        res.setHeader('Content-Type', 'image/png'); // إخبار المتصفح بأن الاستجابة هي صورة PNG
        // Cache-Control: يخزن الصورة مؤقتًا في المتصفح لمدة سنة كاملة (مثال، يمكنك ضبطها).
        // هذا يقلل من طلبات الخادم اللاحقة ويسرع التحميل بشكل كبير.
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

        // 7. إرسال الصورة النهائية إلى العميل
        return res.status(200).send(finalImageBuffer);

    } catch (error) {
        // معالجة الأخطاء وإرجاع رسائل مفيدة
        console.error('General error in generateCertificateTwo2 function:', error);
        console.error('Error stack trace:', error.stack);

        if (error.message.includes('fontconfig') || error.message.includes('freetype')) {
            return res.status(500).json({
                error: 'حدث خطأ في معالجة الخطوط. تأكد من أن بيئة Vercel تدعم Sharp والخطوط بشكل صحيح.',
                details: error.message,
                stack: error.stack
            });
        }
        if (error.message.includes('Input file is missing')) {
            return res.status(500).json({
                error: `صورة الشهادة (${path.basename(CERTIFICATE_IMAGE_PATH)}) مفقودة. يرجى التحقق من مجلد public/images/full.`,
                details: error.message,
                stack: error.stack,
                path: CERTIFICATE_IMAGE_PATH
            });
        }
        // خطأ عام لم يتم تحديده
        return res.status(500).json({
            error: 'حدث خطأ أثناء توليد الشهادة. يرجى مراجعة سجلات الخادم لمزيد من التفاصيل.',
            details: error.message,
            stack: error.stack
        });
    }
}