// netlify/functions/generateCertificateTwo2.js

const { MongoClient, ObjectId } = require('mongodb');
const fetch = require('node-fetch');
const path = require('path');

const uri = process.env.MONGODB_URI;
const dbName = 'Cluster0';
const collectionName = 'enrolled_students_tbl';

const CONVERTAPI_SECRET = process.env.CONVERTAPI_SECRET || 'secret_qDHxk4i07C7w8USr';

const CERTIFICATE_IMAGE_PATH = '/images/full/wwee.jpg';
const FONT_PATH = '/.netlify/functions/arial.ttf'; // سيبقى هذا المسار لكن لن يتم استخدامه فعليًا

exports.handler = async (event, context) => {
    // لم نعد بحاجة لجلب بيانات الطالب إذا كنا لا نعرض نصوصًا
    // لكنني سأبقي الكود الأساسي لجلب البيانات إذا أردت استخدامه لاحقًا.
    // يمكنك حذف جزء جلب الطالب بالكامل إذا كنت متأكدًا أنك لا تحتاج بياناته.
    const studentId = event.path.split('/').pop();
    console.log('ID المستلم في وظيفة generateCertificateTwo2 (للإشارة فقط، لن نستخدم بياناته للنص):', studentId);

    let client;
    try {
        if (!uri) {
            throw new Error("MONGODB_URI is not set in environment variables. Please set it in Netlify.");
        }
        // إزالة جلب بيانات الطالب إذا لم تعد بحاجة إليها نهائياً
        // client = new MongoClient(uri);
        // await client.connect();
        // const database = client.db(dbName);
        // const studentsCollection = database.collection(collectionName);
        // const student = await studentsCollection.findOne({ _id: new ObjectId(studentId) });
        // if (!student) { /* ... handle not found ... */ }
        // // ... وإزالة المتغيرات المتعلقة بالنصوص مثل serialNumber, studentNameArabic ...

        const htmlContent = `
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>الشهادة</title>
                <style>
                    body {
                        margin: 0;
                        padding: 0;
                    }
                    /* لا يوجد تعريف للخط 'ArabicFont' لأنه لن يتم استخدام أي نص */
                    .certificate-container {
                        background-image: url('${CERTIFICATE_IMAGE_PATH}');
                        background-size: contain;
                        background-repeat: no-repeat;
                        background-position: center;
                        min-height: 100vh;
                        min-width: 100vw;
                    }
                </style>
            </head>
            <body>
                <div class="certificate-container">
                    </div>
            </body>
            </html>
        `.trim();

        console.log('Generated HTML Content for ConvertAPI (for debugging):');
        console.log(htmlContent);

        const payload = {
            Parameters: [
                {
                    Name: 'HtmlString',
                    Value: htmlContent
                }
            ],
        };
        console.log('JSON Payload to ConvertAPI:');
        console.log(JSON.stringify(payload, null, 2));

        const convertApiUrl = `https://v2.convertapi.com/convert/html/to/pdf?Secret=${CONVERTAPI_SECRET}`;

        const response = await fetch(convertApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
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
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="certificate_${studentId}.pdf"`,
            },
            body: pdfBuffer.toString('base64'),
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
        if (client) await client.close(); // تأكد من إغلاق الاتصال إذا تم فتحه
    }
};