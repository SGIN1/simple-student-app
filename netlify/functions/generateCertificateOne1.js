const { MongoClient, ObjectId } = require('mongodb');
const QRCode = require('qrcode');

const uri = process.env.MONGODB_URI;
const dbName = "Cluster0";
const collectionName = 'enrolled_students_tbl';

// قم بتغيير هذا الرابط إلى رابط موقعك الفعلي على Netlify
const NETLIFY_SITE_URL = 'https://680995a3319a79e6dfaa3f7e--spiffy-meerkat-be5bc1.netlify.app';

exports.handler = async (event, context) => {
    const studentId = event.queryStringParameters.id;
    console.log('ID المستلم في وظيفة generateCertificateOne1:', studentId);

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

        // إنشاء رابط لـ generateCertificateTwo2 لتوليد الشهادة الثانية مع دمج الرقم التسلسلي
        const certificateTwoUrl = `${NETLIFY_SITE_URL}/.netlify/functions/generateCertificateTwo2?id=${student._id}`;
        let qrCodeDataUri;

        try {
            qrCodeDataUri = await QRCode.toDataURL(certificateTwoUrl);
        } catch (err) {
            console.error("Error generating QR code:", err);
            qrCodeDataUri = '';
        }

        const htmlCertificate = `
            <!DOCTYPE html>
            <html lang="ar">
            <head>
                <meta charset="UTF-8">
                <title>شهادة الطالب</title>
                <style>
                    body { font-family: Arial, sans-serif; direction: rtl; text-align: center; }
                    .certificate-container { width: 80%; margin: 20px auto; border: 1px solid #ccc; padding: 20px; }
                    .template { max-width: 100%; }
                    .data { margin-top: 20px; }
                    .serial { font-size: 1.2em; font-weight: bold; }
                    .residency { font-size: 1.2em; font-weight: bold; }
                    .qrcode { margin-top: 20px; }
                    .qrcode img { max-width: 150px; }
                    .print-button {
                        margin-top: 20px;
                        padding: 10px 20px;
                        background-color: #007bff;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 16px;
                    }
                </style>
            </head>
            <body>
                <div class="certificate-container">
                    <img src="/www.jpg" alt="قالب الشهادة" class="template">
                    <div class="data">
                        <p class="serial">الرقم التسلسلي: ${student.serial_number}</p>
                        <p class="residency">رقم الإقامة: ${student.residency_number}</p>
                    </div>
                    ${qrCodeDataUri ? `<div class="qrcode"><img src="${qrCodeDataUri}" alt="QR Code للشهادة الثانية"></div><p>امسح رمز QR لعرض الشهادة الثانية</p>` : ''}
                    <button class="print-button" onclick="window.print()">طباعة هذه الشهادة</button>
                </div>
            </body>
            </html>
        `;

        return {
            statusCode: 200,
            body: htmlCertificate,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        };

    } catch (error) {
        console.error('خطأ في وظيفة توليد الشهادة:', error);
        return {
            statusCode: 500,
            body: `<h1>حدث خطأ أثناء توليد الشهادة</h1><p>${error.message}</p>`,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        };
    } finally {
        if (client) {
            await client.close();
        }
    }
};