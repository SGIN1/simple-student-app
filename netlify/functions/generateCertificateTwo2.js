// netlify/functions/generateCertificateTwo2.js

const { MongoClient, ObjectId } = require('mongodb');
const fetch = require('node-fetch');

const uri = process.env.MONGODB_URI;
const dbName = 'Cluster0';
const collectionName = 'enrolled_students_tbl';

const CONVERTAPI_SECRET = 'secret_qDHxk4i07C7w8USr';

const YOUR_NETLIFY_SITE_URL = 'https://spiffy-meerkat-be5bc1.netlify.app';
const CERTIFICATE_IMAGE_URL = `${YOUR_NETLIFY_SITE_URL}/images_temp/wwee.jpg`;

// **ملاحظة: FONT_URL و TEXT_STYLES لا تزال معلقة في هذا الكود البسيط للاختبار**

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

        // هذا هو الجزء الأهم: الـ HTML الذي سيُرسل إلى ConvertAPI.
        // يجب أن يحتوي على الأبعاد الثابتة في الـ CSS لكي يتعرف عليها ConvertAPI.
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
                        /* هذه الأبعاد هي التي يجب أن تتطابق مع أبعاد صورتك wwee.jpg */
                        /* ConvertAPI سيقوم بمحاكاة متصفح يعرض هذا الـ HTML ويأخذ هذه الأبعاد */
                        width: 978px;
                        height: 1280px;
                        overflow: hidden;
                    }
                    .certificate-container {
                        width: 100%; /* املأ الحاوية بالكامل */
                        height: 100%; /* املأ الحاوية بالكامل */
                        background-image: url('${CERTIFICATE_IMAGE_URL}');
                        background-size: 100% 100%; /* تأكد من أن الصورة تملأ الأبعاد المحددة */
                        background-repeat: no-repeat;
                        background-position: center;
                    }
                </style>
            </head>
            <body>
                <div class="certificate-container">
                    </div>
            </body>
            </html>
        `;

        // **2. إرسال HTML إلى ConvertAPI لتحويله إلى PDF**
        const convertApiUrl = `https://v2.convertapi.com/convert/html/to/pdf?Secret=${CONVERTAPI_SECRET}`;

        const response = await fetch(convertApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                Parameters: [
                    {
                        Name: 'File',
                        FileValue: {
                            Url: `data:text/html;base64,${Buffer.from(certificateHtmlContent).toString('base64')}`,
                        },
                    },
                    // **لقد أزلنا PageSize, PageWidth, PageHeight التي كانت تسبب خطأ الـ JSON**
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
                    // هذه المعلمة مهمة جداً لضمان أن ConvertAPI يعرض HTML بعرض ثابت قبل التحويل
                    {
                       Name: 'ViewportWidth',
                       Value: 978 // عرض الصورة بالبكسل
                    }
                ],
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('خطأ من ConvertAPI:', errorData);
            return {
                statusCode: response.status,
                body: `<h1>خطأ في توليد الشهادة من ConvertAPI</h1><p>${JSON.stringify(errorData, null, 2)}</p>`,
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            };
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