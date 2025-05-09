const { MongoClient, ObjectId } = require('mongodb');
const QRCode = require('qrcode');

const uri = process.env.MONGODB_URI;
const dbName = 'Cluster0';
const collectionName = 'enrolled_students_tbl';

// **هام جدًا:** تأكد من أن هذا الرابط يشير إلى الدومين الجديد الخاص بك
const NETLIFY_BASE_URL = 'https://ssadsd.kozow.com'; // استبدل بـاسم دومينك

exports.handler = async (event, context) => {
  // الحصول على معرف الطالب من معاملات الاستعلام
  const studentId = event.queryStringParameters.id;
  console.log('ID المستلم في وظيفة generateCertificateOne1:', studentId);

  let client;

  try {
    client = new MongoClient(uri);
    await client.connect();
    const database = client.db(dbName);
    const studentsCollection = database.collection(collectionName);

    // البحث عن بيانات الطالب في قاعدة البيانات
    const student = await studentsCollection.findOne({ _id: new ObjectId(studentId) });

    // إذا لم يتم العثور على الطالب، إرجاع خطأ 404
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

    // توليد رمز QR Code للرابط
    try {
      qrCodeDataUri = await QRCode.toDataURL(certificateTwoUrl);
    } catch (err) {
      console.error("Error generating QR code:", err);
      qrCodeDataUri = '';
    }

    // إنشاء كود HTML للشهادة الأولى
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
          .qrcode-container { margin-top: 20px; }
          .qrcode-container img { max-width: 150px; }
          .qrcode-text { font-size: 0.8em; color: gray; }
        </style>
      </head>
      <body>
        <div class="certificate-container">
          <img src="/الشهادة1.jpg" alt="قالب الشهادة" class="template">
          <div class="data">
            <p class="serial">${student.serial_number}</p>
            <p class="residency">${student.residency_number}</p>
            ${qrCodeDataUri ? `
              <div class="qrcode-container">
                <img src="${qrCodeDataUri}" alt="QR Code للشهادة الثانية">
                <p class="qrcode-text">امسح هذا الرمز لفتح الشهادة الثانية</p>
              </div>
            ` : `<p classCode="qrcode-text">حدث خطأ في إنشاء QR Code</p>`}
          </div>
        </div>
        <script>
          window.onload = function() {
            // window.print(); // يمكنك تفعيل الطباعة التلقائية هنا إذا أردت
            // setTimeout(function() { window.close(); }, 100);
          };
        </script>
      </body>
      </html>
    `;

    // إرجاع الاستجابة مع الشهادة HTML
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
    // إغلاق اتصال قاعدة البيانات في جميع الحالات
    if (client) await client.close();
  }
};