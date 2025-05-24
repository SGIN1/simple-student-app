// netlify/functions/generateCertificateTwo2.js

const { MongoClient, ObjectId } = require('mongodb');
const fetch = require('node-fetch');

const uri = process.env.MONGODB_URI;
const dbName = 'Cluster0';
const collectionName = 'enrolled_students_tbl';

const CONVERTAPI_SECRET = 'secret_qDHxk4i07C7w8USr'; // تأكد من أنه صحيح

const YOUR_NETLIFY_SITE_URL = 'https://spiffy-meerkat-be5bc1.netlify.app';
const CERTIFICATE_IMAGE_URL = `${YOUR_NETLIFY_SITE_URL}/images_temp/wwee.jpg`;

exports.handler = async (event, context) => {
    const studentId = event.path.split('/').pop();
    console.log('ID المستلم في وظيفة generateCertificateTwo2:', studentId);

    let client;

    try {
        if (!uri) {
            throw new Error("MONGODB_URI is not set in environment variables. Please set it in Netlify.");
        }

        client = new MongoClient(uri);
        await client.connect();
        const database = client.db(dbName);
        const studentsCollection = database.collection(collectionName);

        let student;
        try {
            student = await studentsCollection.findOne({ _id: new ObjectId(studentId) });
        } catch (objectIdError) {
            console.error('خطأ في إنشاء ObjectId:', objectIdError);
            return {
                statusCode: 400,
                body: '<h1>معرف الطالب غير صالح</h1><p>يجب أن يكون المعرف سلسلة نصية مكونة من 24 حرفًا سداسيًا عشريًا.</p>',
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            };
        }

        if (!student) {
            return {
                statusCode: 404,
                body: `<h1>لم يتم العثور على طالب بالمعرف: ${studentId}</h1>`,
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            };
        }

        // بناء الـ HTML
        const certificateHtmlContent = `
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                <title>الشهادة التلقائية</title>
                <style>
                    html, body {
                        margin: 0;
                        padding: 0;
                        width: 978px;
                        height: 1280px;
                        overflow: hidden;
                    }
                    .certificate-container {
                        width: 100%;
                        height: 100%;
                        background-image: url('${CERTIFICATE_IMAGE_URL}');
                        background-size: 100% 100%;
                        background-repeat: no-repeat;
                        background-position: center;
                    }
                </style>
            </head>
            <body>
                <div class="certificate-container"></div>
            </body>
            </html>
        `;

        // **هنا التغيير الرئيسي: تأكد من تحويل الـ HTML إلى Base64 بشكل صحيح**
        // استخدام Buffer.from(string, 'utf8').toString('base64') هو الطريقة الصحيحة
        const htmlBase64 = Buffer.from(certificateHtmlContent, 'utf8').toString('base64');
        const dataUrl = `data:text/html;base64,${htmlBase64}`;

        console.log('JSON Payload to ConvertAPI:'); // لتتبع الـ JSON الذي نرسله
        const payload = {
            Parameters: [
                {
                    Name: 'File',
                    FileValue: {
                        Url: dataUrl,
                    },
                },
                {
                    Name: 'MarginTop',
                    Value: 0
                },
                {
                    Name: 'MarginRight',
                    Value: 0
                },
                {
                    Name: 'MarginBottom',
                    Value: 0
                },
                {
                    Name: 'MarginLeft',
                    Value: 0
                },
                {
                   Name: 'ViewportWidth',
                   Value: 978
                }
            ],
        };
        console.log(JSON.stringify(payload, null, 2)); // اطبع الـ JSON منسقًا لرؤيته في السجلات

        const convertApiUrl = `https://v2.convertapi.com/convert/html/to/pdf?Secret=${CONVERTAPI_SECRET}`;

        const response = await fetch(convertApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload), // استخدام الـ payload الذي أنشأناه
        });

        if (!response.ok) {
            const errorText = await response.text(); // حاول الحصول على نص الخطأ الخام
            console.error('خطأ من ConvertAPI (الاستجابة النصية):', errorText);
            // حاول تحليل JSON إذا كان نصياً
            try {
                const errorData = JSON.parse(errorText);
                console.error('خطأ من ConvertAPI (JSON المحلل):', errorData);
                return {
                    statusCode: response.status,
                    body: `<h1>خطأ في توليد الشهادة من ConvertAPI</h1><p>${JSON.stringify(errorData, null, 2)}</p>`,
                    headers: { 'Content-Type': 'text/html; charset=utf-8' },
                };
            } catch (jsonParseError) {
                // إذا لم يكن نص الخطأ JSON صالحًا
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
        if (client) await client.close();
    }
};