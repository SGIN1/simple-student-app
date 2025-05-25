// netlify/functions/generateCertificateTwo2.js

const { MongoClient, ObjectId } = require('mongodb');
const fetch = require('node-fetch');

const uri = process.env.MONGODB_URI;
const dbName = 'Cluster0';
const collectionName = 'enrolled_students_tbl';

const CONVERTAPI_SECRET = process.env.CONVERTAPI_SECRET || 'secret_qDHxk4i07C7w8USr';

// هذا هو الرابط العلني الحقيقي والمؤكد لصورة الشهادة على موقعك في Netlify.
// بناءً على اسم موقعك في Netlify، تأكد 100% أن هذا هو الرابط الصحيح الذي تظهر فيه الصورة.
const CERTIFICATE_IMAGE_PUBLIC_URL = `https://ssadsd.kozow.com/images/full/wwee.jpg`;

exports.handler = async (event, context) => {
    const studentId = event.path.split('/').pop();
    console.log('ID المستلم في وظيفة generateCertificateTwo2:', studentId);

    let client;
    try {
        if (!uri) {
            throw new Error("MONGODB_URI is not set in environment variables. Please set it in Netlify.");
        }

        const htmlContent = `
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>الشهادة ${studentId}</title>
            </head>
            <body>
                <img src="${CERTIFICATE_IMAGE_PUBLIC_URL}" alt="الشهادة">
            </body>
            </html>
        `.trim();

        // طلب من ConvertAPI لتحويل HTML إلى صورة JPG
        // هذه هي النقطة التي تحدث فيها المشكلة مع ConvertAPI
        const convertApiUrl = `https://v2.convertapi.com/convert/html/to/jpg?Secret=${CONVERTAPI_SECRET}`;

        const response = await fetch(convertApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/html',
                'Content-Disposition': 'attachment; filename="certificate.html"'
            },
            body: Buffer.from(htmlContent, 'utf8'),
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
        const imageFileUrl = result.Files[0].Url; // رابط الصورة الناتجة من ConvertAPI

        const imageResponse = await fetch(imageFileUrl);
        if (!imageResponse.ok) {
            throw new Error(`Failed to fetch image from ConvertAPI URL: ${imageResponse.statusText}`);
        }
        const imageBuffer = await imageResponse.buffer();

        // عرض الصورة مباشرة في المتصفح
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'image/jpeg', // يخبر المتصفح أن المحتوى هو صورة JPEG
                'Content-Disposition': `inline; filename="certificate_${studentId}.jpg"`, // 'inline' للعرض المباشر
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