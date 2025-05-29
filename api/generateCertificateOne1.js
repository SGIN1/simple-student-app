import { MongoClient, ObjectId } from 'mongodb';
import QRCode from 'qrcode'; // تم تغيير صيغة الاستيراد لـ qrcode

const uri = process.env.MONGODB_URI;
const dbName = "Cluster0";
const collectionName = 'enrolled_students_tbl';

const VERCEL_BASE_URL = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const studentId = req.query.id;
    console.log('ID المستلم في وظيفة generateCertificateOne1:', studentId);

    if (!studentId) {
        return res.status(400).json({ error: 'معرف الطالب مطلوب.' });
    }

    let client;

    try {
        if (!uri) {
            return res.status(500).json({ error: 'لم يتم العثور على رابط اتصال MongoDB في متغيرات البيئة. تأكد من إعداده في Vercel.' });
        }

        client = new MongoClient(uri);
        await client.connect();
        const database = client.db(dbName);
        const studentsCollection = database.collection(collectionName);

        let student;
        try {
            student = await studentsCollection.findOne({ _id: new ObjectId(studentId) });
        } catch (objectIdError) {
            return res.status(400).send(`<h1>معرف الطالب غير صالح: ${studentId}</h1><p>${objectIdError.message}</p>`);
        }

        if (!student) {
            return res.status(404).send(`<h1>لم يتم العثور على طالب بالمعرف: ${studentId}</h1>`);
        }

        const certificateTwoUrl = `${VERCEL_BASE_URL}/api/generateCertificateTwo2?id=${student._id}`;

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
                        size: auto;
                        margin: 0;
                    }
                    body {
                        margin: 0;
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
                        <p class="serial">${student.serial_number || 'غير محدد'}</p>
                        <p class="residency">${student.residency_number || 'غير محدد'}</p>
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
                        ` : `<p class="qrcode-text">Error generating QR Code</p>`}
                    </div>
                </div>
                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                            setTimeout(function() { window.close(); }, 1000);
                        }, 500);
                    };
                </script>
            </body>

            </html>
        `;

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(htmlCertificate);

    } catch (error) {
        console.error('Error in generateCertificateOne1 function:', error);
        return res.status(500).send(`<h1>An error occurred while generating the certificate</h1><p>${error.message || 'حدث خطأ غير متوقع في الخادم.'}</p>`);
    } finally {
        if (client) {
            await client.close();
        }
    }
}