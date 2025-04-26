const { MongoClient, ObjectId } = require('mongodb');
const sharp = require('sharp');
const path = require('path');

const uri = process.env.MONGODB_URI;
const dbName = "Cluster0";
const collectionName = 'enrolled_students_tbl';
const certificateTemplatePath = 'https://raw.githubusercontent.com/SGIN1/simple-student-app/1c3610d4e38df2d71c6e70d88399c74ec02eea9e/images/ppp.jpg'; // رابط مباشر لقالب الشهادة
const fontPath = 'https://raw.githubusercontent.com/SGIN1/simple-student-app/master/netlify/functions/arial.ttf'; // رابط مباشر لملف الخط (معلق)

console.log('مسار قالب الشهادة (رابط):', certificateTemplatePath);
console.log('مسار الخط (رابط):', fontPath);

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

        console.log('بيانات الطالب المسترجعة:', student);
        console.log('الرقم التسلسلي:', student.serial_number);
        console.log('رقم الإقامة:', student.residency_number);

        let imageBuffer;
        try {
            console.log('محاولة تحميل قالب الشهادة من:', certificateTemplatePath);
            const templateResponse = await fetch(certificateTemplatePath);
            if (!templateResponse.ok) {
                throw new Error(`فشل في تحميل قالب الشهادة: ${templateResponse.status} - ${templateResponse.statusText}`);
            }
            const templateBuffer = await templateResponse.arrayBuffer();

            imageBuffer = await sharp(Buffer.from(templateBuffer))
                .jpeg({ quality: 90 })
                .toBuffer();

            return {
                statusCode: 200,
                body: JSON.stringify({ image: imageBuffer.toString('base64') }),
                headers: {
                    'Content-Type': 'application/json',
                },
            };

        } catch (error) {
            console.error('خطأ أثناء معالجة الصورة:', error);
            return {
                statusCode: 500,
                body: `<h1>حدث خطأ أثناء معالجة الصورة</h1><p>${error.message}</p>`,
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            };
        } finally {
            if (client) {
                await client.close();
            }
        }
    } catch (error) {
        console.error('خطأ عام في وظيفة توليد الشهادة الثانية:', error);
        return {
            statusCode: 500,
            body: `<h1>حدث خطأ أثناء توليد الشهادة الثانية</h1><p>${error.message}</p>`,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        };
    }
};