import { MongoClient, ObjectId } from 'mongodb';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

const uri = process.env.MONGODB_URI;
const dbName = 'Cluster0';
const collectionName = 'enrolled_students_tbl';

// تأكد أن هذا هو المسار الصحيح لصورتك
const CERTIFICATE_IMAGE_PATH = path.join(process.cwd(), 'public', 'images', 'full', 'wwee.jpg');

const FONT_FILENAME = 'arial.ttf';
const FONT_PATH = path.join(process.cwd(), 'public', 'fonts', FONT_FILENAME);
const FONT_CSS_FAMILY_NAME = 'Arial'; // هذا الاسم يستخدمه sharp للإشارة إلى الخط

const RED_COLOR_HEX = '#FF0000';

// **تم تعديل المواقع بناءً على الأبعاد الحقيقية للصورة: 978x1280**
// سنحاول وضع النصوص في المنتصف السفلي من الشهادة حيث يتوقع أن تكون منطقة بيضاء لكتابة البيانات.
// سنفترض أن المنطقة البيضاء تبدأ من حوالي 400 بكسل من الأعلى
const CERTIFICATE_TEXT_POSITIONS = {
    WELCOME_TEXT: {
        text: "مرحباً بك في الاختبار!", // نص ثابت للاختبار
        x: 0, // توسيط أفقي
        y: 450, // موضع متوسط داخل منطقة النص
        fontSize: 40,
        color: RED_COLOR_HEX,
        gravity: 'center' // لضمان التوسيط
    },
    SERIAL_NUMBER: {
        label: "الرقم التسلسلي:",
        field: "serial_number",
        x: 100, // موضع ثابت من اليسار
        y: 500, // أسفل نص الترحيب
        fontSize: 30,
        color: RED_COLOR_HEX,
        gravity: 'west' // المحاذاة لليسار
    },
    RESIDENCY_NUMBER: {
        label: "رقم الإقامة:",
        field: "residency_number",
        x: 100, // موضع ثابت من اليسار
        y: 550, // أسفل الرقم التسلسلي بقليل
        fontSize: 30,
        color: RED_COLOR_HEX,
        gravity: 'west' // المحاذاة لليسار
    },
    // يمكنك إضافة المزيد من النصوص هنا وتعديل مواقعها
    // EXAMPLE_FIELD_1: {
    //     label: "مثال 1:",
    //     field: "some_field_from_db", // استبدل بهذا اسم الحقل من قاعدة البيانات
    //     x: 100,
    //     y: 600,
    //     fontSize: 30,
    //     color: RED_COLOR_HEX,
    //     gravity: 'west'
    // },
};

/**
 * دالة مساعدة لإنشاء نص كـ Buffer لـ sharp باستخدام sharp.text().
 *
 * @param {string} text - النص المراد عرضه.
 * @param {number} fontSize - حجم الخط.
 * @param {string} color - لون النص (بصيغة هيكس).
 * @param {number} svgWidth - عرض الصورة التي سيتراكب عليها النص (مستخدم لحساب مساحة النص).
 * @param {number} svgHeight - ارتفاع الصورة (مستخدم لحساب مساحة النص).
 * @param {string} gravity - محاذاة النص ('west', 'center', 'east').
 * @param {string} fontCssFamilyName - اسم عائلة الخط (كما هو مستخدم في CSS).
 * @returns {Promise<Buffer>} - Buffer يحتوي على النص كصورة PNG.
 */
async function createSharpTextBuffer(text, fontSize, color, svgWidth, svgHeight, gravity, fontCssFamilyName) {
    // sharp.text() يحتاج إلى SVG. سنقوم بإنشاء SVG بسيط يحتوي على النص.
    // لضمان محاذاة صحيحة، سنقوم بضبط 'text-anchor' و 'x' بناءً على 'gravity'.
    let textAnchor = 'start';
    let xOffset = 0;
    if (gravity === 'center') {
        textAnchor = 'middle';
        xOffset = svgWidth / 2; // توسيط النص أفقياً
    } else if (gravity === 'east') {
        textAnchor = 'end';
        xOffset = svgWidth; // محاذاة النص لليمين
    } else { // 'west' أو أي شيء آخر يكون 'start'
        textAnchor = 'start';
        xOffset = 0; // محاذاة النص لليسار
    }

    // `y` في SVG تبدأ من أعلى الصندوق، لذا `font-size` يمثل الجزء السفلي من النص.
    // لجعله متناسباً مع `y` المستخدمة في `composite`، سنضع النص عند `fontSize` من الأعلى.
    const svgText = `<text x="${xOffset}" y="${fontSize}" font-family="${fontCssFamilyName}" font-size="${fontSize}" fill="${color}" text-anchor="${textAnchor}">${text}</text>`;
    const svg = `<svg width="${svgWidth}" height="${fontSize * 1.5}">${svgText}</svg>`; // ارتفاع تقريبي للنص

    return sharp(Buffer.from(svg))
        .png()
        .toBuffer();
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
        const fieldsToDisplay = ['WELCOME_TEXT', 'SERIAL_NUMBER', 'RESIDENCY_NUMBER']; // أضف هنا أي حقول أخرى تريد عرضها

        for (const key of fieldsToDisplay) {
            const pos = CERTIFICATE_TEXT_POSITIONS?.[key];
            if (pos) {
                let textToDisplay = '';

                if (pos.text) {
                    textToDisplay = pos.text;
                }
                else if (pos.field) {
                    let fieldValue = student?.[pos.field];
                    if (fieldValue === undefined || fieldValue === null) {
                        fieldValue = 'غير متوفر';
                    }
                    textToDisplay = `${pos.label || ''} ${fieldValue}`;
                }

                // استخدم ارتفاعاً تقريبياً للنص لتحديد ارتفاع SVG
                const textRenderHeight = (pos.fontSize || 40) * 1.5;

                console.log(`إنشاء نص لـ: ${key} بـ: "${textToDisplay}" عند X: ${pos.x}, Y: ${pos.y}`);

                const textOverlayBuffer = await createSharpTextBuffer(
                    textToDisplay,
                    pos.fontSize || 40,
                    pos.color || RED_COLOR_HEX,
                    imageWidth, // تمرير العرض الحقيقي للتحكم في توسيط النص داخل SVG
                    Math.ceil(textRenderHeight), // ارتفاع تقديري
                    pos.gravity || 'west',
                    FONT_CSS_FAMILY_NAME
                );
                console.log(`تم إنشاء Buffer للنص ${key}`);

                processedImage = await processedImage.composite([{
                    input: textOverlayBuffer,
                    left: pos.x || 0,
                    top: pos.y, // استخدام موقع Y المباشر
                }]);
                console.log(`تم تركيب النص ${key}`);
            }
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

        if (error.message.includes('expected positive integer for text.height')) {
            return res.status(500).json({
                error: 'خطأ في معالجة أبعاد النص. قد يكون بسبب قيمة ارتفاع النص غير الصحيحة (عشري بدلاً من صحيح).',
                details: error.message,
                stack: error.stack
            });
        }
        else if (error.message.includes('fontconfig') || error.message.includes('freetype')) {
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
    } finally {
        if (client) {
            await client.close();
            console.log('تم إغلاق اتصال قاعدة البيانات.');
        }
    }
}