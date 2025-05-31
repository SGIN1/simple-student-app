// api/generateCertificateTwo2.js
// هذا الملف يستخدم الآن ES Module syntax

import { MongoClient, ObjectId } from 'mongodb'; // هذه المكتبة لم تعد ضرورية للنص الثابت ولكن تم إبقاؤها لتجنب الأخطاء إذا كانت مستخدمة في مكان آخر
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
// import QRCode from 'qrcode'; // تم إزالة هذا الاستيراد لأنه غير مستخدم الآن

// **ملاحظة هامة:** MONGODB_URI لم تعد ضرورية لعرض نص ثابت، ولكن تم إبقاؤها لتجنب الأخطاء إذا كانت مستخدمة في مكان آخر
const uri = process.env.MONGODB_URI;
const dbName = 'Cluster0';
const collectionName = 'enrolled_students_tbl';

// **مسار صورة الشهادة المصحح:**
// تأكد أن 'wwee.png' موجودة في هذا المسار المحدد في نشر Vercel.
const CERTIFICATE_IMAGE_PATH = path.join(process.cwd(), 'public', 'images', 'full', 'wwee.png');

// تعريف ألوان النصوص
const RED_COLOR_HEX = '#FF0000'; // أحمر
const TEXT_COLOR_HEX = '#000000'; // أسود (للاستخدام العام إذا احتجت)

// تعريف إحداثيات ومواصفات نص الترحيب
const GREETING_TEXT_POSITION = {
    x: 500, // إحداثي X (أفقي) لمنتصف النص
    y: 300, // إحداثي Y (رأسي) لمنتصف النص
    fontSize: 70, // حجم الخط كبير وواضح
    color: RED_COLOR_HEX, // اللون الأحمر
    alignment: 'middle' // محاذاة النص في المنتصف
};

/**
 * دالة مساعدة لإنشاء نص SVG يمكن لـ sharp تركيبه على الصورة.
 * نستخدم خطوط نظامية شائعة لضمان التوافقية في بيئة Serverless.
 * @param {string} text - النص المراد عرضه.
 * @param {number} fontSize - حجم الخط بالبكسل.
 * @param {string} color - لون النص (مثال: '#FF0000').
 * @param {number} svgWidth - العرض الكلي لمساحة SVG.
 * @param {string} alignment - محاذاة النص ('start', 'middle', 'end').
 * @returns {Buffer} - كائن Buffer يحتوي على بيانات SVG.
 */
async function createTextSVG(text, fontSize, color, svgWidth, alignment = 'middle') {
    const svgHeight = fontSize * 1.5;
    const cleanText = text ? text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';

    let xPosition;
    let anchor;
    if (alignment === 'right') {
        xPosition = svgWidth - 10;
        anchor = 'end';
    } else if (alignment === 'left') {
        xPosition = 10;
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
 * وظيفة Vercel Serverless Function لإنشاء الشهادة.
 * هذه الوظيفة ستستقبل طلب GET (لا تتطلب معرف طالب حالياً).
 *
 * @param {Object} req - كائن الطلب (HTTP request).
 * @param {Object} res - كائن الاستجابة (HTTP response).
 */
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // لا حاجة لـ studentId أو الاتصال بقاعدة البيانات في هذا الإصدار المبسّط
    // const studentId = req.query.id || req.url.split('/').pop();
    // console.log('ID المستلم (للتتبع فقط - غير مستخدم الآن):', studentId);

    let client; // متغير عميل MongoDB (لم يعد مستخدمًا)

    try {
        // 1. التحقق من وجود صورة الشهادة أولاً
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

        // قراءة صورة الشهادة الأساسية باستخدام sharp
        const baseImage = sharp(CERTIFICATE_IMAGE_PATH);
        const metadata = await baseImage.metadata();
        const imageWidth = metadata.width;
        // const imageHeight = metadata.height; // غير مستخدمة حالياً

        const overlays = [];

        // --- إضافة نص الترحيب إلى الصورة ---
        const greetingText = "مرحباً بكم في شهادتك!"; // النص الذي تريد عرضه
        const greetingSVG = await createTextSVG(
            greetingText,
            GREETING_TEXT_POSITION.fontSize,
            GREETING_TEXT_POSITION.color,
            imageWidth, // استخدم عرض الصورة لتوسيط النص
            GREETING_TEXT_POSITION.alignment
        );
        overlays.push({ 
            input: greetingSVG, 
            top: GREETING_TEXT_POSITION.y, 
            left: GREETING_TEXT_POSITION.x, 
            blend: 'overlay' 
        });

        // تركيب النصوص على الصورة وإنشاء الصورة النهائية
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
            error: 'حدث خطأ أثناء توليد الشهادة.',
            details: error.message,
            stack: error.stack
        });
    } finally {
        // إغلاق اتصال MongoDB دائمًا (حتى لو لم يكن مستخدمًا بشكل مباشر في هذا الإصدار)
        if (client) await client.close();
    }
}