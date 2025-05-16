// teachers_project/netlify/functions/generateCertificateTwoTeacher4.js
const { MongoClient, ObjectId } = require('mongodb');

// تعريف رابط الاتصال واسم قاعدة البيانات واسم المجموعة الخاصة بالمعلمين من متغيرات البيئة
const uri = process.env.MONGODB_URI_TEACHERS;
const dbName = 'TeachersDB';
const collectionName = 'enrolled_teachers_tbl';

// **مسار صورة الشهادة للمعلمين:** يجب أن يكون موجودًا في مجلد public/images_temp
const CERTIFICATE_IMAGE_PATH = '/public/images_temp/wwee.jpg'; // يمكنك تغيير هذا إذا كان للمعلمين صورة شهادة مختلفة

// **مسار الخط:** يجب أن يكون موجودًا في مجلد netlify/functions/fonts
const FONT_PATH = './arial.ttf'; // تأكد من وجود هذا الخط

const SERIAL_NUMBER_STYLE = `
    position: absolute;
    top: 180px;
    left: 50px;
    font-size: 28px;
    font-weight: bold;
    color: black;
    text-align: center;
    width: 180px;
`;

exports.handler = async (event, context) => {
    const teacherId = event.path.split('/').pop(); // استخراج المعرّف من event.path
    console.log('ID المستلم في وظيفة generateCertificateTwoTeacher4:', teacherId);

    let client;

    try {
        client = new MongoClient(uri);
        await client.connect();
        const database = client.db(dbName);
        const teachersCollection = database.collection(collectionName);

        let teacher;
        try {
            teacher = await teachersCollection.findOne({ _id: new ObjectId(teacherId) });
        } catch (objectIdError) {
            console.error('خطأ في إنشاء ObjectId:', objectIdError);
            return {
                statusCode: 400,
                body: '<h1>معرف المعلم غير صالح</h1><p>يجب أن يكون المعرف سلسلة نصية مكونة من 24 حرفًا سداسيًا عشريًا.</p>',
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            };
        }

        if (!teacher) {
            return {
                statusCode: 404,
                body: `<h1>لم يتم العثور على معلم بالمعرف: ${teacherId}</h1>`,
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            };
        }

        const serialNumber = teacher.serial_number;
        const teacherNameArabic = teacher.arabic_name || ''; // تأكد من وجود هذا الحقل في بيانات المعلمين إذا كنت تريد عرضه

        const htmlContent = `
            <!DOCTYPE html>
            <html lang="ar" style="height: 100%;">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, minimum-scale=0.1">
                <title>شهادة المعلم</title>
                <style>
                    body {
                        margin: 0px;
                        height: 100%;
                        background-color: rgb(14, 14, 14);
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }
                    img {
                        display: block;
                        -webkit-user-select: none;
                        margin: auto;
                        cursor: zoom-in;
                        background-color: hsl(0, 0%, 90%);
                        transition: background-color 300ms;
                        width: 496px;
                        height: 607px;
                    }
                    @font-face {
                        font-family: 'ArabicFont';
                        src: url('${FONT_PATH}') format('truetype');
                    }
                    .teacher-name {
                        font-family: 'ArabicFont', serif;
                        font-size: 48px;
                        color: #fff;
                        position: absolute;
                        top: 100px;
                        left: 50%;
                        transform: translateX(-50%);
                        text-align: center;
                        width: 90%;
                    }
                    .serial-number {
                        ${SERIAL_NUMBER_STYLE}
                        font-family: sans-serif;
                        color: #fff;
                    }
                </style>
            </head>
            <body style="margin: 0px; height: 100%; background-color: rgb(14, 14, 14);">
                <img style="display: block;-webkit-user-select: none;margin: auto;cursor: zoom-in;background-color: hsl(0, 0%, 90%);transition: background-color 300ms;" src="${CERTIFICATE_IMAGE_PATH}" width="496" height="607">
                ${teacherNameArabic ? `<div class="teacher-name">${teacherNameArabic}</div>` : ''}
                <div class="serial-number">${serialNumber}</div>
            </body>
            </html>
        `;

        return {
            statusCode: 200,
            body: htmlContent,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        };
    } catch (error) {
        console.error('خطأ في وظيفة توليد شهادة المعلم الثانية:', error);
        return {
            statusCode: 500,
            body: `<h1>حدث خطأ أثناء توليد الشهادة</h1><p>${error.message}</p>`,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        };
    } finally {
        if (client) await client.close();
    }
};