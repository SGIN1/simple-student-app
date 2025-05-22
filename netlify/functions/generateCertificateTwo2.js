// netlify/functions/generateCertificateTwo2.js

const { MongoClient, ObjectId } = require('mongodb');
const path = require('path'); // ما زلنا نحتاج path لضمان المسارات إذا أردت استخدامها لاحقًا بشكل صحيح

const uri = process.env.MONGODB_URI;
const dbName = 'Cluster0';
const collectionName = 'enrolled_students_tbl';

// **مسار صورة الشهادة:** هذا المسار هو نسبي لمجلد 'public'
// تأكد أن wwee.jpg موجودة في 'public/images_temp/wwee.jpg'
const CERTIFICATE_IMAGE_PATH = '/images_temp/wwee.jpg'; // مسار الـ URL للوصول للصورة من المتصفح

// **مسار الخط:** هذا المسار هو نسبي لموقع ملف الوظيفة نفسه (generateCertificateTwo2.js)
// تأكد أن arial.ttf موجود في 'netlify/functions/arial.ttf'
// إذا كان داخل 'netlify/functions/fonts/arial.ttf'، فاجعله: const FONT_PATH = 'fonts/arial.ttf';
const FONT_PATH = 'arial.ttf'; // هذا المسار لكي يتعرف عليه المتصفح عبر @font-face

// قم بضبط هذه الستايلات لتناسب تصميم شهادتك
// الأبعاد هنا تمثل المواقع بالنسبة لصورة الشهادة ذات الأبعاد (978x1280)
const TEXT_STYLES = {
    STUDENT_NAME: { top: '350px', fontSize: '48px', color: '#000', textAlign: 'center', width: '80%', left: '10%' },
    SERIAL_NUMBER: { top: '420px', left: '100px', fontSize: '28px', color: '#fff', textAlign: 'left', width: '200px' },
    DOCUMENT_SERIAL_NUMBER: { top: '480px', fontSize: '20px', color: '#000', textAlign: 'center', width: '80%', left: '10%' },
    PLATE_NUMBER: { top: '520px', fontSize: '20px', color: '#000', textAlign: 'center', width: '80%', left: '10%' },
    CAR_TYPE: { top: '560px', fontSize: '20px', color: '#000', textAlign: 'center', width: '80%', left: '10%' },
    COLOR: { top: '600px', fontSize: '20px', color: '#000', textAlign: 'center', width: '80%', left: '10%' },
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
                <meta name="viewport" content="width=device-width, minimum-scale=0.1, initial-scale=1.0">
                <title>الشهادة</title>
                <style>
                    body {
                        margin: 0;
                        height: 100vh; /* استخدم vh لضمان الارتفاع الكامل لنافذة العرض */
                        background-color: #0e0e0e; /* لون الخلفية */
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }
                    .certificate-container {
                        position: relative;
                        /* الأبعاد التي طلبتها للشهادة: العرض 978 والارتفاع 1280 */
                        width: 978px; 
                        height: 1280px;
                        background-image: url('${CERTIFICATE_IMAGE_PATH}');
                        background-size: contain;
                        background-repeat: no-repeat;
                        background-position: center;
                        background-color: #eee; /* لون مؤقت إذا لم تحمل الصورة */
                        overflow: hidden; /* لمنع تجاوز النصوص للحاوية */
                        box-shadow: 0 0 10px rgba(0,0,0,0.5); /* لإضافة بعض الظل */
                    }
                    /* الخط الذي حددته في المسار: FONT_PATH */
                    @font-face {
                        font-family: 'ArabicFont';
                        src: url('/.netlify/functions/arial.ttf') format('truetype');
                        /* تأكد من أن المسار هنا هو المسار الفعلي لملف الخط على Netlify */
                        /* إذا كان الخط في netlify/functions/fonts/arial.ttf، غيره إلى 'url("/.netlify/functions/fonts/arial.ttf")' */
                    }
                    .text-overlay {
                        position: absolute;
                        font-family: 'ArabicFont', 'Arial', sans-serif; /* استخدم خطك، ثم Arial كبديل */
                        text-wrap: wrap; /* للسماح بلف النص */
                    }
                    #student-name {
                        top: ${TEXT_STYLES.STUDENT_NAME.top};
                        font-size: ${TEXT_STYLES.STUDENT_NAME.fontSize};
                        color: ${TEXT_STYLES.STUDENT_NAME.color};
                        text-align: ${TEXT_STYLES.STUDENT_NAME.textAlign};
                        width: ${TEXT_STYLES.STUDENT_NAME.width};
                        left: ${TEXT_STYLES.STUDENT_NAME.left};
                        transform: translateX(-${TEXT_STYLES.STUDENT_NAME.left}); /* لمركزة العنصر بناءً على عرضه */
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

                    /* أنماط للطباعة */
                    @media print {
                        body {
                            margin: 0;
                            padding: 0;
                            height: auto; /* مهم للطباعة */
                            overflow: visible; /* مهم للطباعة */
                            background: none;
                        }
                        .certificate-container {
                            width: 978px; /* تأكد من الأبعاد الثابتة للطباعة */
                            height: 1280px;
                            box-shadow: none;
                            background-image: url('${CERTIFICATE_IMAGE_PATH}');
                            -webkit-print-color-adjust: exact; /* لطباعة ألوان الخلفية */
                            color-adjust: exact;
                        }
                        .text-overlay {
                            position: absolute; /* احتفظ بها كـ absolute */
                            /* قد تحتاج لضبط top/left للطباعة إذا كانت مختلفة عن العرض */
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