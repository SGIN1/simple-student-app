// api/generateCertificateTwo2.js
// هذا الملف يستخدم الآن ES Module syntax

import { MongoClient, ObjectId } from 'mongodb'; 
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

const uri = process.env.MONGODB_URI;
const dbName = 'Cluster0';
const collectionName = 'enrolled_students_tbl';

// **مسار صورة الشهادة:**
const CERTIFICATE_IMAGE_PATH = path.join(process.cwd(), 'public', 'images', 'full', 'wwee.png');

// **مسار الخط الجديد (Arial):**
// تأكد أن ملف 'arial.ttf' موجود في هذا المسار ضمن مجلد public/fonts في مشروعك.
const FONT_FILENAME = 'arial.ttf';
const FONT_PATH = path.join(process.cwd(), 'public', 'fonts', FONT_FILENAME);

// **اسم الخط للاستخدام في CSS:**
// هذا هو الاسم الذي سيتعرف عليه SVG في بيئة sharp
const FONT_CSS_FAMILY_NAME = 'Arial'; // الاسم الشائع لخط Arial

// تعريف ألوان النصوص
const RED_COLOR_HEX = '#FF0000';    // أحمر
const BLUE_COLOR_HEX = '#0000FF';   // أزرق
const GREEN_COLOR_HEX = '#00FF00';  // أخضر

// تعريف إحداثيات ومواصفات نصوص الترحيب
// **هذه الإحداثيات (x, y) هي قيم تقديرية. يجب عليك تعديلها بعناية لتناسب تصميم شهادتك (wwee.png).**
const GREETING_POSITIONS = {
    GREETING1: { 
        text: "أهلاً وسهلاً بكم!", 
        x: 500, // منتصف الصورة أفقياً
        y: 300, // أعلى قليلاً
        fontSize: 70, 
        color: RED_COLOR_HEX, 
        alignment: 'middle' 
    },
    GREETING2: { 
        text: "نتمنى لكم يوماً سعيداً.", 
        x: 100, // جهة اليسار
        y: 450, // أسفل قليلاً
        fontSize: 50, 
        color: BLUE_COLOR_HEX, 
        alignment: 'left' 
    },
    GREETING3: { 
        text: "شكراً لزيارتكم.", 
        x: 900, // جهة اليمين
        y: 600, // أسفل أكثر
        fontSize: 40, 
        color: GREEN_COLOR_HEX, 
        alignment: 'right' 
    }
};

/**
 * دالة مساعدة لإنشاء نص SVG يمكن لـ sharp تركيبه على الصورة.
 * تقوم بتضمين الخط مباشرة في SVG كـ base64.
 * @param {string} text - النص المراد عرضه.
 * @param {number} fontSize - حجم الخط بالبكسل.
 * @param {string} color - لون النص (مثال: '#FF0000').
 * @param {number} svgWidth - العرض الكلي لمساحة SVG (يجب أن يكون عرض الصورة).
 * @param {string} alignment - محاذاة النص ('start', 'middle', 'end').
 * @param {Buffer} fontBuffer - بيانات ملف الخط (buffer) لضمان التضمين الصحيح.
 * @param {string} fontCssFamilyName - الاسم الذي سيتم استخدامه للخط في CSS (الاسم الدقيق للخط).
 * @returns {Buffer} - كائن Buffer يحتوي على بيانات SVG.
 */
async function createTextSVG(text, fontSize, color, svgWidth, alignment = 'middle', fontBuffer, fontCssFamilyName) {
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
                    font-family: '${fontCssFamilyName}'; 
                    src: url('data:font/ttf;base64,${fontBuffer.toString('base64')}') format('truetype');
                    font-weight: normal;
                    font-style: normal;
                }
                text {
                    font-family: '${fontCssFamilyName}', sans-serif; /* استخدام الخط المخصص، ثم خط عام احتياطي */
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

    let client; 

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

        // 2. التحقق من وجود ملف الخط وقراءته في الذاكرة
        let fontBuffer;
        try {
            fontBuffer = await fs.readFile(FONT_PATH);
            console.log('ملف الخط موجود وتم قراءته:', FONT_PATH);
            console.log('الاسم الذي سيُستخدم للخط في CSS هو:', FONT_CSS_FAMILY_NAME);
        } catch (fontError) {
            console.error('خطأ: ملف الخط غير موجود أو لا يمكن الوصول إليه:', fontError.message);
            return res.status(500).json({
                error: 'ملف الخط غير موجود أو لا يمكن الوصول إليه. يرجى التأكد من وضعه في المسار الصحيح وتضمينه في النشر.',
                details: fontError.message,
                path: FONT_PATH
            });
        }

        // قراءة صورة الشهادة الأساسية باستخدام sharp
        const baseImage = sharp(CERTIFICATE_IMAGE_PATH);
        const metadata = await baseImage.metadata();
        const imageWidth = metadata.width;

        const overlays = [];

        // --- إضافة نصوص الترحيب إلى الصورة ---
        for (const key in GREETING_POSITIONS) {
            const pos = GREETING_POSITIONS[key];
            const greetingSVG = await createTextSVG(
                pos.text,
                pos.fontSize,
                pos.color,
                imageWidth,
                pos.alignment,
                fontBuffer, 
                FONT_CSS_FAMILY_NAME 
            );
            overlays.push({ 
                input: greetingSVG, 
                top: pos.y, 
                left: pos.x, 
                blend: 'overlay' 
            });
        }

        // تركيب النصوص على الصورة وإنشاء الصورة النهائية
        const processedImageBuffer = await baseImage
            .composite(overlays)
            .png() 
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
        if (client) await client.close();
    }
}