// api/generateCertificateTwo2.js
// هذا الملف يستخدم الآن ES Module syntax

import { MongoClient, ObjectId } from 'mongodb'; // هذه المكتبة لم تعد ضرورية للنص الثابت ولكن تم إبقاؤها لتجنب الأخطاء إذا كانت مستخدمة في مكان آخر
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

// **ملاحظة هامة:** MONGODB_URI لم تعد ضرورية لعرض نص ثابت ولكن تم إبقاؤها لتجنب الأخطاء إذا كانت مستخدمة في مكان آخر
const uri = process.env.MONGODB_URI;
const dbName = 'Cluster0';
const collectionName = 'enrolled_students_tbl';

// **مسار صورة الشهادة:**
const CERTIFICATE_IMAGE_PATH = path.join(process.cwd(), 'public', 'images', 'full', 'wwee.png');

// **مسار الخط الجديد (Arial):**
const FONT_FILENAME = 'arial.ttf'; // <--- تأكد من وجود ملف arial.ttf في public/fonts/
const FONT_PATH = path.join(process.cwd(), 'public', 'fonts', FONT_FILENAME);

// **اسم الخط للاستخدام في CSS:**
const FONT_CSS_FAMILY_NAME = 'Arial'; // الاسم الشائع لخط Arial

// تعريف ألوان النصوص
const RED_COLOR_HEX = '#FF0000';    // أحمر
const BLUE_COLOR_HEX = '#0000FF';   // أزرق
const GREEN_COLOR_HEX = '#00FF00';  // أخضر

// تعريف إحداثيات ومواصفات نصوص الترحيب
// **هذه الإحداثيات (x, y) هي قيم تقديرية. يجب عليك تعديلها بعناية لتناسب تصميم شهادتك (wwee.png).**
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
 * @param {string} text - النص المراد عرضه.
 * @param {number} fontSize - حجم الخط بالبكسل.
 * @param {string} color - لون النص (مثال: '#FF0000').
 * @param {number} svgWidth - العرض الكلي لمساحة النص (يجب أن يكون عرض الصورة).
 * @param {number} svgHeight - الارتفاع الكلي لمساحة النص.
 * @param {string} gravity - محاذاة النص ('center', 'west', 'east').
 * @param {Buffer} fontBuffer - بيانات ملف الخط (buffer).
 * @param {string} fontCssFamilyName - الاسم الذي سيتم استخدامه للخط.
 * @returns {Buffer} - كائن Buffer يحتوي على بيانات النص.
 */
async function createSharpTextBuffer(text, fontSize, color, svgWidth, svgHeight, gravity, fontBuffer, fontCssFamilyName) {
    return sharp({
        text: {
            text: `<span foreground="${color}">${text}</span>`, // استخدام span لتطبيق اللون
            font: fontCssFamilyName, // اسم الخط
            fontfile: FONT_PATH, // مسار ملف الخط
            width: svgWidth, // عرض المساحة المتاحة للنص
            height: svgHeight, // ارتفاع المساحة المتاحة للنص
            align: gravity === 'center' ? 'centre' : (gravity === 'west' ? 'left' : 'right'),
            rgba: true // يجب أن تكون true لاستخدام الألوان في Pango Markup
        }
    }).png().toBuffer();
}


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
        const imageHeight = metadata.height; // احصل على ارتفاع الصورة أيضاً

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


        // --- إضافة نصوص الترحيب إلى الصورة باستخدام sharp.text() ---
        for (const key in GREETING_POSITIONS) {
            const pos = GREETING_POSITIONS[key];

            // تحديد ارتفاع مناسب لمربع النص لضمان ظهور النص كاملاً
            const textHeight = pos.fontSize * 2; // ضعف حجم الخط كارتفاع تقريبي للمربع

            const textOverlayBuffer = await createSharpTextBuffer(
                pos.text,
                pos.fontSize,
                pos.color,
                imageWidth, // عرض النص بالكامل هو عرض الصورة
                textHeight, // الارتفاع الذي حسبناه
                pos.gravity,
                fontBuffer,
                FONT_CSS_FAMILY_NAME
            );

            // تركيب النص كـ overlay
            processedImage = await processedImage.composite([{
                input: textOverlayBuffer,
                left: pos.x,
                top: pos.y,
                blend: 'overlay'
            }]);
        }

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