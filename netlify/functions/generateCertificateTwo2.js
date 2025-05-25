// netlify/functions/generateCertificateTwo2.js

const { MongoClient, ObjectId } = require('mongodb');
const fetch = require('node-fetch');

const uri = process.env.MONGODB_URI;
const dbName = 'Cluster0';
const collectionName = 'enrolled_students_tbl';

const CONVERTAPI_TOKEN = process.env.CONVERTAPI_TOKEN;

const CERTIFICATE_IMAGE_PUBLIC_URL = `https://ssadsd.kozow.com/images/full/wwee.jpg`;
const FONT_PUBLIC_URL = '/.netlify/functions/arial.ttf';

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
            // استخدام بيانات تجريبية إذا لم يتم العثور على الطالب
            student = {
                arabic_name: "الطالب التجريبي",
                serial_number: "SN-12345",
                document_serial_number: "DOC-67890",
                plate_number: "ABC-123",
                car_type: "Sedan",
                color: "Red"
            };
            // إرجاع 404 إذا كنت تريد إظهار أن الطالب غير موجود
            // return {
            //     statusCode: 404,
            //     body: `<h1>لم يتم العثور على طالب بالمعرف: ${studentId}</h1>`,
            //     headers: { 'Content-Type': 'text/html; charset=utf-8' },
            // };
        }

        const serialNumber = student.serial_number || 'N/A';
        const studentNameArabic = student.arabic_name || 'اسم غير معروف';
        const documentSerialNumber = student.document_serial_number || 'N/A';
        const plateNumber = student.plate_number || 'N/A';
        const carType = student.car_type || 'N/A';
        const color = student.color || 'N/A';

        // **اختبار بسيط: بناء HTML بسيط جدًا للتأكد من أن المشكلة ليست في تعقيد HTML**
        let htmlContent = `
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>Test Certificate</title>
                <style>
                    body {
                        margin: 0;
                        padding: 0;
                        font-family: Arial, sans-serif;
                        text-align: center;
                    }
                    img {
                        width: 100%;
                        height: auto;
                        display: block;
                    }
                    .overlay-text {
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        font-size: 4em;
                        color: blue;
                    }
                </style>
            </head>
            <body>
                <img src="${CERTIFICATE_IMAGE_PUBLIC_URL}" alt="Certificate Background">
                <div class="overlay-text">مرحبًا ${studentNameArabic}!</div>
                <div class="overlay-text" style="top: 70%; font-size: 2em; color: green;">رقم تسلسلي: ${serialNumber}</div>
            </body>
            </html>
        `.trim();

        // **ملاحظة:** إذا نجح هذا الكود التجريبي، عندها نعود إلى الكود الأصلي المعقد ونبحث عن مشاكل التنسيق أو المحتوى فيه.

        console.log('طول htmlContent قبل التشفير:', htmlContent.length);
        if (htmlContent.length === 0) {
            throw new Error("htmlContent فارغ قبل التشفير.");
        }
        console.log('أول 200 حرف من htmlContent:', htmlContent.substring(0, 200));

        const htmlBase64 = Buffer.from(htmlContent).toString('base64');
        console.log('طول htmlBase64 بعد التشفير:', htmlBase64.length);
        if (htmlBase64.length === 0) {
            throw new Error("htmlBase64 فارغ بعد التشفير.");
        }
        console.log('أول 200 حرف من htmlBase64:', htmlBase64.substring(0, 200));

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
                { Name: "PageSize", Value: "Custom" },
                { Name: "PageWidth", Value: 800 }, // استخدم أبعادًا بسيطة للاختبار
                { Name: "PageHeight", Value: 600 },
                { Name: "MarginTop", Value: 0 },
                { Name: "MarginRight", Value: 0 },
                { Name: "MarginBottom", Value: 0 },
                { Name: "MarginLeft", Value: 0 }
            ]
        };

        console.log('جسم طلب ConvertAPI (أول 500 حرف):', JSON.stringify(convertApiRequestBody, null, 2).substring(0, 500));

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
            console.error('ConvertAPI لم تُرجع أي ملفات في الاستجابة.');
            return {
                statusCode: 500,
                body: `<h1>خطأ في توليد الشهادة</h1><p>ConvertAPI لم تُرجع أي ملفات.</p>`,
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