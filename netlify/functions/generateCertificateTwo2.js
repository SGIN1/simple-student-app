// netlify/functions/generateCertificateTwo2.js

const { MongoClient, ObjectId } = require('mongodb');
const fetch = require('node-fetch'); // لاستخدام fetch لإرسال الطلبات إلى ConvertAPI

// URI الخاص بقاعدة بيانات MongoDB الخاصة بك. يجب أن يكون مضبوطًا كمتغير بيئة في Netlify.
const uri = process.env.MONGODB_URI;
const dbName = 'Cluster0'; // اسم قاعدة البيانات
const collectionName = 'enrolled_students_tbl'; // اسم المجموعة (Collection) التي تحتوي على بيانات الطلاب

// **معلومات ConvertAPI الخاصة بك (استخدم الـ API Secret)**
const CONVERTAPI_SECRET = 'secret_qDHxk4i07C7w8USr';

// **رابط موقعك الحقيقي على Netlify.**
const YOUR_NETLIFY_SITE_URL = 'https://spiffy-meerkat-be5bc1.netlify.app';

// **مسار صورة الشهادة:**
const CERTIFICATE_IMAGE_URL = `${YOUR_NETLIFY_SITE_URL}/images_temp/wwee.jpg`;

// **مسار الخط:**
const FONT_URL = `${YOUR_NETLIFY_SITE_URL}/.netlify/functions/arial.ttf`;

