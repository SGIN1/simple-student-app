// generateCertificateTwo2.js
const jimp = require('jimp');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');

const uri = process.env.MONGODB_URI;
const dbName = "Cluster0";
const collectionName = 'enrolled_students_tbl';
const CERTIFICATE_IMAGE_PATH = path.join(__dirname, '..', 'public', 'images_temp', 'wwee.jpg');
const FONT_PATH = path.join(__dirname, 'fonts', 'arial.ttf'); // المسار الصحيح لملف الخط

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

        let student = null;
        try {
            const query = { _id: studentId };
            student = await studentsCollection.findOne(query);
            if (!student && ObjectId.isValid(studentId)) {
                student = await studentsCollection.findOne({ _id: new ObjectId(studentId) });
            }
        } catch (error) {
            console.error("خطأ في البحث عن الطالب:", error);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'حدث خطأ أثناء البحث عن الطالب.' }),
            };
        }

        if (!student || !student.serial_number) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'لم يتم العثور على الطالب أو الرقم التسلسلي.' }),
            };
        }

        const serialNumber = student.serial_number;

        try {
            const font = await jimp.loadFont(FONT_PATH);
            const certificate = await jimp.read(CERTIFICATE_IMAGE_PATH);
            const x = 100;
            const y = 200;
            certificate.print(font, x, y, serialNumber);
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
            console.error('خطأ في معالجة الصورة:', error);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'حدث خطأ أثناء معالجة صورة الشهادة.' }),
            };
        }

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