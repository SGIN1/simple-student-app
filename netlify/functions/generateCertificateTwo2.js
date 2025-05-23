const { MongoClient, ObjectId } = require('mongodb');
const puppeteer = require('puppeteer'); // تم تحديث الاستيراد إلى puppeteer الرسمي

const uri = process.env.MONGODB_URI;
const dbName = 'Cluster0';
const collectionName = 'enrolled_students_tbl';

// **مسار صورة الشهادة:**
// تأكد من وجود ملف wwee.jpg في مجلد public/images/full/
const CERTIFICATE_IMAGE_PATH = '/images/full/wwee.jpg';

// **مسار الخط:**
// تأكد من وجود ملف arial.ttf في مجلد public/fonts/
// هذا المسار افتراضي، قد تحتاج لضبطه إذا كان لديك إعدادات مختلفة للخطوط
const FONT_PATH_RELATIVE = '/fonts/arial.ttf';

// قم بضبط هذه الستايلات لتناسب تصميم شهادتك ومواقع النصوص على الشهادة
const TEXT_STYLES = {
    STUDENT_NAME: { top: '220px', fontSize: '30px', color: '#000', textAlign: 'center', width: '80%', left: '10%' },
    SERIAL_NUMBER: { top: '260px', left: '60px', fontSize: '18px', color: '#fff', textAlign: 'left', width: '150px' },
    DOCUMENT_SERIAL_NUMBER: { top: '300px', fontSize: '16px', color: '#000', textAlign: 'center', width: '80%', left: '10%' },
    PLATE_NUMBER: { top: '330px', fontSize: '16px', color: '#000', textAlign: 'center', width: '80%', left: '10%' },
    CAR_TYPE: { top: '360px', fontSize: '16px', color: '#000', textAlign: 'center', width: '80%', left: '10%' },
    COLOR: { top: '390px', fontSize: '16px', color: '#000', textAlign: 'center', width: '80%', left: '10%' },
    // أضف المزيد من الحقول هنا وقم بضبط أماكنها وأحجامها وألوانها
};

