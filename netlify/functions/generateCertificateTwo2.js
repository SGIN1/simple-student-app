const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');
const fs = require('fs').promises; // استخدام promises عشان async/await

const uri = process.env.MONGODB_URI;
const dbName = "Cluster0";
const collectionName = 'enrolled_students_tbl';

exports.handler = async (event, context) => {
    const studentId = event.queryStringParameters.id;
    console.log('ID المستلم في وظيفة generateCertificateTwo2:', studentId);

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

        // استخدام رابط URL مباشر لصورة ppp.jpg من GitHub
        const imageUrl = 'https://github.com/SGIN1/simple-student-app/blob/master/ppp.jpg?raw=true';

        const htmlCertificateTwo = `
            <!DOCTYPE html>
            <html lang="ar">
            <head>
                <meta charset="UTF-8">
                <title>الشهادة الثانية للطالب</title>
                <style>
                    body { direction: rtl; text-align: center; background-color: #f0f0f0; }
                    .certificate-container { margin: 50px auto; background-color: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,.1); }
                    img { max-width: 100%; height: auto; display: block; }
                </style>
            </head>
            <body>
                <div class="certificate-container">
                    <img src="${imageUrl}" alt="الشهادة الثانية">
                </div>
            </body>
            </html>
        `;

        return {
            statusCode: 200,
            body: htmlCertificateTwo,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        };

    } catch (error) {
        console.error('خطأ في وظيفة توليد الشهادة الثانية:', error);
        return {
            statusCode: 500,
            body: `<h1>حدث خطأ أثناء توليد الشهادة الثانية</h1><p>${error.message}</p>`,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        };
    } finally {
        if (client) {
            await client.close();
        }
    }
};