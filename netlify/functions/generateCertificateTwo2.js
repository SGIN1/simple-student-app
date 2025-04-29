const { MongoClient, ObjectId } = require('mongodb');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises; // قد لا نحتاجها بشكل مباشر الآن

const uri = process.env.MONGODB_URI;
const dbName = "Cluster0";
const collectionName = 'enrolled_students_tbl';

// رابط URL الخام لقالب الشهادة الثانية من GitHub
const CERTIFICATE_TEMPLATE_URL = 'https://raw.githubusercontent.com/SGIN1/simple-student-app/refs/heads/master/images/ppp.jpg';

// --- خيارات تعديل حجم الشهادة والنص ---
const OUTPUT_QUALITY = 85;
// ... باقي الخيارات كما هي ...

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

        const serialNumber = student.serial_number;
        const testText = 'مرحباً بكم على مكتبة path'; // نص توضيحي

        try {
            // استخدام sharp مباشرة مع URL الصورة
            const imageWithText = await sharp(CERTIFICATE_TEMPLATE_URL)
                .composite([
                    {
                        text: {
                            text: serialNumber,
                            x: SERIAL_TEXT_X,
                            y: SERIAL_TEXT_Y,
                            font: 'arial',
                            size: SERIAL_FONT_SIZE,
                            color: SERIAL_FONT_COLOR,
                            align: SERIAL_TEXT_ALIGN,
                            width: SERIAL_TEXT_WIDTH,
                            height: SERIAL_TEXT_HEIGHT,
                            wrap: 'word'
                        }
                    },
                    { // إضافة النص التوضيحي
                        text: {
                            text: testText,
                            x: TEST_TEXT_X,
                            y: TEST_TEXT_Y,
                            font: 'arial',
                            size: TEST_FONT_SIZE,
                            color: TEST_FONT_COLOR,
                            align: 'left',
                        }
                    }
                ])
                .jpeg({ quality: OUTPUT_QUALITY })
                .toBuffer();

            return {
                statusCode: 200,
                headers: { 'Content-Type': 'image/jpeg' },
                body: imageWithText.toString('base64'),
                isBase64Encoded: true,
            };

        } catch (error) {
            console.error('خطأ في معالجة الصورة:', error);
            return {
                statusCode: 500,
                body: `<h1>حدث خطأ أثناء إنشاء الشهادة الثانية</h1><p>${error.message}</p>`,
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            };
        }

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