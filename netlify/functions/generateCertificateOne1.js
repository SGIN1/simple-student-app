const { MongoClient, ObjectId } = require('mongodb');
const QRCode = require('qrcode');

const uri = process.env.MONGODB_URI;
const dbName = "Cluster0";
const collectionName = 'enrolled_students_tbl';
const CERTIFICATE_ONE_IMAGE_URL = 'https://raw.githubusercontent.com/SGIN1/simple-student-app/1c3610d4e38df2d71c6e70d88399c74ec02eea9e/images/www.jpg';

// يمكنك تعديل هذه القيم لتناسب مواقع وأحجام الخطوط المطلوبة
const SERIAL_NUMBER_STYLE_ONE = `
    position: absolute;
    top: 250px; /* تعديل المسافة من الأعلى */
    right: 100px; /* تعديل المسافة من اليمين */
    font-size: 24px;
    font-weight: bold;
    color: black;
`;

const RESIDENCY_NUMBER_STYLE_ONE = `
    position: absolute;
    top: 300px; /* تعديل المسافة من الأعلى */
    right: 100px; /* تعديل المسافة من اليمين */
    font-size: 24px;
    font-weight: bold;
    color: black;
`;

const QR_CODE_STYLE_ONE = `
    position: absolute;
    bottom: 50px; /* تعديل المسافة من الأسفل */
    left: 50px; /* تعديل المسافة من اليسار */
    width: 100px; /* تعديل حجم الـ QR Code */
    height: 100px;
`;

exports.handler = async (event, context) => {
    const studentId = event.queryStringParameters.id;
    console.log('ID المستلم في وظيفة generateCertificateOne1 (HTML + CSS + QR):', studentId);

    let client;

    try {
        client = new MongoClient(uri);
        await client.connect();
        const database = client.db(dbName);
        const studentsCollection = database.collection(collectionName);
        const student = await studentsCollection.findOne({ _id: new ObjectId(studentId) });

        if (!student) {
            return { statusCode: 404, body: `<h1>لم يتم العثور على طالب بالمعرف: ${studentId}</h1>`, headers: { 'Content-Type': 'text/html; charset=utf-8' } };
        }

        const certificateTwoUrl = `https://spiffy-meerkat-be5bc1.netlify.app/.netlify/functions/generateCertificateTwo2?id=${student._id}`;
        let qrCodeDataUri;

        try {
            qrCodeDataUri = await QRCode.toDataURL(certificateTwoUrl);
        } catch (err) {
            console.error("Error generating QR code:", err);
            qrCodeDataUri = '';
        }

        const htmlContent = `
            <!DOCTYPE html>
            <html lang="ar">
            <head>
                <meta charset="UTF-8">
                <title>الشهادة الأولى</title>
                <style>
                    body { margin: 0; }
                    .certificate-container {
                        position: relative;
                        width: 800px; /* تعديل العرض حسب حجم الشهادة */
                        height: 600px; /* تعديل الارتفاع حسب حجم الشهادة */
                        background-image: url('${CERTIFICATE_ONE_IMAGE_URL}');
                        background-size: cover;
                        background-repeat: no-repeat;
                        direction: rtl;
                        text-align: right;
                    }
                    .serial-number {
                        ${SERIAL_NUMBER_STYLE_ONE}
                    }
                    .residency-number {
                        ${RESIDENCY_NUMBER_STYLE_ONE}
                    }
                    .qrcode-container {
                        ${QR_CODE_STYLE_ONE}
                    }
                    .qrcode-container img {
                        width: 100%;
                        height: 100%;
                    }
                </style>
            </head>
            <body>
                <div class="certificate-container">
                    <div class="serial-number">${student.serial_number}</div>
                    <div class="residency-number">${student.residency_number}</div>
                    <div class="qrcode-container">
                        ${qrCodeDataUri ? `<img src="${qrCodeDataUri}" alt="QR Code للشهادة الثانية">` : `<p>خطأ في QR</p>`}
                    </div>
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
        console.error('خطأ في وظيفة generateCertificateOne1 (HTML + CSS + QR):', error);
        return { statusCode: 500, body: `<h1>حدث خطأ أثناء توليد الشهادة الأولى</h1><p>${error.message}</p>`, headers: { 'Content-Type': 'text/html; charset=utf-8' } };
    } finally {
        if (client) await client.close();
    }
};