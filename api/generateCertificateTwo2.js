// api/generateCertificateTwo2.js
// الكود الذي أرسلته لك مسبقًا بدون تعليقات

import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

const CERTIFICATE_IMAGE_PATH = path.join(process.cwd(), 'public', 'images', 'full', 'wwee.jpg');
const FONT_FILENAME = 'arial.ttf';
const FONT_PATH = path.join(process.cwd(), 'public', 'fonts', FONT_FILENAME);
const FONT_CSS_FAMILY_NAME = 'Arial';

const RED_COLOR_HEX = '#FF0000';
const BLUE_COLOR_HEX = '#0000FF';
const GREEN_COLOR_HEX = '#00FF00';
const BLACK_COLOR_HEX = '#000000';

const GREETING_POSITIONS = {
    GREETING1: { text: "أهلاً وسهلاً بكم!", x: 0, y: 80, fontSize: 40, color: RED_COLOR_HEX, gravity: 'center' },
    GREETED_NAME: { text: "محمد أحمد علي", x: 0, y: 180, fontSize: 55, color: BLACK_COLOR_HEX, gravity: 'center' },
    GREETING2: { text: "نتمنى لكم يوماً سعيداً.", x: 50, y: 300, fontSize: 30, color: BLUE_COLOR_HEX, gravity: 'west' },
    GREETING3: { text: "شكراً لزيارتكم.", x: 0, y: 450, fontSize: 25, color: GREEN_COLOR_HEX, gravity: 'east' }
};

async function createSharpTextBuffer(text, fontSize, color, svgWidth, svgHeight, gravity, fontBuffer, fontCssFamilyName) {
    let textAnchor = 'middle';
    let xPosition = svgWidth / 2;

    if (gravity === 'west') {
        textAnchor = 'start';
        xPosition = 0;
    } else if (gravity === 'east') {
        textAnchor = 'end';
        xPosition = svgWidth;
    }

    const svgText = `
        <svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">
            <style>
                @font-face {
                    font-family: '${fontCssFamilyName}';
                    src: url('data:font/ttf;base64,${fontBuffer.toString('base64')}') format('truetype');
                }
                text {
                    font-family: '${fontCssFamilyName}', sans-serif;
                    font-size: ${fontSize}px;
                    fill: ${color};
                    text-anchor: ${textAnchor};
                    dominant-baseline: middle;
                    direction: rtl;
                }
            </style>
            <text x="${xPosition}" y="${svgHeight / 2}">${text}</text>
        </svg>
    `.trim();
    
    return sharp(Buffer.from(svgText)).png().toBuffer();
}

export default async function handler(req, res) {
    console.log('--- بدأ تنفيذ دالة generateCertificateTwo2 ---'); // Log 1

    if (req.method !== 'GET') {
        console.log('طلب غير مسموح به:', req.method); // Log 2
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        console.log('جارٍ التحقق من صورة الشهادة...'); // Log 3
        try {
            await fs.access(CERTIFICATE_IMAGE_PATH);
            console.log('صورة الشهادة موجودة.', CERTIFICATE_IMAGE_PATH); // Log 4
        } catch (fileError) {
            console.error('خطأ: صورة الشهادة غير موجودة أو لا يمكن الوصول إليها:', fileError.message); // Log 5
            return res.status(500).json({
                error: 'صورة الشهادة غير موجودة أو لا يمكن الوصول إليها.',
                details: fileError.message,
                path: CERTIFICATE_IMAGE_PATH
            });
        }

        console.log('جارٍ معالجة الصورة الأساسية...'); // Log 6
        const baseImage = sharp(CERTIFICATE_IMAGE_PATH);
        const metadata = await baseImage.metadata();
        const imageWidth = metadata.width;
        const imageHeight = metadata.height;
        console.log('أبعاد الصورة:', imageWidth, 'x', imageHeight); // Log 7

        let processedImage = baseImage;

        console.log('جارٍ التحقق من ملف الخط...'); // Log 8
        let fontBuffer;
        try {
            fontBuffer = await fs.readFile(FONT_PATH);
            console.log('ملف الخط موجود وتم قراءته.', FONT_PATH); // Log 9
        } catch (fontError) {
            console.error('خطأ: ملف الخط غير موجود أو لا يمكن الوصول إليه:', fontError.message); // Log 10
            return res.status(500).json({
                error: 'ملف الخط غير موجود أو لا يمكن الوصول إليه.',
                details: fontError.message,
                path: FONT_PATH
            });
        }

        console.log('جارٍ إضافة النصوص إلى الصورة...'); // Log 11
        for (const key in GREETING_POSITIONS) {
            const pos = GREETING_POSITIONS[key];
            const textHeight = pos.fontSize * 2;
            
            console.log(`إنشاء نص لـ: ${key} بـ: ${pos.text}`); // Log 12

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
            console.log(`تم إنشاء Buffer للنص ${key}`); // Log 13

            processedImage = await processedImage.composite([{
                input: textOverlayBuffer,
                left: pos.x,
                top: pos.y - (textHeight / 2),
            }]);
            console.log(`تم تركيب النص ${key}`); // Log 14
        }

        console.log('جارٍ إنشاء الصورة النهائية...'); // Log 15
        const finalImageBuffer = await processedImage
            .flatten({ background: { r: 255, g: 255, b: 255, alpha: 1 } })
            .jpeg({
                quality: 85,
                progressive: true
            }).toBuffer();
        console.log('تم إنشاء الصورة النهائية.'); // Log 16

        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');
        console.log('تم إرسال الصورة بنجاح.'); // Log 17
        return res.status(200).send(finalImageBuffer);

    } catch (error) {
        console.error('خطأ عام في وظيفة generateCertificateTwo2 (داخل catch):', error); // Log 18
        console.error('تتبع الخطأ (داخل catch):', error.stack); // Log 19

        if (error.message.includes('fontconfig') || error.message.includes('freetype')) {
            return res.status(500).json({
                error: 'خطأ في تحميل الخطوط (fontconfig/freetype).',
                details: error.message
            });
        } else if (error.message.includes('Input file is missing')) {
            return res.status(500).json({
                error: 'ملف الصورة الأساسي غير موجود.',
                details: error.message
            });
        } else {
            return res.status(500).json({
                error: 'حدث خطأ غير متوقع أثناء معالجة الشهادة.',
                details: error.message
            });
        }
    }
}