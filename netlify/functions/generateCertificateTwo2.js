const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');

const uri = process.env.MONGODB_URI;
const dbName = 'Cluster0';
const collectionName = 'enrolled_students_tbl';

// **مسار صورة الشهادة:**
// هذا المسار يستخدم قاعدة إعادة التوجيه في netlify.toml لضمان الحجم الأصلي عبر Image CDN
const CERTIFICATE_IMAGE_PATH = '/images/full/wwee.jpg';

// **مسار الخط:**
// تأكد أن arial.ttf موجود الآن في 'public/fonts/arial.ttf'
const FONT_PATH_RELATIVE = '/fonts/arial.ttf';

// قم بضبط هذه الستايلات لتناسب تصميم شهادتك
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
                <title>الشهادة</title>
                <style>
                    /*
                    تعديلات هنا: جعل الـ HTML والـ Body يشغلان كامل الشاشة
                    وإزالة الهوامش الافتراضية وتطبيق خلفية سوداء واستخدام Flexbox للتوسيط.
                    */
                    html, body {
                        height: 100%;
                        width: 100%;
                        margin: 0;
                        padding: 0;
                        display: flex; /* استخدام Flexbox لتوسيط الحاوية */
                        justify-content: center; /* توسيط أفقي */
                        align-items: center; /* توسيط عمودي */
                        background-color: black; /* تغيير لون الخلفية إلى الأسود */
                        overflow: auto; /* السماح بظهور أشرطة التمرير إذا كانت الشهادة أكبر من الشاشة */
                    }
                    
                    .certificate-container {
                        position: relative;
                        /* تعيين الأبعاد الثابتة لضمان عرضها بحجمها الأساسي دائمًا */
                        width: 624px; /* العرض الأساسي للصورة */
                        height: 817px; /* الارتفاع الأساسي للصورة */
                        flex-shrink: 0; /* مهم: يمنع الحاوية من الانكماش إذا كانت الشاشة أصغر */
                        
                        background-image: url('${CERTIFICATE_IMAGE_PATH}');
                        background-size: 100% 100%; /* لتغطية الحاوية بالكامل بدقة */
                        background-repeat: no-repeat;
                        background-position: center;
                        background-color: #eee; /* لون احتياطي في حال عدم تحميل الصورة */
                        box-shadow: 0 0 10px rgba(0,0,0,0.5);
                    }
                    @font-face {
                        font-family: 'ArabicFont';
                        src: url('${FONT_PATH_RELATIVE}') format('truetype');
                    }
                    .text-overlay {
                        position: absolute;
                        font-family: 'ArabicFont', 'Arial', sans-serif;
                        text-wrap: wrap;
                    }
                    #student-name {
                        top: ${TEXT_STYLES.STUDENT_NAME.top};
                        font-size: ${TEXT_STYLES.STUDENT_NAME.fontSize};
                        color: ${TEXT_STYLES.STUDENT_NAME.color};
                        text-align: ${TEXT_STYLES.STUDENT_NAME.textAlign};
                        width: ${TEXT_STYLES.STUDENT_NAME.width};
                        left: ${TEXT_STYLES.STUDENT_NAME.left};
                        transform: translateX(-${TEXT_STYLES.STUDENT_NAME.left});
                    }
                    #serial-number {
                        top: ${TEXT_STYLES.SERIAL_NUMBER.top};
                        left: ${TEXT_STYLES.SERIAL_NUMBER.left};
                        font-size: ${TEXT_STYLES.SERIAL_NUMBER.fontSize};
                        color: ${TEXT_STYLES.SERIAL_NUMBER.color};
                        text-align: ${TEXT_STYLES.SERIAL_NUMBER.textAlign};
                        width: ${TEXT_STYLES.SERIAL_NUMBER.width};
                    }
                    #document-serial-number {
                        top: ${TEXT_STYLES.DOCUMENT_SERIAL_NUMBER.top};
                        font-size: ${TEXT_STYLES.DOCUMENT_SERIAL_NUMBER.fontSize};
                        color: ${TEXT_STYLES.DOCUMENT_SERIAL_NUMBER.color};
                        text-align: ${TEXT_STYLES.DOCUMENT_SERIAL_NUMBER.textAlign};
                        width: ${TEXT_STYLES.DOCUMENT_SERIAL_NUMBER.width};
                        left: ${TEXT_STYLES.DOCUMENT_SERIAL_NUMBER.left};
                        transform: translateX(-${TEXT_STYLES.DOCUMENT_SERIAL_NUMBER.left});
                    }
                    #plate-number {
                        top: ${TEXT_STYLES.PLATE_NUMBER.top};
                        font-size: ${TEXT_STYLES.PLATE_NUMBER.fontSize};
                        color: ${TEXT_STYLES.PLATE_NUMBER.color};
                        text-align: ${TEXT_STYLES.PLATE_NUMBER.textAlign};
                        width: ${TEXT_STYLES.PLATE_NUMBER.width};
                        left: ${TEXT_STYLES.PLATE_NUMBER.left};
                        transform: translateX(-${TEXT_STYLES.PLATE_NUMBER.left});
                    }
                    #car-type {
                        top: ${TEXT_STYLES.CAR_TYPE.top};
                        font-size: ${TEXT_STYLES.CAR_TYPE.fontSize};
                        color: ${TEXT_STYLES.CAR_TYPE.color};
                        text-align: ${TEXT_STYLES.CAR_TYPE.textAlign};
                        width: ${TEXT_STYLES.CAR_TYPE.width};
                        left: ${TEXT_STYLES.CAR_TYPE.left};
                        transform: translateX(-${TEXT_STYLES.CAR_TYPE.left});
                    }
                    #color {
                        top: ${TEXT_STYLES.COLOR.top};
                        font-size: ${TEXT_STYLES.COLOR.fontSize};
                        color: ${TEXT_STYLES.COLOR.color};
                        text-align: ${TEXT_STYLES.COLOR.textAlign};
                        width: ${TEXT_STYLES.COLOR.width};
                        left: ${TEXT_STYLES.COLOR.left};
                        transform: translateX(-${TEXT_STYLES.COLOR.left});
                    }

                    /* أنماط الطباعة ستبقى كما هي لأنها تستخدم نفس الأبعاد الثابتة */
                    @media print {
                        html, body {
                            width: auto; /* السماح للمحتوى بتحديد العرض */
                            height: auto; /* السماح للمحتوى بتحديد الارتفاع */
                            display: block; /* إلغاء الفليكس بوكس للطباعة */
                            background-color: white; /* تأكد من خلفية بيضاء للطباعة */
                            overflow: visible;
                        }
                        body {
                            margin: 0;
                            padding: 0;
                            overflow: visible;
                            background: none;
                        }
                        .certificate-container {
                            width: 624px; /* الأبعاد الثابتة لضمان الطباعة الصحيحة */
                            height: 817px;
                            background-size: 100% 100%;
                            box-shadow: none;
                            background-image: url('${CERTIFICATE_IMAGE_PATH}');
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