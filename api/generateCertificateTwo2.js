// api/generateCertificateTwo2.js
// هذا الملف يستخدم الآن ES Module syntax

import { MongoClient, ObjectId } from 'mongodb';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import QRCode from 'qrcode';

// **ملاحظة هامة:** تأكد من إضافة MONGODB_URI في متغيرات البيئة الخاصة بمشروعك على Vercel
// (Settings -> Environment Variables)
const uri = process.env.MONGODB_URI;
const dbName = 'Cluster0'; // تأكد من اسم قاعدة البيانات الخاصة بك
const collectionName = 'enrolled_students_tbl'; // تأكد من اسم المجموعة الخاصة بك

// **مسار صورة الشهادة المصحح:**
// تأكد أن 'wwee.png' موجودة في هذا المسار المحدد في نشر Vercel.
const CERTIFICATE_IMAGE_PATH = path.join(process.cwd(), 'public', 'images', 'full', 'wwee.png');

// تعريف ألوان النصوص
const TEXT_COLOR_HEX = '#000000'; // أسود
const WHITE_COLOR_HEX = '#FFFFFF'; // أبيض

// تعريف إحداثيات النصوص (قد تحتاج لتعديلها بدقة بعد التجربة)
// هذه القيم تقديرية وستحتاج إلى تعديل بناءً على تصميم قالب "wwee.png" وحجم الخط
const TEXT_POSITIONS = {
    // هذه الحقول يجب أن تتطابق مع الحقول في قاعدة بياناتك والشهادة
    SERIAL_NUMBER_VEHICLE: { x: 700, y: 150, fontSize: 40, color: TEXT_COLOR_HEX, alignment: 'right' },
    RESIDENCY_NUMBER_OWNER: { x: 700, y: 200, fontSize: 30, color: TEXT_COLOR_HEX, alignment: 'right' },
    PLATE_NUMBER: { x: 700, y: 250, fontSize: 25, color: TEXT_COLOR_HEX, alignment: 'right' },
    CAR_TYPE: { x: 700, y: 300, fontSize: 25, color: TEXT_COLOR_HEX, alignment: 'right' },
    INSPECTION_DATE: { x: 700, y: 350, fontSize: 25, color: TEXT_COLOR_HEX, alignment: 'right' },
    INSPECTION_EXPIRY_DATE: { x: 700, y: 400, fontSize: 25, color: TEXT_COLOR_HEX, alignment: 'right' },
    
    // موقع وحجم QR Code (سيتم التعامل معه بشكل منفصل)
    QR_CODE: { x: 100, y: 500, size: 150 } 
};

