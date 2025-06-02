// api/generateCertificateTwo2.js
// هذا الملف يستخدم الآن ES Module syntax

import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises'; // لـ fs.access و fs.readFile

// ----------------------------------------------------
// **تعريفات المتغيرات والثوابت**
// ----------------------------------------------------

// **مسار صورة الشهادة:**
const CERTIFICATE_IMAGE_PATH = path.join(process.cwd(), 'public', 'images', 'full', 'wwee.jpg');

// **مسار الخط (Arial):**
const FONT_FILENAME = 'arial.ttf'; // <--- تأكد من وجود ملف arial.ttf في public/fonts/
const FONT_PATH = path.join(process.cwd(), 'public', 'fonts', FONT_FILENAME);

// **اسم الخط للاستخدام في CSS داخل SVG:**
const FONT_CSS_FAMILY_NAME = 'Arial'; // يجب أن يتطابق مع الاسم في ملف الخط نفسه

// تعريف ألوان النصوص
const RED_COLOR_HEX = '#FF0000';    // أحمر
const BLUE_COLOR_HEX = '#0000FF';   // أزرق
const GREEN_COLOR_HEX = '#00FF00';  // أخضر
const BLACK_COLOR_HEX = '#000000';  // أسود

// تعريف إحداثيات ومواصفات نصوص الترحيب
// تم ضبط هذه القيم لتناسب الأبعاد الفعلية لشهادتك (العرض: 1030 بكسل، الارتفاع: 727 بكسل).
// قد تحتاج إلى تعديلات دقيقة لهذه القيم (y, fontSize) بناءً على تصميم شهادتك بالضبط.
const GREETING_POSITIONS = {
    GREETING1: {
        text: "أهلاً وسهلاً بكم!",
        x: 0,
        y: 80,
        fontSize: 40,
        color: RED_COLOR_HEX,
        gravity: 'center'
    },
    GREETED_NAME: {
        text: "محمد أحمد علي", // سيتم استبداله ببيانات الطالب الفعلية
        x: 0,
        y: 180,
        fontSize: 55,
        color: BLACK_COLOR_HEX,
        gravity: 'center'
    },
    GREETING2: {
        text: "نتمنى لكم يوماً سعيداً.",
        x: 50,
        y: 300,
        fontSize: 30,
        color: BLUE_COLOR_HEX,
        gravity: 'west'
    },
    GREETING3: {
        text: "شكراً لزيارتكم.",
        x: 0,
        y: 450,
        fontSize: 25,
        color: GREEN_COLOR_HEX,
        gravity: 'east'
    }
};

/**
 * دالة مساعدة لإنشاء نص كـ Buffer لـ sharp من SVG.
 * تم تحسينها لضمان دعم الخط العربي وإزالة المسافات البيضاء.
 */
async function createSharpTextBuffer(text, fontSize, color, svgWidth, svgHeight, gravity, fontBuffer, fontCssFamilyName) {
    let textAnchor = 'middle';
    let xPosition = svgWidth / 2;

    if (gravity === 'west') {
        textAnchor = 'start';
        xPosition = 0; // سيبدأ من اليسار (x=0)
    } else if (gravity === 'east') {
        textAnchor = 'end';
        xPosition = svgWidth; // سينتهي عند اليمين (x=svgWidth)
    }

    // بناء SVG النصي مع تضمين الخط (ttf) مباشرة كـ Base64
    // تم تضمين الخط كـ Base64 لضمان أن الـ SVG يمكنه استخدامه.
    const svgText = `
        <svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">
            <style>
                @font-face {
                    font-family: '${fontCssFamilyName}';
                    src: url('data:font/ttf;base64,${fontBuffer.toString('base64')}') format('truetype');
                }
                text {
                    font-family: '${fontCssFamilyName}', sans-serif;
                    font-size: ${fontSize}px;
                    fill: ${color};
                    text-anchor: ${textAnchor};
                    dominant-baseline: middle; /* لمحاذاة النص عموديًا في المنتصف */
                    direction: rtl; /* لدعم اللغة العربية */
                }
            </style>
            <text x="${xPosition}" y="${svgHeight / 2}">${text}</text>
        </svg>
    `.trim(); // استخدام .trim() لإزالة المسافات البيضاء والأسطر الجديدة الزائدة

    // تحويل SVG إلى صورة (PNG مؤقتة) يمكن لـ Sharp دمجها بسهولة كطبقة
    return sharp(Buffer.from(svgText)).png().toBuffer();
}

