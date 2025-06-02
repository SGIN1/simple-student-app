import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

// مسار صورة الشهادة
const CERTIFICATE_IMAGE_PATH = path.join(process.cwd(), 'public', 'images', 'full', 'wwee.jpg'); // تأكد من أنه .jpg أو .png حسب ملفك الفعلي

// مسار الخط (Arial)
const FONT_FILENAME = 'arial.ttf';
const FONT_PATH = path.join(process.cwd(), 'public', 'fonts', FONT_FILENAME); // تأكد من وجود arial.ttf هنا

// اسم الخط للاستخدام في CSS (مهم لـ sharp.text())
const FONT_CSS_FAMILY_NAME = 'Arial';

// تعريف ألوان النصوص
const RED_COLOR_HEX = '#FF0000';
const BLUE_COLOR_HEX = '#0000FF';
const GREEN_COLOR_HEX = '#00FF00';
const BLACK_COLOR_HEX = '#000000'; // أضفت اللون الأسود للنص الرئيسي

// تعريف إحداثيات ومواصفات نصوص الترحيب
const GREETING_POSITIONS = {
    GREETING1: {
        text: "أهلاً وسهلاً بكم!",
        x: 0,
        y: 80, // هذا يجب أن يكون موضع y الذي تريده لـ GREETING1
        fontSize: 40,
        color: RED_COLOR_HEX,
        gravity: 'center'
    },
    GREETED_NAME: { // هذا هو النص الذي كان مفقودًا
        text: "محمد أحمد علي", // هذا النص يجب أن يأتي من بيانات الطالب ديناميكيًا لاحقًا
        x: 0,
        y: 180, // هذا يجب أن يكون موضع y الذي تريده للاسم
        fontSize: 55,
        color: BLACK_COLOR_HEX,
        gravity: 'center'
    },
    GREETING2: {
        text: "نتمنى لكم يوماً سعيداً.",
        x: 50, // هذا يجب أن يكون موضع x الذي تريده لـ GREETING2
        y: 300, // هذا يجب أن يكون موضع y الذي تريده لـ GREETING2
        fontSize: 30,
        color: BLUE_COLOR_HEX,
        gravity: 'west'
    },
    GREETING3: {
        text: "شكراً لزيارتكم.",
        x: 0, // هذا يجب أن يكون موضع x الذي تريده لـ GREETING3 (يتمركز على اليمين)
        y: 450, // هذا يجب أن يكون موضع y الذي تريده لـ GREETING3
        fontSize: 25,
        color: GREEN_COLOR_HEX,
        gravity: 'east'
    }
};

/**
 * دالة مساعدة لإنشاء نص كـ Buffer لـ sharp باستخدام sharp.text().
 * @param {string} text - النص المراد عرضه.
 * @param {number} fontSize - حجم الخط بالبكسل.
 * @param {string} color - لون النص (مثال: '#FF0000').
 * @param {number} svgWidth - العرض الكلي لمساحة النص (يجب أن يكون عرض الصورة).
 * @param {number} svgHeight - الارتفاع الكلي لمساحة النص (مربع نص مؤقت).
 * @param {string} gravity - محاذاة النص ('center', 'west', 'east').
 * @param {Buffer} fontBuffer - بيانات ملف الخط (لن يتم استخدامها هنا بشكل مباشر ولكن تبقى للمستقبل).
 * @param {string} fontCssFamilyName - الاسم الذي سيتم استخدامه للخط في Pango.
 * @returns {Buffer} - كائن Buffer يحتوي على بيانات النص.
 */
async function createSharpTextBuffer(text, fontSize, color, svgWidth, svgHeight, gravity, fontBuffer, fontCssFamilyName) {
    // ترجمة 'gravity' إلى محاذاة 'align' لـ sharp.text()
    let align = 'centre'; // الافتراضي هو 'centre'
    if (gravity === 'west') {
        align = 'left';
    } else if (gravity === 'east') {
        align = 'right';
    }

    return sharp({
        text: {
            text: `<span foreground="${color}">${text}</span>`, // استخدام Pango Markup لتطبيق اللون
            font: fontCssFamilyName, // اسم الخط الذي يجب أن يتعرف عليه sharp
            fontfile: FONT_PATH, // مسار ملف الخط (مهم جدًا هنا)
            width: svgWidth, // عرض المنطقة التي سيتم رسم النص فيها
            height: svgHeight, // ارتفاع المنطقة التي سيتم رسم النص فيها
            align: align,
            rgba: true // يجب أن تكون true لاستخدام الألوان في Pango Markup
        }
    }).png().toBuffer();
}


