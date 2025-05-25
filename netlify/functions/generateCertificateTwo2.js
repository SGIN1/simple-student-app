const { MongoClient, ObjectId } = require('mongodb');
const fetch = require('node-fetch'); // تمت إضافته لـ ConvertAPI

const uri = process.env.MONGODB_URI;
const dbName = 'Cluster0';
const collectionName = 'enrolled_students_tbl';

const CONVERTAPI_SECRET = process.env.CONVERTAPI_SECRET || 'secret_qDHxk4i07C7w8USr'; // تمت إضافته لـ ConvertAPI

const CERTIFICATE_IMAGE_RELATIVE_PATH = '/images/full/wwee.jpg';

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
                <img src="${CERTIFICATE_IMAGE_RELATIVE_PATH}" alt="الشهادة">
            </body>
            </html>
        `.trim();

        // بداية إضافة ConvertAPI
        const convertApiUrl = `https://v2.convertapi.com/convert/html/to/pdf?Secret=${CONVERTAPI_SECRET}`;

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
        const pdfFileUrl = result.Files[0].Url;

        const pdfResponse = await fetch(pdfFileUrl);
        if (!pdfResponse.ok) {
            throw new Error(`Failed to fetch PDF from ConvertAPI URL: ${pdfResponse.statusText}`);
        }
        const pdfBuffer = await pdfResponse.buffer();

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/pdf', // هذا يخبر المتصفح أن الملف PDF
                'Content-Disposition': `attachment; filename="certificate_${studentId}.pdf"`,
            },
            body: pdfBuffer.toString('base64'),
            isBase64Encoded: true,
        };
        // نهاية إضافة ConvertAPI

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