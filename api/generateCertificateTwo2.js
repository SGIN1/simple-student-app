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

// **مسار صورة الشهادة:**
// تأكد أن 'wwee.png' موجودة في هذا المسار المحدد في نشر Vercel.
const CERTIFICATE_IMAGE_PATH = path.join(process.cwd(), 'public', 'images', 'full', 'wwee.png');

// **مسار الخط العربي الجديد:**
// **تم تحديث اسم الملف إلى 'andlso.ttf' ليتطابق مع سجلات النشر.**
const ARABIC_FONT_PATH = path.join(process.cwd(), 'public', 'fonts', 'andlso.ttf');

// تعريف ألوان النصوص
const RED_COLOR_HEX = '#FF0000'; // أحمر

// تعريف إحداثيات ومواصفات نص الترحيب
const GREETING_TEXT_POSITION = {
    x: 500, // إحداثي X (أفقي) لمنتصف النص - **قد تحتاج للتعديل**
    y: 300, // إحداثي Y (رأسي) لمنتصف النص - **قد تحتاج للتعديل**
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
 * @param {string} fontPath - المسار الكامل لملف الخط.
 * @returns {Buffer} - كائن Buffer يحتوي على بيانات SVG.
 */
async function createTextSVG(text, fontSize, color, svgWidth, alignment = 'middle', fontPath) {
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
                @font-face {
                    font-family: 'Andlso'; /* **تغيير اسم الخط في CSS ليتطابق مع اسم ملف الخط or best practice** */
                    src: url('data:font/ttf;base64,${(await fs.readFile(fontPath)).toString('base64')}') format('truetype');
                }
                text {
                    font-family: 'Andlso', sans-serif; /* **استخدام اسم الخط الجديد**، ثم خط عام */
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

        // 2. التحقق من وجود ملف الخط العربي
        try {
            await fs.access(ARABIC_FONT_PATH);
            console.log('ملف الخط العربي موجود في المسار المحدد:', ARABIC_FONT_PATH);
        } catch (fontError) {
            console.error('خطأ: ملف الخط العربي غير موجود أو لا يمكن الوصول إليه:', fontError.message);
            return res.status(500).json({
                error: 'ملف الخط العربي غير موجود أو لا يمكن الوصول إليه. يرجى التأكد من وضعه في المسار الصحيح وتضمينه في النشر.',
                details: fontError.message,
                path: ARABIC_FONT_PATH
            });
        }

        // قراءة صورة الشهادة الأساسية باستخدام sharp
        const baseImage = sharp(CERTIFICATE_IMAGE_PATH);
        const metadata = await baseImage.metadata();
        const imageWidth = metadata.width;

        const overlays = [];

        // --- إضافة نص الترحيب إلى الصورة ---
        const greetingText = "أهلاً وسهلاً بكم!"; // النص العربي الذي تريده
        const greetingSVG = await createTextSVG(
            greetingText,
            GREETING_TEXT_POSITION.fontSize,
            GREETING_TEXT_POSITION.color,
            imageWidth,
            GREETING_TEXT_POSITION.alignment,
            ARABIC_FONT_PATH // تمرير مسار الخط لدالة createTextSVG
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