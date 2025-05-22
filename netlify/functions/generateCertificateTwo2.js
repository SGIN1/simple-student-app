// netlify/functions/generateCertificateTwo2.js

const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');
// استيراد متغير Base64 من الملف الجديد
const { BASE64_CERTIFICATE_IMAGE } = require('./data/certificateData'); // لاحظ المسار النسبي

const uri = process.env.MONGODB_URI;
const dbName = 'Cluster0';
const collectionName = 'enrolled_students_tbl';

// لم نعد نحتاج CERTIFICATE_IMAGE_PATH إذا كنا نستخدم Base64
// const CERTIFICATE_IMAGE_PATH = '/images_temp/wwee.jpg';

// مسار الخط يبقى كما هو
const FONT_PATH = 'arial.ttf';

// قم بضبط هذه الستايلات لتناسب تصميم شهادتك (القيم النسبية المقترحة سابقاً)
const TEXT_STYLES = {
    STUDENT_NAME: { top: '26.9%', fontSize: '3.6vh', color: '#000', textAlign: 'center', width: '80%', left: '50%'  }, // مثال بقيم نسبية وتوسيط
    SERIAL_NUMBER: { top: '31.8%', left: '9.6%', fontSize: '2.2vh', color: '#fff', textAlign: 'left', width: '24%'  },
    DOCUMENT_SERIAL_NUMBER: { top: '36.7%', fontSize: '1.9vh', color: '#000', textAlign: 'center', width: '80%', left: '50%'  },
    PLATE_NUMBER: { top: '40.4%', fontSize: '1.9vh', color: '#000', textAlign: 'center', width: '80%', left: '50%'  },
    CAR_TYPE: { top: '44.1%', fontSize: '1.9vh', color: '#000', textAlign: 'center', width: '80%', left: '50%'  },
    COLOR: { top: '47.7%', fontSize: '1.9vh', color: '#000', textAlign: 'center', width: '80%', left: '50%'  },
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
                        height: 100vh;
                        background-color: #0e0e0e;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }
                    .certificate-container {
                        position: relative;
                        width: min(80vh * (624 / 817), 90vw);
                        height: min(80vh, 90vw * (817 / 624));
                        
                        /* هنا نستخدم متغير Base64 */
                        background-image: url('${BASE64_CERTIFICATE_IMAGE}');
                        
                        background-size: 100% 100%;
                        background-repeat: no-repeat;
                        background-position: center;
                        background-color: #eee;
                        overflow: hidden;
                        box-shadow: 0 0 10px rgba(0,0,0,0.5);
                    }
                    @font-face {
                        font-family: 'ArabicFont';
                        src: url('/.netlify/functions/arial.ttf') format('truetype');
                    }
                    .text-overlay {
                        position: absolute;
                        font-family: 'ArabicFont', 'Arial', sans-serif;
                        text-wrap: wrap;
                        box-sizing: border-box;
                    }
                    /* الأنماط تستخدم القيم النسبية من TEXT_STYLES */
                    #student-name {
                        top: ${TEXT_STYLES.STUDENT_NAME.top};
                        font-size: ${TEXT_STYLES.STUDENT_NAME.fontSize};
                        color: ${TEXT_STYLES.STUDENT_NAME.color};
                        text-align: ${TEXT_STYLES.STUDENT_NAME.textAlign};
                        width: ${TEXT_STYLES.STUDENT_NAME.width};
                        left: ${TEXT_STYLES.STUDENT_NAME.left};
                        transform: translateX(-50%); 
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
                        transform: translateX(-50%);
                    }
                    #plate-number {
                        top: ${TEXT_STYLES.PLATE_NUMBER.top};
                        font-size: ${TEXT_STYLES.PLATE_NUMBER.fontSize};
                        color: ${TEXT_STYLES.PLATE_NUMBER.color};
                        text-align: ${TEXT_STYLES.PLATE_NUMBER.textAlign};
                        width: ${TEXT_STYLES.PLATE_NUMBER.width};
                        left: ${TEXT_STYLES.PLATE_NUMBER.left};
                        transform: translateX(-50%);
                    }
                    #car-type {
                        top: ${TEXT_STYLES.CAR_TYPE.top};
                        font-size: ${TEXT_STYLES.CAR_TYPE.fontSize};
                        color: ${TEXT_STYLES.CAR_TYPE.color};
                        text-align: ${TEXT_STYLES.CAR_TYPE.textAlign};
                        width: ${TEXT_STYLES.CAR_TYPE.width};
                        left: ${TEXT_STYLES.CAR_TYPE.left};
                        transform: translateX(-50%);
                    }
                    #color {
                        top: ${TEXT_STYLES.COLOR.top};
                        font-size: ${TEXT_STYLES.COLOR.fontSize};
                        color: ${TEXT_STYLES.COLOR.color};
                        text-align: ${TEXT_STYLES.COLOR.textAlign};
                        width: ${TEXT_STYLES.COLOR.width};
                        left: ${TEXT_STYLES.COLOR.left};
                        transform: translateX(-50%);
                    }

                    /* أنماط للطباعة */
                    @media print {
                        body {
                            margin: 0;
                            padding: 0;
                            height: auto;
                            overflow: visible;
                            background: none;
                        }
                        .certificate-container {
                            width: 150mm;
                            height: calc(150mm * (817 / 624));
                            box-shadow: none;
                            background-image: url('${BASE64_CERTIFICATE_IMAGE}'); // استخدام Base64 للطباعة أيضاً
                            background-size: 100% 100%;
                            -webkit-print-color-adjust: exact;
                            color-adjust: exact;
                        }
                        .text-overlay {
                            position: absolute;
                            /* هنا ستحتاج لضبط مواقع النصوص للطباعة يدوياً إذا كانت الأبعاد المطبوعة مختلفة */
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