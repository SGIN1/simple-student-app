// netlify/functions/generateCertificateTwo2.js

const { MongoClient, ObjectId } = require('mongodb');
const fetch = require('node-fetch');
const path = require('path');

const uri = process.env.MONGODB_URI;
const dbName = 'Cluster0';
const collectionName = 'enrolled_students_tbl';

const CONVERTAPI_SECRET = process.env.CONVERTAPI_SECRET || 'secret_qDHxk4i07C7w8USr'; // استخدم متغير بيئة

// مسارات الصور والخطوط يجب أن تكون قابلة للوصول بواسطة Netlify Function
// إذا كانت هذه الملفات موجودة في مجلد `public` أو `static` في مشروعك،
// فقد تحتاج إلى تعديل المسارات أو التأكد من أنها مدمجة في بناء الوظيفة.
// في بيئة Netlify Functions، المسار '/.netlify/functions/' يشير إلى جذر الدالة.
const CERTIFICATE_IMAGE_PATH = '/images/full/wwee.jpg'; // افترض أن هذا المسار صحيح ضمن Netlify
const FONT_PATH = '/.netlify/functions/arial.ttf'; // يجب أن يكون الخط موجودًا في نفس مجلد الدالة المجمّعة

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

        const serialNumber = student.serial_number || 'N/A';
        const studentNameArabic = student.arabic_name || 'اسم الطالب غير متوفر';
        const documentSerialNumber = student.document_serial_number || 'N/A';
        const plateNumber = student.plate_number ? `رقم اللوحة: ${student.plate_number}` : 'رقم اللوحة: N/A';
        const carType = student.car_type ? `نوع السيارة: ${student.car_type}` : 'نوع السيارة: N/A';
        const color = student.color ? `اللون: ${student.color}` : 'اللون: N/A';

        // محتوى HTML المبسّط
        const htmlContent = `
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, minimum-scale=0.1, initial-scale=1.0">
                <title>الشهادة</title>
                <style>
                    body {
                        margin: 0;
                        padding: 20px;
                        font-family: 'ArabicFont', 'Arial', sans-serif;
                        text-align: center;
                        color: #000;
                    }
                    @font-face {
                        font-family: 'ArabicFont';
                        src: url('${FONT_PATH}') format('truetype');
                    }
                    .certificate-container {
                        background-image: url('${CERTIFICATE_IMAGE_PATH}');
                        background-size: contain; /* استخدام contain لضمان ظهور الصورة بالكامل */
                        background-repeat: no-repeat;
                        background-position: center;
                        padding: 50px;
                        /* يمكن إضافة border أو box-shadow لرؤية حدود الحاوية إذا لزم الأمر */
                        /* border: 1px solid red; */
                    }
                    .text-item {
                        margin-bottom: 15px;
                        line-height: 1.5;
                    }
                    #student-name {
                        font-size: 30px;
                        font-weight: bold;
                        margin-bottom: 30px;
                    }
                    #serial-number {
                        font-size: 18px;
                        color: #555;
                    }
                </style>
            </head>
            <body>
                <div class="certificate-container">
                    <div id="student-name" class="text-item">${studentNameArabic}</div>
                    <div id="serial-number" class="text-item">${serialNumber}</div>
                    <div id="document-serial-number" class="text-item">${documentSerialNumber}</div>
                    <div id="plate-number" class="text-item">${plateNumber}</div>
                    <div id="car-type" class="text-item">${carType}</div>
                    <div id="color" class="text-item">${color}</div>
                </div>
            </body>
            </html>
        `.trim();

        console.log('Generated HTML Content for ConvertAPI (for debugging):');
        console.log(htmlContent);

        const payload = {
            Parameters: [
                {
                    Name: 'HtmlFile',
                    Value: Buffer.from(htmlContent, 'utf8').toString('base64')
                },
                // إزالة Margin Parameters إذا كنت تريد أن تكون الافتراضات هي ما يحكم
                // أو اتركها إذا كنت تريد هامش 0
                { Name: 'MarginTop', Value: 0 },
                { Name: 'MarginRight', Value: 0 },
                { Name: 'MarginBottom', Value: 0 },
                { Name: 'MarginLeft', Value: 0 },
                // ViewportWidth يمكن أن تؤثر على العرض الذي يراه ConvertAPI عند تحويل HTML
                // يمكننا إزالتها للسماح لـ ConvertAPI باختيار العرض الافتراضي
                // أو الاحتفاظ بها إذا كانت الأبعاد مهمة لعرض الخلفية بشكل صحيح.
                // لنتركها في هذه المرحلة لتجنب مشاكل في عرض الخلفية.
                { Name: 'ViewportWidth', Value: 624 }
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
        if (client) await client.close();
    }
};