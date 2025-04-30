const { MongoClient, ObjectId } = require('mongodb');
const fetch = require('node-fetch');

const uri = process.env.MONGODB_URI;
const dbName = 'Cluster0';
const collectionName = 'enrolled_students_tbl';
const CERTIFICATE_IMAGE_PATH = '/images/ppp.jpg'; // افترض أن الصورة في public/images
const FONT_PATH = '/fonts/Amiri-Regular.ttf'; // افترض أن الخط في public/fonts

const SERIAL_NUMBER_STYLE = `
  position: absolute;
  top: 180px;
  left: 50px;
  font-size: 28px;
  font-weight: bold;
  color: black;
  text-align: center;
  width: 180px;
`;

exports.handler = async (event, context) => {
  const studentId = event.queryStringParameters.id;
  console.log('ID المستلم في وظيفة generateCertificateTwo2:', studentId);

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

    const serialNumber = student.serial_number;
    const studentNameArabic = student.arabic_name || 'اسم الطالب';

    const certificateLink = `https://your-netlify-site.netlify.app/.netlify/functions/generateCertificateTwo2?id=${studentId}`; // إنشاء رابط الشهادة

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>الشهادة</title>
        <style>
          body { margin: 0; font-family: sans-serif; }
          .certificate-container {
            position: relative;
            width: 800px;
            height: 600px;
            background-image: url('${CERTIFICATE_IMAGE_PATH}');
            background-size: cover;
            background-repeat: no-repeat;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
          }
          @font-face {
            font-family: 'ArabicFont';
            src: url('${FONT_PATH}') format('truetype');
          }
          .student-name {
            font-family: 'ArabicFont', serif;
            font-size: 48px;
            color: #000;
            margin-top: 200px;
          }
          .serial-number {
            ${SERIAL_NUMBER_STYLE}
            font-family: sans-serif;
          }
          .certificate-link { /* نمط للرابط */
            margin-top: 20px;
            font-size: 20px;
          }
        </style>
      </head>
      <body>
        <div class="certificate-container">
          <div class="student-name">${studentNameArabic}</div>
          <div class="serial-number">${serialNumber}</div>
          <div class="certificate-link">
            <a href="${certificateLink}">عرض الشهادة</a>
          </div>
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
    console.error('خطأ في وظيفة توليد الشهادة:', error);
    return {
      statusCode: 500,
      body: `<h1>حدث خطأ أثناء توليد الشهادة</h1><p>${error.message}</p>`,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    };
  } finally {
    if (client) await client.close();
  }
};