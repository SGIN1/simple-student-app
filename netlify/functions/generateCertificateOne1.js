const { MongoClient, ObjectId } = require('mongodb');
const QRCode = require('qrcode');

const uri = process.env.MONGODB_URI;
const dbName = "Cluster0";
const collectionName = 'enrolled_students_tbl';

exports.handler = async (event, context) => {
    const studentId = event.queryStringParameters.id;

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

        // إنشاء بيانات الباركود (يمكن أن يكون رابط للشهادة الثانية أو معرف الطالب)
        const qrCodeData = `/certificate2?id=${student._id}`; // رابط لصفحة الشهادة الثانية

        // تحويل بيانات الباركود إلى SVG
        const qrCodeSVG = await QRCode.toString(qrCodeData, { type: 'svg' });

        return {
            statusCode: 200,
            body: `
                <!DOCTYPE html>
                <html lang="ar" dir="rtl">
                <head>
                    <meta charset="UTF-8">
                    <title>شهادة تقدير</title>
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                        .certificate { border: 5px solid #000; padding: 50px; position: relative; }
                        h1 { font-size: 2em; margin-bottom: 20px; }
                        p { font-size: 1.2em; line-height: 1.6; }
                        .barcode {
                            position: absolute;
                            bottom: 20px;
                            left: 20px;
                        }
                    </style>
                </head>
                <body>
                    <div class="certificate">
                        <h1>شهادة تقدير</h1>
                        <p>يشهد بأن الطالب:</p>
                        <p><b>الرقم التسلسلي: ${student.serial_number}</b></p>
                        <p><b>رقم الإقامة: ${student.residency_number}</b></p>
                        <p>قد أتم بنجاح...</p>
                        <p>نتمنى له التوفيق!</p>
                        <div class="barcode">
                            ${qrCodeSVG}
                        </div>
                    </div>
                    <script>
                        window.onload = function() {
                            window.print();
                        }
                    </script>
                </body>
                </html>
            `,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        };
    } catch (error) {
        console.error('Error generating certificate one:', error);
        return {
            statusCode: 500,
            body: `<h1>حدث خطأ أثناء إنشاء الشهادة الأولى</h1><p>${error.message}</p>`,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        };
    } finally {
        if (client) {
            await client.close();
        }
    }
};