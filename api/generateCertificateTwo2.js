// ملف: pages/api/generateCertificateTwo2.js
// هذا الملف يستخدم الآن ES Module syntax

import { MongoClient, ObjectId } from 'mongodb';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises'; // لاستخدام fs.access للتحقق من وجود الملف
import QRCode from 'qrcode'; // لإضافة QR Code إذا رغبت في ذلك (سيتم تعطيله مؤقتاً لتجنب تعقيد sharp)

// **ملاحظة هامة:** تأكد من إضافة MONGODB_URI في متغيرات البيئة الخاصة بمشروعك على Vercel
// (Settings -> Environment Variables)
const uri = process.env.MONGODB_URI;
const dbName = 'Cluster0'; // تأكد من اسم قاعدة البيانات الخاصة بك
const collectionName = 'enrolled_students_tbl'; // تأكد من اسم المجموعة الخاصة بك

// **مسار صورة الشهادة المصحح:**
// هذا المسار يفترض أن صورة 'wwee.png' موجودة في مجلد 'public/images/full'
// داخل جذر مشروعك على Vercel.
const CERTIFICATE_IMAGE_PATH = path.join(process.cwd(), 'public', 'images', 'full', 'wwee.png');

// تعريف ألوان النصوص
const TEXT_COLOR_HEX = '#000000'; // أسود (يمكنك تغييره)
const WHITE_COLOR_HEX = '#FFFFFF'; // أبيض (يمكنك تغييره)

// تعريف إحداثيات النصوص (قد تحتاج لتعديلها بدقة بعد التجربة)
// هذه القيم تقديرية وستحتاج إلى تعديل بناءً على تصميم قالب "wwee.png" وحجم الخط
const TEXT_POSITIONS = {
    // استخدم الحقول التي تظهر في الشهادة الثانية من بيانات الطالب
    // القيم (x, y) هي إحداثيات (أفقي, رأسي) بالبكسل من الزاوية العلوية اليسرى للصورة.
    // يجب تعديلها لتتناسب مع تصميم wwee.png
    SERIAL_NUMBER_VEHICLE: { x: 300, y: 150, fontSize: 40, color: TEXT_COLOR_HEX, alignment: 'right' },
    RESIDENCY_NUMBER_OWNER: { x: 300, y: 200, fontSize: 30, color: TEXT_COLOR_HEX, alignment: 'right' },
    PLATE_NUMBER: { x: 300, y: 250, fontSize: 25, color: TEXT_COLOR_HEX, alignment: 'right' },
    CAR_TYPE: { x: 300, y: 300, fontSize: 25, color: TEXT_COLOR_HEX, alignment: 'right' },
    INSPECTION_DATE: { x: 300, y: 350, fontSize: 25, color: TEXT_COLOR_HEX, alignment: 'right' },
    INSPECTION_EXPIRY_DATE: { x: 300, y: 400, fontSize: 25, color: TEXT_COLOR_HEX, alignment: 'right' },
    // أضف المزيد من الحقول إذا كانت الشهادة الثانية تتطلبها
    // مثال:
    // CHASSIS_NUMBER: { x: 300, y: 450, fontSize: 25, color: TEXT_COLOR_HEX, alignment: 'right' },
    // MANUFACTURER: { x: 300, y: 500, fontSize: 25, color: TEXT_COLOR_HEX, alignment: 'right' },

    QR_CODE: { x: 100, y: 500, size: 150 } // موقع وحجم QR Code (سنتعامل معه بشكل منفصل)
};

/**
 * دالة مساعدة لإنشاء نص SVG يمكن لـ sharp تركيبه على الصورة.
 * نستخدم خطوط نظامية شائعة لضمان التوافقية في بيئة Serverless.
 * @param {string} text - النص المراد عرضه.
 * @param {number} fontSize - حجم الخط بالبكسل.
 * @param {string} color - لون النص (مثال: '#000000').
 * @param {number} svgWidth - العرض الكلي لمساحة SVG (يمكن أن يكون عرض الصورة).
 * @param {string} alignment - محاذاة النص ('start', 'middle', 'end').
 * @returns {Buffer} - كائن Buffer يحتوي على بيانات SVG.
 */
async function createTextSVG(text, fontSize, color, svgWidth, alignment = 'middle') {
    const svgHeight = fontSize * 1.5; // لتوفير مساحة كافية للنص
    const cleanText = text ? text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';

    let xPosition;
    let anchor;
    if (alignment === 'right') {
        xPosition = svgWidth - 10; // 10 بكسل من اليمين للحافة
        anchor = 'end';
    } else if (alignment === 'left') {
        xPosition = 10; // 10 بكسل من اليسار للحافة
        anchor = 'start';
    } else { // middle
        xPosition = svgWidth / 2;
        anchor = 'middle';
    }

    const svg = `
        <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
            <style>
                text {
                    font-family: 'Arial', sans-serif; /* خط شائع يدعم العربية */
                    font-size: ${fontSize}px;
                    fill: ${color};
                    text-anchor: ${anchor};
                    dominant-baseline: central;
                }
            </style>
            <text x="${xPosition}" y="${svgHeight / 2}">${cleanText}</text>
        </svg>
    `;
    return Buffer.from(svg);
}

