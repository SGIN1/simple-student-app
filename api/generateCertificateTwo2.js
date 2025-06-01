// api/generateCertificateTwo2.js

import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

// المسارات الثابتة للملفات
const CERTIFICATE_IMAGE_PATH = path.join(process.cwd(), 'public', 'images', 'full', 'wwee.png');
const FONT_FILENAME = 'arial.ttf'; // تأكد من هذا الاسم يطابق تماماً ملفك
const FONT_PATH = path.join(process.cwd(), 'public', 'fonts', FONT_FILENAME);

// تعريف ألوان النصوص
const RED_COLOR_HEX = '#FF0000';    // أحمر
const BLUE_COLOR_HEX = '#0000FF';   // أزرق
const GREEN_COLOR_HEX = '#00FF00';  // أخضر

// تعريف إحداثيات ومواصفات نصوص الترحيب على الشهادة
// (هذه القيم تقديرية، قد تحتاج لتعديلها لتناسب تصميم شهادتك بالضبط)
const GREETING_POSITIONS = {
    // القيم x و y هنا ستكون هي إحداثيات وضع طبقة النص الناتجة من sharp.text()
    // وليس إحداثيات داخل SVG. قد تحتاج لتعديلها قليلاً بعد التجربة.
    GREETING1: { text: "أهلاً وسهلاً بكم!", x: 0, y: 400, fontSize: 70, color: RED_COLOR_HEX, gravity: 'center' },
    GREETING2: { text: "نتمنى لكم يوماً سعيداً.", x: 50, y: 550, fontSize: 50, color: BLUE_COLOR_HEX, gravity: 'west' },
    GREETING3: { text: "شكراً لزيارتكم.", x: 0, y: 700, fontSize: 40, color: GREEN_COLOR_HEX, gravity: 'east' }
};

/**
 * دالة مساعدة لإنشاء نص كـ Buffer لـ sharp باستخدام sharp.text().
 * هذا يتجاوز مشاكل Fontconfig بالكامل.
 * @param {string} text - النص المراد عرضه.
 * @param {number} fontSize - حجم الخط بالبكسل.
 * @param {string} color - لون النص (مثال: '#FF0000').
 * @param {Buffer} fontBuffer - محتوى ملف الخط كـ Buffer.
 * @returns {Promise<Buffer>} - Buffer لصورة PNG تحتوي على النص.
 */
async function createSharpTextBuffer(text, fontSize, color, fontBuffer) {
    return sharp({
        text: {
            text: text,
            font: FONT_PATH, // يحدد مسار ملف الخط مباشرة
            fontFile: fontBuffer, // يمرر الـ Buffer الخاص بالخط
            width: 2000, // عرض تقديري كبير بما يكفي للنص، سيتم اقتصاصه لاحقًا
            height: fontSize * 2, // ارتفاع تقديري
            align: 'center', // المحاذاة داخل مربع النص، يمكن أن تكون 'center', 'left', 'right'
            rgba: true // لتمكين الشفافية والألوان الكاملة
        }
    })
    .resize({
        // يمكننا استخدام resize لضبط الحجم النهائي للصورة النصية
        // أو نتركها لتحديد sharp الحجم الأنسب تلقائيًا.
        // عادة ما ينتج sharp.text صورة بالحجم المناسب للنص.
        // يمكننا إزالة هذا الـ resize إذا لم يكن ضروريًا
    })
    .png() // تحويل النص إلى صورة PNG مع خلفية شفافة
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
        
        // مصفوفة لتخزين طبقات النصوص
        const textOverlays = [];

        for (const key in GREETING_POSITIONS) {
            const pos = GREETING_POSITIONS[key];
            
            // توليد صورة النص باستخدام sharp.text()
            const textImageBuffer = await createSharpTextBuffer(
                pos.text,
                pos.fontSize,
                pos.color,
                fontBuffer // نمرر الـ Buffer الخاص بالخط مباشرة
            );

            // نحتاج الآن لمعرفة أبعاد الصورة النصية التي تم إنشاؤها لضبط الإحداثيات
            const textMetadata = await sharp(textImageBuffer).metadata();
            const textWidth = textMetadata.width;
            const textHeight = textMetadata.height;

            let finalX = pos.x;
            let finalY = pos.y;

            // ضبط إحداثيات X بناءً على المحاذاة بعد معرفة عرض النص الفعلي
            if (pos.gravity === 'center') {
                finalX = (imageWidth - textWidth) / 2;
            } else if (pos.gravity === 'east') {
                finalX = imageWidth - textWidth - pos.x; // pos.x هنا يصبح هامش من اليمين
            }
            // إذا كانت 'west' فـ finalX = pos.x (كما هو في الأصل)

            textOverlays.push({
                input: textImageBuffer,
                left: Math.max(0, finalX), // تأكد ألا تكون خارج حدود الصورة
                top: Math.max(0, finalY),  // تأكد ألا تكون خارج حدود الصورة
                blend: 'over'
            });
        }

        // دمج جميع طبقات النصوص مرة واحدة
        processedImage = await processedImage.composite(textOverlays);

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
        
        return res.status(500).json({
            error: `حدث خطأ أثناء توليد الشهادة: ${error.message}`,
            details: error.message,
            stack: error.stack
        });
    }
}