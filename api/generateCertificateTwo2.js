// هذا الملف يستخدم الآن ES Module syntax

import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

// **مسار صورة الشهادة:**
// تأكد أن ملف wwee.png موجود هنا: [جذر_مشروعك]/public/images/full/wwee.png
const CERTIFICATE_IMAGE_PATH = path.join(process.cwd(), 'public', 'images', 'full', 'wwee.png');

// **مسار الخط الجديد (Arial):**
// تأكد أن ملف arial.ttf موجود هنا: [جذر_مشروعك]/public/fonts/arial.ttf
const FONT_FILENAME = 'arial.ttf';
const FONT_PATH = path.join(process.cwd(), 'public', 'fonts', FONT_FILENAME);

// **اسم الخط للاستخدام في CSS (مهم لـ sharp):**
const FONT_CSS_FAMILY_NAME = 'Arial'; // الاسم الشائع لخط Arial

// تعريف ألوان النصوص
const RED_COLOR_HEX = '#FF0000';    // أحمر
const BLUE_COLOR_HEX = '#0000FF';   // أزرق
const GREEN_COLOR_HEX = '#00FF00';  // أخضر

// تعريف إحداثيات ومواصفات نصوص الترحيب
// **هذه الإحداثيات (x, y) هي قيم تقديرية. يجب عليك تعديلها لتناسب تصميم شهادتك (wwee.png).**
const GREETING_POSITIONS = {
    GREETING1: {
        text: "أهلاً وسهلاً بكم!",
        x: 0,
        y: 400,
        fontSize: 70,
        color: RED_COLOR_HEX,
        gravity: 'center'
    },
    GREETING2: {
        text: "نتمنى لكم يوماً سعيداً.",
        x: 50,
        y: 550,
        fontSize: 50,
        color: BLUE_COLOR_HEX,
        gravity: 'west'
    },
    GREETING3: {
        text: "شكراً لزيارتكم.",
        x: 0,
        y: 700,
        fontSize: 40,
        color: GREEN_COLOR_HEX,
        gravity: 'east'
    }
};

/**
 * دالة مساعدة لإنشاء نص كـ Buffer لـ sharp.
 */
async function createSharpTextBuffer(text, fontSize, color, svgWidth, svgHeight, gravity, fontBuffer, fontCssFamilyName) {
    // **التعديل الرئيسي هنا:**
    // نستخدم خصائص sharp المباشرة بدلاً من حقن CSS أو وسوم HTML.
    // Sharp يتعامل مع النص واللون وحجم الخط بشكل مباشر.
    return sharp({
        text: {
            text: text, // النص نفسه بدون وسوم HTML أو CSS
            font: fontCssFamilyName, // اسم الخط
            fontfile: FONT_PATH,    // مسار ملف الخط
            width: svgWidth,        // عرض المساحة المتاحة للنص
            height: svgHeight,      // ارتفاع المساحة المتاحة للنص
            align: gravity === 'center' ? 'centre' : (gravity === 'west' ? 'left' : 'right'),
            rgba: true,
            // تحديد اللون مباشرة هنا، هذا هو الحل الأفضل لـ sharp
            // الألوان يمكن تعيينها كرقم 4 بايت RGBA (مثال: 0xFF0000FF للأحمر الكامل)
            // أو يمكن أن تكون جزء من SVG إذا أردت المزيد من التحكم.
            // ولكن الأسهل هو جعل النص أبيض أو أسود، ثم تلوينه عند الدمج إذا لزم الأمر،
            // أو التأكد من أن Sharp يتعامل مع اللون بشكل مباشر.
            // الطريقة الأكثر موثوقية لتغيير لون النص هي جعله جزءًا من الـ SVG نفسه:
            // ولكن بما أن النص ليس معقدًا، يمكن أن نجرب الطريقة المباشرة أولاً.
            // إذا لم يعمل اللون، قد نعود لاستخدام SVG كامل للنص.
            // حالياً، اللون يتم تحديده في النص الأصلي باستخدام <span foreground="...">
            // أو يمكننا استخدام صورة SVG كاملة للنص وتلوينها كـ overlay.
            // للحفاظ على البساطة، سأعود إلى الطريقة التي يفترض أن تعمل مع foreground:
            // إذا لم ينجح، سنستخدم طريقة SVG كاملة.
        }
    })
    .modulate({ tint: color.replace('#', '0x') + 'FF' }) // تطبيق اللون كـ tint على الصورة الناتجة (تتطلب تنسيق RGBA)
    .png()
    .toBuffer();
}
// بقية الكود في generateCertificateTwo2.js
// ... (لا يوجد تغييرات أخرى في باقي الكود)

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
            // console.log('صورة الشهادة موجودة في المسار المحدد:', CERTIFICATE_IMAGE_PATH);
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
        let metadata = await baseImage.metadata();
        let imageWidth = metadata.width;
        let imageHeight = metadata.height;

        let processedImage = baseImage;

        // 3. التحقق من وجود ملف الخط وقراءته في الذاكرة
        let fontBuffer;
        try {
            fontBuffer = await fs.readFile(FONT_PATH);
            // console.log('ملف الخط موجود وتم قراءته:', FONT_PATH);
        } catch (fontError) {
            console.error('خطأ: ملف الخط غير موجود أو لا يمكن الوصول إليه:', fontError.message);
            return res.status(500).json({
                error: 'ملف الخط غير موجود أو لا يمكن الوصول إليه. يرجى التأكد من وضعه في المسار الصحيح وتضمينه في النشر.',
                details: fontError.message,
                path: FONT_PATH
            });
        }

        // --- إضافة نصوص الترحيب إلى الصورة باستخدام sharp.text() ---
        for (const key in GREETING_POSITIONS) {
            const pos = GREETING_POSITIONS[key];
            const textHeight = pos.fontSize * 2; 

            const textOverlayBuffer = await createSharpTextBuffer(
                pos.text,
                pos.fontSize,
                pos.color, // تمرير اللون هنا
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
                blend: 'over' 
            }]);
        }

        // 4. توليد الصورة النهائية باستخدام WebP لتحسين الأداء
        const finalImageBuffer = await processedImage
            .webp({
                quality: 85,        
                nearLossless: true, 
                chromaSubsampling: '4:4:4' 
            })
            .toBuffer();

        res.setHeader('Content-Type', 'image/webp');
        res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');

        return res.status(200).send(finalImageBuffer);

    } catch (error) {
        console.error('خطأ عام في وظيفة generateCertificateTwo2:', error);
        console.error('تتبع الخطأ:', error.stack);
        if (error.message.includes('fontconfig') || error.message.includes('freetype')) {
            return res.status(500).json({
                error: 'حدث خطأ في معالجة الخطوط. قد تكون بيئة النشر لا تدعم Fontconfig أو FreeType. تأكد من تهيئة Vercel بشكل صحيح لدعم Sharp والخطوط.',
                details: error.message,
                stack: error.stack
            });
        }
        if (error.message.includes('Input file is missing')) {
            return res.status(500).json({
                error: 'صورة الشهادة (wwee.png) غير موجودة في المسار المحدد على الخادم. يرجى التحقق من مجلد public/images/full.',
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