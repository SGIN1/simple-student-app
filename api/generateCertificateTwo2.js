// api/generateCertificateTwo2.js
// ... (الاستيرادات والمتغيرات العليا كما هي) ...

// **اسم الخط للاستخدام في CSS:**
const FONT_CSS_FAMILY_NAME = 'Arial'; // الاسم الشائع لخط Arial

// تعريف ألوان النصوص
const RED_COLOR_HEX = '#FF0000';    // أحمر
const BLUE_COLOR_HEX = '#0000FF';   // أزرق
const GREEN_COLOR_HEX = '#00FF00';  // أخضر

// تعريف إحداثيات ومواصفات نصوص الترحيب
// ... (GREETING_POSITIONS كما هي) ...

// دالة createSharpTextBuffer تبقى كما هي (لأنها تعمل على النص)
// ... (createSharpTextBuffer كما هي) ...


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
        // **التعديل هنا: تحديد لون الخلفية عند قراءة الصورة أو عند تحويلها**
        const baseImage = sharp(CERTIFICATE_IMAGE_PATH);
        const metadata = await baseImage.metadata();
        const imageWidth = metadata.width;
        const imageHeight = metadata.height;

        let processedImage = baseImage;

        // **اختياري: إذا كانت الصورة الأصلية wwee.png تحتوي على خلفية شفافة وتظهر سوداء**
        // يمكننا فرض خلفية بيضاء قبل أي معالجة أخرى.
        // جرب هذه السطر إذا كانت الخلفية البيضاء الأصلية للشهادة تظهر سوداء.
        // processedImage = processedImage.flatten({ background: { r: 255, g: 255, b: 255, alpha: 1 } });
        // أو إذا كانت المشكلة هي أن الصورة نفسها تظهر بلون خاطئ، قد تحتاج إلى تحويلها إلى RGB
        // processedImage = processedImage.toColorspace('srgb');


        // ... (بقية الكود الخاص بجلب الخط GREETING_POSITIONS كما هي) ...

        // --- إضافة نصوص الترحيب إلى الصورة باستخدام sharp.text() ---
        for (const key in GREETING_POSITIONS) {
            const pos = GREETING_POSITIONS[key];

            const textHeight = pos.fontSize * 2;

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

            // تركيب النص كـ overlay. لا نحدد blend mode للسماح لـ sharp باختيار الأفضل (عادة 'over' أو 'at')
            processedImage = await processedImage.composite([{
                input: textOverlayBuffer,
                left: pos.x,
                top: pos.y,
                // لا نحدد blend هنا، sharp يستخدم 'over' افتراضياً لـ PNG فوق صورة أخرى
            }]);
        }

        // **التعديل الجوهري هنا: إضافة background قبل التحويل إلى JPEG**
        // هذا يضمن أن أي شفافية في الصورة الأصلية (أو الناتج الوسيط) تُملأ باللون الأبيض.
        const finalImageBuffer = await processedImage
            .flatten({ background: { r: 255, g: 255, b: 255, alpha: 1 } }) // **أضف هذا السطر**
            .jpeg({
                quality: 85,
                progressive: true
            }).toBuffer();

        res.setHeader('Content-Type', 'image/jpeg');
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