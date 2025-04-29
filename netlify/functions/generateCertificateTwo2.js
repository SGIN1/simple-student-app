const { MongoClient, ObjectId } = require('mongodb');
const Jimp = require('jimp');
const path = require('path');

const uri = process.env.MONGODB_URI;
const dbName = "Cluster0";
const collectionName = 'enrolled_students_tbl';

// مسار قالب الشهادة الثانية (يوجد في مجلد 'images' داخل مجلد الوظيفة)
const CERTIFICATE_TEMPLATE_PATH = path.join(__dirname, 'images', 'ppp.jpg');

// --- خيارات النص ---
const SERIAL_TEXT_X = 550;
const SERIAL_TEXT_Y = 350;
const SERIAL_FONT_SIZE = 52;
const SERIAL_FONT_COLOR = '#000000';
const SERIAL_TEXT_ALIGN = Jimp.HORIZONTAL_ALIGN_CENTER;
const SERIAL_TEXT_MAX_WIDTH = 450;

const TEST_TEXT_X = 150;
const TEST_TEXT_Y = 100;
const TEST_FONT_SIZE = 36;
const TEST_FONT_COLOR = '#FF0000';
const TEST_TEXT_ALIGN_TEST = Jimp.HORIZONTAL_ALIGN_LEFT;

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
        const testText = 'مرحباً بكم على مكتبة Jimp'; // نص توضيحي

        try {
            const image = await Jimp.read(CERTIFICATE_TEMPLATE_PATH);
            const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK); // يمكنك اختيار خط آخر

            // إضافة الرقم التسلسلي
            image.print(
                font,
                SERIAL_TEXT_X,
                SERIAL_TEXT_Y,
                {
                    text: serialNumber,
                    alignmentX: SERIAL_TEXT_ALIGN,
                    maxWidth: SERIAL_TEXT_MAX_WIDTH
                },
                SERIAL_TEXT_MAX_WIDTH // تحديد أقصى عرض للنص
            );

            // إضافة النص التوضيحي
            image.print(
                font,
                TEST_TEXT_X,
                TEST_TEXT_Y,
                {
                    text: testText,
                    alignmentX: TEST_TEXT_ALIGN_TEST
                }
            );

            const buffer = await image.getBufferAsync(Jimp.MIME_JPEG);

            return {
                statusCode: 200,
                headers: { 'Content-Type': 'image/jpeg' },
                body: buffer.toString('base64'),
                isBase64Encoded: true,
            };

        } catch (error) {
            console.error('خطأ في معالجة الصورة باستخدام Jimp:', error);
            return {
                statusCode: 500,
                body: `<h1>حدث خطأ أثناء إنشاء الشهادة الثانية باستخدام Jimp</h1><p>${error.message}</p>`,
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