// netlify/functions/generateCertificateTwo2.js

const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');

const uri = process.env.MONGODB_URI;
const dbName = 'Cluster0';
const collectionName = 'enrolled_students_tbl';

// **مسار صورة الشهادة:**
// تم تغيير هذا المسار لاستخدام مسار Netlify Image CDN الجديد الذي يضمن الحجم الأصلي.
// هذا المسار يتوافق مع قاعدة إعادة التوجيه الجديدة في netlify.toml
const CERTIFICATE_IMAGE_PATH = '/images/full/wwee.jpg'; // تم التعديل هنا

// **مسار الخط:** هذا المسار هو نسبي لموقع ملف الوظيفة نفسه (generateCertificateTwo2.js)
// تأكد أن arial.ttf موجود في 'netlify/functions/arial.ttf'
const FONT_PATH = 'arial.ttf';

// **هنا نقوم بضبط هذه الستايلات لتناسب تصميم شهادتك بدقة.**
// هذه القيم (top, left, width) يجب أن تضبطها بعناية فائقة
// لتتناسب مع المواقع الدقيقة للنصوص في صورة الشهادة wwee.jpg التي لديك.
// استخدم أداة قياس البكسل (مثل فتح الصورة في برنامج رسومي أو حتى استخدام متصفح المطور)
// لمعرفة المواقع الدقيقة (بالبكسل) لكل نص في الشهادة الأصلية.
const TEXT_STYLES = {
    // الأبعاد الكلية للشهادة 978px عرض × 1280px ارتفاع
    STUDENT_NAME: { top: '380px', fontSize: '42px', color: '#000', textAlign: 'center', width: '70%', left: '15%' }, // مثال: اسم الطالب في منتصف الشهادة تقريباً
    SERIAL_NUMBER: { top: '150px', left: '100px', fontSize: '20px', color: '#333', textAlign: 'left', width: '200px' }, // مثال: رقم تسلسلي في أعلى اليسار
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

        const htmlContent = `
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>الشهادة الديناميكية</title>
                <style>
                    /* ------------------------------------------------------------- */
                    /* الأنماط العامة للصفحة لعرض الشهادة في المنتصف */
                    /* ------------------------------------------------------------- */
                    body {
                        margin: 0;
                        padding: 0;
                        height: 100vh;
                        background-color: #f0f0f0; /* لون خلفية فاتح لراحة العين */
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        overflow: auto; /* للسماح بالتمرير إذا كانت الشهادة أكبر من الشاشة */
                    }
                    /* ------------------------------------------------------------- */
                    /* خصائص حاوية الشهادة - الأبعاد الثابتة والمهمة */
                    /* ------------------------------------------------------------- */
                    .certificate-container {
                        position: relative;
                        /* الأبعاد الحقيقية لملف wwee.jpg */
                        width: 978px;  
                        height: 1280px;
                        background-image: url('${CERTIFICATE_IMAGE_PATH}');
                        /* لضمان تغطية الصورة للحاوية بالكامل بدقة دون تكرار */
                        background-size: 100% 100%; 
                        background-repeat: no-repeat;
                        background-position: center;
                        box-shadow: 0 0 20px rgba(0,0,0,0.3); /* ظل جميل لإبراز الشهادة */
                        overflow: hidden; /* لإخفاء أي محتوى يتجاوز الحدود */
                        flex-shrink: 0; /* يمنع الحاوية من الانكماش على الشاشات الصغيرة */
                    }

                    /* ------------------------------------------------------------- */
                    /* تعريف الخط العربي - مهم جداً للثبات البصري */
                    /* ------------------------------------------------------------- */
                    @font-face {
                        font-family: 'ArabicFont';
                        src: url('/.netlify/functions/arial.ttf') format('truetype');
                        font-weight: normal;
                        font-style: normal;
                    }
                    /* ------------------------------------------------------------- */
                    /* الأنماط العامة لطبقة النصوص العلوية */
                    /* ------------------------------------------------------------- */
                    .text-overlay {
                        position: absolute;
                        font-family: 'ArabicFont', 'Arial', sans-serif; /* استخدام الخط العربي أولاً */
                        /* يمكن إضافة خصائص عامة للنصوص هنا مثل line-height أو text-shadow */
                        white-space: pre-wrap; /* للحفاظ على تنسيق النصوص (مثل فواصل الأسطر) */
                        box-sizing: border-box; /* لضمان أن العرض لا يتأثر بالبادينج */
                        /* background-color: rgba(255, 0, 0, 0.2); /* استخدم هذا لتصحيح المواقع مؤقتًا */ */
                    }
                    /* ------------------------------------------------------------- */
                    /* أنماط كل حقل نصي بناءً على المتغيرات المحددة في TEXT_STYLES */
                    /* ------------------------------------------------------------- */
                    #student-name {
                        top: ${TEXT_STYLES.STUDENT_NAME.top};
                        font-size: ${TEXT_STYLES.STUDENT_NAME.fontSize};
                        color: ${TEXT_STYLES.STUDENT_NAME.color};
                        text-align: ${TEXT_STYLES.STUDENT_NAME.textAlign};
                        width: ${TEXT_STYLES.STUDENT_NAME.width};
                        left: ${TEXT_STYLES.STUDENT_NAME.left};
                        /* هذا التحويل يضمن التوسيط الأفقي عندما يكون text-align: center و left: 50% */
                        transform: translateX(${TEXT_STYLES.STUDENT_NAME.textAlign === 'center' ? '-50%' : '0'});
                        /* يمكن إضافة font-weight: bold; إذا كان مطلوبًا */
                    }
                    #serial-number {
                        top: ${TEXT_STYLES.SERIAL_NUMBER.top};
                        left: ${TEXT_STYLES.SERIAL_NUMBER.left};
                        font-size: ${TEXT_STYLES.SERIAL_NUMBER.fontSize};
                        color: ${TEXT_STYLES.SERIAL_NUMBER.color};
                        text-align: ${TEXT_STYLES.SERIAL_NUMBER.textAlign};
                        width: ${TEXT_STYLES.SERIAL_NUMBER.width};
                        /* لضمان ثبات الموضع الأفقي لليسار */
                        right: auto;
                    }
                    #document-serial-number {
                        top: ${TEXT_STYLES.DOCUMENT_SERIAL_NUMBER.top};
                        font-size: ${TEXT_STYLES.DOCUMENT_SERIAL_NUMBER.fontSize};
                        color: ${TEXT_STYLES.DOCUMENT_SERIAL_NUMBER.color};
                        text-align: ${TEXT_STYLES.DOCUMENT_SERIAL_NUMBER.textAlign};
                        width: ${TEXT_STYLES.DOCUMENT_SERIAL_NUMBER.width};
                        left: ${TEXT_STYLES.DOCUMENT_SERIAL_NUMBER.left};
                        transform: translateX(${TEXT_STYLES.DOCUMENT_SERIAL_NUMBER.textAlign === 'center' ? '-50%' : '0'});
                    }
                    #plate-number {
                        top: ${TEXT_STYLES.PLATE_NUMBER.top};
                        font-size: ${TEXT_STYLES.PLATE_NUMBER.fontSize};
                        color: ${TEXT_STYLES.PLATE_NUMBER.color};
                        text-align: ${TEXT_STYLES.PLATE_NUMBER.textAlign};
                        width: ${TEXT_STYLES.PLATE_NUMBER.width};
                        left: ${TEXT_STYLES.PLATE_NUMBER.left};
                        transform: translateX(${TEXT_STYLES.PLATE_NUMBER.textAlign === 'center' ? '-50%' : '0'});
                    }
                    #car-type {
                        top: ${TEXT_STYLES.CAR_TYPE.top};
                        font-size: ${TEXT_STYLES.CAR_TYPE.fontSize};
                        color: ${TEXT_STYLES.CAR_TYPE.color};
                        text-align: ${TEXT_STYLES.CAR_TYPE.textAlign};
                        width: ${TEXT_STYLES.CAR_TYPE.width};
                        left: ${TEXT_STYLES.CAR_TYPE.left};
                        transform: translateX(${TEXT_STYLES.CAR_TYPE.textAlign === 'center' ? '-50%' : '0'});
                    }
                    #color {
                        top: ${TEXT_STYLES.COLOR.top};
                        font-size: ${TEXT_STYLES.COLOR.fontSize};
                        color: ${TEXT_STYLES.COLOR.color};
                        text-align: ${TEXT_STYLES.COLOR.textAlign};
                        width: ${TEXT_STYLES.COLOR.width};
                        left: ${TEXT_STYLES.COLOR.left};
                        transform: translateX(${TEXT_STYLES.COLOR.textAlign === 'center' ? '-50%' : '0'});
                    }

                    /* ------------------------------------------------------------- */
                    /* أنماط الطباعة (Print Styles) */
                    /* ------------------------------------------------------------- */
                    @media print {
                        body {
                            margin: 0;
                            padding: 0;
                            height: auto;
                            overflow: visible;
                            background: none;
                        }
                        .certificate-container {
                            width: 978px;  /* تأكيد الأبعاد للطباعة */
                            height: 1280px;
                            box-shadow: none; /* إزالة الظل عند الطباعة */
                            background-image: url('${CERTIFICATE_IMAGE_PATH}');
                            background-size: 100% 100%; /* تأكيد تغطية الصورة للحاوية بالكامل عند الطباعة */
                            -webkit-print-color-adjust: exact; /* لضمان طباعة الألوان والخلفيات بدقة */
                            color-adjust: exact; /* نفس الخاصية للمتصفحات الأخرى */
                        }
                        .text-overlay {
                            position: absolute;
                            /* لا حاجة لإعادة تعريف معظم الخصائص هنا إلا إذا أردت تغييرها للطباعة فقط */
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
        `;

        return {
            statusCode: 200,
            body: htmlContent,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
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