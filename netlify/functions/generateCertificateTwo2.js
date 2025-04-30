const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGODB_URI;
const dbName = 'Cluster0';
const collectionName = 'enrolled_students_tbl';

const CERTIFICATE_IMAGE_PATH = '/images/ppp.jpg';
const FONT_PATH = '/fonts/Amiri-Regular.ttf';

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

    let student;
    try {
      student = await studentsCollection.findOne({ _id: new ObjectId(studentId) });
    } catch (objectIdError) {
      console.error('خطأ في إنشاء ObjectId:', objectIdError);
      return {
        statusCode: 400,
        body: '<h1>معرف الطالب غير صالح</h1><p>يجب أن يكون المعرف سلسلة نصية مكونة من 24 حرفًا سداسيًا عشريًا.</p>',
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      };
    }

    if (!student) {
      return {
        statusCode: 404,
        body: `<h1>لم يتم العثور على طالب بالمعرف: ${studentId}</h1>`,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      };
    }

    const serialNumber = student.serial_number;
    const studentNameArabic = student.arabic_name || 'اسم الطالب';

    // **التغيير الرئيسي:** عرض الشهادة مباشرةً
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
        </style>
      </head>
      <body>
        <div class="certificate-container">
          <div class="student-name">${studentNameArabic}</div> <div class="serial-number">${serialNumber}</div> </div>
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