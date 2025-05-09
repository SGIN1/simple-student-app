// generateCertificateTwo2.js
const jimp = require('jimp');
const { MongoClient } = require('mongodb');
const path = require('path');

const uri = process.env.MONGODB_URI;
const dbName = "Cluster0";
const collectionName = 'enrolled_students_tbl';
// استخدام path.join لتكوين المسار بشكل صحيح
const CERTIFICATE_IMAGE_PATH = path.join(__dirname, '..', 'public', 'images_temp', 'wwee.jpg');
const FONT_PATH = path.join(__dirname, 'arial.ttf'); // تأكد من وجود ملف الخط في نفس مجلد الدالة أو عدّل المسار

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

        // محاولة تحويل studentId إلى ObjectId إذا كان تنسيقه كذلك في قاعدة البيانات
        let query;
        try {
            query = { _id: studentId }; // محاولة البحث باستخدام المعرّف كما هو
            const student = await studentsCollection.findOne(query);
            if (!student) {
                // إذا لم يتم العثور عليه، نحاول البحث باستخدام ObjectId
                query = { _id: new ObjectId(studentId) };
                const studentWithObjectId = await studentsCollection.findOne(query);
                if (studentWithObjectId) {
                    student = studentWithObjectId;
                }
            }
        } catch (error) {
            // إذا فشل تحويل ObjectId، فهذا يعني أن المعرّف ليس بتنسيق ObjectId، ونستمر في البحث كما هو
            console.error("خطأ في محاولة تحويل ObjectId:", error);
            const student = await studentsCollection.findOne({ _id: studentId });
        }

        if (!student || !student.serial_number) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'لم يتم العثور على الطالب أو الرقم التسلسلي.' }),
            };
        }

        const serialNumber = student.serial_number;

        // قراءة الخط باستخدام المسار المحدد
        const font = await jimp.loadFont(FONT_PATH);

        // قراءة صورة الشهادة باستخدام المسار المحدد
        const certificate = await jimp.read(CERTIFICATE_IMAGE_PATH);

        // تحديد موقع النص (يمكن تعديل هذه القيم)
        const x = 100;
        const y = 200;

        // كتابة الرقم التسلسلي على الصورة
        certificate.print(font, x, y, serialNumber);

        // تحويل الصورة إلى Buffer قابل للإرسال
        const buffer = await certificate.getBufferAsync(jimp.MIME_PNG);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'image/png',
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