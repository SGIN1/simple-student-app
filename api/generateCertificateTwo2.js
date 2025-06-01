// api/generateCertificateTwo2.js
// تأكد أن هذا الكود هو بالضبط ما لديك

import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

const CERTIFICATE_IMAGE_PATH = path.join(process.cwd(), 'public', 'images', 'full', 'wwee.png');
const FONT_FILENAME = 'arial.ttf';
const FONT_PATH = path.join(process.cwd(), 'public', 'fonts', FONT_FILENAME);
const FONT_CSS_FAMILY_NAME = 'Arial'; 

const RED_COLOR_HEX = '#FF0000';    
const BLUE_COLOR_HEX = '#0000FF';   
const GREEN_COLOR_HEX = '#00FF00';  

const GREETING_POSITIONS = {
    GREETING1: { text: "أهلاً وسهلاً بكم!", x: 0, y: 400, fontSize: 70, color: RED_COLOR_HEX, gravity: 'center' },
    GREETING2: { text: "نتمنى لكم يوماً سعيداً.", x: 50, y: 550, fontSize: 50, color: BLUE_COLOR_HEX, gravity: 'west' },
    GREETING3: { text: "شكراً لزيارتكم.", x: 0, y: 700, fontSize: 40, color: GREEN_COLOR_HEX, gravity: 'east' }
};

async function createSharpTextBuffer(text, fontSize, color, svgWidth, svgHeight, gravity, fontBuffer, fontCssFamilyName) {
    // هذه هي الطريقة الصحيحة التي تدعمها Sharp لإنشاء النص ولتجنب خطأ "invalid markup"
    const svgText = `<svg width="${svgWidth}" height="${svgHeight}">
        <style>
            @font-face {
                font-family: '${fontCssFamilyName}';
                src: url('data:font/ttf;base64,${fontBuffer.toString('base64')}') format('truetype');
            }
            text {
                font-family: '${fontCssFamilyName}';
                font-size: ${fontSize}px;
                fill: ${color};
                dominant-baseline: middle; /* لتحسين المحاذاة الرأسية */
                text-anchor: ${gravity === 'center' ? 'middle' : (gravity === 'west' ? 'start' : 'end')}; /* لتحديد المحاذاة الأفقية */
            }
        </style>
        <text x="${gravity === 'center' ? svgWidth / 2 : (gravity === 'west' ? 0 : svgWidth)}" y="${svgHeight / 2}">
            ${text}
        </text>
    </svg>`;
    
    return sharp(Buffer.from(svgText))
        .png() // نولدها كـ PNG مؤقتة لدمجها بسهولة
        .toBuffer();
}


export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        await fs.access(CERTIFICATE_IMAGE_PATH);
        const baseImage = sharp(CERTIFICATE_IMAGE_PATH);
        let metadata = await baseImage.metadata();
        let imageWidth = metadata.width;
        let imageHeight = metadata.height;

        let processedImage = baseImage;

        let fontBuffer;
        try {
            fontBuffer = await fs.readFile(FONT_PATH);
        } catch (fontError) {
            console.error('خطأ: ملف الخط غير موجود أو لا يمكن الوصول إليه:', fontError.message);
            return res.status(500).json({
                error: 'ملف الخط غير موجود أو لا يمكن الوصول إليه. يرجى التأكد من وضعه في المسار الصحيح وتضمينه في النشر.',
                details: fontError.message,
                path: FONT_PATH
            });
        }
        
        // --- إضافة نصوص الترحيب إلى الصورة باستخدام sharp.composite() ---
        for (const key in GREETING_POSITIONS) {
            const pos = GREETING_POSITIONS[key];
            const textHeight = pos.fontSize * 2; 

            const textOverlayBuffer = await createSharpTextBuffer(
                pos.text,
                pos.fontSize,
                pos.color,
                imageWidth, 
                textHeight,
                pos.gravity,
                fontBuffer,
                FONT_CSS_FAMILY_NAME
            );

            // تركيب النص كـ overlay
            processedImage = await processedImage.composite([{
                input: textOverlayBuffer,
                left: pos.x,
                top: pos.y,
                blend: 'over' 
            }]);
        }

        const finalImageBuffer = await processedImage
            .webp({
                quality: 85,         
                nearLossless: true,  
                chromaSubsampling: '4:4:4' 
            })
            .toBuffer();

        res.setHeader('Content-Type', 'image/webp'); 
        // استراتيجية كاش قوية جداً: تُخزن لمدة سنة، ولا يعيد المتصفح التحقق من الخادم.
        // مناسب جداً للصور التي لا تتغير أبدًا لنفس الـ ID.
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        // إذا كان هناك احتمال ولو ضئيل لتغيير الشهادة لنفس الـ ID، استخدم:
        // res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
        // أو إذا كنت تريد عدم الكاش مطلقاً (غير موصى به للأداء):
        // res.setHeader('Cache-Control', 'no-store');


        return res.status(200).send(finalImageBuffer);

    } catch (error) {
        console.error('خطأ عام في وظيفة generateCertificateTwo2:', error);
        console.error('تتبع الخطأ:', error.stack);
        if (error.message.includes('fontconfig') || error.message.includes('freetype')) {
            return res.status(500).json({
                error: 'خطأ في معالجة الخطوط. تأكد من تهيئة Vercel لدعم Sharp والخطوط.',
                details: error.message,
                stack: error.stack
            });
        }
        if (error.message.includes('Input file is missing')) {
            return res.status(500).json({
                error: 'صورة الشهادة (wwee.png) غير موجودة. تحقق من مجلد public/images/full.',
                details: error.message,
                path: CERTIFICATE_IMAGE_PATH
            });
        }
        return res.status(500).json({
            error: 'حدث خطأ أثناء توليد الشهادة. يرجى مراجعة سجلات الخادم.',
            details: error.message,
            stack: error.stack
        });
    }
}