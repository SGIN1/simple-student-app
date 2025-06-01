// api/generateCertificateTwo2.js
// تأكد من وجود ملفاتك:
// public/images/full/wwee.png
// public/fonts/arial.ttf

import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

const CERTIFICATE_IMAGE_PATH = path.join(process.cwd(), 'public', 'images', 'full', 'wwee.png');
const FONT_FILENAME = 'arial.ttf';
const FONT_PATH = path.join(process.cwd(), 'public', 'fonts', FONT_FILENAME);
const FONT_CSS_FAMILY_NAME = 'Arial'; // يجب أن يكون هذا الاسم هو نفسه داخل ملف الخط (ttf)

const RED_COLOR_HEX = '#FF0000';
const BLUE_COLOR_HEX = '#0000FF';
const GREEN_COLOR_HEX = '#00FF00';

const GREETING_POSITIONS = {
    GREETING1: { text: "أهلاً وسهلاً بكم!", x: 0, y: 400, fontSize: 70, color: RED_COLOR_HEX, gravity: 'center' },
    GREETING2: { text: "نتمنى لكم يوماً سعيداً.", x: 50, y: 550, fontSize: 50, color: BLUE_COLOR_HEX, gravity: 'west' },
    GREETING3: { text: "شكراً لزيارتكم.", x: 0, y: 700, fontSize: 40, color: GREEN_COLOR_HEX, gravity: 'east' }
};

/**
 * دالة مساعدة لإنشاء نص كـ Buffer لـ sharp باستخدام SVG مع الخط المضمن.
 * هذه هي الطريقة الأكثر موثوقية لتطبيق الخط والألوان مع Sharp.
 */
async function createSharpTextBuffer(text, fontSize, color, svgWidth, svgHeight, gravity, fontBuffer, fontCssFamilyName) {
    // تحديد محاذاة النص داخل SVG
    const textAnchor = gravity === 'center' ? 'middle' : (gravity === 'west' ? 'start' : 'end');
    const xPosition = gravity === 'center' ? svgWidth / 2 : (gravity === 'west' ? 0 : svgWidth);

    // بناء SVG النصي مع تضمين الخط كـ Base64
    const svgText = `<svg width="${svgWidth}" height="${svgHeight}">
        <style>
            @font-face {
                font-family: '${fontCssFamilyFamilyName}';
                src: url('data:font/ttf;base64,${fontBuffer.toString('base64')}') format('truetype');
            }
            text {
                font-family: '${fontCssFamilyName}', sans-serif;
                font-size: ${fontSize}px;
                fill: ${color};
                dominant-baseline: middle;
                text-anchor: ${textAnchor};
            }
        </style>
        <text x="${xPosition}" y="${svgHeight / 2}">
            ${text}
        </text>
    </svg>`;
    
    return sharp(Buffer.from(svgText))
        .png() // نحول SVG إلى PNG مؤقتًا لدمجه كطبقة
        .toBuffer();
}

/**
 * وظيفة Vercel Serverless Function لإنشاء الشهادة.
 */
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // التحقق من وجود صورة الشهادة الأساسية
        try {
            await fs.access(CERTIFICATE_IMAGE_PATH);
        } catch (fileError) {
            console.error('خطأ: صورة الشهادة الأساسية غير موجودة:', fileError.message);
            return res.status(500).json({
                error: 'صورة الشهادة الأساسية غير موجودة أو لا يمكن الوصول إليها. يرجى التحقق من مسار ملف الصورة في النشر.',
                details: fileError.message,
                path: CERTIFICATE_IMAGE_PATH
            });
        }

        const baseImage = sharp(CERTIFICATE_IMAGE_PATH);
        let metadata = await baseImage.metadata();
        let imageWidth = metadata.width;
        let imageHeight = metadata.height;

        let processedImage = baseImage;

        // التحقق من وجود ملف الخط
        let fontBuffer;
        try {
            fontBuffer = await fs.readFile(FONT_PATH);
        } catch (fontError) {
            console.error('خطأ: ملف الخط غير موجود أو لا يمكن الوصول إليه:', fontError.message);
            return res.status(500).json({
                error: 'ملف الخط غير موجود أو لا يمكن الوصول إليه. يرجى التأكد من وضعه في المسار الصحيح وتضمينه في النشر.',
                details: fontError.message,
                path: FONT_PATH
            });
        }
        
        // إضافة نصوص الترحيب إلى الصورة
        for (const key in GREETING_POSITIONS) {
            const pos = GREETING_POSITIONS[key];
            const textHeight = pos.fontSize * 2; // مساحة كافية للنص داخل SVG

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

            // تركيب النص كـ overlay
            processedImage = await processedImage.composite([{
                input: textOverlayBuffer,
                left: pos.x,
                top: pos.y,
                blend: 'over' // لضمان ظهور النص بوضوح فوق الخلفية
            }]);
        }

        // توليد الصورة النهائية بصيغة WebP لتحسين الأداء ومنع الوميض
        const finalImageBuffer = await processedImage
            .webp({
                quality: 85,         // جودة ممتازة
                nearLossless: true,  // يحافظ على وضوح النصوص والتفاصيل
                chromaSubsampling: '4:4:4' // يحافظ على دقة الألوان
            })
            .toBuffer();

        // تعيين Headers للاستجابة
        res.setHeader('Content-Type', 'image/webp');
        // Cache-Control: يخزن الصورة مؤقتًا لمدة سنة، مما يسرع التحميل للمرات القادمة.
        // استخدم 'public, max-age=3600, stale-while-revalidate=86400' إذا كانت الشهادات قد تتغير لنفس الـ ID.
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

        return res.status(200).send(finalImageBuffer);

    } catch (error) {
        console.error('خطأ عام في وظيفة generateCertificateTwo2:', error);
        console.error('تتبع الخطأ:', error.stack);
        // رسائل خطأ مفيدة للمساعدة في Debugging
        if (error.message.includes('fontconfig') || error.message.includes('freetype')) {
            return res.status(500).json({
                error: 'خطأ في معالجة الخطوط. تأكد من تهيئة Vercel لدعم Sharp والخطوط.',
                details: error.message,
                stack: error.stack
            });
        }
        if (error.message.includes('Input file is missing')) {
            return res.status(500).json({
                error: 'صورة الشهادة (wwee.png) غير موجودة. تحقق من مجلد public/images/full.',
                details: error.message,
                path: CERTIFICATE_IMAGE_PATH
            });
        }
        return res.status(500).json({
            error: 'حدث خطأ أثناء توليد الشهادة. يرجى مراجعة سجلات الخادم.',
            details: error.message,
            stack: error.stack
        });
    }
}