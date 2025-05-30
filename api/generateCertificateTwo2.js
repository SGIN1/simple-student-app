import path from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';

import nodeHtmlToImage from 'node-html-to-image';

export const config = {
    maxDuration: 60 // 60 ثانية هو الحد الأقصى لخطة Vercel المجانية
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCAL_FONT_PATH = path.join(__dirname, '..', 'public', 'fonts', 'andlso.ttf');
const BACKGROUND_IMAGE_PATH = path.join(__dirname, '..', 'public', 'images', 'full', 'wwee.jpg');

export default async function handler(req) {
    try {
        console.log('--- Function Invoked (node-html-to-image) ---');
        console.log('Current Working Directory (process.cwd()):', process.cwd());
        console.log('Directory Name (__dirname):', __dirname);
        console.log('Attempting to load font from path:', LOCAL_FONT_PATH);
        console.log('Attempting to load image from path:', BACKGROUND_IMAGE_PATH);

        if (req.method !== 'GET') {
            return new Response('Method Not Allowed', { status: 405 });
        }

        const host = req.headers.host;
        const protocol = req.headers['x-forwarded-proto'] || 'http';

        const fullUrlString = `${protocol}://${host}${req.url}`;
        const url = new URL(fullUrlString);
        console.log("Full URL received:", fullUrlString);

        let studentId = url.searchParams.get('id');

        if (!studentId) {
            const pathSegments = url.pathname.split('/');
            const certIndex = pathSegments.indexOf('certificate');
            if (certIndex !== -1 && pathSegments.length > certIndex + 1) {
                const possibleId = pathSegments[certIndex + 1];
                if (possibleId && possibleId.trim() !== '') {
                    studentId = possibleId.trim();
                }
            }
        }
        console.log("Extracted Student ID:", studentId);

        if (!studentId) {
            return new Response('<h1>معرف الطالب مطلوب</h1><p>الرابط الذي استخدمته غير صحيح أو لا يحتوي على معرف الطالب.</p>', {
                status: 400,
                headers: { 'Content-Type': 'text/html' },
            });
        }

        let student;
        let fontData;
        let backgroundImageBase64 = '';

        try {
            const studentDataUrl = `${protocol}://${host}/api/getStudent?id=${studentId}`;
            console.log("Fetching student data from:", studentDataUrl);

            // لا حاجة لإضافة رؤوس المصادقة هنا ما دامت getStudent.js لا تتطلبها داخلياً
            const response = await fetch(studentDataUrl);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Failed to fetch student data from /api/getStudent: ${response.status} - ${errorText}`);
                let errorMessage = `فشل في جلب بيانات الطالب (الحالة: ${response.status}).`;
                try {
                    if (response.headers.get('content-type')?.includes('application/json')) {
                        const errorJson = JSON.parse(errorText);
                        errorMessage = errorJson.error || errorMessage;
                    } else {
                        // قص الرسالة الطويلة لتكون أوضح
                        // رسالة Vercel "Authentication Required" تكون طويلة جداً كـ HTML
                        errorMessage = `تفاصيل الخطأ: ${errorText.substring(0, 300)}...`; 
                    }
                } catch (e) {
                    errorMessage = `تفاصيل الخطأ: ${errorText.substring(0, 300)}...`;
                }
                // تعديل رسالة الخطأ لتكون أكثر وضوحًا للمستخدم
                return new Response(`
                    <h1>خطأ في جلب بيانات الطالب</h1>
                    <p>المشكلة قد تكون بسبب: <b>${errorMessage}</b></p>
                    <p>الرجاء التأكد من أن رابط بيانات الطالب صحيح وأن دالة جلب البيانات لا تتطلب مصادقة غير مبررة في إعدادات Vercel.</p>
                `, {
                    status: response.status,
                    headers: { 'Content-Type': 'text/html' },
                });
            }

            student = await response.json();
            console.log("Student data fetched successfully:", student.arabic_name);

            try {
                fontData = await fs.readFile(LOCAL_FONT_PATH);
                console.log("Font loaded successfully from file system.");
            } catch (fontFileError) {
                console.error("Failed to load font from file system at path:", LOCAL_FONT_PATH, "Error:", fontFileError.message);
                fontData = null; // استمر حتى لو فشل تحميل الخط، لكن الشهادة قد لا تظهر بشكل صحيح
            }

            try {
                const imageBuffer = await fs.readFile(BACKGROUND_IMAGE_PATH);
                backgroundImageBase64 = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
                console.log("Background image loaded successfully from file system and converted to Base64.");
            } catch (imageFileError) {
                console.error("Failed to load background image from file system at path:", BACKGROUND_IMAGE_PATH, "Error:", imageFileError.message);
                backgroundImageBase64 = ''; // استمر بدون خلفية إذا فشل التحميل
            }

            const htmlContent = `
            <html>
            <head>
                <style>
                    @font-face {
                        font-family: 'andlso';
                        src: url('data:font/ttf;base64,${fontData ? fontData.toString('base64') : ''}') format('truetype');
                    }
                    body {
                        width: 1200px;
                        height: 630px;
                        margin: 0;
                        padding: 0;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                        position: relative;
                        background-color: #fff;
                        font-family: 'andlso', sans-serif;
                        color: black;
                        background-image: url('${backgroundImageBase64}');
                        background-size: 100% 100%;
                        background-repeat: no-repeat;
                    }
                    .arabic-name {
                        position: absolute;
                        top: 40%;
                        width: 100%;
                        text-align: center;
                        font-size: 36px;
                        direction: rtl;
                        unicode-bidi: embed;
                    }
                    .detail {
                        position: absolute;
                        font-size: 16px;
                        color: white;
                        direction: rtl;
                        unicode-bidi: embed;
                    }
                    .serial-number { top: 15%; left: 10%; width: 30%; text-align: left; }
                    .document-serial-number { top: 55%; width: 100%; text-align: center; }
                    .plate-number { top: 60%; width: 100%; text-align: center; }
                    .car-type { top: 65%; width: 100%; text-align: center; }
                    .color { top: 70%; width: 100%; text-align: center; }
                </style>
            </head>
            <body>
                <div class="arabic-name">${student.arabic_name || 'اسم غير معروف'}</div>
                <div class="detail serial-number">${student.serial_number || 'غير متوفر'}</div>
                <div class="detail document-serial-number">${student.document_serial_number || 'غير متوفر'}</div>
                <div class="detail plate-number">${student.plate_number || 'غير متوفر'}</div>
                <div class="detail car-type">${student.car_type || 'غير متوفر'}</div>
                <div class="detail color">${student.color || 'غير متوفر'}</div>
            </body>
            </html>
            `;

            const imageBuffer = await nodeHtmlToImage({
                html: htmlContent,
                puppeteerArgs: {
                    args: ['--no-sandbox', '--disable-setuid-sandbox'],
                    headless: 'new'
                },
                encoding: 'binary',
            });
            console.log("Image generated successfully with node-html-to-image.");

            return new Response(imageBuffer, {
                status: 200,
                headers: {
                    'Content-Type': 'image/jpeg',
                    'Cache-Control': 's-maxage=315336000, stale-while-revalidate', // 1 سنة كاش
                },
            });

        } catch (error) {
            console.error("Critical error inside handler (node-html-to-image):", error);
            return new Response(`<h1>حدث خطأ فادح</h1><p>${error.message || 'حدث خطأ غير متوقع في الخادم.'}</p><pre>${error.stack || 'لا يوجد تتبع خطأ'}</pre>`, {
                status: 500,
                headers: { 'Content-Type': 'text/html' },
            });
        }
    } catch (globalError) {
        console.error("Global error outside handler (node-html-to-image):", globalError);
        return new Response(`<h1>حدث خطأ عام قبل المعالج</h1><p>${globalError.message || 'حدث خطأ غير متوقع في الخادم.'}</p><pre>${globalError.stack || 'لا يوجد تتبع خطأ'}</pre>`, {
            status: 500,
            headers: { 'Content-Type': 'text/html' },
        });
    }
}