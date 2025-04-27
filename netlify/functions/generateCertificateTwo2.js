const { MongoClient, ObjectId } = require('mongodb');
const sharp = require('sharp');
const fetch = require('node-fetch'); // تحتاج إلى هذه المكتبة لجلب الصورة من الرابط

const uri = process.env.MONGODB_URI;
const dbName = "Cluster0";
const collectionName = 'enrolled_students_tbl';

// رابط صورة الشهادة الثانية الخام
const CERTIFICATE_TWO_IMAGE_URL = 'https://raw.githubusercontent.com/SGIN1/simple-student-app/1c3610d4e38df2d71c6e70d88399c74ec02eea9e/images/ppp.jpg';

// إعدادات النص الذي سيتم إضافته (يمكن تعديلها)
const TEXT_OPTIONS = {
    text: '<p><span style="font-size: 48px; font-weight: bold; fill: black;">%TEXT%</span></p>',
    x: 500, // إحداثي X لبداية النص
    y: 650, // إحداثي Y لبداية النص
    font: 'Arial',
    width: 400, // أقصى عرض للنص
    height: 100,
    align: 'center',
};

exports.handler = async (event, context) => {
    const studentId = event.queryStringParameters.id;
    console.log('ID المستلم في وظيفة generateCertificateTwo2 (مع دمج النص):', studentId);

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
        const textToAdd = TEXT_OPTIONS.text.replace('%TEXT%', serialNumber);

        // جلب صورة الشهادة باستخدام node-fetch
        const imageResponse = await fetch(CERTIFICATE_TWO_IMAGE_URL);
        if (!imageResponse.ok) {
            console.error('فشل في جلب صورة الشهادة:', imageResponse.status, imageResponse.statusText);
            return {
                statusCode: 500,
                body: '<h1>فشل في تحميل صورة الشهادة</h1>',
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            };
        }
        const imageBuffer = await imageResponse.buffer();

        // إنشاء SVG يحتوي على النص
        const svgText = `
            <svg width="${1200}" height="${800}">
                <style>
                    .serial-number { font-size: 60px; font-weight: bold; fill: black; text-anchor: middle; }
                </style>
                <text x="${TEXT_OPTIONS.x + TEXT_OPTIONS.width / 2}" y="${TEXT_OPTIONS.y + TEXT_OPTIONS.height / 2}" class="serial-number">${serialNumber}</text>
            </svg>
        `;
        const svgBuffer = Buffer.from(svgText);

        // دمج النص SVG مع صورة الشهادة
        const outputBuffer = await sharp(imageBuffer)
            .composite([{
                input: svgBuffer,
                top: TEXT_OPTIONS.y,
                left: TEXT_OPTIONS.x,
            }])
            .toFormat('jpeg') // يمكنك تغيير التنسيق حسب الرغبة
            .toBuffer();

        return {
            statusCode: 200,
            body: outputBuffer.toString('base64'),
            isBase64Encoded: true,
            headers: { 'Content-Type': 'image/jpeg' }, // أو 'image/png' حسب التنسيق
        };

    } catch (error) {
        console.error('خطأ في وظيفة توليد الشهادة الثانية (مع دمج النص):', error);
        return {
            statusCode: 500,
            body: `<h1>حدث خطأ أثناء توليد الشهادة الثانية مع دمج النص</h1><p>${error.message}</p>`,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        };
    } finally {
        if (client) {
            await client.close();
        }
    }
};