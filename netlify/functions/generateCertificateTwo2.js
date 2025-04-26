const { MongoClient, ObjectId } = require('mongodb');
const fetch = require('node-fetch'); // عشان نقدر نعمل fetch من داخل Node.js

const uri = process.env.MONGODB_URI;
const dbName = "Cluster0";
const collectionName = 'enrolled_students_tbl';

exports.handler = async (event, context) => {
    const studentId = event.queryStringParameters.id;
    console.log('ID المستلم في وظيفة generateCertificateOne1:', studentId);

    let client;

    try {
        client = new MongoClient(uri);
        await client.connect();
        const database = client.db(dbName);
        const studentsCollection = database.collection(collectionName);

        const student = await studentsCollection.findOne({ _id: new ObjectId(studentId) });

        if (!student) {
            return {
                statusCode: 404,
                body: `<h1>لم يتم العثور على طالب بالمعرف: ${studentId}</h1>`,
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            };
        }

        // استدعاء وظيفة generateCertificateTwo2 لجلب الصورة كـ base64
        const certificateTwoUrl = `https://spiffy-meerkat-be5bc1.netlify.app/.netlify/functions/generateCertificateTwo2?id=${student._id}`;
        const responseTwo = await fetch(certificateTwoUrl);

        if (!responseTwo.ok) {
            const errorData = await responseTwo.json();
            console.error('فشل في استدعاء generateCertificateTwo2:', errorData);
            return {
                statusCode: responseTwo.status,
                body: `<h1>فشل في الحصول على الشهادة الثانية</h1><p>${errorData?.error || 'حدث خطأ غير معروف'}</p>`,
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            };
        }

        const dataTwo = await responseTwo.json();

        return {
            statusCode: 200,
            body: JSON.stringify({ image: dataTwo.image, serialNumber: student.serial_number }),
            headers: {
                'Content-Type': 'application/json',
            },
        };

    } catch (error) {
        console.error('خطأ عام في وظيفة generateCertificateOne1:', error);
        return {
            statusCode: 500,
            body: `<h1>حدث خطأ أثناء معالجة الشهادة</h1><p>${error.message}</p>`,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        };
    } finally {
        if (client) {
            await client.close();
        }
    }
};