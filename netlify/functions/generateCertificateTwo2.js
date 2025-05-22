const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGODB_URI;
const dbName = 'Cluster0';
const collectionName = 'enrolled_students_tbl';

// **مسار صورة الشهادة:** يجب أن يكون موجودًا في مجلد public/images_temp
const CERTIFICATE_IMAGE_PATH = '/public/images_temp/wwee.jpg';

// **مسار الخط:** يجب أن يكون موجودًا في مجلد netlify/functions/fonts
const FONT_PATH = './arial.ttf';

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
  const studentId = event.path.split('/').pop(); // استخراج المعرّف من event.path
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
    const studentNameArabic = student.arabic_name || '';

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="ar" style="height: 100%;">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, minimum-scale=0.1">
        <title>الشهادة</title>
        <style>
          body {
            margin: 0px;
            height: 100%;
            background-color: rgb(14, 14, 14);
            display: flex;
            justify-content: center;
            align-items: center;
          }
          img {
            display: block;
            -webkit-user-select: none;
            margin: auto;
            cursor: zoom-in;
            background-color: hsl(0, 0%, 90%);
            transition: background-color 300ms;
            width: 496px;
            height: 607px;
          }
          @font-face {
            font-family: 'ArabicFont';
            src: url('${FONT_PATH}') format('truetype');
          }
          .student-name {
            font-family: 'ArabicFont', serif;
            font-size: 48px;
            color: #fff;
            position: absolute;
            top: 100px;
            left: 50%;
            transform: translateX(-50%);
            text-align: center;
            width: 90%;
          }
          .serial-number {
            ${SERIAL_NUMBER_STYLE}
            font-family: sans-serif;
            color: #fff;
          }
        </style>
      </head>
      <body style="margin: 0px; height: 100%; background-color: rgb(14, 14, 14);">
        <img style="display: block;-webkit-user-select: none;margin: auto;cursor: zoom-in;background-color: hsl(0, 0%, 90%);transition: background-color 300ms;" src="${CERTIFICATE_IMAGE_PATH}" width="496" height="607">
        <div class="student-name">${studentNameArabic}</div>
        <div class="serial-number">${serialNumber}</div>
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