exports.handler = async (event, context) => {
    const studentId = event.path.split('/').pop();
    console.log('ID المستلم في وظيفة generateCertificateTwo2:', studentId);

    let client;
    let browser = null; // تعريف متغير المتصفح لضمان إغلاقه في finally

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
            // استخدام try-catch هنا للتعامل مع معرّفات MongoDB غير الصالحة
            student = await studentsCollection.findOne({ _id: new ObjectId(studentId) });
        } catch (objectIdError) {
            console.error('خطأ في إنشاء ObjectId (معرف طالب غير صالح):', objectIdError);
            return {
                statusCode: 400,
                body: '<h1>معرف الطالب غير صالح</h1><p>يجب أن يكون المعرف سلسلة نصية صالحة.</p>',
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

        // استخراج بيانات الطالب مع قيم افتراضية لمنع الأخطاء
        const serialNumber = student.serial_number || '';
        const studentNameArabic = student.arabic_name || '';
        const documentSerialNumber = student.document_serial_number || '';
        const plateNumber = student.plate_number || '';
        const carType = student.car_type || '';
        const color = student.color || '';

        // **هنا يبدأ جزء Puppeteer **
        // تهيئة المتصفح (Chromium) في بيئة Netlify Functions
        browser = await puppeteer.launch({
            headless: true, // أو 'new' للإصدارات الأحدث من Puppeteer (إذا لم يعمل true)
            args: ['--no-sandbox', '--disable-setuid-sandbox'], // ضروري لتشغيل Chromium في بيئات serverless
        });
        const page = await browser.newPage();

        // **محتوى HTML للصفحة التي سيلتقط Puppeteer لقطة شاشة لها**
        // هذا المحتوى مصمم ليحتوي الشهادة فقط بأبعادها الثابتة
        const htmlContentForScreenshot = `
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>الشهادة للقطة الشاشة</title>
                <style>
                    /*
                    هذه الأنماط هي لصفحة Puppeteer، وهي التي تضمن الأبعاد الثابتة ودمج النصوص.
                    لا نحتاج هنا للتوسيط بالـ Flexbox لأننا سنلتقط صورة للعنصر نفسه.
                    */
                    html, body {
                        width: 624px; /* الأبعاد الأساسية للشهادة */
                        height: 817px;
                        margin: 0;
                        padding: 0;
                        background-color: transparent; /* مهم: اجعل الخلفية شفافة لكي تظهر صورة الخلفية */
                        overflow: hidden; /* إخفاء أي أشرطة تمرير */
                        display: block; /* للتحكم المباشر بالأبعاد */
                    }
                    .certificate-container {
                        position: relative;
                        width: 624px;
                        height: 817px;
                        background-image: url('${CERTIFICATE_IMAGE_PATH}');
                        background-size: 100% 100%; /* لملء الحاوية بالكامل */
                        background-repeat: no-repeat;
                        background-position: center;
                        background-color: transparent; /* تأكد من الشفافية هنا أيضًا */
                        box-shadow: none; /* لا نريد الظل في الصورة الناتجة */
                    }
                    /* تعريف الخط العربي */
                    @font-face {
                        font-family: 'ArabicFont';
                        src: url('${FONT_PATH_RELATIVE}') format('truetype');
                    }
                    .text-overlay {
                        position: absolute;
                        font-family: 'ArabicFont', 'Arial', sans-serif; /* استخدم خطك المخصص أولاً */
                        text-wrap: wrap; /* للسماح بلف النص إذا كان طويلاً */
                        line-height: 1.2; /* لضبط تباعد الأسطر إذا كان النص يلتف */
                    }
                    /* أنماط كل حقل نصي حسب TEXT_STYLES */
                    #student-name {
                        top: ${TEXT_STYLES.STUDENT_NAME.top};
                        font-size: ${TEXT_STYLES.STUDENT_NAME.fontSize};
                        color: ${TEXT_STYLES.STUDENT_NAME.color};
                        text-align: ${TEXT_STYLES.STUDENT_NAME.textAlign};
                        width: ${TEXT_STYLES.STUDENT_NAME.width};
                        left: ${TEXT_STYLES.STUDENT_NAME.left};
                        /* هذا التحويل (transform) قد يحتاج لضبط دقيق حسب التوسيط الذي تريده */
                        /* For text-align: center, you might use: left: 50%; transform: translateX(-50%); */
                    }
                    #serial-number {
                        top: ${TEXT_STYLES.SERIAL_NUMBER.top};
                        left: ${TEXT_STYLES.SERIAL_NUMBER.left};
                        font-size: ${TEXT_STYLES.SERIAL_NUMBER.fontSize};
                        color: ${TEXT_STYLES.SERIAL_NUMBER.color};
                        text-align: ${TEXT_STYLES.SERIAL_NUMBER.textAlign};
                        width: ${TEXT_STYLES.SERIAL_NUMBER.width};
                    }
                    #document-serial-number {
                        top: ${TEXT_STYLES.DOCUMENT_SERIAL_NUMBER.top};
                        font-size: ${TEXT_STYLES.DOCUMENT_SERIAL_NUMBER.fontSize};
                        color: ${TEXT_STYLES.DOCUMENT_SERIAL_NUMBER.color};
                        text-align: ${TEXT_STYLES.DOCUMENT_SERIAL_NUMBER.textAlign};
                        width: ${TEXT_STYLES.DOCUMENT_SERIAL_NUMBER.width};
                        left: ${TEXT_STYLES.DOCUMENT_SERIAL_NUMBER.left};
                    }
                    #plate-number {
                        top: ${TEXT_STYLES.PLATE_NUMBER.top};
                        font-size: ${TEXT_STYLES.PLATE_NUMBER.fontSize};
                        color: ${TEXT_STYLES.PLATE_NUMBER.color};
                        text-align: ${TEXT_STYLES.PLATE_NUMBER.textAlign};
                        width: ${TEXT_STYLES.PLATE_NUMBER.width};
                        left: ${TEXT_STYLES.PLATE_NUMBER.left};
                    }
                    #car-type {
                        top: ${TEXT_STYLES.CAR_TYPE.top};
                        font-size: ${TEXT_STYLES.CAR_TYPE.fontSize};
                        color: ${TEXT_STYLES.CAR_TYPE.color};
                        text-align: ${TEXT_STYLES.CAR_TYPE.textAlign};
                        width: ${TEXT_STYLES.CAR_TYPE.width};
                        left: ${TEXT_STYLES.CAR_TYPE.left};
                    }
                    #color {
                        top: ${TEXT_STYLES.COLOR.top};
                        font-size: ${TEXT_STYLES.COLOR.fontSize};
                        color: ${TEXT_STYLES.COLOR.color};
                        text-align: ${TEXT_STYLES.COLOR.textAlign};
                        width: ${TEXT_STYLES.COLOR.width};
                        left: ${TEXT_STYLES.COLOR.left};
                    }
                </style>
            </head>
            <body>
                <div class="certificate-container">
                    <div id="student-name" class="text-overlay">${studentNameArabic}</div>
                    <div id="serial-number" class="text-overlay">${serialNumber}</div>
                    <div id="document-serial-number" class="text-overlay">${documentSerialNumber}</div>
                    <div id="plate-number" class="text-overlay">رقم اللوحة: ${plateNumber}</div>
                    <div id="car-type" class="text-overlay">نوع السيارة: ${carType}</div>
                    <div id="color" class="text-overlay">اللون: ${color}</div>
                </div>
            </body>
            </html>
        `;

        // تعيين محتوى الصفحة لـ Puppeteer
        await page.setContent(htmlContentForScreenshot, { waitUntil: 'networkidle0' });

        // تحديد العنصر الذي نريد التقاط صورته (الشهادة نفسها)
        const certificateElement = await page.$('.certificate-container');

        // التقاط لقطة الشاشة
        const imageBuffer = await certificateElement.screenshot({
            type: 'png', // يمكن تغييرها إلى 'jpeg' إذا كنت تفضل حجماً أصغر على حساب الجودة
            encoding: 'base64', // لإرجاع البيانات كـ Base64
            // لا حاجة لـ clip هنا لأننا نلتقط صورة للعنصر بأكمله الذي له أبعاد ثابتة
        });

        // إرجاع الصورة كاستجابة HTTP
        return {
            statusCode: 200,
            body: imageBuffer,
            isBase64Encoded: true, // مهم لإخبار Netlify بأن الـ body مشفر بـ Base64
            headers: {
                'Content-Type': 'image/png', // نوع المحتوى هو صورة PNG
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate', // لضمان عدم تخزين الشهادة مؤقتاً
                'Pragma': 'no-cache',
                'Expires': '0',
            },
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
        if (browser) await browser.close(); // تأكد من إغلاق المتصفح بعد كل استخدام
    }
};