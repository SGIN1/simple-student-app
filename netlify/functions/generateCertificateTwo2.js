const { MongoClient, ObjectId } = require('mongodb');
const sharp = require('sharp');
const path = require('path');

const uri = process.env.MONGODB_URI;
const dbName = 'Cluster0';
const collectionName = 'enrolled_students_tbl';

// **مسار صورة الشهادة:** يجب أن يكون موجودًا في مجلد public/images_temp
const CERTIFICATE_IMAGE_PATH = path.join(process.cwd(), 'public/images_temp/wwee.jpg');

// **مسار الخط:** يجب أن يكون موجودًا في مجلد netlify/functions/fonts
const FONT_PATH = path.join(process.cwd(), 'netlify/functions/fonts/arial.ttf');

async function generateTextOverlay(text, x, y, size, color, fontFamily, width, align) {
    const svg = `
        <svg width="${width}" height="${size * 1.2}">
            <text x="${align === 'center' ? width / 2 : align === 'right' ? width : 0}" y="${size}"
                  font-size="${size}" fill="${color}" font-family="${fontFamily}"
                  text-anchor="${align === 'center' ? 'middle' : align === 'right' ? 'end' : 'start'}">
                ${text}
            </text>
        </svg>
    `;
    return Buffer.from(svg);
}

exports.handler = async (event, context) => {
    const studentId = event.path.split('/').pop();
    console.log('ID المستلم في وظيفة generateCertificateTwo2 باستخدام sharp:', studentId);

    let client;

    try {
        client = new MongoClient(uri);
        await client.connect();
        const database = client.db(dbName);
        const studentsCollection = database.collection(collectionName);

        let student;
        try {
            student = await studentsCollection.findOne({ _id: new ObjectId(studentId) });
        } catch (objectIdError) {
            console.error('خطأ في إنشاء ObjectId:', objectIdError);
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'معرف الطالب غير صالح' }),
                headers: { 'Content-Type': 'application/json' },
            };
        }

        if (!student) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: `لم يتم العثور على طالب بالمعرف: ${studentId}` }),
                headers: { 'Content-Type': 'application/json' },
            };
        }

        const serialNumber = student.serial_number;
        const studentNameArabic = student.arabic_name || '';
        const documentSerialNumber = student.document_serial_number || '';
        const plateNumber = student.plate_number || '';
        const carType = student.car_type || '';
        const color = student.color || '';

        const image = sharp(CERTIFICATE_IMAGE_PATH);
        const metadata = await image.metadata();
        const imageWidth = metadata.width;

        // إنشاء طبقات النصوص SVG
        const nameOverlay = await generateTextOverlay(studentNameArabic, 0, 150, 48, 'white', 'arial', imageWidth * 0.9, 'center');
        const serialOverlay = await generateTextOverlay(serialNumber, 0, 220, 28, 'white', 'arial', 180, 'center');
        const docSerialOverlay = await generateTextOverlay(documentSerialNumber, 0, 280, 20, 'black', 'arial', imageWidth * 0.9, 'center');
        const plateOverlay = await generateTextOverlay(`رقم اللوحة: ${plateNumber}`, 0, 320, 20, 'black', 'arial', imageWidth * 0.9, 'center');
        const carTypeOverlay = await generateTextOverlay(`نوع السيارة: ${carType}`, 0, 360, 20, 'black', 'arial', imageWidth * 0.9, 'center');
        const colorOverlay = await generateTextOverlay(`اللون: ${color}`, 0, 400, 20, 'black', 'arial', imageWidth * 0.9, 'center');

        // دمج الطبقات النصية مع الصورة الأساسية
        const compositeImage = await image
            .composite([
                { input: nameOverlay, top: 150 - 48, left: Math.round(imageWidth * 0.05) }, // تعديل الموضع ليناسب النص
                { input: serialOverlay, top: 220 - 28, left: Math.round((imageWidth - 180) / 2) },
                { input: docSerialOverlay, top: 280 - 20, left: Math.round(imageWidth * 0.05) },
                { input: plateOverlay, top: 320 - 20, left: Math.round(imageWidth * 0.05) },
                { input: carTypeOverlay, top: 360 - 20, left: Math.round(imageWidth * 0.05) },
                { input: colorOverlay, top: 400 - 20, left: Math.round(imageWidth * 0.05) },
            ])
            .jpeg()
            .toBuffer();

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'image/jpeg',
            },
            body: compositeImage.toString('base64'),
            isBase64Encoded: true,
        };

    } catch (error) {
        console.error('خطأ في وظيفة توليد الشهادة باستخدام sharp:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'حدث خطأ أثناء توليد الشهادة باستخدام sharp', details: error.message }),
            headers: { 'Content-Type': 'application/json' },
        };
    } finally {
        if (client) await client.close();
    }
};