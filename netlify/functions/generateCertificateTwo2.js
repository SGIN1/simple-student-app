// netlify/functions/generateCertificateTwo2.js

const { MongoClient, ObjectId } = require('mongodb');
const fetch = require('node-fetch');

const uri = process.env.MONGODB_URI;
const dbName = 'Cluster0';
const collectionName = 'enrolled_students_tbl';

const CONVERTAPI_TOKEN = process.env.CONVERTAPI_TOKEN;

// إزالة مسارات الصور والخطوط الخارجية في هذا الاختبار لتبسيط HTML
// const CERTIFICATE_IMAGE_PUBLIC_URL = `https://ssadsd.kozow.com/images/full/wwee.jpg`;
// const FONT_PUBLIC_URL = '/.netlify/functions/arial.ttf';

const TEXT_STYLES = {
    STUDENT_NAME: { top: '220px', fontSize: '30px', color: '#000', textAlign: 'center', width: '80%', left: '10%' },
    SERIAL_NUMBER: { top: '260px', left: '60px', fontSize: '18px', color: '#fff', textAlign: 'left', width: '150px' },
    DOCUMENT_SERIAL_NUMBER: { top: '300px', fontSize: '16px', color: '#000', textAlign: 'center', width: '80%', left: '10%' },
    PLATE_NUMBER: { top: '330px', fontSize: '16px', color: '#000', textAlign: 'center', width: '80%', left: '10%' },
    CAR_TYPE: { top: '360px', fontSize: '16px', color: '#000', textAlign: 'center', width: '80%', left: '10%' },
    COLOR: { top: '390px', fontSize: '16px', color: '#000', textAlign: 'center', width: '80%', left: '10%' },
};

exports.handler = async (event, context) => {
    const studentId = event.path.split('/').pop();
    console.log('ID المستلم في وظيفة generateCertificateTwo2:', studentId);

    let client;
    try {
        if (!CONVERTAPI_TOKEN) {
            console.error("خطأ: CONVERTAPI_TOKEN غير مضبوط.");
            return {
                statusCode: 500,
                body: "<h1>خطأ في الخادم</h1><p>CONVERTAPI_TOKEN غير مضبوط.</p>",
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            };
        }
        if (!uri) {
            console.error("خطأ: MONGODB_URI غير مضبوط.");
            return {
                statusCode: 500,
                body: "<h1>خطأ في الخادم</h1><p>MONGODB_URI غير مضبوط.</p>",
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            };
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
            console.warn(`تحذير: لم يتم العثور على طالب بالمعرف: ${studentId}. استخدام بيانات تجريبية.`);
            student = {
                arabic_name: "الطالب التجريبي",
                serial_number: "SN-12345",
                document_serial_number: "DOC-67890",
                plate_number: "ABC-123",
                car_type: "Sedan",
                color: "Red"
            };
        }

        const studentNameArabic = student.arabic_name || 'اسم غير معروف';
        const serialNumber = student.serial_number || 'N/A';

        // **محتوى HTML بسيط جدًا (بدون صور أو خطوط خارجية)**
        let htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Simple Test</title>
                <style>
                    body { font-family: sans-serif; text-align: center; }
                    h1 { color: #333; }
                    p { color: #666; }
                </style>
            </head>
            <body>
                <h1>Hello, ${studentNameArabic}!</h1>
                <p>This is a simple test certificate.</p>
                <p>Serial Number: ${serialNumber}</p>
            </body>
            </html>
        `.trim();

        console.log('طول htmlContent قبل التشفير (اختبار مبسط):', htmlContent.length);
        if (htmlContent.length === 0) {
            throw new Error("htmlContent فارغ قبل التشفير.");
        }
        console.log('أول 200 حرف من htmlContent (اختبار مبسط):', htmlContent.substring(0, 200));

        const htmlBase64 = Buffer.from(htmlContent).toString('base64');
        console.log('طول htmlBase64 بعد التشفير (اختبار مبسط):', htmlBase64.length);
        if (htmlBase64.length === 0) {
            throw new Error("htmlBase64 فارغ بعد التشفير.");
        }
        console.log('أول 200 حرف من htmlBase64 (اختبار مبسط):', htmlBase64.substring(0, 200));

        const convertApiUrl = `https://v2.convertapi.com/convert/html/to/jpg`;
        const convertApiRequestBody = {
            Parameters: [
                {
                    Name: "File",
                    FileValue: {
                        Base64: htmlBase64
                    },
                    FileName: "simple_test.html"
                },
                { Name: "PageSize", Value: "A4" } // استخدام حجم قياسي (A4) للاختبار
            ]
        };

        console.log('جسم طلب ConvertAPI (أول 500 حرف) (اختبار مبسط):', JSON.stringify(convertApiRequestBody, null, 2).substring(0, 500));

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
            console.error('خطأ من ConvertAPI (الاستجابة النصية) (اختبار مبسط):', errorText);
            try {
                const errorData = JSON.parse(errorText);
                console.error('خطأ من ConvertAPI (JSON المحلل) (اختبار مبسط):', errorData);
                return {
                    statusCode: response.status,
                    body: `<h1>خطأ في توليد الشهادة من ConvertAPI (اختبار مبسط)</h1><p>${JSON.stringify(errorData, null, 2)}</p>`,
                    headers: { 'Content-Type': 'text/html; charset=utf-8' },
                };
            } catch (jsonParseError) {
                console.error('فشل تحليل JSON من استجابة ConvertAPI (اختبار مبسط):', jsonParseError);
                return {
                    statusCode: response.status,
                    body: `<h1>خطأ في توليد الشهادة من ConvertAPI (اختبار مبسط)</h1><p>استجابة غير متوقعة: ${errorText}</p>`,
                    headers: { 'Content-Type': 'text/html; charset=utf-8' },
                };
            }
        }

        const result = await response.json();
        if (!result.Files || result.Files.length === 0) {
            console.error('ConvertAPI لم تُرجع أي ملفات في الاستجابة (اختبار مبسط).');
            return {
                statusCode: 500,
                body: `<h1>خطأ في توليد الشهادة (اختبار مبسط)</h1><p>ConvertAPI لم تُرجع أي ملفات.</p>`,
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            };
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
                'Content-Disposition': `inline; filename="simple_test_certificate.jpg"`,
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            },
            body: imageBuffer.toString('base64'),
            isBase64Encoded: true,
        };

    } catch (error) {
        console.error('خطأ في وظيفة توليد الشهادة (اختبار مبسط):', error);
        return {
            statusCode: 500,
            body: `<h1>حدث خطأ أثناء توليد الشهادة (اختبار مبسط)</h1><p>${error.message}</p>`,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        };
    } finally {
        if (client) await client.close();
    }
};