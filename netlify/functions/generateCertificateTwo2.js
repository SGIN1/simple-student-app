const { MongoClient, ObjectId } = require('mongodb');
const sharp = require('sharp');
const path = require('path');

const uri = process.env.MONGODB_URI;
const dbName = "Cluster0";
const collectionName = 'enrolled_students_tbl';
const certificateTemplatePath = 'https://github.com/SGIN1/simple-student-app/blob/master/ppp.jpg?raw=true'; // رابط مباشر لقالب الشهادة
const fontPath = 'arial.ttf'; // تأكد من وجود هذا الخط في نفس مجلد الوظيفة أو مسار صحيح

console.log('مسار قالب الشهادة (رابط):', certificateTemplatePath);
console.log('مسار الخط:', fontPath);

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

        const fontSize = 48;
        const textColor = '#000000'; // أسود
        const serialNumberX = 300;
        const serialNumberY = 400;
        const residencyNumberX = 300;
        const residencyNumberY = 500;

        let imageBuffer;
        try {
            console.log('محاولة تحميل قالب الشهادة من:', certificateTemplatePath);
            const templateResponse = await fetch(certificateTemplatePath);
            if (!templateResponse.ok) {
                throw new Error(`فشل في تحميل قالب الشهادة: ${templateResponse.status} - ${templateResponse.statusText}`);
            }
            const templateBuffer = await templateResponse.arrayBuffer();
            imageBuffer = await sharp(Buffer.from(templateBuffer))
                .composite([
                    {
                        text: {
                            text: student.serial_number,
                            x: serialNumberX,
                            y: serialNumberY,
                            font: fontPath,
                            size: fontSize,
                            color: textColor,
                            align: 'left',
                        },
                    },
                    {
                        text: {
                            text: student.residency_number,
                            x: residencyNumberX,
                            y: residencyNumberY,
                            font: fontPath,
                            size: fontSize,
                            color: textColor,
                            align: 'left',
                        },
                    },
                ])
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
    }
};