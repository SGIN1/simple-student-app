const { MongoClient, ObjectId } = require('mongodb');
const sharp = require('sharp');
const path = require('path');

const uri = process.env.MONGODB_URI;
const dbName = "Cluster0";
const collectionName = 'enrolled_students_tbl';
const certificateTemplatePath = path.resolve('./www_student.jpg'); // تأكد من المسار!
const fontPath = path.resolve('./arial.ttf'); // تأكد من مسار الخط!

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

        // حجم وموقع النصوص على الشهادة - تحتاج لتعديل هذه القيم!
        const fontSize = 48;
        const textColor = '#000000'; // أسود
        const serialNumberX = 300;
        const serialNumberY = 400;
        const residencyNumberX = 300;
        const residencyNumberY = 500;
        const enrollmentDateX = 300;
        const enrollmentDateY = 600;
        const studentIdX = 100;
        const studentIdY = 100;

        const imageBuffer = await sharp(certificateTemplatePath)
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
                {
                    text: {
                        text: student.created_at ? student.created_at.substring(0, 10) : '', // عرض أول 10 حروف من تاريخ الإضافة
                        x: enrollmentDateX,
                        y: enrollmentDateY,
                        font: fontPath,
                        size: fontSize - 10,
                        color: textColor,
                        align: 'left',
                    },
                },
                {
                    text: {
                        text: student._id.toString(),
                        x: studentIdX,
                        y: studentIdY,
                        font: fontPath,
                        size: fontSize - 20,
                        color: '#888888',
                        align: 'left',
                    },
                },
            ])
            .jpeg({ quality: 90 }) // يمكنك تغيير الفورمات والجودة حسب الحاجة
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
};