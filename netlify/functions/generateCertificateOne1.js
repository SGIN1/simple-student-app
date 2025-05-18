// netlify/functions/generateCertificateOne1.js
const { MongoClient, ObjectId } = require('mongodb');
const QRCode = require('qrcode');

const uri = process.env.MONGODB_URI;
const dbName = "Cluster0";
const collectionName = 'enrolled_students_tbl';

// **هام جدًا:** تأكد من أن هذا الرابط يشير إلى الدومين الجديد الخاص بك
const NETLIFY_BASE_URL = 'https://ssadsd.kozow.com'; // استبدل بـاسم دومينك

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

        // **التعديل هنا:** إنشاء رابط URL كامل للشهادة الثانية باستخدام الرابط الأنيق مع الدومين الجديد
        const certificateTwoUrl = `${NETLIFY_BASE_URL}/certificate/${student._id}`;

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
                    .other-data { margin-top: 10px; font-size: 1em; }
                    .qrcode-container { margin-top: 20px; }
                    .qrcode-container img { max-width: 150px; }
                    .qrcode-text { font-size: 0.8em; color: gray; }
                </style>
            </head>
            <body>
                <div class="certificate-container">
                    <img src="/www.jpg" alt="قالب الشهادة" class="template">
                    <div class="data">
                        <p class="serial">${student.serial_number}</p>
                        <p class="residency">${student.residency_number}</p>
                        <p class="other-data">الرقم التسلسلي للوثيقة: ${student.document_serial_number || 'غير محدد'}</p>
                        <p class="other-data">رقم اللوحة: ${student.plate_number || 'غير محدد'}</p>
                        <p class="other-data">تاريخ الفحص: ${student.inspection_date || 'غير محدد'}</p>
                        <p class="other-data">الشركة الصانعة: ${student.manufacturer || 'غير محدد'}</p>
                        <p class="other-data">تاريخ انتهاء الفحص: ${student.inspection_expiry_date || 'غير محدد'}</p>
                        <p class="other-data">نوع السيارة: ${student.car_type || 'غير محدد'}</p>
                        <p class="other-data">قراءة العداد: ${student.counter_reading || 'غير محدد'}</p>
                        <p class="other-data">رقم الهيكل: ${student.chassis_number || 'غير محدد'}</p>
                        <p class="other-data">طراز المركبة: ${student.vehicle_model || 'غير محدد'}</p>
                        <p class="other-data">اللون: ${student.color || 'غير محدد'}</p>
                        <p class="other-data">الرقم التسلسلي: ${student.serial_number_duplicate || 'غير محدد'}</p>
                        ${qrCodeDataUri ? `
                            <div class="qrcode-container">
                                <img src="${qrCodeDataUri}" alt="QR Code للشهادة الثانية">
                                <p class="qrcode-text">امسح هذا الرمز لفتح الشهادة الثانية</p>
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