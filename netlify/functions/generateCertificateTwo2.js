// netlify/functions/generateCertificateTwo2.js

const { MongoClient, ObjectId } = require('mongodb');
const fetch = require('node-fetch'); // لاستخدام fetch لإرسال الطلبات إلى PDFCrowd API

// URI الخاص بقاعدة بيانات MongoDB الخاصة بك. يجب أن يكون مضبوطًا كمتغير بيئة في Netlify.
const uri = process.env.MONGODB_URI;
const dbName = 'Cluster0'; // اسم قاعدة البيانات
const collectionName = 'enrolled_students_tbl'; // اسم المجموعة (Collection) التي تحتوي على بيانات الطلاب

// **معلومات PDFCrowd API الخاصة بك**
const PDFCROWD_USERNAME = 'sgn'; // اسم المستخدم الخاص بـ PDFCrowd
const PDFCROWD_API_KEY = 'b8f189e3d2485001c34860d633c1050b'; // مفتاح الـ API الخاص بـ PDFCrowd

// **رابط موقعك الحقيقي على Netlify.**
// هذا هو الرابط الذي سيتم استخدامه للوصول إلى صور وخطوط الشهادة.
// تأكد من أن هذا الرابط هو رابط موقعك الأساسي على Netlify
const YOUR_NETLIFY_SITE_URL = 'https://spiffy-meerkat-be5bc1.netlify.app';

// **مسار صورة الشهادة:**
// بناءً على إعدادات netlify.toml الجديدة، يمكنك الإشارة مباشرة إلى مسار الصورة في مجلد public
const CERTIFICATE_IMAGE_URL = `${YOUR_NETLIFY_SITE_URL}/images_temp/wwee.jpg`;

// **مسار الخط:**
// بناءً على إعدادات netlify.toml الجديدة، يمكنك الإشارة مباشرة إلى مسار الخط داخل مجلد الدوال
const FONT_URL = `${YOUR_NETLIFY_SITE_URL}/.netlify/functions/arial.ttf`;

// **ضبط ستايلات النصوص على الشهادة.**
// هذه القيم (top, left, width, fontSize, إلخ) يجب أن تضبطها بدقة عالية
// لتتناسب مع المواقع الدقيقة للنصوص في صورة الشهادة wwee.jpg التي لديك.
// استخدم مشروعك المحلي (certificate.html) لتحديد هذه القيم بالبكسل.
const TEXT_STYLES = {
    STUDENT_NAME: { top: '380px', fontSize: '42px', color: '#000', textAlign: 'center', width: '70%', left: '15%' },
    SERIAL_NUMBER: { top: '150px', left: '100px', fontSize: '20px', color: '#333', textAlign: 'left', width: '200px' },
    DOCUMENT_SERIAL_NUMBER: { top: '480px', fontSize: '24px', color: '#000', textAlign: 'center', width: '80%', left: '10%' },
    PLATE_NUMBER: { top: '550px', fontSize: '24px', color: '#000', textAlign: 'center', width: '80%', left: '10%' },
    CAR_TYPE: { top: '620px', fontSize: '24px', color: '#000', textAlign: 'center', width: '80%', left: '10%' },
    COLOR: { top: '690px', fontSize: '24px', color: '#000', textAlign: 'center', width: '80%', left: '10%' },
};

