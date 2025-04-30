const { MongoClient, ObjectId } = require('mongodb');
const QRCode = require('qrcode');

const uri = process.env.MONGODB_URI;
const dbName = "Cluster0";
const collectionName = 'enrolled_students_tbl';

exports.handler = async (event, context) => {
  const studentId = event.queryStringParameters.id;
  console.log('ID المستلم في وظيفة generateCertificateOne1 (QR Code):', studentId);

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
        <title>QR Code للشهادة الثانية</title>
        <style>
          body { display: flex; justify-content: center; align-items: center; min-height: 100vh; background-color: #f0f0f0; direction: rtl; text-align: center; }
          .qrcode-container { background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); }
          img { max-width: 100%; height: auto; }
          p { margin-top: 20px; font-size: 1.2em; color: #333; }
        </style>
      </head>
      <body>
        <div class="qrcode-container">
          ${qrCodeDataUri ? `<img src="${qrCodeDataUri}" alt="QR Code للشهادة الثانية">` : `<p>حدث خطأ في إنشاء QR Code</p>`}
          <p>امسح هذا الرمز لفتح الشهادة</p>
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
    console.error('خطأ في وظيفة generateCertificateOne1 (QR Code):', error);
    return { statusCode: 500, body: `<h1>حدث خطأ أثناء توليد QR Code</h1><p>${error.message}</p>`, headers: { 'Content-Type': 'text/html; charset=utf-8' } };
  } finally {
    if (client) await client.close();
  }
};