// ----------------------------------------------------
// **وظيفة Vercel Serverless Function**
// ----------------------------------------------------

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // يمكنك استخراج الـ studentId هنا إذا كنت تخطط لعرض بيانات طالب حقيقية
    // const { id: studentId } = req.query;

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

        // 2. قراءة صورة الشهادة الأساسية والحصول على أبعادها تلقائياً
        const baseImage = sharp(CERTIFICATE_IMAGE_PATH);
        const metadata = await baseImage.metadata();
        const imageWidth = metadata.width;
        const imageHeight = metadata.height;

        let processedImage = baseImage;

        // 3. التحقق من وجود ملف الخط وقراءته في الذاكرة
        let fontBuffer;
        try {
            fontBuffer = await fs.readFile(FONT_PATH);
            console.log('الملف الخط موجود وتم قراءته:', FONT_PATH);
        } catch (fontError) {
            console.error('خطأ: ملف الخط غير موجود أو لا يمكن الوصول إليه:', fontError.message);
            // قد تحتاج إلى توفير مسار بديل لخط افتراضي أو التوقف هنا
            return res.status(500).json({
                error: 'ملف الخط غير موجود أو لا يمكن الوصول إليه. يرجى التأكد من وضعه في المسار الصحيح وتضمينه في النشر.',
                details: fontError.message,
                path: FONT_PATH
            });
        }

        // --- إضافة نصوص الترحيب إلى الصورة ---
        for (const key in GREETING_POSITIONS) {
            const pos = GREETING_POSITIONS[key];

            // ارتفاع مربع النص يعتمد على حجم الخط لضمان احتواء النص
            // نزيد الارتفاع قليلاً لضمان عدم اقتصاص النص
            const textHeight = pos.fontSize * 2; 

            const textOverlayBuffer = await createSharpTextBuffer(
                pos.text,
                pos.fontSize,
                pos.color,
                imageWidth,
                textHeight, // استخدمنا textHeight هنا كارتفاع للـ SVG الخاص بالنص
                pos.gravity,
                fontBuffer,
                FONT_CSS_FAMILY_NAME
            );

            // تركيب النص كطبقة علوية
            processedImage = await processedImage.composite([{
                input: textOverlayBuffer,
                left: pos.x,
                top: pos.y - (textHeight / 2), // ضبط الـ y بناءً على منتصف الـ textHeight
                // بما أن text-anchor و dominant-baseline تتعاملان مع المحاذاة داخل الـ SVG،
                // فإن الـ 'top' هنا يحدد موضع بداية طبقة النص.
                // قد تحتاج لتعديل 'top' قليلاً لضبط المحاذاة العمودية بشكل دقيق.
            }]);
        }

        // بما أنك تستخدم wwee.jpg، سنقوم بالإخراج كـ JPEG
        const finalImageBuffer = await processedImage
            .flatten({ background: { r: 255, g: 255, b: 255, alpha: 1 } }) // للتأكد من عدم وجود شفافية في الناتج النهائي
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

        // رسائل خطأ أكثر تفصيلاً للمساعدة في Debugging
        if (error.message.includes('fontconfig') || error.message.includes('freetype')) {
            return res.status(500).json({
                error: 'خطأ في تحميل الخطوط (fontconfig/freetype). هذا يشير عادةً إلى مشكلة في بيئة الخادم أو عدم توفر تبعيات الخطوط بشكل كامل. يرجى التأكد من أن Vercel Function لديها البيئة اللازمة لـ Sharp والخطوط.',
                details: error.message,
                stack: error.stack
            });
        } else if (error.message.includes('Input file is missing')) {
            return res.status(500).json({
                error: 'ملف الصورة الأساسي غير موجود. تأكد من أن مسار الصورة صحيح وأنها مضمنة في النشر.',
                details: error.message,
                path: CERTIFICATE_IMAGE_PATH,
                stack: error.stack
            });
        } else {
            return res.status(500).json({
                error: 'حدث خطأ غير متوقع أثناء معالجة الشهادة.',
                details: error.message,
                stack: error.stack
            });
        }
    }
}               error: 'يبدو أن هناك مشكلة في معالجة الخطوط على الخادم. قد تكون بيئة النشر لا تدعم Fontconfig/FreeType بشكل كامل لبعض الخطوط.',
                details: error.message,
                stack: error.stack
            });
        }
        if (error.message.includes('Input file is missing or of an unsupported image format')) {
             return res.status(500).json({
                error: `صورة الشهادة (${path.basename(CERTIFICATE_IMAGE_PATH)}) مفقودة أو تالفة. تأكد من مسارها وتضمينها في النشر.`,
                details: error.message,
                stack: error.stack,
                path: CERTIFICATE_IMAGE_PATH
            });
        }

        return res.status(500).json({
            error: 'حدث خطأ أثناء توليد الشهادة.',
            details: error.message,
            stack: error.stack
        });
    }
}