// api/generateCertificateTwo2.js
// هذا الملف يستخدم الآن ES Module syntax

import { MongoClient, ObjectId } from 'mongodb';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises'; // لاستخدام fs.access للتحقق من وجود الملف

// **ملاحظة هامة:** تأكد من إضافة MONGODB_URI في متغيرات البيئة الخاصة بمشروعك على Vercel
// (Settings -> Environment Variables)
const uri = process.env.MONGODB_URI;
const dbName = 'Cluster0'; // تأكد من اسم قاعدة البيانات الخاصة بك
const collectionName = 'enrolled_students_tbl'; // تأكد من اسم المجموعة الخاصة بك

// **مسار صورة الشهادة المصحح:**
// تم تغيير الامتداد من .jpg إلى .png ليتناسب مع الصورة المرفوعة
// هذا المسار يفترض أن صورة 'wwee.png' موجودة في مجلد 'public/images/full'
// داخل جذر مشروعك على Vercel.
const CERTIFICATE_IMAGE_PATH = path.join(process.cwd(), 'public', 'images', 'full', 'wwee.png');

// تعريف أنماط النصوص وألوانها
const TEXT_COLOR_HEX = '#000000'; // أسود
const WHITE_COLOR_HEX = '#FFFFFF'; // أبيض

// تعريف إحداثيات النصوص (قد تحتاج لتعديلها بدقة بعد التجربة على Vercel)
// هذه القيم تقريبية وقد تحتاج إلى تعديل بناءً على الخط وحجم الصورة
const TEXT_POSITIONS = {
    STUDENT_NAME: { x: 300, y: 150, fontSize: 48, color: WHITE_COLOR_HEX, alignment: 'middle' },
    SERIAL_NUMBER: { x: 90, y: 220, fontSize: 28, color: WHITE_COLOR_HEX, alignment: 'middle' },
    DOCUMENT_SERIAL_NUMBER: { x: 300, y: 280, fontSize: 20, color: TEXT_COLOR_HEX, alignment: 'middle' },
    PLATE_NUMBER: { x: 300, y: 320, fontSize: 20, color: TEXT_COLOR_HEX, alignment: 'middle' },
    CAR_TYPE: { x: 300, y: 360, fontSize: 20, color: TEXT_COLOR_HEX, alignment: 'middle' },
    COLOR: { x: 300, y: 400, fontSize: 20, color: TEXT_COLOR_HEX, alignment: 'middle' },
};

// ---

/**
 * دالة مساعدة لإنشاء نص SVG يمكن لـ sharp تركيبه على الصورة.
 * نستخدم خطوط نظامية شائعة لضمان التوافقية في بيئة Serverless.
 * @param {string} text - النص المراد عرضه.
 * @param {number} fontSize - حجم الخط بالبكسل.
 * @param {string} color - لون النص (مثال: '#000000').
 * @param {number} imageWidth - عرض الصورة الأساسية للمساعدة في تحديد عرض SVG.
 * @returns {Buffer} - كائن Buffer يحتوي على بيانات SVG.
 */
async function createTextSVG(text, fontSize, color, imageWidth) {
    const svgWidth = imageWidth;
    const svgHeight = fontSize * 1.5; // لتوفير مساحة كافية للنص
    const cleanText = text ? text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : ''; // تنظيف النص لـ XML/SVG

    const svg = `
        <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
            <style>
                /* استخدام خط نظامي شائع (مثل Arial أو Helvetica أو أي خط sans-serif) */
                text {
                    font-family: 'Arial', sans-serif;
                    font-size: ${fontSize}px;
                    fill: ${color};
                    text-anchor: middle; /* للمحاذاة الأفقية في المنتصف */
                    dominant-baseline: central; /* للمحاذاة الرأسية في المنتصف */
                }
            </style>
            <text x="${svgWidth / 2}" y="${svgHeight / 2}">${cleanText}</text>
        </svg>
    `;
    return Buffer.from(svg);
}

