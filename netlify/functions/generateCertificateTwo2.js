const { MongoClient, ObjectId } = require('mongodb'); // استيراد كلاسات MongoDB للتعامل مع قاعدة البيانات والأوبجكت IDs
const sharp = require('sharp'); // مكتبة لمعالجة الصور، بنستخدمها لإضافة النصوص على قالب الشهادة
const path = require('path'); // وحدة للتعامل مع مسارات الملفات (مش مستخدمة بشكل مباشر هنا لكن ممكن تكون مفيدة في حالات تانية)

// متغيرات لتهيئة الاتصال بقاعدة بيانات MongoDB
const uri = process.env.MONGODB_URI; // رابط الاتصال بقاعدة بيانات MongoDB، بيتم تعيينه كمتغير بيئة في Netlify
const dbName = "Cluster0"; // اسم قاعدة البيانات اللي هنستخدمها
const collectionName = 'enrolled_students_tbl'; // اسم المجموعة (Collection) اللي فيها بيانات الطلاب

// متغيرات تحدد مسار قالب الشهادة والخط المستخدم
const certificateTemplatePath = 'https://github.com/SGIN1/simple-student-app/blob/master/ppp.jpg?raw=true'; // رابط مباشر لقالب الشهادة على GitHub
const fontPath = 'arial.ttf'; // اسم الخط المستخدم (يفترض وجوده في نفس مكان الوظيفة أو مسار محدد)

// تسجيل مسارات القالب والخط في الكونسول للمساعدة في تتبع الأخطاء
console.log('مسار قالب الشهادة (رابط):', certificateTemplatePath);
console.log('مسار الخط:', fontPath);

// الدالة الرئيسية اللي بيتم تشغيلها في كل مرة يتم استدعاء وظيفة Netlify
exports.handler = async (event, context) => {
    // استخراج ID الطالب من parameters الموجودة في URL الطلب
    const studentId = event.queryStringParameters.id;
    console.log('ID المستلم في وظيفة generateCertificateTwo2:', studentId);

    let client; // متغير لتخزين كائن عميل MongoDB

    try {
        // إنشاء عميل MongoDB جديد والاتصال بقاعدة البيانات
        client = new MongoClient(uri);
        await client.connect();
        const database = client.db(dbName); // الحصول على مرجع لقاعدة البيانات المحددة
        const studentsCollection = database.collection(collectionName); // الحصول على مرجع لمجموعة الطلاب

        // البحث عن الطالب في قاعدة البيانات باستخدام الـ ID المستخرج
        const student = await studentsCollection.findOne({ _id: new ObjectId(studentId) });

        // إذا لم يتم العثور على طالب بهذا الـ ID، يتم إرجاع استجابة خطأ 404
        if (!student) {
            return {
                statusCode: 404,
                body: `<h1>لم يتم العثور على طالب بالمعرف: ${studentId}</h1>`,
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            };
        }

        // تسجيل بيانات الطالب المسترجعة في الكونسول للتتبع
        console.log('بيانات الطالب المسترجعة:', student);
        console.log('الرقم التسلسلي:', student.serial_number);
        console.log('رقم الإقامة:', student.residency_number);

        // تحديد حجم الخط ولون النص ومواقع النصوص على الشهادة
        const fontSize = 48;
        const textColor = '#000000'; // أسود
        const serialNumberX = 300;
        const serialNumberY = 400;
        const residencyNumberX = 300;
        const residencyNumberY = 500;

        let imageBuffer; // متغير لتخزين بيانات الصورة الناتجة بعد إضافة النصوص
        try {
            console.log('محاولة تحميل قالب الشهادة من:', certificateTemplatePath);
            const templateResponse = await fetch(certificateTemplatePath); // تحميل قالب الشهادة من الرابط
            if (!templateResponse.ok) {
                throw new Error(`فشل في تحميل قالب الشهادة: ${templateResponse.status} - ${templateResponse.statusText}`);
            }
            const templateBuffer = await templateResponse.arrayBuffer(); // تحويل استجابة القالب إلى ArrayBuffer
            imageBuffer = await sharp(Buffer.from(templateBuffer)) // إنشاء كائن sharp من بيانات القالب
                .composite([ // إضافة نصوص على الصورة
                    {
                        text: { // إعدادات إضافة نص الرقم التسلسلي
                            text: student.serial_number,
                            x: serialNumberX,
                            y: serialNumberY,
                            font: fontPath,
                            size: fontSize,
                            color: textColor,
                            align: 'left',
                        },
                    },
                    {
                        text: { // إعدادات إضافة نص رقم الإقامة
                            text: student.residency_number,
                            x: residencyNumberX,
                            y: residencyNumberY,
                            font: fontPath,
                            size: fontSize,
                            color: textColor,
                            align: 'left',
                        },
                    },
                ])
                .jpeg({ quality: 90 }) // تحويل الصورة إلى JPEG بجودة 90%
                .toBuffer(); // تحويل الصورة المعالجة إلى Buffer

            // إرجاع استجابة ناجحة تحتوي على الصورة بصيغة base64
            return {
                statusCode: 200,
                body: JSON.stringify({ image: imageBuffer.toString('base64') }),
                headers: {
                    'Content-Type': 'application/json',
                },
            };

        } catch (error) {
            // معالجة أي خطأ يحدث أثناء العملية وتسجيله وإرجاع استجابة خطأ 500
            console.error('خطأ في وظيفة توليد الشهادة الثانية:', error);
            return {
                statusCode: 500,
                body: `<h1>حدث خطأ أثناء توليد الشهادة الثانية</h1><p>${error.message}</p>`,
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            };
        } finally {
            // إغلاق اتصال عميل MongoDB في النهاية، سواء نجحت العملية أو فشلت
            if (client) {
                await client.close();
            }
        }
    }
};