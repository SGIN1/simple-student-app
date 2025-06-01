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
// يفضل استخدام إحداثيات نسبية إذا كانت الشهادات بأحجام مختلفة بشكل كبير
// ولكن للاحتفاظ بالسهولة سنبقيها ثابتة حالياً.
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
    // Sharp يتعامل مع HTML-like SVG لإنشاء النصوص
    // يمكننا تحسين طريقة تحديد العرض والارتفاع لـ SVG للحصول على أفضل دقة
    // لكن مع استخدام gravity، Sharp يقوم بتوسيط النص داخل المساحة المتاحة.
    return sharp({
        text: {
            text: `<span style="font-size:${fontSize}px; color:${color}; font-family:'${fontCssFamilyName}';">${text}</span>`,
            font: fontCssFamilyName,
            fontfile: FONT_PATH,
            width: svgWidth, // عرض المساحة المتاحة للنص
            height: svgHeight, // ارتفاع المساحة المتاحة للنص
            align: gravity === 'center' ? 'centre' : (gravity === 'west' ? 'left' : 'right'),
            rgba: true
        }
    }).png().toBuffer(); // نولدها كـ PNG مؤقتة ثم ندمجها
}

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
            // console.log('صورة الشهادة موجودة في المسار المحدد:', CERTIFICATE_IMAGE_PATH); // للإخراج في مرحلة التطوير
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

        // **لا نغير حجم الصورة هنا تلقائياً لتدعم الأحجام الكبيرة والصغيرة.**
        // نعتمد على أن الصورة الأساسية (wwee.png) لها دقة مناسبة.
        // إذا كنت ترغب في تقليصها بشكل اختياري لأداء أفضل للصور الضخمة جدًا:
        // const OPTIMAL_DISPLAY_WIDTH = 1920; // دقة Full HD
        // if (imageWidth > OPTIMAL_DISPLAY_WIDTH) {
        //     processedImage = processedImage.resize({ width: OPTIMAL_DISPLAY_WIDTH });
        //     metadata = await processedImage.metadata(); // تحديث الأبعاد بعد التصغير
        //     imageWidth = metadata.width;
        //     imageHeight = metadata.height;
        //     console.log(`تم تصغير أبعاد الشهادة إلى: ${imageWidth}x${imageHeight}`);
        // }
        // ملاحظة: إذا قمت بتصغير الصورة هنا، ستحتاج إلى إعادة معايرة إحداثيات النصوص (x, y, fontSize) لتتناسب مع الأبعاد الجديدة.
        // لهذا السبب، الحل الأفضل هو جعل wwee.png نفسه بحجم مثالي للعرض (مثلاً 1920px عرض).

        // 3. التحقق من وجود ملف الخط وقراءته في الذاكرة
        let fontBuffer;
        try {
            fontBuffer = await fs.readFile(FONT_PATH);
            // console.log('ملف الخط موجود وتم قراءته:', FONT_PATH); // للإخراج في مرحلة التطوير
        } catch (fontError) {
            console.error('خطأ: ملف الخط غير موجود أو لا يمكن الوصول إليه:', fontError.message);
            return res.status(500).json({
                error: 'ملف الخط غير موجود أو لا يمكن الوصول إليه. يرجى التأكد من وضعه في المسار الصحيح وتضمينه في النشر.',
                details: fontError.message,
                path: FONT_PATH
            });
        }

        // --- إضافة نصوص الترحيب إلى الصورة باستخدام sharp.text() ---
        // نستخدم `imageWidth` و `imageHeight` كـ `svgWidth` و `svgHeight` لضمان أن Sharp
        // يعرف المساحة الكلية للصورة لتطبيق `gravity` بشكل صحيح.
        for (const key in GREETING_POSITIONS) {
            const pos = GREETING_POSITIONS[key];
            // تحديد ارتفاع كافٍ لمربع النص لضمان عدم اقتصاصه، قد يكون `fontSize * 1.5` أو `fontSize * 2` كافياً.
            const textHeight = pos.fontSize * 2; 

            const textOverlayBuffer = await createSharpTextBuffer(
                pos.text,
                pos.fontSize,
                pos.color,
                imageWidth,  // عرض المساحة الكلية للصورة
                textHeight,  // ارتفاع مربع النص
                pos.gravity,
                fontBuffer,
                FONT_CSS_FAMILY_NAME
            );

            // تركيب النص كـ overlay
            processedImage = await processedImage.composite([{
                input: textOverlayBuffer,
                left: pos.x,
                top: pos.y,
                // استخدام 'over' بدلاً من 'overlay' لضمان ظهور النص فوق الصورة بوضوح
                // 'overlay' يقوم بمزج الألوان وقد يغير لون النص حسب الخلفية
                blend: 'over' 
            }]);
        }

        // 4. توليد الصورة النهائية باستخدام WebP لتحسين الأداء
        const finalImageBuffer = await processedImage
            .webp({
                quality: 85,         // جودة ممتازة (يمكن تجربتها بين 75-95)
                nearLossless: true,  // يحسن وضوح النصوص بشكل كبير في WebP
                chromaSubsampling: '4:4:4' // يحافظ على تفاصيل الألوان بشكل أفضل
            })
            .toBuffer();

        // **تعيين رؤوس الاستجابة (Headers) بشكل صحيح:**
        res.setHeader('Content-Type', 'image/webp'); // **النوع الجديد للصورة**
        // إدارة الكاش:
        // 'public, max-age=31536000, immutable' : كاش قوي جداً (سنة)، للملفات التي لن تتغير أبداً.
        // 'public, max-age=3600, stale-while-revalidate=86400' : كاش لمدة ساعة، ويعيد التحقق بعد 24 ساعة.
        // 'no-store' : لا يتم تخزينها مؤقتاً أبداً (مفيدة للشهادات التي قد تتغير كثيراً).
        // بما أن الشهادة ديناميكية، يمكن أن نضع كاش قصير أو لا كاش على الإطلاق إذا كانت تتغير مع كل طلب.
        // إذا كان الـ `id` يضمن شهادة فريدة لا تتغير لنفس الـ `id`، يمكن استخدام كاش أطول.
        // لغرض التجربة وحل مشكلة الوميض، سنضع كاش قصير مع إعادة تحقق:
        res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
        // إذا كنت تريد التأكد من عدم الكاش أبداً، استخدم:
        // res.setHeader('Cache-Control', 'no-store');

        return res.status(200).send(finalImageBuffer);

    } catch (error) {
        console.error('خطأ عام في وظيفة generateCertificateTwo2:', error);
        console.error('تتبع الخطأ:', error.stack);
        // رسائل خطأ أكثر تفصيلاً للمساعدة في Debugging
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