/**
 * دالة مساعدة لإنشاء نص SVG يمكن لـ sharp تركيبه على الصورة.
 * نستخدم خطوط نظامية شائعة لضمان التوافقية في بيئة Serverless.
 * @param {string} text - النص المراد عرضه.
 * @param {number} fontSize - حجم الخط بالبكسل.
 * @param {string} color - لون النص (مثال: '#000000').
 * @param {number} svgWidth - العرض الكلي لمساحة SVG (يمكن أن يكون عرض الصورة).
 * @param {string} alignment - محاذاة النص ('start', 'middle', 'end', 'right', 'left').
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
 * تستقبل طلب GET مع معرف الطالب في الـ Query Parameter (`?id=`) أو في المسار.
 *
 * @param {Object} req - كائن الطلب (HTTP request).
 * @param {Object} res - كائن الاستجابة (HTTP response).
 */
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // استخراج معرف الطالب من Query Parameter (req.query.id) أو من المسار
    const studentId = req.query.id || req.url.split('/').pop();
    console.log('ID المستلم في generateCertificateTwo2:', studentId);

    if (!studentId) {
        return res.status(400).json({ error: 'معرف الطالب مطلوب في رابط URL (مثال: ?id=xxxx أو /api/generateCertificateTwo2/xxxx).' });
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
                error: 'صورة الشهادة الثانية غير موجودة أو لا يمكن الوصول إليها. يرجى التحقق من مسار ملف الصورة في النشر.',
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
            // محاولة البحث باستخدام ObjectId أولاً
            student = await studentsCollection.findOne({ _id: new ObjectId(studentId) });
        } catch (objectIdError) {
            // إذا فشل التحويل إلى ObjectId، قد يكون الـ ID ليس ObjectId صالحًا.
            // في هذه الحالة، نحاول البحث باستخدام الـ serial_number (إذا كان هذا هو المطلوب).
            console.warn('ID المستلم ليس ObjectId صالحًا، نحاول البحث كـ serial_number:', studentId);
            student = await studentsCollection.findOne({ serial_number: studentId });
        }

        // التحقق مما إذا كان الطالب موجودًا
        if (!student) {
            console.error(`لم يتم العثور على طالب بالمعرف أو الرقم التسلسلي: ${studentId}`);
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
        // استخدم '|| '' لتجنب عرض 'null' أو 'undefined' إذا كان الحقل مفقودًا
        
        // الرقم التسلسلي للمركبة
        const serialNumberVehicleText = `الرقم التسلسلي للمركبة: ${student.serial_number || 'غير محدد'}`;
        const serialNumberVehicleSVG = await createTextSVG(
            serialNumberVehicleText,
            TEXT_POSITIONS.SERIAL_NUMBER_VEHICLE.fontSize,
            TEXT_POSITIONS.SERIAL_NUMBER_VEHICLE.color,
            imageWidth,
            TEXT_POSITIONS.SERIAL_NUMBER_VEHICLE.alignment
        );
        overlays.push({ input: serialNumberVehicleSVG, top: TEXT_POSITIONS.SERIAL_NUMBER_VEHICLE.y, left: TEXT_POSITIONS.SERIAL_NUMBER_VEHICLE.x });

        // رقم إقامة المالك
        const residencyNumberOwnerText = `رقم إقامة المالك: ${student.residency_number || 'غير محدد'}`;
        const residencyNumberOwnerSVG = await createTextSVG(
            residencyNumberOwnerText,
            TEXT_POSITIONS.RESIDENCY_NUMBER_OWNER.fontSize,
            TEXT_POSITIONS.RESIDENCY_NUMBER_OWNER.color,
            imageWidth,
            TEXT_POSITIONS.RESIDENCY_NUMBER_OWNER.alignment
        );
        overlays.push({ input: residencyNumberOwnerSVG, top: TEXT_POSITIONS.RESIDENCY_NUMBER_OWNER.y, left: TEXT_POSITIONS.RESIDENCY_NUMBER_OWNER.x });
        
        // رقم اللوحة
        const plateNumberText = `رقم اللوحة: ${student.plate_number || 'غير محدد'}`;
        const plateNumberSVG = await createTextSVG(
            plateNumberText,
            TEXT_POSITIONS.PLATE_NUMBER.fontSize,
            TEXT_POSITIONS.PLATE_NUMBER.color,
            imageWidth,
            TEXT_POSITIONS.PLATE_NUMBER.alignment
        );
        overlays.push({ input: plateNumberSVG, top: TEXT_POSITIONS.PLATE_NUMBER.y, left: TEXT_POSITIONS.PLATE_NUMBER.x });

        // نوع المركبة
        const carTypeText = `نوع المركبة: ${student.car_type || 'غير محدد'}`;
        const carTypeSVG = await createTextSVG(
            carTypeText,
            TEXT_POSITIONS.CAR_TYPE.fontSize,
            TEXT_POSITIONS.CAR_TYPE.color,
            imageWidth,
            TEXT_POSITIONS.CAR_TYPE.alignment
        );
        overlays.push({ input: carTypeSVG, top: TEXT_POSITIONS.CAR_TYPE.y, left: TEXT_POSITIONS.CAR_TYPE.x });

        // تاريخ الفحص
        const inspectionDateText = `تاريخ الفحص: ${student.inspection_date || 'غير محدد'}`;
        const inspectionDateSVG = await createTextSVG(
            inspectionDateText,
            TEXT_POSITIONS.INSPECTION_DATE.fontSize,
            TEXT_POSITIONS.INSPECTION_DATE.color,
            imageWidth,
            TEXT_POSITIONS.INSPECTION_DATE.alignment
        );
        overlays.push({ input: inspectionDateSVG, top: TEXT_POSITIONS.INSPECTION_DATE.y, left: TEXT_POSITIONS.INSPECTION_DATE.x });

        // تاريخ انتهاء الفحص
        const inspectionExpiryDateText = `تاريخ انتهاء الفحص: ${student.inspection_expiry_date || 'غير محدد'}`;
        const inspectionExpiryDateSVG = await createTextSVG(
            inspectionExpiryDateText,
            TEXT_POSITIONS.INSPECTION_EXPIRY_DATE.fontSize,
            TEXT_POSITIONS.INSPECTION_EXPIRY_DATE.color,
            imageWidth,
            TEXT_POSITIONS.INSPECTION_EXPIRY_DATE.alignment
        );
        overlays.push({ input: inspectionExpiryDateSVG, top: TEXT_POSITIONS.INSPECTION_EXPIRY_DATE.y, left: TEXT_POSITIONS.INSPECTION_EXPIRY_DATE.x });

        // --- إضافة QR Code (اختياري) ---
        const VERCEL_BASE_URL = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
        const certificateTwoVerificationUrl = `${VERCEL_BASE_URL}/api/verifyCertificateTwo?id=${student._id}`;
        
        let qrCodeDataUri;
        try {
            qrCodeDataUri = await QRCode.toDataURL(certificateTwoVerificationUrl, { errorCorrectionLevel: 'L', width: 100, margin: 1 });
            const qrBuffer = Buffer.from(qrCodeDataUri.split(',')[1], 'base64');
            overlays.push({
                input: qrBuffer,
                top: TEXT_POSITIONS.QR_CODE.y,
                left: TEXT_POSITIONS.QR_CODE.x,
                blend: 'overlay'
            });
        } catch (qrError) {
            console.error("خطأ في توليد QR Code:", qrError);
        }

        // تركيب النصوص والـ QR Code على الصورة وإنشاء الصورة النهائية
        const processedImageBuffer = await baseImage
            .composite(overlays)
            .png() // إخراج الصورة بصيغة PNG
            .toBuffer();

        // إرجاع الصورة
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');
        return res.status(200).send(processedImageBuffer);

    } catch (error) {
        console.error('خطأ عام في وظيفة generateCertificateTwo2:', error);
        console.error('تتبع الخطأ:', error.stack);

        return res.status(500).json({
            error: 'حدث خطأ أثناء توليد الشهادة الثانية',
            details: error.message,
            stack: error.stack
        });
    } finally {
        // إغلاق اتصال MongoDB دائمًا
        if (client) await client.close();
    }
}