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

const RED_COLOR_HEX = '#FF0000';
const BLUE_COLOR_HEX = '#0000FF';
const GREEN_COLOR_HEX = '#00FF00';
const BLACK_COLOR_HEX = '#000000';

const CERTIFICATE_TEXT_POSITIONS = {
    GREETING1: {
        text: "أهلاً وسهلاً بكم!",
        x: 0,
        y: 150,
        fontSize: 60,
        color: RED_COLOR_HEX,
        gravity: 'center'
    },
    GREETED_NAME: {
        text: "اسم الطالب هنا",
        field: "arabic_name",
        x: 0,
        y: 300,
        fontSize: 80,
        color: BLACK_COLOR_HEX,
        gravity: 'center'
    },
    GREETING2: {
        text: "نتمنى لكم يوماً سعيداً.",
        x: 100,
        y: 500,
        fontSize: 45,
        color: BLUE_COLOR_HEX,
        gravity: 'west'
    },
    GREETING3: {
        text: "شكراً لزيارتكم.",
        x: 0,
        y: 650,
        fontSize: 40,
        color: GREEN_COLOR_HEX,
        gravity: 'east'
    },
    RESIDENCY_NUMBER: {
        label: "رقم الإقامة:",
        field: "residency_number",
        x: 150,
        y: 800,
        fontSize: 30,
        color: BLACK_COLOR_HEX,
        gravity: 'west'
    },
    SERIAL_NUMBER: {
        label: "الرقم التسلسلي:",
        field: "serial_number",
        x: 150,
        y: 840,
        fontSize: 30,
        color: BLACK_COLOR_HEX,
        gravity: 'west'
    },
    DOCUMENT_SERIAL_NUMBER: {
        label: "الرقم التسلسلي للوثيقة:",
        field: "document_serial_number",
        x: 150,
        y: 880,
        fontSize: 30,
        color: BLACK_COLOR_HEX,
        gravity: 'west'
    },
    PLATE_NUMBER: {
        label: "رقم اللوحة:",
        field: "plate_number",
        x: 150,
        y: 920,
        fontSize: 30,
        color: BLACK_COLOR_HEX,
        gravity: 'west'
    },
    INSPECTION_DATE: {
        label: "تاريخ الفحص:",
        field: "inspection_date",
        x: 150,
        y: 960,
        fontSize: 30,
        color: BLACK_COLOR_HEX,
        gravity: 'west'
    },
    MANUFACTURER: {
        label: "الشركة الصانعة:",
        field: "manufacturer",
        x: 150,
        y: 1000,
        fontSize: 30,
        color: BLACK_COLOR_HEX,
        gravity: 'west'
    },
    INSPECTION_EXPIRY_DATE: {
        label: "تاريخ انتهاء الفحص:",
        field: "inspection_expiry_date",
        x: 150,
        y: 1040,
        fontSize: 30,
        color: BLACK_COLOR_HEX,
        gravity: 'west'
    },
    CAR_TYPE: {
        label: "نوع السيارة:",
        field: "نوع_السيارة",
        x: 900,
        y: 800,
        fontSize: 30,
        color: BLACK_COLOR_HEX,
        gravity: 'west'
    },
    COUNTER_READING: {
        label: "قراءة العداد:",
        field: "counter_reading",
        x: 900,
        y: 840,
        fontSize: 30,
        color: BLACK_COLOR_HEX,
        gravity: 'west'
    },
    CHASSIS_NUMBER: {
        label: "رقم الهيكل:",
        field: "رقم_الهيكل",
        x: 900,
        y: 880,
        fontSize: 30,
        color: BLACK_COLOR_HEX,
        gravity: 'west'
    },
    VEHICLE_MODEL: {
        label: "طراز المركبة:",
        field: "vehicle_model",
        x: 900,
        y: 920,
        fontSize: 30,
        color: BLACK_COLOR_HEX,
        gravity: 'west'
    },
    COLOR: {
        label: "اللون:",
        field: "color",
        x: 900,
        y: 960,
        fontSize: 30,
        color: BLACK_COLOR_HEX,
        gravity: 'west'
    },
    SERIAL_NUMBER_DUPLICATE: {
        label: "الرقم التسلسلي (مكرر):",
        field: "serial_number_duplicate",
        x: 900,
        y: 1000,
        fontSize: 30,
        color: BLACK_COLOR_HEX,
        gravity: 'west'
    },
    CREATED_AT: {
        label: "تاريخ الإضافة:",
        field: "created_at",
        x: 900,
        y: 1040,
        fontSize: 30,
        color: BLACK_COLOR_HEX,
        gravity: 'west'
    }
};

/**
 * دالة مساعدة لإنشاء نص كـ Buffer لـ sharp باستخدام sharp.text().
 */
async function createSharpTextBuffer(text, fontSize, color, svgWidth, svgHeight, gravity, fontCssFamilyName) {
    // **التعديل الرئيسي هنا: تأكد من أن النص ليس فارغًا أو مجرد مسافات بيضاء**
    const textToRender = (text && text.trim() !== '') ? text : 'غير متوفر'; // نص افتراضي

    let align = 'centre';
    if (gravity === 'west') {
        align = 'left';
    } else if (gravity === 'east') {
        align = 'right';
    }

    return sharp({
        text: {
            text: `<span foreground="${color}">${textToRender}</span>`, // استخدام textToRender
            font: fontCssFamilyName,
            fontfile: FONT_PATH,
            width: svgWidth,
            height: svgHeight,
            align: align,
            rgba: true
        }
    }).png().toBuffer();
}


export default async function handler(req, res) {
    console.log('--- بدأ تنفيذ دالة generateCertificateTwo2 ---');

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


        // 2. التحقق من وجود صورة الشهادة
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
                // **التعديل الثاني هنا: التأكد من أن fieldValue ليس null أو undefined**
                if (fieldValue === undefined || fieldValue === null || String(fieldValue).trim() === '') {
                    fieldValue = 'غير متوفر'; // نص افتراضي للحقول الفارغة
                }

                if (pos.field === 'created_at' || pos.field === 'inspection_date' || pos.field === 'inspection_expiry_date') {
                    if (fieldValue !== 'غير متوفر' && fieldValue) { // تأكد من أن fieldValue ليس النص الافتراضي
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
            console.log('تم إغلاق اتصال قاعدة البيانات.');
        }
    }
}