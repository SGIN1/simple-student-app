const { MongoClient, ObjectId } = require('mongodb');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs/promises'); // هذا سيمكننا من قراءة ملف الخط

const uri = process.env.MONGODB_URI;
const dbName = 'Cluster0';
const collectionName = 'enrolled_students_tbl';

const CERTIFICATE_IMAGE_PATH = path.join(process.cwd(), 'public/images_temp/wwee.jpg');

// ***مسار الخط***
// تأكد أن المسار صحيح نسبة إلى جذر مجلد مشروعك في Netlify
// إذا كان ملف الدالة generateCertificateTwo2.js موجود في netlify/functions/generateCertificateTwo2.js
// ومجلد fonts موجود في netlify/functions/fonts
// فإن المسار الصحيح للخط هو:
const ARABIC_FONT_PATH = path.join(process.cwd(), 'netlify/functions/fonts/arial.ttf');


const TEXT_COLOR_HEX = '#000000';
const WHITE_COLOR_HEX = '#FFFFFF';

const TEXT_POSITIONS = {
    STUDENT_NAME: { x: 300, y: 150, fontSize: 48, color: WHITE_COLOR_HEX, alignment: 'middle' },
    SERIAL_NUMBER: { x: 90, y: 220, fontSize: 28, color: WHITE_COLOR_HEX, alignment: 'middle' },
    DOCUMENT_SERIAL_NUMBER: { x: 300, y: 280, fontSize: 20, color: TEXT_COLOR_HEX, alignment: 'middle' },
    PLATE_NUMBER: { x: 300, y: 320, fontSize: 20, color: TEXT_COLOR_HEX, alignment: 'middle' },
    CAR_TYPE: { x: 300, y: 360, fontSize: 20, color: TEXT_COLOR_HEX, alignment: 'middle' },
    COLOR: { x: 300, y: 400, fontSize: 20, color: TEXT_COLOR_HEX, alignment: 'middle' },
};


// دالة مساعدة لإنشاء نص SVG
async function createTextSVG(text, fontSize, color, imageWidth) {
    // قراءة ملف الخط وتحويله إلى Base64
    const fontData = await fs.readFile(ARABIC_FONT_PATH);
    const fontBase64 = fontData.toString('base64');

    const svgWidth = imageWidth;
    const svgHeight = fontSize * 1.5;

    const svg = `
        <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <style type="text/css">
                    @font-face {
                        font-family: 'ArialCustom'; /* اسم خاص للخط لضمان عدم تضاربه */
                        src: url(data:font/ttf;base64,${fontBase64}) format('truetype');
                    }
                </style>
            </defs>
            <text style="font-family: 'ArialCustom', sans-serif; font-size: ${fontSize}px; fill: ${color}; text-anchor: middle; dominant-baseline: central;" x="${svgWidth / 2}" y="${svgHeight / 2}">${text}</text>
        </svg>
    `;
    return Buffer.from(svg);
}


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

        const baseImage = sharp(CERTIFICATE_IMAGE_PATH);
        const metadata = await baseImage.metadata();
        const imageWidth = metadata.width;

        const overlays = [];

        // اسم الطالب
        const studentNameSVG = await createTextSVG(
            studentNameArabic,
            TEXT_POSITIONS.STUDENT_NAME.fontSize,
            TEXT_POSITIONS.STUDENT_NAME.color,
            imageWidth
        );
        overlays.push({ input: studentNameSVG, top: TEXT_POSITIONS.STUDENT_NAME.y, left: TEXT_POSITIONS.STUDENT_NAME.x, blend: 'overlay' });

        // الرقم التسلسلي
        const serialNumberSVG = await createTextSVG(
            serialNumber,
            TEXT_POSITIONS.SERIAL_NUMBER.fontSize,
            TEXT_POSITIONS.SERIAL_NUMBER.color,
            imageWidth
        );
        overlays.push({ input: serialNumberSVG, top: TEXT_POSITIONS.SERIAL_NUMBER.y, left: TEXT_POSITIONS.SERIAL_NUMBER.x, blend: 'overlay' });

        // رقم الوثيقة التسلسلي
        const documentSerialNumberSVG = await createTextSVG(
            documentSerialNumber,
            TEXT_POSITIONS.DOCUMENT_SERIAL_NUMBER.fontSize,
            TEXT_POSITIONS.DOCUMENT_SERIAL_NUMBER.color,
            imageWidth
        );
        overlays.push({ input: documentSerialNumberSVG, top: TEXT_POSITIONS.DOCUMENT_SERIAL_NUMBER.y, left: TEXT_POSITIONS.DOCUMENT_SERIAL_NUMBER.x, blend: 'overlay' });

        // رقم اللوحة
        const plateNumberSVG = await createTextSVG(
            `رقم اللوحة: ${plateNumber}`,
            TEXT_POSITIONS.PLATE_NUMBER.fontSize,
            TEXT_POSITIONS.PLATE_NUMBER.color,
            imageWidth
        );
        overlays.push({ input: plateNumberSVG, top: TEXT_POSITIONS.PLATE_NUMBER.y, left: TEXT_POSITIONS.PLATE_NUMBER.x, blend: 'overlay' });

        // نوع السيارة
        const carTypeSVG = await createTextSVG(
            `نوع السيارة: ${carType}`,
            TEXT_POSITIONS.CAR_TYPE.fontSize,
            TEXT_POSITIONS.CAR_TYPE.color,
            imageWidth
        );
        overlays.push({ input: carTypeSVG, top: TEXT_POSITIONS.CAR_TYPE.y, left: TEXT_POSITIONS.CAR_TYPE.x, blend: 'overlay' });

        // اللون
        const colorSVG = await createTextSVG(
            `اللون: ${color}`,
            TEXT_POSITIONS.COLOR.fontSize,
            TEXT_POSITIONS.COLOR.color,
            imageWidth
        );
        overlays.push({ input: colorSVG, top: TEXT_POSITIONS.COLOR.y, left: TEXT_POSITIONS.COLOR.x, blend: 'overlay' });

        const processedImageBuffer = await baseImage
            .composite(overlays)
            .jpeg()
            .toBuffer();

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