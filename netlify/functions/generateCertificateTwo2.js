const { MongoClient, ObjectId } = require('mongodb');
const Jimp = require('jimp');
const path = require('path');

const uri = process.env.MONGODB_URI;
const dbName = 'Cluster0';
const collectionName = 'enrolled_students_tbl';

// **مسار صورة الشهادة (معدل ليناسب مكان ملف الدالة):**
const CERTIFICATE_IMAGE_PATH = path.join(__dirname, 'images_temp', 'wwee.jpg');

// **مسار الخط (معدل ليناسب مكان ملف الدالة):**
const FONT_PATH = path.join(__dirname, 'fonts', 'arial.ttf');

const TEXT_STYLE = `
    position: absolute;
    font-size: 24px;
    color: black;
    text-align: center;
    width: 90%;
    left: 50%;
    transform: translateX(-50%);
`;

const STUDENT_NAME_STYLE = `
    ${TEXT_STYLE}
    font-family: 'ArabicFont', serif;
    color: #fff;
`;

const SERIAL_NUMBER_STYLE = `
    ${TEXT_STYLE}
    font-weight: bold;
    color: #fff;
    font-family: sans-serif;
    width: 180px;
`;

const DOCUMENT_SERIAL_NUMBER_STYLE = `
    ${TEXT_STYLE}
    color: #333;
`;

const PLATE_NUMBER_STYLE = `
    ${TEXT_STYLE}
    color: #333;
`;

const CAR_TYPE_STYLE = `
    ${TEXT_STYLE}
    color: #333;
`;

const COLOR_STYLE = `
    ${TEXT_STYLE}
    color: #333;
`;

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
                body: '<h1>معرف الطالب غير صالح</h1><p>يجب أن يكون المعرف سلسلة نصية مكونة من 24 حرفًا سداسيًا عشريًا.</p>',
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            };
        }

        if (!student) {
            return {
                statusCode: 404,
                body: `<h1>لم يتم العثور على طالب بالمعرف: ${studentId}</h1>`,
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            };
        }

        const serialNumber = student.serial_number;
        const studentNameArabic = student.arabic_name || '';
        const documentSerialNumber = student.document_serial_number || '';
        const plateNumber = student.plate_number || '';
        const carType = student.car_type || '';
        const color = student.color || '';

        let imageWidth, imageHeight;

        try {
            const image = await Jimp.read(CERTIFICATE_IMAGE_PATH);
            imageWidth = image.bitmap.width;
            imageHeight = image.bitmap.height;
            console.log(`الأبعاد الأصلية للصورة: ${imageWidth}x${imageHeight}`);
        } catch (error) {
            console.error('خطأ في قراءة صورة الشهادة باستخدام Jimp:', error);
            return {
                statusCode: 500,
                body: `<h1>حدث خطأ أثناء معالجة صورة الشهادة</h1><p>${error.message}</p><p>${error.stack}</p>`,
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            };
        }

        const nameTop = imageHeight * 0.25;
        const nameFontSize = imageHeight * 0.08;
        const serialTop = imageHeight * 0.38;
        const serialFontSize = imageHeight * 0.045;
        const docSerialTop = imageHeight * 0.48;
        const plateTop = imageHeight * 0.55;
        const carTypeTop = imageHeight * 0.62;
        const colorTop = imageHeight * 0.69;
        const otherFontSize = imageHeight * 0.035;

        const htmlContent = `<!DOCTYPE html>
        <html lang="ar" style="height: 100%;">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, minimum-scale=0.1">
            <title>الشهادة</title>
            <style>
                body {
                    margin: 0px;
                    height: 100%;
                    background-color: rgb(14, 14, 14);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .certificate-container {
                    position: relative;
                    width: ${imageWidth}px;
                    height: ${imageHeight}px;
                }
                .certificate-image {
                    display: block;
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                }
                @font-face {
                    font-family: 'ArabicFont';
                    src: url('${FONT_PATH}') format('truetype');
                }
                .student-name {
                    ${STUDENT_NAME_STYLE}
                    top: ${nameTop}px;
                    font-size: ${nameFontSize}px;
                }
                .serial-number {
                    ${SERIAL_NUMBER_STYLE}
                    top: ${serialTop}px;
                    font-size: ${serialFontSize}px;
                }
                .document-serial-number {
                    ${DOCUMENT_SERIAL_NUMBER_STYLE}
                    top: ${docSerialTop}px;
                    font-size: ${otherFontSize}px;
                }
                .plate-number {
                    ${PLATE_NUMBER_STYLE}
                    top: ${plateTop}px;
                    font-size: ${otherFontSize}px;
                }
                .car-type {
                    ${CAR_TYPE_STYLE}
                    top: ${carTypeTop}px;
                    font-size: ${otherFontSize}px;
                }
                .color {
                    ${COLOR_STYLE}
                    top: ${colorTop}px;
                    font-size: ${otherFontSize}px;
                }
            </style>
        </head>
        <body style="margin: 0px; height: 100%; background-color: rgb(14, 14, 14);">
            <div class="certificate-container">
                <img class="certificate-image" src="${CERTIFICATE_IMAGE_PATH}" alt="الشهادة">
                <div class="student-name">${studentNameArabic}</div>
                <div class="serial-number">${serialNumber}</div>
                <div class="document-serial-number"> ${documentSerialNumber}</div>
                <div class="plate-number">رقم اللوحة: ${plateNumber}</div>
                <div class="car-type">نوع السيارة: ${carType}</div>
                <div class="color">اللون: ${color}</div>
            </div>
        </body>
        </html>
    `;

        return {
            statusCode: 200,
            body: htmlContent,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        };

    } catch (error) {
        console.error('خطأ في وظيفة توليد الشهادة:', error);
        return {
            statusCode: 500,
            body: `<h1>حدث خطأ أثناء توليد الشهادة</h1><p>${error.message}</p><p>${error.stack}</p>`,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        };
    } finally {
        if (client) await client.close();
    }
};