// الدالة الرئيسية التي ستنفذها Netlify Function
exports.handler = async (event, context) => {
    // استخراج معرف الطالب من مسار الطلب (URL)
    const studentId = event.path.split('/').pop();
    console.log('ID المستلم في وظيفة generateCertificateTwo2:', studentId);

    let client; // متغير لعميل MongoDB

    try {
        // التحقق من وجود متغير بيئة MONGODB_URI
        if (!uri) {
            throw new Error("MONGODB_URI is not set in environment variables. Please set it in Netlify.");
        }

        // الاتصال بقاعدة بيانات MongoDB
        client = new MongoClient(uri);
        await client.connect();
        const database = client.db(dbName);
        const studentsCollection = database.collection(collectionName);

        let student;
        try {
            // البحث عن الطالب باستخدام معرفه (ObjectId)
            student = await studentsCollection.findOne({ _id: new ObjectId(studentId) });
        } catch (objectIdError) {
            console.error('خطأ في إنشاء ObjectId:', objectIdError);
            return {
                statusCode: 400,
                body: '<h1>معرف الطالب غير صالح</h1><p>يجب أن يكون المعرف سلسلة نصية مكونة من 24 حرفًا سداسيًا عشريًا.</p>',
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            };
        }

        // إذا لم يتم العثور على الطالب
        if (!student) {
            return {
                statusCode: 404,
                body: `<h1>لم يتم العثور على طالب بالمعرف: ${studentId}</h1>`,
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            };
        }

        // استخراج بيانات الطالب مع توفير قيمة افتراضية فارغة إذا لم تكن موجودة
        const serialNumber = student.serial_number || '';
        const studentNameArabic = student.arabic_name || '';
        const documentSerialNumber = student.document_serial_number || '';
        const plateNumber = student.plate_number || '';
        const carType = student.car_type || '';
        const color = student.color || '';

        // **1. بناء كود HTML للشهادة**
        // هذا هو قالب HTML الذي سيتم إرساله إلى PDFCrowd لتحويله إلى PDF.
        // يتضمن صورة الخلفية، الخطوط، والنصوص الديناميكية لبيانات الطالب.
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
                        height: 1280px; /* فرض الارتفاع على كامل الشهادة */
                        width: 978px;  /* فرض العرض على كامل الشهادة */
                        overflow: hidden; /* إخفاء أي تمرير غير مرغوب فيه */
                    }
                    /* خصائص حاوية الشهادة - الأبعاد الثابتة والمهمة جداً */
                    .certificate-container {
                        position: relative;
                        width: 978px;  
                        height: 1280px;
                        background-image: url('${CERTIFICATE_IMAGE_URL}'); /* استخدم URL الصورة المتاحة للعامة */
                        background-size: 100% 100%; 
                        background-repeat: no-repeat;
                        background-position: center;
                        overflow: hidden; 
                    }

                    /* تعريف الخط العربي - مهم جداً لـ PDFCrowd */
                    /* يجب أن يكون الخط متاحًا لـ PDFCrowd عبر URL */
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

                    /* أنماط كل حقل نصي - قيمك المضبوطة بدقة */
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

        // **2. إرسال HTML إلى PDFCrowd API لتحويله إلى PDF**
        const response = await fetch('https://api.pdfcrowd.com/convert/v2/pdf/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                // ترويسة التخويل (Authorization) تستخدم اسم المستخدم ومفتاح الـ API
                'Authorization': 'Basic ' + Buffer.from(`${PDFCROWD_USERNAME}:${PDFCROWD_API_KEY}`).toString('base64'),
            },
            body: new URLSearchParams({
                src: certificateHtmlContent, // محتوى الـ HTML المراد تحويله
                // يمكنك إضافة معلمات إضافية لـ PDFCrowd هنا للتحكم في خصائص الـ PDF الناتج
                // مثل حجم الصفحة، الهوامش، إلخ.
                // page_width: '978px',
                // page_height: '1280px',
                // use_print_media: 'true',
                // viewport_width: '978',
                // viewport_height: '1280',
            }).toString(),
        });

        // التحقق مما إذا كان الطلب إلى PDFCrowd ناجحًا
        if (!response.ok) {
            const errorText = await response.text();
            console.error('خطأ من PDFCrowd:', errorText);
            return {
                statusCode: response.status,
                body: `<h1>خطأ في توليد الشهادة من PDFCrowd</h1><p>${errorText}</p>`,
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            };
        }

        // الحصول على بيانات ملف PDF الثنائية من استجابة PDFCrowd
        const pdfBuffer = await response.buffer();

        // **3. إرجاع ملف PDF إلى المتصفح**
        // إعداد استجابة Netlify Function لإرجاع ملف PDF قابل للتنزيل
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/pdf', // نوع المحتوى هو PDF
                // Content-Disposition لتحديد أن الملف يجب تنزيله، مع اسم للملف
                'Content-Disposition': `attachment; filename="certificate_${studentId}.pdf"`,
            },
            body: pdfBuffer.toString('base64'), // يجب أن يكون الجسم بترميز Base64
            isBase64Encoded: true, // إبلاغ Netlify أن الجسم مشفر بـ Base64
        };

    } catch (error) {
        // معالجة الأخطاء العامة التي قد تحدث في الدالة
        console.error('خطأ في وظيفة توليد الشهادة:', error);
        return {
            statusCode: 500,
            body: `<h1>حدث خطأ أثناء توليد الشهادة</h1><p>${error.message}</p>`,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        };
    } finally {
        // إغلاق اتصال MongoDB بعد الانتهاء، سواء بنجاح أو فشل
        if (client) await client.close();
    }
};