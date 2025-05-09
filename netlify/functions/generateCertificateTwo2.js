// generateCertificateTwo2.js
const jimp = require('jimp');
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const dbName = "Cluster0";
const collectionName = 'enrolled_students_tbl';
const CERTIFICATE_IMAGE_PATH = '/public/images_temp/wwee.jpg'; // المسار النسبي للصورة (سيتم تعديله ليناسب بيئة Netlify)

exports.handler = async (event, context) => {
    const studentId = event.queryStringParameters.id;

    if (!studentId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'مُعرّف الطالب مفقود.' }),
        };
    }

    let client;

    try {
        client = new MongoClient(uri);
        await client.connect();
        const database = client.db(dbName);
        const studentsCollection = database.collection(collectionName);

        const student = await studentsCollection.findOne({ _id: studentId }); // أو أي حقل تعريف فريد آخر تستخدمه

        if (!student || !student.serial_number) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'لم يتم العثور على الطالب أو الرقم التسلسلي.' }),
            };
        }

        const serialNumber = student.serial_number;

        // قراءة الخط (تأكد من وجود هذا الخط في مجلد وظائف Netlify أو مسار يمكن الوصول إليه)
        const font = await jimp.loadFont(jimp.FONT_SANS_32_BLACK); // يمكنك اختيار خط آخر وتوفيره

        // قراءة صورة الشهادة
        const certificate = await jimp.read(__dirname + CERTIFICATE_IMAGE_PATH); // __dirname يشير إلى مجلد الدالة

        // تحديد موقع النص (يمكن تعديل هذه القيم)
        const x = 100;
        const y = 200;

        // كتابة الرقم التسلسلي على الصورة
        certificate.print(font, x, y, serialNumber);

        // تحويل الصورة إلى Buffer قابل للإرسال
        const buffer = await certificate.getBufferAsync(jimp.MIME_PNG); // يمكنك اختيار MIME آخر حسب نوع الصورة

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'image/png', // أو image/jpeg حسب نوع الصورة
            },
            body: buffer.toString('base64'),
            isBase64Encoded: true,
        };

    } catch (error) {
        console.error('خطأ في دالة توليد الشهادة:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    } finally {
        if (client) {
            await client.close();
        }
    }
};