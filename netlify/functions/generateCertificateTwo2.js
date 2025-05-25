// netlify/functions/generateCertificateTwo2.js

const { MongoClient, ObjectId } = require('mongodb'); // تظل موجودة إذا كنت تخطط لاستخدام MongoDB
const fetch = require('node-fetch');

const uri = process.env.MONGODB_URI; // لـ MongoDB، احتفظ بها كمتغير بيئي
const dbName = 'Cluster0'; // اسم قاعدة البيانات
const collectionName = 'enrolled_students_tbl'; // اسم المجموعة

const CONVERTAPI_TOKEN = process.env.CONVERTAPI_TOKEN; 
const CERTIFICATE_IMAGE_PUBLIC_URL = `https://ssadsd.kozow.com/images/full/wwee.jpg`; // رابط الصورة العلني للشهادة

exports.handler = async (event, context) => {
    const studentId = event.path.split('/').pop();
    console.log('ID المستلم في وظيفة generateCertificateTwo2:', studentId);

    let client; // لتعريف اتصال MongoDB، لا يستخدم حاليا
    try {
        // التحقق من مفتاح ConvertAPI Token
        if (!CONVERTAPI_TOKEN) {
            throw new Error("CONVERTAPI_TOKEN is not set in environment variables. Please set it in Netlify.");
        }
        
        // في هذا الجزء، لا نستخدم MongoDB حاليًا، لذلك studentName سيكون ثابتًا
        // إذا كنت ترغب في استخدام MongoDB، قم بإلغاء تعليق الكود المتعلق به
        const studentName = "اسم الطالب التجريبي"; // سيتم استبداله بقيمة من MongoDB إذا تم تفعيلها

        // بناء محتوى HTML للشهادة.
        // ملاحظة: تأكد من أن ${CERTIFICATE_IMAGE_PUBLIC_URL} صحيح ويمكن الوصول إليه.
        // أضفنا نصًا تجريبيًا لـ ${studentName} للتأكد من أن الـ HTML ليس فارغًا.
        const htmlContent = `
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>الشهادة ${studentId}</title>
                <style>
                    body { margin: 0; padding: 0; position: relative; width: 100%; height: 100vh; overflow: hidden; }
                    img { width: 100%; height: 100%; display: block; object-fit: cover; }
                    .student-name {
                        position: absolute;
                        top: 50%; /* عدّل لتحديد الموضع الرأسي بدقة */
                        left: 50%; /* عدّل لتحديد الموضع الأفقي بدقة */
                        transform: translate(-50%, -50%); /* لمركزة الاسم */
                        color: black; /* لون النص */
                        font-size: 3em; /* حجم الخط */
                        font-weight: bold; /* سمك الخط */
                        text-align: center; /* محاذاة النص */
                        width: 80%; /* لمنع تجاوز الاسم لحدود معينة */
                        font-family: 'Arial', sans-serif; /* نوع الخط */
                    }
                </style>
            </head>
            <body>
                <img src="${CERTIFICATE_IMAGE_PUBLIC_URL}" alt="الشهادة">
                <div class="student-name">${studentName}</div>
            </body>
            </html>
        `.trim();

        // **التحقق من أن محتوى HTML ليس فارغًا**
        if (!htmlContent || htmlContent.length === 0) {
            throw new Error("Generated HTML content is empty. Cannot convert to image.");
        }

        // تحويل محتوى HTML إلى Base64.
        const htmlBase64 = Buffer.from(htmlContent).toString('base64');

        // **تحقق إضافي: التأكد من أن Base64 ليس فارغًا**
        if (!htmlBase64 || htmlBase64.length === 0) {
            throw new Error("Base64 encoded HTML content is empty. This indicates an issue with the HTML generation or encoding.");
        }

        const convertApiUrl = `https://v2.convertapi.com/convert/html/to/jpg`;
        const convertApiRequestBody = {
            Parameters: [
                {
                    Name: "File",
                    FileValue: {
                        Base64: htmlBase64
                    },
                    FileName: "certificate.html"
                },
                // يمكن إضافة معلمات إضافية هنا، مثل الدقة أو جودة الصورة
                // مثال:
                {
                    Name: "PageSize",
                    Value: "A4" // أو 'Letter', 'Legal', 'A3', 'A5'
                },
                {
                    Name: "PageOrientation",
                    Value: "Landscape" // 'Portrait' أو 'Landscape'
                }
            ]
        };

        const response = await fetch(convertApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONVERTAPI_TOKEN}` 
            },
            body: JSON.stringify(convertApiRequestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('خطأ من ConvertAPI (الاستجابة النصية):', errorText);
            try {
                const errorData = JSON.parse(errorText);
                console.error('خطأ من ConvertAPI (JSON المحلل):', errorData);
                return {
                    statusCode: response.status,
                    body: `<h1>خطأ في توليد الشهادة من ConvertAPI</h1><p>${JSON.stringify(errorData, null, 2)}</p>`,
                    headers: { 'Content-Type': 'text/html; charset=utf-8' },
                };
            } catch (jsonParseError) {
                console.error('فشل تحليل JSON من استجابة ConvertAPI:', jsonParseError);
                return {
                    statusCode: response.status,
                    body: `<h1>خطأ في توليد الشهادة من ConvertAPI</h1><p>استجابة غير متوقعة: ${errorText}</p>`,
                    headers: { 'Content-Type': 'text/html; charset=utf-8' },
                };
            }
        }

        const result = await response.json();
        if (!result.Files || result.Files.length === 0) {
            throw new Error('ConvertAPI did not return any files in the response.');
        }
        const imageFileUrl = result.Files[0].Url;

        const imageResponse = await fetch(imageFileUrl);
        if (!imageResponse.ok) {
            throw new Error(`فشل في جلب الصورة من رابط ConvertAPI: ${imageResponse.statusText}`);
        }
        const imageBuffer = await imageResponse.buffer();

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'image/jpeg',
                'Content-Disposition': `inline; filename="certificate_${studentId}.jpg"`,
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            },
            body: imageBuffer.toString('base64'),
            isBase64Encoded: true,
        };

    } catch (error) {
        console.error('خطأ في وظيفة توليد الشهادة:', error);
        return {
            statusCode: 500,
            body: `<h1>حدث خطأ أثناء توليد الشهادة</h1><p>${error.message}</p>`,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        };
    } finally {
        if (client) await client.close();
    }
};