// ---

/**
 * وظيفة Vercel Serverless Function لإنشاء الشهادة.
 * هذه الوظيفة ستستقبل طلب GET مع معرف الطالب في المسار.
 *
 * @param {Object} request - كائن الطلب الذي يحتوي على معلومات الطلب الوارد (HTTP request).
 * @returns {Object} - كائن الاستجابة (HTTP response).
 */
export default async function handler(request) {
    // استخراج معرف الطالب من مسار الطلب
    const studentId = request.url.split('/').pop();

    let client; // تعريف متغير العميل خارج try لضمان إغلاقه في finally

    try {
        // 1. التحقق من وجود صورة الشهادة أولاً
        try {
            await fs.access(CERTIFICATE_IMAGE_PATH);
            console.log('صورة الشهادة موجودة في المسار المحدد:', CERTIFICATE_IMAGE_PATH);
        } catch (fileError) {
            console.error('خطأ: صورة الشهادة غير موجودة أو لا يمكن الوصول إليها:', fileError.message);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'صورة الشهادة غير موجودة أو لا يمكن الوصول إليها. يرجى التحقق من مسار ملف الصورة في النشر.', details: fileError.message }),
                headers: { 'Content-Type': 'application/json' },
            };
        }

        // 2. الاتصال بقاعدة بيانات MongoDB
        client = new MongoClient(uri);
        await client.connect();
        const database = client.db(dbName);
        const studentsCollection = database.collection(collectionName);

        let student;
        try {
            // محاولة البحث باستخدام ObjectId أولاً
            student = await studentsCollection.findOne({ _id: new ObjectId(studentId) });
        } catch (objectIdError) {
            // إذا فشل التحويل إلى ObjectId، قد يكون الـ ID ليس ObjectId صالحًا.
            // في هذه الحالة، يمكننا محاولة البحث باستخدام الـ serial_number إذا كان هذا هو ما تتوقعه.
            console.warn('ID المستلم ليس ObjectId صالحًا، نحاول البحث كـ serial_number:', studentId);
            student = await studentsCollection.findOne({ serial_number: studentId });
        }

        // التحقق مما إذا كان الطالب موجودًا
        if (!student) {
            console.error(`لم يتم العثور على طالب بالمعرف أو الرقم التسلسلي: ${studentId}`);
            return {
                statusCode: 404,
                body: JSON.stringify({ error: `لم يتم العثور على طالب بالمعرف: ${studentId}` }),
                headers: { 'Content-Type': 'application/json' },
            };
        }

        console.log('بيانات الطالب المسترجعة:', student); // لتتبع بيانات الطالب

        // استخراج بيانات الطالب مع التأكد من وجودها أو إعطاء قيمة افتراضية
        const serialNumber = student.serial_number || '';
        const studentNameArabic = student.arabic_name || '';
        const documentSerialNumber = student.document_serial_number || '';
        const plateNumber = student.plate_number || '';
        const carType = student.car_type || '';
        const color = student.color || '';

        // قراءة صورة الشهادة الأساسية باستخدام sharp
        const baseImage = sharp(CERTIFICATE_IMAGE_PATH);
        const metadata = await baseImage.metadata();
        const imageWidth = metadata.width;

        // تجهيز مصفوفة الطبقات (overlays) لإضافة النصوص
        const overlays = [];

        // إنشاء نصوص SVG وإضافتها إلى مصفوفة الطبقات
        // اسم الطالب
        const studentNameSVG = await createTextSVG(
            studentNameArabic,
            TEXT_POSITIONS.STUDENT_NAME.fontSize,
            TEXT_POSITIONS.STUDENT_NAME.color,
            imageWidth
        );
        overlays.push({ input: studentNameSVG, top: TEXT_POSITIONS.STUDENT_NAME.y, left: TEXT_POSITIONS.STUDENT_NAME.x, blend: 'overlay' });

        // الرقم التسلسلي
        const serialNumberSVG = await createTextSVG(
            serialNumber,
            TEXT_POSITIONS.SERIAL_NUMBER.fontSize,
            TEXT_POSITIONS.SERIAL_NUMBER.color,
            imageWidth
        );
        overlays.push({ input: serialNumberSVG, top: TEXT_POSITIONS.SERIAL_NUMBER.y, left: TEXT_POSITIONS.SERIAL_NUMBER.x, blend: 'overlay' });

        // رقم الوثيقة التسلسلي
        const documentSerialNumberSVG = await createTextSVG(
            documentSerialNumber,
            TEXT_POSITIONS.DOCUMENT_SERIAL_NUMBER.fontSize,
            TEXT_POSITIONS.DOCUMENT_SERIAL_NUMBER.color,
            imageWidth
        );
        overlays.push({ input: documentSerialNumberSVG, top: TEXT_POSITIONS.DOCUMENT_SERIAL_NUMBER.y, left: TEXT_POSITIONS.DOCUMENT_SERIAL_NUMBER.x, blend: 'overlay' });

        // رقم اللوحة
        const plateNumberSVG = await createTextSVG(
            `رقم اللوحة: ${plateNumber}`,
            TEXT_POSITIONS.PLATE_NUMBER.fontSize,
            TEXT_POSITIONS.PLATE_NUMBER.color,
            imageWidth
        );
        overlays.push({ input: plateNumberSVG, top: TEXT_POSITIONS.PLATE_NUMBER.y, left: TEXT_POSITIONS.PLATE_NUMBER.x, blend: 'overlay' });

        // نوع السيارة
        const carTypeSVG = await createTextSVG(
            `نوع السيارة: ${carType}`,
            TEXT_POSITIONS.CAR_TYPE.fontSize,
            TEXT_POSITIONS.CAR_TYPE.color,
            imageWidth
        );
        overlays.push({ input: carTypeSVG, top: TEXT_POSITIONS.CAR_TYPE.y, left: TEXT_POSITIONS.CAR_TYPE.x, blend: 'overlay' });

        // اللون
        const colorSVG = await createTextSVG(
            `اللون: ${color}`,
            TEXT_POSITIONS.COLOR.fontSize,
            TEXT_POSITIONS.COLOR.color,
            imageWidth
        );
        overlays.push({ input: colorSVG, top: TEXT_POSITIONS.COLOR.y, left: TEXT_POSITIONS.COLOR.x, blend: 'overlay' });

        // تركيب النصوص على الصورة وإنشاء الصورة النهائية
        const processedImageBuffer = await baseImage
            .png() // تم تغيير هذا السطر ليخرج الصورة بصيغة PNG إذا كانت الصورة الأساسية PNG
            // يمكنك استخدام .jpeg() إذا كنت تفضل إخراج JPEG وتحويل الصورة
            .toBuffer();

        // إرجاع الصورة كـ base64 في استجابة HTTP
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'image/png', // تحديد نوع المحتوى كصورة PNG
                'Cache-Control': 's-maxage=1, stale-while-revalidate' // تحسينات للتخزين المؤقت
            },
            body: processedImageBuffer.toString('base64'),
            isBase64Encoded: true, // إعلام العميل بأن الجسم مشفر بـ base64
        };

    } catch (error) {
        // معالجة الأخطاء وطباعتها في سجلات Vercel بشكل مفصل
        console.error('خطأ عام في وظيفة توليد الشهادة:', error);
        console.error('تتبع الخطأ:', error.stack); // اطبع تتبع الخطأ لتحديد مصدره بدقة

        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'حدث خطأ أثناء توليد الشهادة', details: error.message }),
            headers: { 'Content-Type': 'application/json' },
        };
    } finally {
        // إغلاق اتصال MongoDB دائمًا لضمان عدم تراكم الاتصالات
        if (client) await client.close();
    }
}