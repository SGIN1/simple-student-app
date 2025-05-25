// netlify/functions/generateCertificateTwo2.js

const { MongoClient, ObjectId } = require('mongodb');
const fetch = require('node-fetch'); // لم نعد بحاجة لـ fetch إذا لم نستخدم ConvertAPI
const path = require('path'); // لم نعد بحاجة لـ path

const uri = process.env.MONGODB_URI;
const dbName = 'Cluster0';
const collectionName = 'enrolled_students_tbl';

// لم نعد بحاجة لـ CONVERTAPI_SECRET إذا لم نستخدم ConvertAPI
// const CONVERTAPI_SECRET = process.env.CONVERTAPI_SECRET || 'secret_qDHxk4i07C7w8USr';

// مسار الصورة في مشروعك (سيكون متاحًا في المتصفح مباشرة)
const CERTIFICATE_IMAGE_RELATIVE_PATH = '/images/full/wwee.jpg';

exports.handler = async (event, context) => {
    const studentId = event.path.split('/').pop();
    console.log('ID المستلم في وظيفة generateCertificateTwo2:', studentId);

    let client;
    try {
        if (!uri) {
            throw new Error("MONGODB_URI is not set in environment variables. Please set it in Netlify.");
        }
        // هنا يمكنك جلب بيانات الطالب إذا كنت ترغب في عرض اسمه أو معلومات أخرى على الشهادة.
        // بما أنك طلبت عرض الشهادة كصورة فقط، لن نجلب البيانات الآن.
        // إذا أردت إضافة نص لاحقًا، سنضيف كود MongoDB هنا.

        const htmlContent = `
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>الشهادة ${studentId}</title>
                <style>
                    body {
                        margin: 0;
                        padding: 0;
                        /* نستخدم min-height و min-width لضمان تغطية كامل الشاشة */
                        min-height: 100vh;
                        min-width: 100vw;
                        overflow: hidden; /* لمنع ظهور scrollbars إذا كانت الصورة أكبر قليلاً */
                        display: flex; /* لضمان توسيط المحتوى */
                        justify-content: center;
                        align-items: center;
                        background-color: #f0f0f0; /* لون خلفية خفيف إذا كانت الصورة لا تغطي 100% */
                    }
                    .certificate-container {
                        /* مسار الصورة المطلق الذي يمكن للمتصفح الوصول إليه */
                        background-image: url('${CERTIFICATE_IMAGE_RELATIVE_PATH}');
                        background-size: contain; /* لجعل الصورة تتناسب داخل الحاوية */
                        background-repeat: no-repeat; /* لعدم تكرار الصورة */
                        background-position: center; /* لتوسيط الصورة */
                        width: 100%; /* اجعل الحاوية تأخذ عرض الشاشة */
                        height: 100%; /* اجعل الحاوية تأخذ ارتفاع الشاشة */
                        max-width: 1200px; /* يمكن تحديد أقصى عرض للشهادة إذا لزم الأمر */
                        max-height: 800px; /* يمكن تحديد أقصى ارتفاع */
                        aspect-ratio: 3/2; /* إذا كانت الشهادة بنسبة 3:2، للحفاظ على الأبعاد */
                        /* يمكنك ضبط هذه الأبعاد لتناسب حجم صورتك wwee.jpg */
                    }
                </style>
            </head>
            <body>
                <div class="certificate-container">
                    </div>
            </body>
            </html>
        `.trim();

        // إرجاع كود HTML مباشرة إلى المتصفح
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
            },
            body: htmlContent,
        };

    } catch (error) {
        console.error('خطأ في وظيفة عرض الشهادة:', error);
        return {
            statusCode: 500,
            body: `<h1>حدث خطأ أثناء عرض الشهادة</h1><p>${error.message}</p>`,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        };
    } finally {
        if (client) await client.close();
    }
};