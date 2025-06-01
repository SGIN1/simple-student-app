// api/generateCertificateTwo2.js
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
const RED_COLOR_HEX = '#FF0000';     // أحمر
const BLUE_COLOR_HEX = '#0000FF';    // أزرق
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
 * دالة مساعدة لإنشاء طبقة نص كـ Buffer لـ sharp.
 * **مهم: سنقوم بإنشاء نص SVG بدلاً من PNG هنا، وsharp سيتعامل مع SVG مباشرة.**
 */
async function createSharpSvgText(text, fontSize, color, svgWidth, svgHeight, gravity, fontCssFamilyName) {
    // Sharp can directly composite SVG text.
    // The font needs to be available to sharp/Pango.
    // Ensure fontfile is specified.
    const pangoAlign = gravity === 'center' ? 'centre' : (gravity === 'west' ? 'left' : 'right');

    const svgText = `
        <svg width="${svgWidth}" height="${svgHeight}">
            <style>
                @font-face {
                    font-family: '${fontCssFamilyName}';
                    src: url('file://${FONT_PATH}');
                }
                text {
                    font-family: '${fontCssFamilyName}';
                    font-size: ${fontSize}px;
                    fill: ${color};
                    text-anchor: ${gravity === 'center' ? 'middle' : (gravity === 'west' ? 'start' : 'end')};
                }
            </style>
            <text x="${gravity === 'center' ? svgWidth / 2 : (gravity === 'west' ? 0 : svgWidth)}" y="${fontSize}">${text}</text>
        </svg>
    `;
    return Buffer.from(svgText);
}


/**
 * وظيفة Vercel Serverless Function لإنشاء الشهادة.
 *
 * @param {Object} req - كائن الطلب (HTTP request).
 * @param {Object} res - كائن الاستجابة (HTTP response).
 */
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed', message: 'Only GET requests are allowed for certificate generation.' });
    }

    try {
        // 1. التحقق من وجود صورة الشهادة
        try {
            await fs.access(CERTIFICATE_IMAGE_PATH);
            console.log('صورة الشهادة موجودة في المسار المحدد:', CERTIFICATE_IMAGE_PATH);
        } catch (fileError) {
            console.error('خطأ: صورة الشهادة غير موجودة أو لا يمكن الوصول إليها:', fileError.message);
            return res.status(500).json({
                error: 'Certificate image not found or inaccessible.',
                details: fileError.message,
                path: CERTIFICATE_IMAGE_PATH,
                fix: 'Please ensure "wwee.png" exists at the specified path and is included in your deployment artifacts.'
            });
        }

        // 2. قراءة صورة الشهادة الأساسية
        const baseImage = sharp(CERTIFICATE_IMAGE_PATH);
        let metadata = await baseImage.metadata();
        let imageWidth = metadata.width;
        let imageHeight = metadata.height;

        let processedImage = baseImage;

        // **تصغير أبعاد الصورة إذا كانت أكبر من اللازم (اختياري ولكن موصى به):**
        // هذا يساعد في تقليل حجم بيانات البكسل التي يجب على المتصفح معالجتها،
        // مما يحسن الأداء والتحميل، خاصة على الشبكات البطيئة.
        const MAX_IMAGE_WIDTH = 2000; // جرب 1500 أو 2500 حسب الدقة المطلوبة
        if (imageWidth > MAX_IMAGE_WIDTH) {
            processedImage = processedImage.resize({ width: MAX_IMAGE_WIDTH });
            // تحديث الأبعاد بعد التصغير لضمان دقة تحديد مواقع النصوص
            metadata = await processedImage.metadata();
            imageWidth = metadata.width;
            imageHeight = metadata.height;
            console.log(`تم تصغير أبعاد الشهادة إلى: ${imageWidth}x${imageHeight} لتحسين الأداء.`);
        }

        // 3. التحقق من وجود ملف الخط (Sharp يتعامل مع الخطوط بشكل أفضل عند استخدام SVG)
        try {
            await fs.access(FONT_PATH);
            console.log('ملف الخط موجود:', FONT_PATH);
        } catch (fontError) {
            console.error('خطأ: ملف الخط غير موجود أو لا يمكن الوصول إليه:', fontError.message);
            return res.status(500).json({
                error: 'Font file not found or inaccessible.',
                details: fontError.message,
                path: FONT_PATH,
                fix: 'Please ensure "arial.ttf" exists at the specified path and is included in your deployment artifacts.'
            });
        }

        // --- إضافة نصوص الترحيب إلى الصورة باستخدام sharp.composite() ---
        // سنقوم بإنشاء مصفوفة لطبقات التركيب (composites)
        const composites = [];

        for (const key in GREETING_POSITIONS) {
            const pos = GREETING_POSITIONS[key];
            // SVG height needs to accommodate the text. A simple fontSize * 1.5 is a start.
            const svgHeight = pos.fontSize * 1.5; 

            // إنشاء طبقة نص SVG كـ Buffer
            const textSvgBuffer = await createSharpSvgText(
                pos.text,
                pos.fontSize,
                pos.color,
                imageWidth, // عرض النص بالكامل هو عرض الصورة لتسهيل المحاذاة الأفقية
                svgHeight,
                pos.gravity,
                FONT_CSS_FAMILY_NAME
            );

            // إضافة طبقة النص إلى مصفوفة composites
            composites.push({
                input: textSvgBuffer,
                left: pos.x,
                top: pos.y,
                blend: 'over' // 'over' هو الأكثر شيوعاً لوضع طبقة فوق أخرى
            });
        }

        // تركيب جميع الطبقات مرة واحدة
        if (composites.length > 0) {
            processedImage = processedImage.composite(composites);
        }

        // 4. توليد الصورة النهائية PNG مع خيارات منع التدرج وتحسين الجودة
        const finalImageBuffer = await processedImage
            .png({
                quality: 90,        // جودة الصورة (من 1 إلى 100). 90 عادة ما تكون جيدة.
                progressive: false, // **هذا هو الإعداد الحاسم لمنع التحميل التدريجي (الوميض).**
                compressionLevel: 9 // أعلى مستوى ضغط ممكن لـ PNG (من 0 إلى 9)
            })
            .toBuffer();

        // إرسال الصورة كاستجابة
        res.setHeader('Content-Type', 'image/png');
        // التحكم في الكاش (Cache-Control) لضمان أن المتصفح لا يحتفظ بنسخة قديمة إذا تغيرت
        // إذا كان معرف الشهادة (ID) فريدًا، يمكن استخدام "immutable"
        // إذا كانت الشهادة قد تتغير لنفس ID، استخدم 'no-cache, no-store, must-revalidate'
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        return res.status(200).send(finalImageBuffer);

    } catch (error) {
        console.error('خطأ عام في وظيفة generateCertificateTwo2:', error);
        console.error('تتبع الخطأ:', error.stack);

        let errorMessage = 'An unexpected error occurred while generating the certificate.';
        if (error.message.includes('fontconfig') || error.message.includes('freetype')) {
            errorMessage = 'Font processing error. Your deployment environment might not support Fontconfig/FreeType. Ensure necessary libraries are installed.';
        } else if (error.message.includes('Input file is missing')) {
            errorMessage = 'Input certificate image file is missing.';
        } else if (error.message.includes('Cannot read property')) {
            errorMessage = 'Error accessing image metadata or processing properties. Check image file integrity.';
        }

        return res.status(500).json({
            error: errorMessage,
            details: error.message,
            stack: error.stack
        });
    }
}