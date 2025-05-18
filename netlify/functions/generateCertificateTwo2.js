// netlify/functions/generateCertificateTwo2.js
const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGODB_URI;
const dbName = "Cluster0";
const collectionName = 'enrolled_students_tbl';

exports.handler = async (event, context) => {
    const studentId = event.path.split('/').pop(); // استخراج المُعرّف من الرابط الأنيق

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

        const htmlCertificate = `
            <!DOCTYPE html>
            <html lang="ar">
            <head>
                <meta charset="UTF-8">
                <title>الشهادة الثانية للطالب</title>
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
                </style>
            </head>
            <body>
                <div class="certificate-container">
                    <img src="/www2.jpg" alt="قالب الشهادة الثاني" class="template">
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
        console.error('خطأ في وظيفة توليد الشهادة الثانية:', error);
        return {
            statusCode: 500,
            body: `<h1>حدث خطأ أثناء توليد الشهادة الثانية</h1><p>${error.message}</p>`,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        };
    } finally {
        if (client) {
            await client.close();
        }
    }
};