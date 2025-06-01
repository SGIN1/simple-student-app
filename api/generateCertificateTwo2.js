// api/generateCertificateTwo2.js

import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

// المسارات الثابتة للملفات
const CERTIFICATE_IMAGE_PATH = path.join(process.cwd(), 'public', 'images', 'full', 'wwee.png');
// تأكد من هذا الاسم والمسار يطابقان تمامًا الخط الذي كان يعمل لديك
const FONT_FILENAME = 'arial.ttf'; // أو أي اسم ملف خط كان يعمل لديك
const FONT_PATH = path.join(process.cwd(), 'public', 'fonts', FONT_FILENAME);
const FONT_CSS_FAMILY_NAME = 'Arial'; // أو اسم عائلة الخط التي كانت تعمل لديك

// تعريف ألوان النصوص
const RED_COLOR_HEX = '#FF0000';    // أحمر
const BLUE_COLOR_HEX = '#0000FF';   // أزرق
const GREEN_COLOR_HEX = '#00FF00';  // أخضر

// تعريف إحداثيات ومواصفات نصوص الترحيب على الشهادة
const GREETING_POSITIONS = {
    GREETING1: { text: "أهلاً وسهلاً بكم!", x: 0, y: 400, fontSize: 70, color: RED_COLOR_HEX, gravity: 'center' },
    GREETING2: { text: "نتمنى لكم يوماً سعيداً.", x: 50, y: 550, fontSize: 50, color: BLUE_COLOR_HEX, gravity: 'west' },
    GREETING3: { text: "شكراً لزيارتكم.", x: 0, y: 700, fontSize: 40, color: GREEN_COLOR_HEX, gravity: 'east' }
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
    const textAnchor = gravity === 'center' ? 'middle' : (gravity === 'west' ? 'start' : 'end');
    const xPosition = gravity === 'center' ? svgWidth / 2 : (gravity === 'west' ? 0 : svgWidth * 0.95); // Adjust for 'east' gravity

    // استخدام خاصية 'text-align' لمحاذاة النص داخل SVG لجعله أكثر مرونة
    // ومع ذلك، الأهم هو التأكد من أن font-face يعمل بشكل كامل.
    // Sharp لديه أحيانًا مشكلة في عرض بعض محارف SVG المعقدة،
    // لكن تضمين الخط بهذه الطريقة هو النهج الصحيح.

    const svgText = `<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg" dir="rtl">
        <defs>
            <style>
                @font-face {
                    font-family: '${fontCssFamilyName}';
                    src: url('data:font/ttf;base64,${fontBuffer.toString('base64')}') format('truetype');
                }
                text {
                    font-family: '${fontCssFamilyName}', sans-serif;
                    font-size: ${fontSize}px;
                    fill: ${color};
                    /* تحسين محاذاة النص وتجاهل Fontconfig قدر الإمكان */
                    dominant-baseline: middle; /* لتحسين المحاذاة الرأسية للنص */
                    text-anchor: ${textAnchor}; /* لتحديد المحاذاة الأفقية للنص */
                }
            </style>
        </defs>
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
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        await fs.access(CERTIFICATE_IMAGE_PATH);
        const baseImage = sharp(CERTIFICATE_IMAGE_PATH);
        let metadata = await baseImage.metadata();
        let imageWidth = metadata.width;
        let imageHeight = metadata.height;

        let processedImage = baseImage;

        let fontBuffer;
        try {
            fontBuffer = await fs.readFile(FONT_PATH);
        } catch (fontError) {
            console.error('Error: Font file not found or inaccessible at deployment:', fontError.message);
            return res.status(500).json({
                error: 'ملف الخط غير موجود أو لا يمكن الوصول إليه. يرجى التأكد من وضعه في المسار الصحيح وتضمينه في النشر.',
                details: fontError.message,
                path: FONT_PATH
            });
        }
        
        for (const key in GREETING_POSITIONS) {
            const pos = GREETING_POSITIONS[key];
            const textSvgHeight = pos.fontSize * 1.5; 

            const textOverlayBuffer = await createSharpTextBuffer(
                pos.text,
                pos.fontSize,
                pos.color,
                imageWidth,
                textSvgHeight,
                pos.gravity,
                fontBuffer,
                FONT_CSS_FAMILY_NAME
            );

            processedImage = await processedImage.composite([{
                input: textOverlayBuffer,
                left: pos.x,
                top: pos.y,
                blend: 'over'
            }]);
        }

        const finalImageBuffer = await processedImage
            .webp({
                quality: 85,
                nearLossless: true,
                chromaSubsampling: '4:4:4'
            })
            .toBuffer();

        res.setHeader('Content-Type', 'image/webp');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        return res.status(200).send(finalImageBuffer);

    } catch (error) {
        console.error('General error in generateCertificateTwo2 function:', error);
        console.error('Error stack trace:', error.stack);
        
        // رسائل خطأ أكثر تحديداً لمساعدتك في Debugging
        if (error.message.includes('Input file is missing')) {
            return res.status(500).json({
                error: 'صورة الشهادة (wwee.png) مفقودة. يرجى التحقق من مجلد public/images/full.',
                details: error.message,
                path: CERTIFICATE_IMAGE_PATH
            });
        }
        // يمكننا إضافة المزيد من التشخيص هنا إذا لم ينجح الحل
        return res.status(500).json({
            error: `حدث خطأ أثناء توليد الشهادة. يرجى التحقق من سجلات الخادم: ${error.message}`,
            details: error.message,
            stack: error.stack
        });
    }
}