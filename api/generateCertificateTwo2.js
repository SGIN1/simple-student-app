import { MongoClient, ObjectId } from 'mongodb';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

const uri = process.env.MONGODB_URI;
const dbName = 'Cluster0';
const collectionName = 'enrolled_students_tbl';

const CERTIFICATE_IMAGE_PATH = path.join(process.cwd(), 'public', 'images', 'full', 'wwee.jpg');
const FONT_FILENAME = 'arial.ttf';
const FONT_PATH = path.join(process.cwd(), 'public', 'fonts', FONT_FILENAME);
const FONT_CSS_FAMILY_NAME = 'Arial';

const BLACK_COLOR_HEX = '#000000'; // اللون الأسود غالباً هو الأوضح

// تم تعديل إحداثيات X و Y هنا لرفع النصوص لأعلى وجعلها مرئية
const CERTIFICATE_TEXT_POSITIONS = {
    RESIDENCY_NUMBER: {
        label: "رقم الإقامة:",
        field: "residency_number",
        x: 100, // مثال: إحداثي X من اليسار
        y: 200, // مثال: إحداثي Y (أعلى الصفحة)
        fontSize: 40, // زيادة حجم الخط قليلاً ليكون أوضح
        color: BLACK_COLOR_HEX,
        gravity: 'west' // النص يبدأ من اليسار
    },
    CHASSIS_NUMBER: {
        label: "رقم الهيكل:",
        field: "chassis_number",
        x: 100, // نفس إحداثي X، بحيث تكون تحت رقم الإقامة مباشرة
        y: 260, // Y ليكون تحت رقم الإقامة بمسافة مناسبة (200 + 40 + 20) = 260
        fontSize: 40,
        color: BLACK_COLOR_HEX,
        gravity: 'west'
    },
    CREATED_AT: {
        label: "تاريخ الإضافة:",
        field: "created_at",
        x: 100, // نفس إحداثي X
        y: 320, // Y ليكون تحت رقم الهيكل بمسافة مناسبة (260 + 40 + 20) = 320
        fontSize: 40,
        color: BLACK_COLOR_HEX,
        gravity: 'west'
    }
};

/**
 * دالة مساعدة لإنشاء نص كـ Buffer لـ sharp باستخدام sharp.text().
 */
async function createSharpTextBuffer(text, fontSize, color, svgWidth, svgHeight, gravity, fontCssFamilyName) {
    const textToRender = (text && String(text).trim() !== '') ? text : 'غير متوفر';

    let align = 'centre';
    if (gravity === 'west') {
        align = 'left';
    } else if (gravity === 'east') {
        align = 'right';
    }

    // حجم SVG يجب أن يكون كافياً لاحتواء النص
    // يمكنك زيادة ارتفاع SVG قليلاً إذا كانت النصوص تظهر مقطوعة
    const estimatedTextHeight = fontSize * 1.5; // تقدير تقريبي لارتفاع النص
    const textSvgHeight = Math.max(svgHeight, estimatedTextHeight + 20); // ضمان ارتفاع كافٍ

    return sharp({
        text: {
            text: `<span foreground="${color}">${textToRender}</span>`,
            font: fontCssFamilyName,
            fontfile: FONT_PATH,
            width: svgWidth,
            height: textSvgHeight, // استخدام الارتفاع المحدث
            align: align,
            rgba: true
        }
    }).png().toBuffer();
}


export default async function handler(req, res) {
    console.log('--- بدأ تنفيذ دالة generateCertificateTwo2 (نسخة مختصرة ومعدلة الإحداثيات) ---');

    if (req.method !== 'GET') {
        console.log('طلب غير مسموح به:', req.method);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { id } = req.query;

    if (!id) {
        console.log('معرف الطالب غير موجود في الطلب.');
        return res.status(400).json({ error: 'معرف الطالب (ID) مطلوب.' });
    }

    let client;
    try {
        console.log('جارٍ الاتصال بقاعدة البيانات...');
        client = new MongoClient(uri);
        await client.connect();
        console.log('تم الاتصال بقاعدة البيانات بنجاح.');

        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        let student;
        try {
            const objectId = new ObjectId(id);
            student = await collection.findOne({ _id: objectId });
            console.log('تم البحث عن الطالب باستخدام _id:', objectId);
        } catch (e) {
            console.error('خطأ في تحويل ID إلى ObjectId:', e.message);
            return res.status(400).json({ error: 'مُعرّف الطالب غير صالح. يجب أن يكون ObjectId صحيحًا.' });
        }

        if (!student) {
            console.log('لم يتم العثور على طالب بالمعرف:', id);
            return res.status(404).json({ error: 'لم يتم العثور على طالب بهذا المعرف.' });
        }
        console.log('تم جلب بيانات الطالب:', JSON.stringify(student, null, 2));


        console.log('جارٍ التحقق من صورة الشهادة...');
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

            if (pos.field) {
                let fieldValue = student[pos.field];
                if (fieldValue === undefined || fieldValue === null || String(fieldValue).trim() === '') {
                    fieldValue = 'غير متوفر';
                }

                if (pos.field === 'created_at' || pos.field === 'inspection_date' || pos.field === 'inspection_expiry_date') {
                    if (fieldValue !== 'غير متوفر' && fieldValue) {
                        textToDisplay = `${pos.label || ''} ${new Date(fieldValue).toLocaleDateString('ar-SA', { year: 'numeric', month: 'numeric', day: 'numeric' })}`;
                    } else {
                        textToDisplay = `${pos.label || ''} غير متوفر`;
                    }
                } else {
                    textToDisplay = `${pos.label || ''} ${fieldValue}`;
                }
            } else {
                textToDisplay = pos.text;
            }

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
    } finally {
        if (client) {
            await client.close();
        }
    }
}