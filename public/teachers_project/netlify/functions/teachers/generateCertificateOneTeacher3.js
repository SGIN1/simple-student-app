// teachers_project/netlify/functions/generateCertificateOneTeacher3.js
const { MongoClient, ObjectId } = require('mongodb');
const QRCode = require('qrcode');

// تعريف رابط الاتصال واسم قاعدة البيانات واسم المجموعة الخاصة بالمعلمين من متغيرات البيئة
const uri = process.env.MONGODB_URI_TEACHERS;
const dbName = "TeachersDB";
const collectionName = 'enrolled_teachers_tbl';

// **هام جدًا:** تأكد من أن هذا الرابط يشير إلى الدومين الجديد الخاص بك
const NETLIFY_BASE_URL = 'https://ssadsd.kozow.com'; // سيظل يشير إلى الدومين الأساسي حسب طلبك

exports.handler = async (event, context) => {
    const teacherId = event.queryStringParameters.id;
    console.log('ID المستلم في وظيفة generateCertificateOneTeacher3:', teacherId);

    let client;

    try {
        client = new MongoClient(uri);
        await client.connect();
        const database = client.db(dbName);
        const teachersCollection = database.collection(collectionName);

        const teacher = await teachersCollection.findOne({ _id: new ObjectId(teacherId) });

        if (!teacher) {
            return {
                statusCode: 404,
                body: `<h1>لم يتم العثور على معلم بالمعرف: ${teacherId}</h1>`,
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            };
        }

        // **التعديل هنا:** إنشاء رابط URL كامل للشهادة الثانية للمعلم باستخدام الرابط الأنيق
        const certificateTwoUrl = `${NETLIFY_BASE_URL}/teachers/certificate/${teacher._id}`;

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
                <title>شهادة المعلم</title>
                <style type="text/css" media="print">
                    @page {
                        size: auto;    /* auto is the initial value */
                        margin: 0;
                    }
                    body {
                        margin: 0; /* Reset body margin for printing */
                    }
                    @media print {
                        @page {
                            margin-top: 0;
                            margin-bottom: 0;
                        }
                        body {
                            padding-top: 0;
                            padding-bottom: 0 ;
                        }
                    }
                </style>
                <style>
                    body { font-family: Arial, sans-serif; direction: rtl; text-align: center; }
                    .certificate-container { width: 80%; margin: 20px auto; border: 1px solid #ccc; padding: 20px; }
                    .template { max-width: 100%; }
                    .data { margin-top: 20px; }
                    .serial { font-size: 1.2em; font-weight: bold; }
                    .residency { font-size: 1.2em; font-weight: bold; }
                    .qrcode-container { margin-top: 20px; }
                    .qrcode-container img { max-width: 150px; }
                    .qrcode-text { font-size: 0.8em; color: gray; }
                </style>
            </head>
            <body>
                <div class="certificate-container">
                    <img src="/www.jpg" alt="قالب الشهادة" class="template">
                    <div class="data">
                        <p class="serial">${teacher.serial_number}</p>
                        <p class="residency">${teacher.residency_number}</p>
                        ${qrCodeDataUri ? `
                            <div class="qrcode-container">
                                <img src="${qrCodeDataUri}" alt="QR Code للشهادة الثانية للمعلم">
                                <p class="qrcode-text">امسح هذا الرمز لفتح الشهادة الثانية للمعلم</p>
                            </div>
                        ` : `<p class="qrcode-text">حدث خطأ في إنشاء QR Code</p>`}
                    </div>
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
        console.error('خطأ في وظيفة توليد شهادة المعلم الأولى:', error);
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