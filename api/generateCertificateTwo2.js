// api/generateCertificateTwo2.js
// هذا الملف يستخدم الآن ES Module syntax

import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

// **مسار صورة الشهادة:**
const CERTIFICATE_IMAGE_PATH = path.join(process.cwd(), 'public', 'images', 'full', 'wwee.png');

// **مسار الخط الجديد (Arial):**
const FONT_FILENAME = 'arial.ttf'; // <--- تأكد من وجود ملف arial.ttf في public/fonts/
const FONT_PATH = path.join(process.cwd(), 'public', 'fonts', FONT_FILENAME);

// تعريف ألوان النصوص
const RED_COLOR_HEX = '#FF0000';    // أحمر
const BLUE_COLOR_HEX = '#0000FF';   // أزرق
const GREEN_COLOR_HEX = '#00FF00';  // أخضر

// تعريف إحداثيات ومواصفات نصوص الترحيب
// **هذه الإحداثيات (x, y) هي قيم تقديرية. يجب عليك تعديلها بعناية لتناسب تصميم شهادتك (wwee.png).**
const GREETING_POSITIONS = {
    GREETING1: { 
        text: "أهلاً وسهلاً بكم!", 
        x: 500, // منتصف الصورة أفقياً
        y: 300, // أعلى قليلاً
        fontSize: 70, 
        color: RED_COLOR_HEX, 
        gravity: 'center' // استخدام gravity بدلاً من left/middle/right للتحكم بوضع النص
    },
    GREETING2: { 
        text: "نتمنى لكم يوماً سعيداً.", 
        x: 100, // جهة اليسار
        y: 450, // أسفل قليلاً
        fontSize: 50, 
        color: BLUE_COLOR_HEX, 
        gravity: 'west' // West يعني اليسار
    },
    GREETG3: { 
        text: "شكراً لزيارتكم.", 
        x: 900, // جهة اليمين
        y: 600, // أسفل أكثر
        fontSize: 40, 
        color: GREEN_COLOR_HEX, 
        gravity: 'east' // East يعني اليمين
    }
};

/**
 * وظيفة Vercel Serverless Function لإنشاء الشهادة.
 *
 * @param {Object} req - كائن الطلب (HTTP request).
 * @param {Object} res - كائن الاستجابة (HTTP response).
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

        let processedImage = baseImage;

        // --- إضافة نصوص الترحيب إلى الصورة باستخدام sharp.text() ---
        for (const key in GREETING_POSITIONS) {
            const pos = GREETING_POSITIONS[key];
            
            // استخدام sharp.text لإنشاء نص كـ Buffer
            // يتطلب sharp v0.28.0+ و librsvg2-dev
            const textOverlay = await sharp({
                text: {
                    text: `<span foreground="${pos.color}">${pos.text}</span>`,
                    font: 'Arial', // يجب أن يكون هذا اسم الخط الذي يتعرف عليه النظام أو sharp
                    fontfile: FONT_PATH, // مسار ملف الخط
                    width: imageWidth, // عرض المساحة المتاحة للنص
                    height: pos.fontSize * 2, // ارتفاع افتراضي لمساحة النص
                    align: pos.gravity === 'center' ? 'centre' : (pos.gravity === 'west' ? 'left' : 'right'),
                    rgba: true // يجب أن تكون true لاستخدام الألوان
                }
            }).png().toBuffer();

            // تركيب النص كـ overlay
            processedImage = await processedImage.composite([{ 
                input: textOverlay, 
                left: pos.x, 
                top: pos.y, 
                blend: 'overlay' 
            }]);
        }

        // إخراج الصورة النهائية
        const finalImageBuffer = await processedImage.png().toBuffer();

        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');
        return res.status(200).send(finalImageBuffer);

    } catch (error) {
        console.error('خطأ عام في وظيفة generateCertificateTwo2:', error);
        console.error('تتبع الخطأ:', error.stack);

        // إذا كان الخطأ يتعلق بـ Fontconfig أو Freetype، قم بتوضيح ذلك
        if (error.message.includes('fontconfig') || error.message.includes('freetype')) {
            return res.status(500).json({
                error: 'حدث خطأ في معالجة الخطوط. قد تكون بيئة النشر لا تدعم Fontconfig أو FreeType بالشكل المطلوب لخطوط مخصصة.',
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