const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs').promises;
const path = require('path');

const uri = process.env.MONGODB_URI;
const dbName = "Cluster0";
const collectionName = 'enrolled_students_tbl';
const CERTIFICATE_TEMPLATE_PATH = path.join(__dirname, 'certificate_template.html');
const FONT_PATH = '/fonts/arial.ttf'; // نفترض وضع الخط في public/fonts

exports.handler = async (event, context) => {
    const studentId = event.queryStringParameters.id;

    if (!studentId) {
        return { statusCode: 400, body: '<h1>مُعرّف الطالب مفقود</h1>', headers: { 'Content-Type': 'text/html; charset=utf-8' } };
    }

    let client;

    try {
        client = new MongoClient(uri);
        await client.connect();
        const database = client.db(dbName);
        const studentsCollection = database.collection(collectionName);

        const student = await studentsCollection.findOne({ _id: new ObjectId(studentId) });

        if (!student || !student.serial_number || !student.arabic_name) {
            return { statusCode: 404, body: '<h1>لم يتم العثور على بيانات الطالب المطلوبة</h1>', headers: { 'Content-Type': 'text/html; charset=utf-8' } };
        }

        const serialNumber = student.serial_number;
        const studentNameArabic = student.arabic_name;
        const issueDate = new Date().toLocaleDateString('ar-SA');

        let certificateHTML = await fs.readFile(CERTIFICATE_TEMPLATE_PATH, 'utf8');

        certificateHTML = certificateHTML.replace('{{اسم_الطالب}}', studentNameArabic);
        certificateHTML = certificateHTML.replace('{{الرقم_التسلسلي}}', serialNumber);
        certificateHTML = certificateHTML.replace('{{تاريخ_الإصدار}}', issueDate);
        certificateHTML = certificateHTML.replace('{{مسار_الخط}}', FONT_PATH);

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
            body: certificateHTML,
        };

    } catch (error) {
        console.error('خطأ في دالة توليد الشهادة (HTML):', error);
        return { statusCode: 500, body: `<h1>حدث خطأ أثناء توليد الشهادة</h1><p>${error.message}</p>`, headers: { 'Content-Type': 'text/html; charset=utf-8' } };
    } finally {
        if (client) await client.close();
    }
};