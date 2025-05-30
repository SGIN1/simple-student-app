import path from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';

import nodeHtmlToImage from 'node-html-to-image';

// **مهم جدًا:** إضافة خاصية maxDuration هنا لزيادة المهلة
export const config = {
    maxDuration: 300 // 5 دقائق (300 ثانية) - Puppeteer يحتاج وقتاً كافياً للتشغيل
};

// تعريف __filename و __dirname يدويًا لوحدات ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// المسارات الأكثر موثوقية:
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

        // **التعديل هنا:** بناء عنوان URL كاملاً بشكل صحيح
        const host = req.headers.get('host');
        const protocol = req.headers.get('x-forwarded-proto') || 'http';
        const fullUrlString = `${protocol}://${host}${req.url}`;
        const url = new URL(fullUrlString);
        console.log("Full URL received:", fullUrlString);


        let studentId = url.searchParams.get('id'); // يفترض أن ID يأتي كـ /api/generateCertificateTwo2?id=xxxx

        // إذا لم يكن الـ ID في query params، حاول استخلاصه من المسار
        // (مثل: /certificate/683908a7a89ab3d68c38b671)
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
        let backgroundImageBase64 = ''; // لتخزين الصورة كـ Base64

        try {
            // استخدام نفس البروتوكول والمضيف لجلب بيانات الطالب
            const studentDataUrl = `${protocol}://${host}/api/getStudent?id=${studentId}`;
            console.log("Fetching student data from:", studentDataUrl);

            const response = await fetch(studentDataUrl);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Failed to fetch student data from /api/getStudent: ${response.status} - ${errorText}`);
                let errorMessage = `Failed to get student data (Status: ${response.status})`;
                try {
                    if (response.headers.get('content-type')?.includes('application/json')) {
                        const errorJson = JSON.parse(errorText);
                        errorMessage = errorJson.error || errorMessage;
                    } else {
                        errorMessage = errorText.substring(0, 150) || errorMessage;
                    }
                } catch (e) {
                    errorMessage = errorText.substring(0, 150) || errorMessage;
                }
                return new Response(`<h1>خطأ في جلب بيانات الطالب</h1><p>${errorMessage}</p>`, {
                    status: response.status,
                    headers: { 'Content-Type': 'text/html' },
                });
            }

            student = await response.json();
            console.log("Student data fetched successfully:", student.arabic_name);

            // --- قراءة الخط والصورة كـ Base64 ---
            try {
                fontData = await fs.readFile(LOCAL_FONT_PATH);
                console.log("Font loaded successfully from file system.");
            } catch (fontFileError) {
                console.error("Failed to load font from file system at path:", LOCAL_FONT_PATH, "Error:", fontFileError.message);
                fontData = null; // اجعله null إذا فشل التحميل
            }

            try {
                const imageBuffer = await fs.readFile(BACKGROUND_IMAGE_PATH);
                backgroundImageBase64 = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
                console.log("Background image loaded successfully from file system and converted to Base64.");
            } catch (imageFileError) {
                console.error("Failed to load background image from file system at path:", BACKGROUND_IMAGE_PATH, "Error:", imageFileError.message);
                backgroundImageBase64 = ''; // فارغ إذا فشل التحميل
            }

            // --- بناء قالب HTML للصورة ---
            const htmlContent = `
            <html>
            <head>
                <style>
                    /* استيراد الخط مباشرة في CSS للقالب */
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

            // --- توليد الصورة باستخدام node-html-to-image ---
            const imageBuffer = await nodeHtmlToImage({
                html: htmlContent,
                puppeteerArgs: {
                    args: ['--no-sandbox', '--disable-setuid-sandbox'], // ضروري لبيئات Serverless
                    // executablePath: process.env.CHROMIUM_PATH || undefined, // عادة لا تحتاج إلى هذا في Vercel
                    headless: 'new' // استخدم الوضع الجديد
                },
                encoding: 'binary', // لإرجاع Buffer
            });
            console.log("Image generated successfully with node-html-to-image.");

            return new Response(imageBuffer, {
                status: 200,
                headers: {
                    'Content-Type': 'image/jpeg', // أو 'image/png' حسب نوع الصورة
                    'Cache-Control': 's-maxage=31536000, stale-while-revalidate',
                },
            });

        } catch (error) {
            console.error("Critical error inside handler (node-html-to-image):", error);
            return new Response(`<h1>Critical Error Occurred</h1><p>${error.message || 'An unexpected server error occurred.'}</p><pre>${error.stack || 'No stack trace'}</pre>`, {
                status: 500,
                headers: { 'Content-Type': 'text/html' },
            });
        }
    } catch (globalError) {
        console.error("Global error outside handler (node-html-to-image):", globalError);
        return new Response(`<h1>Global Error Occurred Before Handler</h1><p>${globalError.message || 'An unexpected server error occurred.'}</p><pre>${globalError.stack || 'No stack trace'}</pre>`, {
            status: 500,
            headers: { 'Content-Type': 'text/html' },
        });
    }
}