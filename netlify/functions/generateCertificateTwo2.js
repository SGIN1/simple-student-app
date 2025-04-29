const { MongoClient, ObjectId } = require('mongodb');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises; // استخدام promises لعمليات الملفات غير المتزامنة

const uri = process.env.MONGODB_URI;
const dbName = "Cluster0";
const collectionName = 'enrolled_students_tbl';

// مسار قالب الشهادة الثانية (تأكد من أن هذا المسار صحيح بالنسبة لموقع ملف القالب في مشروعك)
const CERTIFICATE_TEMPLATE_PATH = path.join(__dirname, 'certificate_template_two.jpg'); // مثال على اسم الملف

// --- خيارات تعديل حجم الشهادة والنص ---
const OUTPUT_QUALITY = 85; // جودة الضغط (0-100) - تقليل القيمة يقلل الحجم
// يمكنك إضافة خيارات resize هنا إذا أردت تغيير أبعاد الصورة بشكل مباشر
// const OUTPUT_WIDTH = 800;
// const OUTPUT_HEIGHT = 600;

// خيارات النص للرقم التسلسلي
const SERIAL_TEXT_X = 550;   // الإحداثي X
const SERIAL_TEXT_Y = 350;   // الإحداثي Y
const SERIAL_FONT_SIZE = 52; // حجم الخط
const SERIAL_FONT_COLOR = '#000000';
const SERIAL_TEXT_ALIGN = 'center';
const SERIAL_TEXT_WIDTH = 450;
const SERIAL_TEXT_HEIGHT = 120;

// خيارات النص التوضيحي (يمكنك تعديلها أو حذفها لاحقًا)
const TEST_TEXT_X = 150;
const TEST_TEXT_Y = 100;
const TEST_FONT_SIZE = 36;
const TEST_FONT_COLOR = '#FF0000';
const TEST_TEXT_ALIGN = 'left';

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
            // قراءة قالب الشهادة ك buffer
            const templateImage = await fs.readFile(CERTIFICATE_TEMPLATE_PATH);

            // كائن Sharp لبدء المعالجة
            let sharpImage = sharp(templateImage);

            // تطبيق تغيير الحجم إذا تم تحديده
            // if (OUTPUT_WIDTH && OUTPUT_HEIGHT) {
            //     sharpImage = sharpImage.resize({ width: OUTPUT_WIDTH, height: OUTPUT_HEIGHT });
            // }

            // إضافة النصوص إلى الصورة باستخدام Sharp
            const imageWithText = await sharpImage
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
                .jpeg({ quality: OUTPUT_QUALITY }) // تحويل الصورة إلى JPEG مع الجودة المحددة
                .toBuffer();

            return {
                statusCode: 200,
                headers: { 'Content-Type': 'image/jpeg' },
                body: imageWithText.toString('base64'),
                isBase64Encoded: true,
            };

        } catch (error) {
            console.error('خطأ في معالجة الصورة باستخدام Sharp:', error);
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