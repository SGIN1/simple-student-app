const { MongoClient, ObjectId } = require('mongodb');
const Jimp = require('jimp');

const uri = process.env.MONGODB_URI;
const dbName = "Cluster0";
const collectionName = 'enrolled_students_tbl';
// رابط GitHub الخام الجديد لصورة ppp.jpg
const CERTIFICATE_TWO_IMAGE_URL = 'https://raw.githubusercontent.com/SGIN1/simple-student-app/refs/heads/master/images/ppp.jpg';

// يمكنك تعديل هذه القيم لتناسب موقع وحجم الخط المطلوب للرقم التسلسلي
const SERIAL_NUMBER_OPTIONS = {
    x: 50,       // المسافة من اليسار
    y: 180,      // المسافة من الأعلى
    fontSize: 28, // حجم الخط
    color: 'black', // لون الخط
    alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT, // محاذاة أفقية
    alignmentY: Jimp.VERTICAL_ALIGN_TOP,   // محاذاة رأسية
};

exports.handler = async (event, context) => {
    const studentId = event.queryStringParameters.id;
    console.log('ID المستلم في وظيفة generateCertificateTwo باستخدام Jimp:', studentId);

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

        // 1. قراءة الصورة باستخدام Jimp
        const image = await Jimp.read(CERTIFICATE_TWO_IMAGE_URL);

        // 2. تحميل خط (يمكنك استبدال هذا بخط افتراضي إذا أردت)
        const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK); // يمكنك تجربة خطوط أخرى

        // 3. كتابة الرقم التسلسلي على الصورة
        image.print(
            font,
            SERIAL_NUMBER_OPTIONS.x,
            SERIAL_NUMBER_OPTIONS.y,
            {
                text: serialNumber,
                alignmentX: SERIAL_NUMBER_OPTIONS.alignmentX,
                alignmentY: SERIAL_NUMBER_OPTIONS.alignmentY,
            },
            image.getWidth(), // تحديد عرض النص لمنع تجاوزه
            image.getHeight()  // تحديد ارتفاع النص (ليس ضروريًا هنا عادةً)
        );

        // 4. تحويل الصورة إلى Buffer لإرسالها كاستجابة
        const imageBuffer = await image.getBufferAsync(Jimp.MIME_JPEG); // يمكنك تغيير MIME حسب نوع الصورة الأصلي

        // 5. إرجاع الصورة كاستجابة
        return {
            statusCode: 200,
            body: imageBuffer.toString('base64'),
            isBase64Encoded: true,
            headers: { 'Content-Type': 'image/jpeg' }, // تأكد من تطابق MIME type مع نوع الصورة
        };

    } catch (error) {
        console.error('خطأ في وظيفة توليد الشهادة الثانية (Jimp):', error);
        return { statusCode: 500, body: `<h1>حدث خطأ أثناء توليد الشهادة</h1><p>${error.message}</p>`, headers: { 'Content-Type': 'text/html; charset=utf-8' } };
    } finally {
        if (client) await client.close();
    }
};