/**
 * وظيفة Vercel Serverless Function لإنشاء الشهادة الثانية.
 * تستقبل طلب GET مع معرف الطالب في الـ Query Parameter (`?id=`).
 *
 * @param {Object} req - كائن الطلب (HTTP request).
 * @param {Object} res - كائن الاستجابة (HTTP response).
 */
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // استخراج معرف الطالب من Query Parameter (req.query.id)
    const studentId = req.query.id;
    console.log('ID المستلم في generateCertificateTwo2:', studentId);

    if (!studentId) {
        return res.status(400).json({ error: 'معرف الطالب مطلوب في رابط URL (مثال: ?id=xxxx).' });
    }

    let client; // تعريف متغير العميل خارج try لضمان إغلاقه في finally

    try {
        // 1. التحقق من وجود صورة الشهادة أولاً
        try {
            await fs.access(CERTIFICATE_IMAGE_PATH);
            console.log('صورة الشهادة الثانية موجودة في المسار المحدد:', CERTIFICATE_IMAGE_PATH);
        } catch (fileError) {
            console.error('خطأ: صورة الشهادة الثانية غير موجودة أو لا يمكن الوصول إليها:', fileError.message);
            return res.status(500).json({
                error: 'صورة الشهادة الثانية غير موجودة أو لا يمكن الوصول إليها.',
                details: fileError.message,
                path: CERTIFICATE_IMAGE_PATH
            });
        }

        // 2. الاتصال بقاعدة بيانات MongoDB
        if (!uri) {
            return res.status(500).json({ error: 'لم يتم العثور على رابط اتصال MongoDB في متغيرات البيئة.' });
        }
        
        client = new MongoClient(uri);
        await client.connect();
        const database = client.db(dbName);
        const studentsCollection = database.collection(collectionName);

        let student;
        try {
            // البحث باستخدام ObjectId
            student = await studentsCollection.findOne({ _id: new ObjectId(studentId) });
        } catch (objectIdError) {
            console.error('خطأ في تحويل المعرف إلى ObjectId:', objectIdError);
            return res.status(400).json({ error: `معرف الطالب غير صالح: ${studentId}`, details: objectIdError.message });
        }

        // التحقق مما إذا كان الطالب موجودًا
        if (!student) {
            console.error(`لم يتم العثور على طالب بالمعرف: ${studentId}`);
            return res.status(404).json({ error: `لم يتم العثور على طالب بالمعرف: ${studentId}` });
        }

        console.log('بيانات الطالب المسترجعة لـ generateCertificateTwo2:', student);

        // قراءة صورة الشهادة الأساسية باستخدام sharp
        const baseImage = sharp(CERTIFICATE_IMAGE_PATH);
        const metadata = await baseImage.metadata();
        const imageWidth = metadata.width;
        const imageHeight = metadata.height;

        const overlays = [];

        // --- إضافة النصوص إلى الصورة ---
        // (تأكد من أن هذه الحقول موجودة في بيانات الطالب المسترجعة أو قم بتعديلها)
        const serialNumberVehicleSVG = await createTextSVG(
            `الرقم التسلسلي للمركبة: ${student.serial_number || 'غير محدد'}`,
            TEXT_POSITIONS.SERIAL_NUMBER_VEHICLE.fontSize,
            TEXT_POSITIONS.SERIAL_NUMBER_VEHICLE.color,
            imageWidth, // استخدم عرض الصورة لتوسيط النص
            TEXT_POSITIONS.SERIAL_NUMBER_VEHICLE.alignment
        );
        overlays.push({ input: serialNumberVehicleSVG, top: TEXT_POSITIONS.SERIAL_NUMBER_VEHICLE.y, left: TEXT_POSITIONS.SERIAL_NUMBER_VEHICLE.x });

        const residencyNumberOwnerSVG = await createTextSVG(
            `رقم إقامة المالك: ${student.residency_number || 'غير محدد'}`,
            TEXT_POSITIONS.RESIDENCY_NUMBER_OWNER.fontSize,
            TEXT_POSITIONS.RESIDENCY_NUMBER_OWNER.color,
            imageWidth,
            TEXT_POSITIONS.RESIDENCY_NUMBER_OWNER.alignment
        );
        overlays.push({ input: residencyNumberOwnerSVG, top: TEXT_POSITIONS.RESIDENCY_NUMBER_OWNER.y, left: TEXT_POSITIONS.RESIDENCY_NUMBER_OWNER.x });
        
        const plateNumberSVG = await createTextSVG(
            `رقم اللوحة: ${student.plate_number || 'غير محدد'}`,
            TEXT_POSITIONS.PLATE_NUMBER.fontSize,
            TEXT_POSITIONS.PLATE_NUMBER.color,
            imageWidth,
            TEXT_POSITIONS.PLATE_NUMBER.alignment
        );
        overlays.push({ input: plateNumberSVG, top: TEXT_POSITIONS.PLATE_NUMBER.y, left: TEXT_POSITIONS.PLATE_NUMBER.x });

        const carTypeSVG = await createTextSVG(
            `نوع المركبة: ${student.car_type || 'غير محدد'}`,
            TEXT_POSITIONS.CAR_TYPE.fontSize,
            TEXT_POSITIONS.CAR_TYPE.color,
            imageWidth,
            TEXT_POSITIONS.CAR_TYPE.alignment
        );
        overlays.push({ input: carTypeSVG, top: TEXT_POSITIONS.CAR_TYPE.y, left: TEXT_POSITIONS.CAR_TYPE.x });

        const inspectionDateSVG = await createTextSVG(
            `تاريخ الفحص: ${student.inspection_date || 'غير محدد'}`,
            TEXT_POSITIONS.INSPECTION_DATE.fontSize,
            TEXT_POSITIONS.INSPECTION_DATE.color,
            imageWidth,
            TEXT_POSITIONS.INSPECTION_DATE.alignment
        );
        overlays.push({ input: inspectionDateSVG, top: TEXT_POSITIONS.INSPECTION_DATE.y, left: TEXT_POSITIONS.INSPECTION_DATE.x });

        const inspectionExpiryDateSVG = await createTextSVG(
            `تاريخ انتهاء الفحص: ${student.inspection_expiry_date || 'غير محدد'}`,
            TEXT_POSITIONS.INSPECTION_EXPIRY_DATE.fontSize,
            TEXT_POSITIONS.INSPECTION_EXPIRY_DATE.color,
            imageWidth,
            TEXT_POSITIONS.INSPECTION_EXPIRY_DATE.alignment
        );
        overlays.push({ input: inspectionExpiryDateSVG, top: TEXT_POSITIONS.INSPECTION_EXPIRY_DATE.y, left: TEXT_POSITIONS.INSPECTION_EXPIRY_DATE.x });

        // --- إضافة QR Code (اختياري) ---
        // بما أن Sharp قد يسبب مشاكل في المهلة، قد يكون من الأفضل عدم تضمين QR Code هنا
        // أو تقليل حجمه وجودته قدر الإمكان لتقليل المعالجة.
        // إذا كنت ترغب في تضمينه:
        const VERCEL_BASE_URL = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
        const certificateTwoVerificationUrl = `${VERCEL_BASE_URL}/api/verifyCertificateTwo?id=${student._id}`; // رابط تحقق للشهادة الثانية
        
        let qrCodeDataUri;
        try {
            // استخدام حجم صغير لـ QR Code لتقليل الحمل على Sharp
            qrCodeDataUri = await QRCode.toDataURL(certificateTwoVerificationUrl, { errorCorrectionLevel: 'L', width: 100, margin: 1 });
            const qrBuffer = Buffer.from(qrCodeDataUri.split(',')[1], 'base64');
            overlays.push({
                input: qrBuffer,
                top: TEXT_POSITIONS.QR_CODE.y,
                left: TEXT_POSITIONS.QR_CODE.x,
                // يمكنك استخدام 'composite' بدلاً من 'overlay' لدمج الصورة مباشرة
                blend: 'overlay' // أو 'saturate' أو غيرها حسب التأثير المطلوب
            });
        } catch (qrError) {
            console.error("خطأ في توليد QR Code:", qrError);
            // لا نضيف QR Code إذا فشل
        }

        // تركيب النصوص والـ QR Code على الصورة وإنشاء الصورة النهائية
        const processedImageBuffer = await baseImage
            .composite(overlays)
            .png() // إخراج الصورة بصيغة PNG
            .toBuffer();

        // إرجاع الصورة كـ base64 في استجابة HTTP
        // يجب أن نرسلها كـ Buffer مباشرة إذا كان هذا النوع من Response مدعومًا في Vercel
        // وإلا، base64 هي الطريقة القياسية
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate'); // تحسينات للتخزين المؤقت
        return res.status(200).send(processedImageBuffer);

    } catch (error) {
        // معالجة الأخطاء وطباعتها في سجلات Vercel بشكل مفصل
        console.error('خطأ عام في وظيفة generateCertificateTwo2:', error);
        console.error('تتبع الخطأ:', error.stack);

        return res.status(500).json({
            error: 'حدث خطأ أثناء توليد الشهادة الثانية',
            details: error.message,
            stack: error.stack // لإظهار تفاصيل الخطأ في الاستجابة (للتطوير)
        });
    } finally {
        // إغلاق اتصال MongoDB دائمًا لضمان عدم تراكم الاتصالات
        if (client) await client.close();
    }
}