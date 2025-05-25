// netlify/functions/generateCertificateTwo2.js

const { MongoClient, ObjectId } = require('mongodb');
const fetch = require('node-fetch'); // يجب أن تكون هذه موجودة
const path = require('path'); // قد لا تكون ضرورية هنا مباشرة ولكن يمكن الاحتفاظ بها

const uri = process.env.MONGODB_URI;
const dbName = 'Cluster0';
const collectionName = 'enrolled_students_tbl';

const CONVERTAPI_TOKEN = process.env.CONVERTAPI_TOKEN; // يجب أن يكون هذا متغيرًا بيئيًا في Netlify

// مسار صورة الشهادة:
// تأكد من أن هذا المسار صحيح ويمكن الوصول إليه من Netlify
const CERTIFICATE_IMAGE_PUBLIC_URL = `https://ssadsd.kozow.com/images/full/wwee.jpg`;

// مسار الخط: يجب أن يكون هذا المسار صحيحًا لدالة Netlify
// إذا كان الخط في 'netlify/functions/arial.ttf'، فإن الرابط سيكون '/.netlify/functions/arial.ttf'
const FONT_PUBLIC_URL = '/.netlify/functions/arial.ttf';


// قم بضبط هذه الستايلات لتناسب تصميم شهادتك
const TEXT_STYLES = {
    STUDENT_NAME: { top: '220px', fontSize: '30px', color: '#000', textAlign: 'center', width: '80%', left: '10%' },
    SERIAL_NUMBER: { top: '260px', left: '60px', fontSize: '#fff', textAlign: 'left', width: '150px' }, // تم تصحيح اللون هنا
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
            throw new Error("CONVERTAPI_TOKEN is not set in environment variables. Please set it in Netlify.");
        }
        if (!uri) {
            throw new Error("MONGODB_URI is not set in environment variables. Please set it in Netlify.");
        }

        // 1. الاتصال بقاعدة البيانات وجلب بيانات الطالب
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

        // 2. استخراج بيانات الطالب مع قيم افتراضية لمنع القيم الفارغة
        const serialNumber = student.serial_number || 'N/A';
        const studentNameArabic = student.arabic_name || 'اسم غير معروف';
        const documentSerialNumber = student.document_serial_number || 'N/A';
        const plateNumber = student.plate_number || 'N/A';
        const carType = student.car_type || 'N/A';
        const color = student.color || 'N/A';

        // 3. بناء محتوى HTML مع البيانات المستخرجة
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
                        height: 100vh;
                        background-color: #0e0e0e;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }
                    .certificate-container {
                        position: relative;
                        width: 624px; /* تأكد أن هذه الأبعاد تتوافق مع شهادتك */
                        height: 817px; /* تأكد أن هذه الأبعاد تتوافق مع شهادتك */
                        background-image: url('${CERTIFICATE_IMAGE_PUBLIC_URL}');
                        background-size: contain;
                        background-repeat: no-repeat;
                        background-position: center;
                        background-color: #eee;
                        overflow: hidden;
                        box-shadow: 0 0 10px rgba(0,0,0,0.5);
                    }
                    @font-face {
                        font-family: 'ArabicFont';
                        src: url('${FONT_PUBLIC_URL}') format('truetype');
                    }
                    .text-overlay {
                        position: absolute;
                        font-family: 'ArabicFont', 'Arial', sans-serif;
                        text-wrap: wrap;
                        /* لمركزة النصوص التي تستخدم left و transformX */
                        transform: translateX(-50%);
                    }
                    #student-name {
                        top: ${TEXT_STYLES.STUDENT_NAME.top};
                        font-size: ${TEXT_STYLES.STUDENT_NAME.fontSize};
                        color: ${TEXT_STYLES.STUDENT_NAME.color};
                        text-align: ${TEXT_STYLES.STUDENT_NAME.textAlign};
                        width: ${TEXT_STYLES.STUDENT_NAME.width};
                        left: 50%; /* تم التعديل إلى 50% للمركزة مع transformX */
                    }
                    #serial-number {
                        top: ${TEXT_STYLES.SERIAL_NUMBER.top};
                        left: ${TEXT_STYLES.SERIAL_NUMBER.left};
                        font-size: ${TEXT_STYLES.SERIAL_NUMBER.fontSize};
                        color: ${TEXT_STYLES.SERIAL_NUMBER.color};
                        text-align: ${TEXT_STYLES.SERIAL_NUMBER.textAlign};
                        width: ${TEXT_STYLES.SERIAL_NUMBER.width};
                        transform: none; /* لا نحتاج إلى transformX هنا إذا كان left ثابتًا */
                    }
                    #document-serial-number {
                        top: ${TEXT_STYLES.DOCUMENT_SERIAL_NUMBER.top};
                        font-size: ${TEXT_STYLES.DOCUMENT_SERIAL_NUMBER.fontSize};
                        color: ${TEXT_STYLES.DOCUMENT_SERIAL_NUMBER.color};
                        text-align: ${TEXT_STYLES.DOCUMENT_SERIAL_NUMBER.textAlign};
                        width: ${TEXT_STYLES.DOCUMENT_SERIAL_NUMBER.width};
                        left: 50%; /* تم التعديل إلى 50% للمركزة مع transformX */
                    }
                    #plate-number {
                        top: ${TEXT_STYLES.PLATE_NUMBER.top};
                        font-size: ${TEXT_STYLES.PLATE_NUMBER.fontSize};
                        color: ${TEXT_STYLES.PLATE_NUMBER.color};
                        text-align: ${TEXT_STYLES.PLATE_NUMBER.textAlign};
                        width: ${TEXT_STYLES.PLATE_NUMBER.width};
                        left: 50%; /* تم التعديل إلى 50% للمركزة مع transformX */
                    }
                    #car-type {
                        top: ${TEXT_STYLES.CAR_TYPE.top};
                        font-size: ${TEXT_STYLES.CAR_TYPE.fontSize};
                        color: ${TEXT_STYLES.CAR_TYPE.color};
                        text-align: ${TEXT_STYLES.CAR_TYPE.textAlign};
                        width: ${TEXT_STYLES.CAR_TYPE.width};
                        left: 50%; /* تم التعديل إلى 50% للمركزة مع transformX */
                    }
                    #color {
                        top: ${TEXT_STYLES.COLOR.top};
                        font-size: ${TEXT_STYLES.COLOR.fontSize};
                        color: ${TEXT_STYLES.COLOR.color};
                        text-align: ${TEXT_STYLES.COLOR.textAlign};
                        width: ${TEXT_STYLES.COLOR.width};
                        left: 50%; /* تم التعديل إلى 50% للمركزة مع transformX */
                    }

                    @media print {
                        body {
                            margin: 0;
                            padding: 0;
                            height: auto;
                            overflow: visible;
                            background: none;
                        }
                        .certificate-container {
                            width: 624px;
                            height: 817px;
                            box-shadow: none;
                            background-image: url('${CERTIFICATE_IMAGE_PUBLIC_URL}');
                            -webkit-print-color-adjust: exact;
                            color-adjust: exact;
                        }
                        .text-overlay {
                            position: absolute;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="certificate-container">
                    <div id="student-name" class="text-overlay">${studentNameArabic}</div>
                    <div id="serial-number" class="text-overlay">${serialNumber}</div>
                    <div id="document-serial-number" class="text-overlay">${documentSerialNumber}</div>
                    <div id="plate-number" class="text-overlay">رقم اللوحة: ${plateNumber}</div>
                    <div id="car-type" class="text-overlay">نوع السيارة: ${carType}</div>
                    <div id="color" class="text-overlay">اللون: ${color}</div>
                </div>
            </body>
            </html>
        `.trim();

        // **4. التحقق من أن محتوى HTML ليس فارغًا**
        if (!htmlContent || htmlContent.length < 100) { // زيادة حد الفحص قليلاً
            console.error('خطأ: محتوى HTML المولّد فارغ أو صغير جدًا.');
            return {
                statusCode: 500,
                body: `<h1>خطأ في توليد الشهادة</h1><p>محتوى HTML المولّد فارغ أو غير كامل.</p>`,
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            };
        }

        // 5. تحويل محتوى HTML إلى Base64.
        const htmlBase64 = Buffer.from(htmlContent).toString('base64');

        // **6. تحقق إضافي: التأكد من أن Base64 ليس فارغًا**
        if (!htmlBase64 || htmlBase64.length === 0) {
            console.error('خطأ: محتوى Base64 المشفر فارغ.');
            return {
                statusCode: 500,
                body: `<h1>خطأ في توليد الشهادة</h1><p>محتوى Base64 المشفر فارغ.</p>`,
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            };
        }

        // 7. استدعاء ConvertAPI لتحويل HTML إلى JPG
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
                {
                    Name: "PageSize",
                    Value: "Custom" // نستخدم "Custom" لتعيين الأبعاد بالبكسل
                },
                {
                    Name: "PageWidth",
                    Value: 624 // يجب أن تتطابق مع عرض الـ container في CSS
                },
                {
                    Name: "PageHeight",
                    Value: 817 // يجب أن تتطابق مع ارتفاع الـ container في CSS
                },
                {
                    Name: "MarginTop",
                    Value: 0
                },
                {
                    Name: "MarginRight",
                    Value: 0
                },
                {
                    Name: "MarginBottom",
                    Value: 0
                },
                {
                    Name: "MarginLeft",
                    Value: 0
                },
                {
                    Name: "ScaleX",
                    Value: 1
                },
                {
                    Name: "ScaleY",
                    Value: 1
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