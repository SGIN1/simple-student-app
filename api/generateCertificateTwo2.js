// generateCertificateTwo2.js

// ... (بقية الـ imports والمتغيرات)

export default async function handler(req, res) {
    console.log('--- بدأ تنفيذ دالة generateCertificateTwo2 (نسخة نهائية مع ضبط الإحداثيات) ---');

    if (req.method !== 'GET') {
        console.log('طلب غير مسموح به:', req.method);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { id } = req.query;

    if (!id) {
        console.log('معرف الطالب غير موجود في الطلب.');
        return res.status(400).json({ error: 'معرف الطالب (ID) مطلوب.' });
    }

    let client; // لا نحتاج client هنا إذا كنا نعتمد على fetch API
    try {
        console.log('جارٍ جلب بيانات الطالب من API...');
        let student;
        try {
            // *** التعديل الرئيسي هنا: استخدام مسار API النسبي مباشرة ***
            // يجب أن يكون المسار '/api/getStudent' كافياً لطلب داخلي في Vercel.
            // إذا كنت تختبر محلياً، قد تحتاج إلى http://localhost:3000/api/getStudent?id=${id}
            // ولكن في Vercel، المسار النسبي يعمل بشكل أفضل بين وظائف الـ API.
            const studentApiResponse = await fetch(`/api/getStudent?id=${id}`);
            if (!studentApiResponse.ok) {
                const errorData = await studentApiResponse.json();
                console.error('خطأ في جلب بيانات الطالب من API:', studentApiResponse.status, errorData.error);
                return res.status(studentApiResponse.status).json({ error: errorData.error });
            }
            student = await studentApiResponse.json();
            console.log('تم جلب بيانات الطالب من API بنجاح:', JSON.stringify(student, null, 2));

        } catch (e) {
            console.error('خطأ في جلب بيانات الطالب من API أو تحويل المعرف:', e.message);
            // هذا الخطأ كان "فشل تحليل عنوان URL"
            return res.status(500).json({ error: 'حدث خطأ أثناء جلب بيانات الطالب للشهادة. الرجاء التأكد من صحة معرف الطالب.' });
        }

        if (!student) {
            console.log('لم يتم العثور على طالب بالمعرف:', id);
            return res.status(404).json({ error: 'لم يتم العثور على طالب بهذا المعرف.' });
        }
        // السجلات هنا ستعرض البيانات بعد معالجتها بواسطة api/getStudent.js
        console.log('قيمة residency_number في الطالب:', student.residency_number);
        console.log('قيمة chassis_number في الطالب:', student.chassis_number);
        console.log('قيمة created_at في الطالب:', student.created_at);

        console.log('جارٍ التحقق من صورة الشهادة...');
        // ... (بقية الكود لم يتغير)
        try {
            await fs.access(CERTIFICATE_IMAGE_PATH);
            console.log('صورة الشهادة موجودة.', CERTIFICATE_IMAGE_PATH);
        } catch (fileError) {
            console.error('خطأ: صورة الشهادة غير موجودة أو لا يمكن الوصول إليها:', fileError.message);
            return res.status(500).json({
                error: 'صورة الشهادة غير موجودة أو لا يمكن الوصول إليها. يرجى التحقق من مسار ملف الصورة في النشر.',
                details: fileError.message,
                path: CERTIFICATE_IMAGE_PATH
            });
        }

        console.log('جارٍ معالجة الصورة الأساسية...');
        const baseImage = sharp(CERTIFICATE_IMAGE_PATH);
        const metadata = await baseImage.metadata();
        const imageWidth = metadata.width;
        const imageHeight = metadata.height;
        console.log('أبعاد الصورة الفعلية التي تم تحميلها:', imageWidth, 'x', imageHeight);

        if (imageWidth !== 1754 || imageHeight !== 1238) {
            console.warn(`تحذير: أبعاد الصورة الفعلية (${imageWidth}x${imageHeight}) لا تتطابق مع الأبعاد المتوقعة (1754x1238). قد تحتاج لضبط إحداثيات النصوص مرة أخرى.`);
        }

        let processedImage = baseImage;

        console.log('جارٍ التحقق من ملف الخط...');
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
        for (const key in CERTIFICATE_TEXT_POSITIONS) {
            const pos = CERTIFICATE_TEXT_POSITIONS[key];
            let textToDisplay = '';

            let fieldValue = student[pos.field];
            // الآن نعتمد على أن api/getStudent.js يضمن وجود قيمة نصية (حتى لو كانت "غير محدد")
            textToDisplay = `${pos.label || ''} ${fieldValue}`;


            const textRenderHeight = pos.fontSize * 2;
            if ((pos.y + textRenderHeight) > imageHeight) {
                console.warn(`النص "${textToDisplay}" (المفتاح: ${key}) قد يتجاوز ارتفاع الصورة (Y: ${pos.y}, ارتفاع الصورة: ${imageHeight}). قد لا يظهر بالكامل.`);
            }

            console.log(`إنشاء نص لـ: ${key} بـ: "${textToDisplay}" عند X: ${pos.x}, Y: ${pos.y}`);

            const textOverlayBuffer = await createSharpTextBuffer(
                textToDisplay,
                pos.fontSize,
                pos.color,
                imageWidth,
                textRenderHeight,
                pos.gravity,
                FONT_CSS_FAMILY_NAME
            );
            console.log(`تم إنشاء Buffer للنص ${key}`);

            processedImage = await processedImage.composite([{
                input: textOverlayBuffer,
                left: pos.x,
                top: pos.y,
            }]);
            console.log(`تم تركيب النص ${key}`);
        }

        console.log('جارٍ إنشاء الصورة النهائية...');
        const finalImageBuffer = await processedImage
            .flatten({ background: { r: 255, g: 255, b: 255, alpha: 1 } })
            .jpeg({
                quality: 85,
                progressive: true
            }).toBuffer();
        console.log('تم إنشاء الصورة النهائية.');

        res.setHeader('Content-Type', 'image/jpeg');
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
        } else if (error.message.includes('text: no text to render')) {
            return res.status(500).json({
                error: 'حدث خطأ أثناء محاولة رسم نص فارغ. يرجى التحقق من وجود بيانات للنصوص المراد عرضها.',
                details: error.message,
                stack: error.stack
            });
        }
        return res.status(500).json({
            error: 'حدث خطأ غير متوقع أثناء معالجة الشهادة.',
            details: error.message,
            stack: error.stack
        });
    } // لا نحتاج لـ finally هنا، حيث لا يوجد client.close()
}