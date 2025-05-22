// netlify/functions/generateCertificateTwo2.js

const { MongoClient, ObjectId } = require('mongodb');
const path = require('path'); // ما زلنا نحتاج path لضمان المسارات إذا أردت استخدامها لاحقًا بشكل صحيح

const uri = process.env.MONGODB_URI;
const dbName = 'Cluster0';
const collectionName = 'enrolled_students_tbl';

// **مسار صورة الشهادة:** هذا المسار هو نسبي لمجلد 'public'
// تأكد أن wwee.jpg موجودة في 'public/images_temp/wwee.jpg'
const CERTIFICATE_IMAGE_PATH = '/images_temp/wwee.jpg'; // مسار الـ URL للوصول للصورة من المتصفح

// **مسار الخط:** هذا المسار هو نسبي لموقع ملف الوظيفة نفسه (generateCertificateTwo2.js)
// تأكد أن arial.ttf موجود في 'netlify/functions/arial.ttf'
// إذا كان داخل 'netlify/functions/fonts/arial.ttf'، فاجعله: const FONT_PATH = 'fonts/arial.ttf';
const FONT_PATH = 'arial.ttf'; // هذا المسار لكي يتعرف عليه المتصفح عبر @font-face

// قم بضبط هذه الستايلات لتناسب تصميم شهادتك
// تم تعديل الأبعاد لتناسب الصورة ذات الأبعاد (624x817)
const TEXT_STYLES = {
    STUDENT_NAME: { top: '220px', fontSize: '30px', color: '#000', textAlign: 'center', width: '80%', left: '10%' },
    SERIAL_NUMBER: { top: '260px', left: '60px', fontSize: '18px', color: '#fff', textAlign: 'left', width: '150px' },
    DOCUMENT_SERIAL_NUMBER: { top: '300px', fontSize: '16px', color: '#000', textAlign: 'center', width: '80%', left: '10%' },
    PLATE_NUMBER: { top: '330px', fontSize: '16px', color: '#000', textAlign: 'center', width: '80%', left: '10%' },
    CAR_TYPE: { top: '360px', fontSize: '16px', color: '#000', textAlign: 'center', width: '80%', left: '10%' },
    COLOR: { top: '390px', fontSize: '16px', color: '#000', textAlign: 'center', width: '80%', left: '10%' },
};

exports.handler = async (event, context) => {
    const studentId = event.path.split('/').pop();
    console.log('ID المستلم في وظيفة generateCertificateTwo2:', studentId);

    let client;

    try {
        if (!uri) {
            throw new Error("MONGODB_URI is not set in environment variables. Please set it in Netlify.");
        }
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

        const serialNumber = student.serial_number || '';
        const studentNameArabic = student.arabic_name || '';
        const documentSerialNumber = student.document_serial_number || '';
        const plateNumber = student.plate_number || '';
        const carType = student.car_type || '';
        const color = student.color || '';

        const htmlContent = `
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, minimum-scale=0.1, initial-scale=1.0">
                <title>الشهادة</title>
                <style>
                    body {
                        margin: 0;
                        height: 100vh; /* استخدم vh لضمان الارتفاع الكامل لنافذة العرض */
                        background-color: #0e0e0e; /* لون الخلفية */
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }
                    .certificate-container {
                        position: relative;
                        /* الأبعاد الجديدة للشهادة: العرض 624 والارتفاع 817 */
                        width: 624px;
                        height: 817px;
                        background-image: url('${CERTIFICATE_IMAGE_PATH}');
                        background-size: contain;
                        background-repeat: no-repeat;
                        background-position: center;
                        background-color: #eee; /* لون مؤقت إذا لم تحمل الصورة */
                        overflow: hidden; /* لمنع تجاوز النصوص للحاوية */
                        box-shadow: 0 0 10px rgba(0,0,0,0.5); /* لإضافة بعض الظل */
                    }
                    /* الخط الذي حددته في المسار: FONT_PATH */
                    @font-face {
                        font-family: 'ArabicFont';
                        src: url('/.netlify/functions/arial.ttf') format('truetype');
                        /* تأكد من