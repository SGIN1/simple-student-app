const { MongoClient, ObjectId } = require('mongodb');
const sharp = require('sharp'); // استيراد مكتبة sharp
const path = require('path');
// قد تحتاج إلى مكتبة لمعالجة نصوص RTL إذا لم تتعامل Sharp معها تلقائيًا
// const arabicReshaper = require('arabic-reshaper');
// const bidiJs = require('bidi-js'); // مثال على مكتبة RTL

const uri = process.env.MONGODB_URI;
const dbName = 'Cluster0';
const collectionName = 'enrolled_students_tbl';

// **مسار صورة الشهادة:** يجب أن يكون موجودًا في مجلد public/images_temp
const CERTIFICATE_IMAGE_PATH = path.join(process.cwd(), 'public', 'images_temp', 'wwee.jpg');

// **مسار الخط:** استخدام مسار خط .ttf أو .otf لـ Sharp
// تأكد من أن هذا الخط يدعم اللغة العربية وموجود في مجلد netlify/functions/fonts/
const FONT_PATH = path.join(__dirname, 'fonts', 'arabic_font.ttf'); // استبدل 'arabic_font.ttf' باسم خطك العربي

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
        let studentNameArabic = student.arabic_name || '';
        const documentSerialNumber = student.document_serial_number || '';
        const plateNumber = student.plate_number || '';
        const carType = student.car_type || '';
        const color = student.color || '';

        // **هام للغة العربية:**
        // sharp يتعامل مع الخطوط مباشرة، لكن قد تحتاج لمعالجة النص RTL إذا لم يظهر صحيحًا
        // إذا كان الخط لا يدعم الربط التلقائي للحروف، قد تحتاج لمكتبة مثل arabic-reshaper
        // مثال: if (arabicReshaper) studentNameArabic = arabicReshaper.reshape(studentNameArabic);
        // ثم لتغيير الاتجاه (RTL) قد تحتاج bidi-js
        // مثال: if (bidiJs) studentNameArabic = bidiJs.get=(studentNameArabic).reorder;

        // قراءة صورة الشهادة باستخدام sharp
        const certificateBuffer = await sharp(CERTIFICATE_IMAGE_PATH).toBuffer();
        let image = sharp(certificateBuffer);

        const metadata = await image.metadata();
        const imageWidth = metadata.width;
        const imageHeight = metadata.height;

        // دالة مساعدة لطباعة النص على الصورة باستخدام SVG و Sharp
        const addTextToImage = async (baseImage, text, style) => {
            const svgText = `
                <svg width="${imageWidth}" height="${imageHeight}">
                    <style>
                        @font-face {
                            font-family: 'CustomArabicFont';
                            src: url('data:font/ttf;base64,${Buffer.from(await require('fs').promises.readFile(FONT_PATH)).toString('base64')}') format('truetype');
                        }
                        .text-style {
                            font-family: 'CustomArabicFont';
                            font-size: ${style.fontSize}px;
                            fill: ${style.color === 0xFFFFFFFF ? '#FFFFFF' : '#000000'}; /* تحويل لون Jimp إلى CSS */
                            text-anchor: middle; /* للتموضع الأفقي في المنتصف */
                        }
                    </style>
                    <text x="${imageWidth / 2}" y="${style.top + style.fontSize / 2}" class="text-style">
                        ${text}
                    </text>
                </svg>
            `;
            // تراكب SVG على الصورة الأساسية
            return baseImage.composite([{
                input: Buffer.from(svgText),
                left: 0,
                top: 0
            }]);
        };

        // كتابة النصوص على الصورة باستخدام sharp
        image = await addTextToImage(image, studentNameArabic, STUDENT_NAME_STYLE);
        image = await addTextToImage(image, serialNumber, SERIAL_NUMBER_STYLE);
        image = await addTextToImage(image, documentSerialNumber, DOCUMENT_SERIAL_NUMBER_STYLE);
        image = await addTextToImage(image, `رقم اللوحة: ${plateNumber}`, PLATE_NUMBER_STYLE);
        image = await addTextToImage(image, `نوع السيارة: ${carType}`, CAR_TYPE_STYLE);
        image = await addTextToImage(image, `اللون: ${color}`, COLOR_STYLE);

        // تحويل الصورة إلى Buffer
        const processedImageBuffer = await image.jpeg().toBuffer(); // أو .png() حسب نوع الصورة المطلوب

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'image/jpeg', // أو image/png
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