export default async function handler(req, res) {
    console.log('--- بدأ تنفيذ دالة generateCertificateTwo2 ---');

    if (req.method !== 'GET') {
        console.log('طلب غير مسموح به:', req.method);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        console.log('جارٍ التحقق من صورة الشهادة...');
        try {
            await fs.access(CERTIFICATE_IMAGE_PATH);
            console.log('صورة الشهادة موجودة.', CERTIFICATE_IMAGE_PATH);
        } catch (fileError) {
            console.error('خطأ: صورة الشهادة غير موجودة أو لا يمكن الوصول إليها:', fileError.message);
            return res.status(500).json({
                error: 'صورة الشهادة غير موجودة أو لا يمكن الوصول إليها.',
                details: fileError.message,
                path: CERTIFICATE_IMAGE_PATH
            });
        }

        console.log('جارٍ معالجة الصورة الأساسية...');
        const baseImage = sharp(CERTIFICATE_IMAGE_PATH);
        const metadata = await baseImage.metadata();
        const imageWidth = metadata.width;
        const imageHeight = metadata.height;
        console.log('أبعاد الصورة:', imageWidth, 'x', imageHeight);

        let processedImage = baseImage;

        console.log('جارٍ التحقق من ملف الخط...');
        // في هذا الإصدار، لا نقوم بقراءة الخط إلى buffer هنا، بل نمرر المسار مباشرةً إلى sharp.text()
        // fs.readFile(FONT_PATH) لم تعد ضرورية هنا لأن sharp.text تتولى قراءة الملف بنفسها عبر 'fontfile'
        // نتحقق من وجوده فقط
        try {
            await fs.access(FONT_PATH);
            console.log('ملف الخط موجود في المسار المحدد:', FONT_PATH);
        } catch (fontError) {
            console.error('خطأ: ملف الخط غير موجود أو لا يمكن الوصول إليه:', fontError.message);
            return res.status(500).json({
                error: 'ملف الخط غير موجود أو لا يمكن الوصول إليه. يرجى التأكد من وضعه في المسار الصحيح وتضمينه في النشر.',
                details: fontError.message,
                path: FONT_PATH
            });
        }

        console.log('جارٍ إضافة النصوص إلى الصورة...');
        for (const key in GREETING_POSITIONS) {
            const pos = GREETING_POSITIONS[key];
            // تحديد ارتفاع مناسب لمربع النص لضمان ظهور النص كاملاً
            const textHeight = pos.fontSize * 2; // ضعف حجم الخط كارتفاع تقريبي للمربع

            console.log(`إنشاء نص لـ: ${key} بـ: ${pos.text}`);

            const textOverlayBuffer = await createSharpTextBuffer(
                pos.text,
                pos.fontSize,
                pos.color,
                imageWidth, // عرض النص بالكامل هو عرض الصورة
                textHeight, // الارتفاع الذي حسبناه
                pos.gravity,
                null, // لا نحتاج fontBuffer هنا لأن sharp.text() يستخدم fontfile
                FONT_CSS_FAMILY_NAME
            );
            console.log(`تم إنشاء Buffer للنص ${key}`);

            // تركيب النص كـ overlay
            processedImage = await processedImage.composite([{
                input: textOverlayBuffer,
                left: pos.x,
                top: pos.y,
                // blend: 'overlay' // يمكن إزالة blend إذا لم تكن بحاجة لتأثير خاص
            }]);
            console.log(`تم تركيب النص ${key}`);
        }

        console.log('جارٍ إنشاء الصورة النهائية...');
        const finalImageBuffer = await processedImage
            .flatten({ background: { r: 255, g: 255, b: 255, alpha: 1 } }) // إعادة Flattening لمنع مشاكل الشفافية
            .jpeg({ // تغيير إلى jpeg إذا كانت الصورة النهائية يجب أن تكون jpeg
                quality: 85,
                progressive: true
            }).toBuffer();
        console.log('تم إنشاء الصورة النهائية.');

        res.setHeader('Content-Type', 'image/jpeg'); // تغيير إلى image/jpeg إذا كانت الصورة النهائية jpeg
        res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');
        console.log('تم إرسال الصورة بنجاح.');
        return res.status(200).send(finalImageBuffer);

    } catch (error) {
        console.error('خطأ عام في وظيفة generateCertificateTwo2 (داخل catch):', error);
        console.error('تتبع الخطأ (داخل catch):', error.stack);

        if (error.message.includes('fontconfig') || error.message.includes('freetype')) {
            return res.status(500).json({
                error: 'حدث خطأ في معالجة الخطوط (Fontconfig/FreeType). يرجى التأكد من أن الخطوط المستخدمة مدعومة بشكل كامل في بيئة Vercel.',
                details: error.message,
                stack: error.stack
            });
        } else if (error.message.includes('Input file is missing')) {
            return res.status(500).json({
                error: 'ملف الصورة الأساسي غير موجود أو لا يمكن الوصول إليه.',
                details: error.message
            });
        }
        return res.status(500).json({
            error: 'حدث خطأ غير متوقع أثناء معالجة الشهادة.',
            details: error.message,
            stack: error.stack
        });
    }
}