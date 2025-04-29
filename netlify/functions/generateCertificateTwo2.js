const { MongoClient, ObjectId } = require('mongodb');
const fetch = require('node-fetch');

const uri = process.env.MONGODB_URI;
const dbName = "Cluster0";
const collectionName = 'enrolled_students_tbl';
// رابط GitHub الخام الجديد لصورة ppp.jpg
const CERTIFICATE_TWO_IMAGE_URL = 'https://raw.githubusercontent.com/SGIN1/simple-student-app/refs/heads/master/images/ppp.jpg';

// يمكنك تعديل هذه القيم لتناسب موقع وحجم الخط المطلوب للرقم التسلسلي
const SERIAL_NUMBER_STYLE = `
  position: absolute;
  top: 180px; /* تعديل المسافة من الأعلى */
  left: 50px; /* تعديل المسافة من اليسار */
  font-size: 28px; /* تعديل حجم الخط */
  font-weight: bold;
  color: black;
  text-align: center; /* محاذاة النص للوسط */
  width: 180px; /* عرض تقريبي للنص */
`;

exports.handler = async (event, context) => {
  const studentId = event.queryStringParameters.id;
  console.log('ID المستلم في وظيفة generateCertificateTwo2 (HTML + CSS):', studentId);

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

    const serialNumber = student.serial_number;

    // تضمين أنماط CSS مباشرة في الصفحة
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>الشهادة</title>
        <style>
          body { margin: 0; }
          .certificate-container {
            position: relative;
            width: 800px; /* تعديل العرض حسب حجم الشهادة */
            height: 600px; /* تعديل الارتفاع حسب حجم الشهادة */
            background-image: url('${CERTIFICATE_TWO_IMAGE_URL}');
            background-size: cover;
            background-repeat: no-repeat;
            display: flex;
            justify-content: center; /* لمركزة العناصر أفقياً */
            align-items: center; /* لمركزة العناصر رأسياً */
          }
          .serial-number {
            ${SERIAL_NUMBER_STYLE}
          }
        </style>
      </head>
      <body>
        <div class="certificate-container">
          <div class="serial-number">${serialNumber}</div>
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
    console.error('خطأ في وظيفة توليد الشهادة الثانية (HTML + CSS):', error);
    return { statusCode: 500, body: `<h1>حدث خطأ أثناء توليد الشهادة</h1><p>${error.message}</p>`, headers: { 'Content-Type': 'text/html; charset=utf-8' } };
  } finally {
    if (client) await client.close();
  }
};