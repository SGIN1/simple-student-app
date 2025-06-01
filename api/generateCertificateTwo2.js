// api/generateCertificateTwo2.js
// تأكد من وجود ملفاتك:
// public/images/full/wwee.png
// public/fonts/arial.ttf

import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

// المسارات الثابتة للملفات
const CERTIFICATE_IMAGE_PATH = path.join(process.cwd(), 'public', 'images', 'full', 'wwee.png');
const FONT_FILENAME = 'arial.ttf';
const FONT_PATH = path.join(process.cwd(), 'public', 'fonts', FONT_FILENAME);
const FONT_CSS_FAMILY_NAME = 'Arial'; // هذا الاسم يستخدم داخل CSS في SVG، ويجب أن يطابق اسم الخط الفعلي

// تعريف ألوان النصوص
const RED_COLOR_HEX = '#FF0000';    // أحمر
const BLUE_COLOR_HEX = '#0000FF';   // أزرق
const GREEN_COLOR_HEX = '#00FF00';  // أخضر

// تعريف إحداثيات ومواصفات نصوص الترحيب على الشهادة
// (هذه القيم تقديرية، قد تحتاج لتعديلها لتناسب تصميم شهادتك بالضبط)
const GREETING_POSITIONS = {
    GREETING1: { text: "أهلاً وسهلاً بكم!", x: 0, y: 400, fontSize: 70, color: RED_COLOR_HEX, gravity: 'center' },
    GREETING2: { text: "نتمنى لكم يوماً سعيداً.", x: 50, y: 550, fontSize: 50, color: BLUE_COLOR_HEX, gravity: 'west' },
    GREETING3: { text: "شكراً لزيارتكم.", x: 0, y: 700, fontSize: 40, color: GREEN_COLOR_HEX, gravity: 'east' }
};

/**
 * دالة مساعدة لإنشاء نص كـ Buffer لـ sharp باستخدام SVG مع الخط المضمن (Base64).
 * هذه الطريقة هي الأكثر موثوقية لتطبيق الخطوط والألوان مع Sharp.
 * * @param {string} text - النص المراد عرضه.
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
    const svgText = `<svg width="${svgWidth}" height="${svgHeight}">
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
 * * @param {Object} req - كائن الطلب (HTTP request).
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
                blend: 'over' // وضع النص فوق الصورة الحالية
            }]);
        }

        // 5. توليد الصورة النهائية بصيغة WebP لتحسين الأداء ومنع الوميض/التدرج
        const finalImageBuffer = await processedImage
            .webp({
                quality: 85,         // جودة الصورة (85% تعتبر جيدة جداً)
                nearLossless: true,  // يحافظ على وضوح النصوص والتفاصيل بشكل ممتاز
                chromaSubsampling: '4:4:4' // يحافظ على دقة الألوان وتجنب تدرج الألوان
            })
            .toBuffer(); // الحصول على الصورة كـ Buffer

        // 6. تعيين Headers المناسبة للاستجابة
        res.setHeader('Content-Type', 'image/webp'); // إخبار المتصفح بأن الاستجابة هي صورة WebP
        // Cache-Control: يخزن الصورة مؤقتًا في المتصفح لمدة سنة كاملة.
        // هذا يقلل من طلبات الخادم اللاحقة ويسرع التحميل بشكل كبير.
        // 'immutable' يعني أن المحتوى لن يتغير أبدًا لنفس الـ URL.
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

        // 7. إرسال الصورة النهائية إلى العميل
        return res.status(200).send(finalImageBuffer);

    } catch (error) {
        // معالجة الأخطاء وإرجاع رسائل مفيدة
        console.error('General error in generateCertificateTwo2 function:', error);
        console.error('Error stack trace:', error.stack);

        if (error.message.includes('fontconfig') || error.message.includes('freetype')) {
            return res.status(500).json({
                error: 'An error occurred with font processing. Ensure Vercel environment supports Sharp and fonts correctly.',
                details: error.message,
                stack: error.stack
            });
        }
        if (error.message.includes('Input file is missing')) {
            return res.status(500).json({
                error: 'The certificate image (wwee.png) is missing. Please check your public/images/full folder.',
                details: error.message,
                path: CERTIFICATE_IMAGE_PATH
            });
        }
        // خطأ عام لم يتم تحديده
        return res.status(500).json({
            error: 'An error occurred while generating the certificate. Please check server logs for more details.',
            details: error.message,
            stack: error.stack
        });
    }
}