// **ضبط ستايلات النصوص على الشهادة.**
const TEXT_STYLES = {
    STUDENT_NAME: { top: '380px', fontSize: '42px', color: '#000', textAlign: 'center', width: '70%', left: '15%' },
    SERIAL_NUMBER: { top: '150px', left: '100px', fontSize: '20px', color: '#333', textAlign: 'left', width: '200px' },
    DOCUMENT_SERIAL_NUMBER: { top: '480px', fontSize: '24px', color: '#000', textAlign: 'center', width: '80%', left: '10%' },
    PLATE_NUMBER: { top: '550px', fontSize: '24px', color: '#000', textAlign: 'center', width: '80%', left: '10%' },
    CAR_TYPE: { top: '620px', fontSize: '24px', color: '#000', textAlign: 'center', width: '80%', left: '10%' },
    COLOR: { top: '690px', fontSize: '24px', color: '#000', textAlign: 'center', width: '80%', left: '10%' },
};

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

        const serialNumber = student.serial_number || '';
        const studentNameArabic = student.arabic_name || '';
        const documentSerialNumber = student.document_serial_number || '';
        const plateNumber = student.plate_number || '';
        const carType = student.car_type || '';
        const color = student.color || '';

        const certificateHtmlContent = `
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                <title>الشهادة الديناميكية</title>
                <style>
                    html, body {
                        margin: 0;
                        padding: 0;
                        height: 1280px;
                        width: 978px;
                        overflow: hidden;
                    }
                    .certificate-container {
                        position: relative;
                        width: 978px;
                        height: 1280px;
                        background-image: url('${CERTIFICATE_IMAGE_URL}');
                        background-size: 100% 100%;
                        background-repeat: no-repeat;
                        background-position: center;
                        overflow: hidden;
                    }
                    @font-face {
                        font-family: 'ArabicFont';
                        src: url('${FONT_URL}') format('truetype');
                        font-weight: normal;
                        font-style: normal;
                    }
                    .text-overlay {
                        position: absolute;
                        font-family: 'ArabicFont', 'Arial', sans-serif;
                        color: #000;
                        text-align: center;
                        box-sizing: border-box;
                    }
                    #student-name {
                        top: ${TEXT_STYLES.STUDENT_NAME.top};
                        left: ${TEXT_STYLES.STUDENT_NAME.left};
                        transform: translateX(${TEXT_STYLES.STUDENT_NAME.textAlign === 'center' ? '-50%' : '0'});
                        width: ${TEXT_STYLES.STUDENT_NAME.width};
                        font-size: ${TEXT_STYLES.STUDENT_NAME.fontSize};
                        color: ${TEXT_STYLES.STUDENT_NAME.color};
                        text-align: ${TEXT_STYLES.STUDENT_NAME.textAlign};
                    }
                    #serial-number {
                        top: ${TEXT_STYLES.SERIAL_NUMBER.top};
                        left: ${TEXT_STYLES.SERIAL_NUMBER.left};
                        width: ${TEXT_STYLES.SERIAL_NUMBER.width};
                        font-size: ${TEXT_STYLES.SERIAL_NUMBER.fontSize};
                        color: ${TEXT_STYLES.SERIAL_NUMBER.color};
                        text-align: ${TEXT_STYLES.SERIAL_NUMBER.textAlign};
                    }
                    #document-serial-number {
                        top: ${TEXT_STYLES.DOCUMENT_SERIAL_NUMBER.top};
                        left: ${TEXT_STYLES.DOCUMENT_SERIAL_NUMBER.left};
                        transform: translateX(${TEXT_STYLES.DOCUMENT_SERIAL_NUMBER.textAlign === 'center' ? '-50%' : '0'});
                        width: ${TEXT_STYLES.DOCUMENT_SERIAL_NUMBER.width};
                        font-size: ${TEXT_STYLES.DOCUMENT_SERIAL_NUMBER.fontSize};
                        color: ${TEXT_STYLES.DOCUMENT_SERIAL_NUMBER.color};
                        text-align: ${TEXT_STYLES.DOCUMENT_SERIAL_NUMBER.textAlign};
                    }
                    #plate-number {
                        top: ${TEXT_STYLES.PLATE_NUMBER.top};
                        left: ${TEXT_STYLES.PLATE_NUMBER.left};
                        transform: translateX(${TEXT_STYLES.PLATE_NUMBER.textAlign === 'center' ? '-50%' : '0'});
                        width: ${TEXT_STYLES.PLATE_NUMBER.width};
                        font-size: ${TEXT_STYLES.PLATE_NUMBER.fontSize};
                        color: ${TEXT_STYLES.PLATE_NUMBER.color};
                        text-align: ${TEXT_STYLES.PLATE_NUMBER.textAlign};
                    }
                    #car-type {
                        top: ${TEXT_STYLES.CAR_TYPE.top};
                        left: ${TEXT_STYLES.CAR_TYPE.left};
                        transform: translateX(${TEXT_STYLES.CAR_TYPE.textAlign === 'center' ? '-50%' : '0'});
                        width: ${TEXT_STYLES.CAR_TYPE.width};
                        font-size: ${TEXT_STYLES.CAR_TYPE.fontSize};
                        color: ${TEXT_STYLES.CAR_TYPE.color};
                        text-align: ${TEXT_STYLES.CAR_TYPE.textAlign};
                    }
                    #color {
                        top: ${TEXT_STYLES.COLOR.top};
                        left: ${TEXT_STYLES.COLOR.left};
                        transform: translateX(${TEXT_STYLES.COLOR.textAlign === 'center' ? '-50%' : '0'});
                        width: ${TEXT_STYLES.COLOR.width};
                        font-size: ${TEXT_STYLES.COLOR.fontSize};
                        color: ${TEXT_STYLES.COLOR.color};
                        text-align: ${TEXT_STYLES.COLOR.textAlign};
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
        `;

        // **2. إرسال HTML إلى ConvertAPI لتحويله إلى PDF**
        // ConvertAPI يستخدم نقطة نهاية مختلفة ومعلمات مختلفة عن PDFCrowd
        const convertApiUrl = `https://v2.convertapi.com/convert/html/to/pdf?Secret=${CONVERTAPI_SECRET}`;

        const response = await fetch(convertApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', // ConvertAPI يتوقع JSON في هذا النوع من الطلبات
            },
            // جسم الطلب يحتوي على الـ HTML كمدخل
            body: JSON.stringify({
                Parameters: [
                    {
                        Name: 'File',
                        FileValue: {
                            Url: `data:text/html;base64,${Buffer.from(certificateHtmlContent).toString('base64')}`, // إرسال HTML كـ Data URL مشفر بـ Base64
                        },
                    },
                    {
                        Name: 'PageSize',
                        Value: 'Custom',
                    },
                    {
                        Name: 'PageWidth',
                        Value: '978px',
                    },
                    {
                        Name: 'PageHeight',
                        Value: '1280px',
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
                    // يمكن إضافة معلمات أخرى مثل UsePrintMedia أو ViewPortWidth
                    // {
                    //    Name: 'UsePrintMedia',
                    //    Value: true
                    // },
                    // {
                    //    Name: 'ViewportWidth',
                    //    Value: '978'
                    // }
                ],
            }),
        });

        // التحقق مما إذا كان الطلب إلى ConvertAPI ناجحًا
        if (!response.ok) {
            const errorData = await response.json(); // ConvertAPI قد يرجع JSON في حالة الخطأ
            console.error('خطأ من ConvertAPI:', errorData);
            return {
                statusCode: response.status,
                body: `<h1>خطأ في توليد الشهادة من ConvertAPI</h1><p>${JSON.stringify(errorData, null, 2)}</p>`,
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            };
        }

        // الحصول على بيانات ملف PDF الثنائية من استجابة ConvertAPI
        // ConvertAPI يرجع كائن JSON يحتوي على رابط للملف
        const result = await response.json();
        const pdfFileUrl = result.Files[0].Url;

        // جلب ملف PDF الفعلي من الرابط الذي قدمه ConvertAPI
        const pdfResponse = await fetch(pdfFileUrl);
        if (!pdfResponse.ok) {
             throw new Error(`Failed to fetch PDF from ConvertAPI URL: ${pdfResponse.statusText}`);
        }
        const pdfBuffer = await pdfResponse.buffer();

        // **3. إرجاع ملف PDF إلى المتصفح**
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