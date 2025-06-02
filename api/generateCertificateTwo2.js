// api/generateCertificateTwo2.js
// هذا الملف يستخدم الآن ES Module syntax

import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

// ----------------------------------------------------
// **تعريفات المتغيرات والثوابت**
// ----------------------------------------------------

// **مسار صورة الشهادة:**
const CERTIFICATE_IMAGE_PATH = path.join(process.cwd(), 'public', 'images', 'full', 'wwee.png');

// **مسار الخط الجديد (Arial):**
const FONT_FILENAME = 'arial.ttf'; // <--- تأكد من وجود ملف arial.ttf في public/fonts/
const FONT_PATH = path.join(process.cwd(), 'public', 'fonts', FONT_FILENAME);

// **اسم الخط للاستخدام في CSS داخل SVG:**
const FONT_CSS_FAMILY_NAME = 'ArialUnicode'; // تم تغيير هذا الاسم لتجنب تعارضات الخطوط

// تعريف ألوان النصوص
const RED_COLOR_HEX = '#FF0000';    // أحمر
const BLUE_COLOR_HEX = '#0000FF';   // أزرق
const GREEN_COLOR_HEX = '#00FF00';  // أخضر
const BLACK_COLOR_HEX = '#000000';  // أسود

// تعريف إحداثيات ومواصفات نصوص الترحيب
// **هذه الإحداثيات (x, y) تم ضبطها لتناسب أبعاد شهادتك: العرض 1000 بكسل، الارتفاع 1220 بكسل.**
// **قد تحتاج إلى تعديلات دقيقة لهذه القيم بناءً على تصميم شهادتك المحدد.**
const GREETING_POSITIONS = {
    GREETING1: {
        text: "أهلاً وسهلاً بكم!",
        x: 0, // 0 مع gravity 'center' يعني المنتصف الأفقي
        y: 200, // مثلاً: 200 بكسل من الأعلى
        fontSize: 50, // حجم مناسب لـ 1000 بكسل عرض
        color: RED_COLOR_HEX,
        gravity: 'center'
    },
    GREETED_NAME: { // نص تجريبي لاسم الطالب (يمكنك تعديل هذا أو حذفه لاحقًا)
        text: "محمد أحمد علي", // نص تجريبي، استبدله ببيانات الطالب الفعلية لاحقًا
        x: 0,
        y: 350, // مثلاً: 350 بكسل من الأعلى
        fontSize: 70, // حجم أكبر للأسماء
        color: BLACK_COLOR_HEX,
        gravity: 'center'
    },
    GREETING2: {
        text: "نتمنى لكم يوماً سعيداً.",
        x: 50, // 50 بكسل من اليسار (لـ 'west' - أي start)
        y: 500, // مثلاً: 500 بكسل من الأعلى
        fontSize: 40,
        color: BLUE_COLOR_HEX,
        gravity: 'west'
    },
    GREETING3: {
        text: "شكراً لزيارتكم.",
        x: 0, // 0 مع gravity 'east' يعني أقصى اليمين من عرض الـ SVG (1000 بكسل)
        y: 650, // مثلاً: 650 بكسل من الأعلى
        fontSize: 30,
        color: GREEN_COLOR_HEX,
        gravity: 'east'
    }
};

/**
 * دالة مساعدة لإنشاء نص كـ Buffer لـ sharp من SVG.
 * هذه الدالة تم تحسينها لضمان دعم الخط العربي بشكل صحيح.
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

            // يجب أن يكون ارتفاع النص كافياً لاحتوائه
            const textHeight = pos.fontSize * 2; // ضعف حجم الخط كارتفاع تقريبي لمربع النص

            const textOverlayBuffer = await createSharpTextBuffer(
                pos.text,
                pos.fontSize,
                pos.color,
                imageWidth, // يجب أن يكون عرض الـ SVG هو عرض الصورة الكاملة
                textHeight,
                pos.gravity,
                fontBuffer,
                FONT_CSS_FAMILY_NAME
            );

            // تركيب النص كـ overlay. sharp سيستخدم الوضع الافتراضي لدمج PNG الشفاف.
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