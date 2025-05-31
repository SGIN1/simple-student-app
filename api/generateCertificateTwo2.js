// api/generateCertificateTwo2.js
// ... (الكود العلوي بدون تغيير) ...

// **مسار الخط الجديد (Arial):**
const FONT_FILENAME = 'arial.ttf'; 
const FONT_PATH = path.join(process.cwd(), 'public', 'fonts', FONT_FILENAME);

// **اسم الخط للاستخدام في CSS:**
const FONT_CSS_FAMILY_NAME = 'Arial'; 

// تعريف ألوان النصوص
const RED_COLOR_HEX = '#FF0000';    // أحمر
const BLUE_COLOR_HEX = '#0000FF';   // أزرق
const GREEN_COLOR_HEX = '#00FF00';  // أخضر

// تعريف إحداثيات ومواصفات نصوص الترحيب
// **تم تعديل هذه الإحداثيات (x, y) وحجم الخط (fontSize) بشكل مقترح.**
// **جرب هذه القيم، ثم قم بالتعديل الدقيق يدوياً بناءً على رؤيتك على الشهادة.**
const GREETING_POSITIONS = {
    GREETING1: { 
        text: "أهلاً وسهلاً بكم!", 
        x: 0, // 0 يعني يبدأ من أقصى اليسار للمربع
        y: 400, // مثلاً في منتصف الشهادة عمودياً (1220 / 2 = 610, هذه أعلى قليلاً)
        fontSize: 70, 
        color: RED_COLOR_HEX, 
        gravity: 'center' // النص يتمركز داخل مربع النص، والمربع نفسه يتمركز أفقياً إذا كان X=0 والعرض=عرض الصورة
    },
    GREETING2: { 
        text: "نتمنى لكم يوماً سعيداً.", 
        x: 50, // مسافة 50 بكسل من الحافة اليسرى
        y: 550, // أسفل الترحيب الأول
        fontSize: 50, 
        color: BLUE_COLOR_HEX, 
        gravity: 'west' // النص يبدأ من اليسار داخل المربع
    },
    GREETING3: { 
        text: "شكراً لزيارتكم.", 
        x: 0, // 0 يعني يبدأ من أقصى اليسار للمربع، لكن gravity ستدفعه لليمين
        y: 700, // أسفل الترحيب الثاني
        fontSize: 40, 
        color: GREEN_COLOR_HEX, 
        gravity: 'east' // النص ينتهي عند الحافة اليمنى داخل المربع (التي تبدأ عند X=0 وعرضها = عرض الصورة)
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


// ... (بقية الكود بدون تغيير كبير حتى دالة handler) ...

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // ... (التحقق من وجود صورة الشهادة وقراءة الخط) ...

        const baseImage = sharp(CERTIFICATE_IMAGE_PATH);
        const metadata = await baseImage.metadata();
        const imageWidth = metadata.width;
        const imageHeight = metadata.height; // احصل على ارتفاع الصورة أيضاً

        let processedImage = baseImage;

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