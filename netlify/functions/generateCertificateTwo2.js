const { MongoClient, ObjectId } = require('mongodb');
const Jimp = require('jimp');
const path = require('path');

const uri = process.env.MONGODB_URI;
const dbName = 'Cluster0';
const collectionName = 'enrolled_students_tbl';

// **مسار صورة الشهادة:** يجب أن يكون موجودًا في مجلد public/images_temp
const CERTIFICATE_IMAGE_PATH = path.join(process.cwd(), 'public/images_temp/wwee.jpg');

// **مسار الخط:** تجربة المسار النسبي المباشر
const FONT_PATH = './fonts/arial.ttf';

// تعريف أنماط النصوص باستخدام Jimp
const TEXT_COLOR = 0x000000FF; // أسود
const WHITE_COLOR = 0xFFFFFFFF;

const STUDENT_NAME_STYLE = { top: 150, fontSize: 48, color: WHITE_COLOR, alignment: Jimp.HORIZONTAL_ALIGN_CENTER };
const SERIAL_NUMBER_STYLE = { top: 220, fontSize: 28, color: WHITE_COLOR, alignment: Jimp.HORIZONTAL_ALIGN_CENTER };
const DOCUMENT_SERIAL_NUMBER_STYLE = { top: 280, fontSize: 20, color: TEXT_COLOR, alignment: Jimp.HORIZONTAL_ALIGN_CENTER };
const PLATE_NUMBER_STYLE = { top: 320, fontSize: 20, color: TEXT_COLOR, alignment: Jimp.HORIZONTAL_ALIGN_CENTER };
const CAR_TYPE_STYLE = { top: 360, fontSize: 20, color: TEXT_COLOR, alignment: Jimp.HORIZONTAL_ALIGN_CENTER };
const COLOR_STYLE = { top: 400, fontSize: 20, color: TEXT_COLOR, alignment: Jimp.HORIZONTAL_ALIGN_CENTER };

exports.handler = async (event, context) => {
    const studentId = event.path.split('/').pop();
    console.log('ID المستلم في وظيفة generateCertificateTwo2:', studentId);

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

        // قراءة صورة الشهادة
        const image = await Jimp.read(CERTIFICATE_IMAGE_PATH);

        // تحميل الخط باستخدام المسار النسبي المباشر
        const font = await Jimp.loadFont(FONT_PATH);

        const imageWidth = image.getWidth();

        // كتابة النصوص على الصورة
        image.print(font, 0, STUDENT_NAME_STYLE.top, { text: studentNameArabic, alignmentX: STUDENT_NAME_STYLE.alignment, maxWidth: imageWidth * 0.9 }, imageWidth);
        image.print(font, 0, SERIAL_NUMBER_STYLE.top, { text: serialNumber, alignmentX: SERIAL_NUMBER_STYLE.alignment, maxWidth: 180 }, 180);
        image.print(font, 0, DOCUMENT_SERIAL_NUMBER_STYLE.top, { text: documentSerialNumber, alignmentX: DOCUMENT_SERIAL_NUMBER_STYLE.alignment, maxWidth: imageWidth * 0.9 }, imageWidth);
        image.print(font, 0, PLATE_NUMBER_STYLE.top, { text: `رقم اللوحة: ${plateNumber}`, alignmentX: PLATE_NUMBER_STYLE.alignment, maxWidth: imageWidth * 0.9 }, imageWidth);
        image.print(font, 0, CAR_TYPE_STYLE.top, { text: `نوع السيارة: ${carType}`, alignmentX: CAR_TYPE_STYLE.alignment, maxWidth: imageWidth * 0.9 }, imageWidth);
        image.print(font, 0, COLOR_STYLE.top, { text: `اللون: ${color}`, alignmentX: COLOR_STYLE.alignment, maxWidth: imageWidth * 0.9 }, imageWidth);

        // تحويل الصورة إلى Buffer
        const processedImageBuffer = await image.getBufferAsync(Jimp.MIME_JPEG);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'image/jpeg',
            },
            body: processedImageBuffer.toString('base64'),
            isBase64Encoded: true,
        };

    } catch (error) {
        console.error('خطأ في وظيفة توليد الشهادة:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'حدث خطأ أثناء توليد الشهادة', details: error.message }),
            headers: { 'Content-Type': 'application/json' },
        };
    } finally {
        if (client) await client.close();
    }
};