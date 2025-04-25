const { MongoClient, ObjectId } = require('mongodb');
const QRCode = require('qrcode');

const uri = process.env.MONGODB_URI;
const dbName = "Cluster0";
const collectionName = 'enrolled_students_tbl';

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

        // استخدام رابط URL كامل للشهادة الثانية
        const certificateTwoUrl = `https://spiffy-meerkat-be5bc1.netlify.app/.netlify/functions/generateCertificateTwo2?id=${student._id}`;
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
                </style>
            </head>
            <body>
                <div class="certificate-container">
                    <img src="/www.jpg" alt="قالب الشهادة" class="template">
                    <div class="data">
                        <p class="serial">${student.serial_number}</p>
                        <p class="residency">${student.residency_number}</p>
                    </div>
                    ${qrCodeDataUri ? `<div class="qrcode"><img src="${qrCodeDataUri}" alt="QR Code للشهادة الثانية"></div>` : ''}
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() { window.close(); }, 100);
                    };
                </script>
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