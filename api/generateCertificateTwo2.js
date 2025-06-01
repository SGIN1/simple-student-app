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
    GREETING1: {
        text: "أهلاً وسهلاً بكم!",
        x: 0,
        y: 400,
        fontSize: 70,
        color: RED_COLOR_HEX,
        gravity: 'center'
    },
    GREETING2: {
        text: "نتمنى لكم يوماً سعيداً.",
        x: 50,
        y: 550,
        fontSize: 50,
        color: BLUE_COLOR_HEX,
        gravity: 'west'
    },
    GREETING3: {
        text: "شكراً لزيارتكم.",
        x: 0,
        y: 700,
        fontSize: 40,
        color: GREEN_COLOR_HEX,
        gravity: 'east'
    }
};

async function createSharpTextBuffer(text, fontSize, color, svgWidth, svgHeight, gravity, fontBuffer, fontCssFamilyName) {
    const svgText = `
        <svg width="${svgWidth}" height="${svgHeight}">
            <style>
                @font-face {
                    font-family: '${fontCssFamilyName}';
                    src: url(data:font/ttf;charset=utf-8;base64,${fontBuffer.toString('base64')}) format('truetype');
                }
                text {
                    font-family: '${fontCssFamilyName}';
                    font-size: ${fontSize}px;
                    fill: ${color};
                    text-anchor: ${gravity === 'center' ? 'middle' : (gravity === 'west' ? 'start' : 'end')};
                }
            </style>
            <text x="${gravity === 'center' ? svgWidth / 2 : (gravity === 'west' ? 0 : svgWidth)}" y="${fontSize}">${text}</text>
        </svg>
    `;
    return Buffer.from(svgText);
}

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { id } = req.query;

    let studentName = "طالب مجهول";
    if (id) {
         studentName = `الطالب رقم ${id}`;
         GREETING_POSITIONS.GREETING1.text = `تهانينا يا ${studentName}!`;
    }

    try {
        try {
            await fs.access(CERTIFICATE_IMAGE_PATH);
        } catch (fileError) {
            return res.status(500).json({
                error: 'صورة الشهادة غير موجودة أو لا يمكن الوصول إليها.',
                details: fileError.message,
                path: CERTIFICATE_IMAGE_PATH
            });
        }

        const baseImage = sharp(CERTIFICATE_IMAGE_PATH);
        let metadata = await baseImage.metadata();
        let imageWidth = metadata.width;
        let imageHeight = metadata.height;

        let processedImage = baseImage;

        const MAX_IMAGE_WIDTH = 2000;
        if (imageWidth > MAX_IMAGE_WIDTH) {
            processedImage = processedImage.resize({ width: MAX_IMAGE_WIDTH });
            metadata = await processedImage.metadata();
            imageWidth = metadata.width;
            imageHeight = metadata.height;
        }

        let fontBuffer;
        try {
            fontBuffer = await fs.readFile(FONT_PATH);
        } catch (fontError) {
            return res.status(500).json({
                error: 'ملف الخط غير موجود أو لا يمكن الوصول إليه.',
                details: fontError.message,
                path: FONT_PATH
            });
        }

        const overlays = [];
        for (const key in GREETING_POSITIONS) {
            const pos = GREETING_POSITIONS[key];
            const textBuffer = await createSharpTextBuffer(
                pos.text,
                pos.fontSize,
                pos.color,
                imageWidth,
                pos.fontSize * 1.5,
                pos.gravity,
                fontBuffer,
                FONT_CSS_FAMILY_NAME
            );

            overlays.push({
                input: textBuffer,
                left: pos.x,
                top: pos.y,
                blend: 'overlay'
            });
        }

        processedImage = await processedImage.composite(overlays);

        const finalImageBuffer = await processedImage
            .png({
                quality: 90,
                progressive: false
            })
            .toBuffer();

        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');
        return res.status(200).send(finalImageBuffer);

    } catch (error) {
        if (error.message.includes('fontconfig') || error.message.includes('freetype')) {
            return res.status(500).json({
                error: 'حدث خطأ في معالجة الخطوط. قد تكون بيئة النشر لا تدعم Fontconfig أو FreeType.',
                details: error.message,
                stack: error.stack
            });
        }
        return res.status(500).json({
            error: 'حدث خطأ أثناء توليد الشهادة.',
            details: error.message,
            stack: error.stack
        });
    }
}