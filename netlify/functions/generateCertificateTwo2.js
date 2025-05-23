const { MongoClient, ObjectId } = require('mongodb');
const puppeteer = require('puppeteer-core'); // مهم: استخدام puppeteer-core

const uri = process.env.MONGODB_URI; // تأكد من إعداد هذا المتغير في Netlify
const dbName = 'Cluster0';
const collectionName = 'enrolled_students_tbl';

// **مسار صورة الشهادة:**
// تأكد من وجود ملف wwee.jpg في مجلد public/images/full/
const CERTIFICATE_IMAGE_PATH = '/images/full/wwee.jpg';

// **مسار الخط:**
// تأكد من وجود ملف arial.ttf في مجلد public/fonts/
const FONT_PATH_RELATIVE = '/fonts/arial.ttf';

// قم بضبط هذه الستايلات لتناسب تصميم شهادتك ومواقع النصوص على الشهادة
// الأبعاد هنا بالبكسل، والقيم 'top' و 'left' تحدد موقع النص من أعلى ويسار الحاوية.
const TEXT_STYLES = {
    STUDENT_NAME: { top: '220px', fontSize: '30px', color: '#000', textAlign: 'center', width: '80%', left: '10%' },
    SERIAL_NUMBER: { top: '260px', left: '60px', fontSize: '18px', color: '#fff', textAlign: 'left', width: '150px' },
    DOCUMENT_SERIAL_NUMBER: { top: '300px', fontSize: '16px', color: '#000', textAlign: 'center', width: '80%', left: '10%' },
    PLATE_NUMBER: { top: '330px', fontSize: '16px', color: '#000', textAlign: 'center', width: '80%', left: '10%' },
    CAR_TYPE: { top: '360px', fontSize: '16px', color: '#000', textAlign: 'center', width: '80%', left: '10%' },
    COLOR: { top: '390px', fontSize: '16px', color: '#000', textAlign: 'center', width: '80%', left: '10%' },
    // يمكنك إضافة المزيد من الحقول هنا وقم بضبط أماكنها وأحجامها وألوانها
};

exports.handler = async (event, context) => {
    // استخراج معرف الطالب من مسار الطلب
    const studentId = event.path.split('/').pop();
    console.log('ID المستلم في وظيفة generateCertificateTwo2:', studentId);

    let client;
    let browser = null; // تعريف متغير المتصفح لضمان إغلاقه دائمًا في finally

    try {
        // التحقق من وجود متغير بيئة MongoDB URI
        if (!uri) {
            throw new Error("MONGODB_URI is not set in environment variables. Please set it in Netlify.");
        }

        // الاتصال بقاعدة بيانات MongoDB
        client = new MongoClient(uri);
        await client.connect();
        const database = client.db(dbName);
        const studentsCollection = database.collection(collectionName);

        let student;
        try {
            // البحث عن الطالب باستخدام المعرف. استخدام try-catch للتعامل مع المعرفات غير الصالحة.
            student = await studentsCollection.findOne({ _id: new ObjectId(studentId) });
        } catch (objectIdError) {
            console.error('خطأ في إنشاء ObjectId (معرف طالب غير صالح):', objectIdError);
            return {
                statusCode: 400,
                body: '<h1>معرف الطالب غير صالح</h1><p>يجب أن يكون المعرف سلسلة نصية صالحة.</p>',
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            };
        }

        // إذا لم يتم العثور على الطالب
        if (!student) {
            return {
                statusCode: 404,
                body: `<h1>لم يتم العثور على طالب بالمعرف: ${studentId}</h1>`,
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            };
        }

        // استخراج بيانات الطالب مع قيم افتراضية لمنع الأخطاء في حال كانت بعض الحقول فارغة
        const serialNumber = student.serial_number || '';
        const studentNameArabic = student.arabic_name || '';
        const documentSerialNumber = student.document_serial_number || '';
        const plateNumber = student.plate_number || '';
        const carType = student.car_type || '';
        const color = student.color || '';

        // **هنا يبدأ جزء Puppeteer **
        // تهيئة المتصفح (Chromium) في بيئة Netlify Functions
        browser = await puppeteer.launch({
            // يحدد هذا المسار أين يجب أن يجد Puppeteer متصفح Chromium في بيئة Netlify.
            // Netlify توفر Chromium في هذا المسار بشكل افتراضي.
            executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
            headless: true, // تشغيل المتصفح في الخلفية بدون واجهة مرئية
            // هذه الوسائط ضرورية لتشغيل Chromium في بيئات الخادم اللامركزية (serverless)
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        const page = await browser.newPage();

        // محتوى HTML للصفحة التي سيلتقط Puppeteer لقطة شاشة لها
        // هذا المحتوى مصمم ليحتوي الشهادة فقط بأبعادها الثابتة والنصوص المدمجة
        const htmlContentForScreenshot = `
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>الشهادة للقطة الشاشة</title>
                <style>
                    /* الأنماط الأساسية للصفحة لضمان الأبعاد الثابتة وعدم التمرير */
                    html, body {
                        width: 624px; /* الأبعاد الأساسية للشهادة */
                        height: 817px;
                        margin: 0;
                        padding: 0;
                        background-color: transparent; /* مهم: اجعل الخلفية شفافة لكي تظهر صورة الخلفية */
                        overflow: hidden; /* إخفاء أي أشرطة تمرير */
                        display: block; /* للتحكم المباشر بالأبعاد */
                    }
                    /* حاوية الشهادة مع صورة الخلفية */
                    .certificate-container {
                        position: relative;
                        width: 624px;
                        height: 817px;
                        background-image: url('${CERTIFICATE_IMAGE_PATH}'); /* مسار صورة الخلفية */
                        background-size: 100% 100%; /* لملء الحاوية بالكامل */
                        background-repeat: no-repeat;
                        background-position: center;
                        background-color: transparent; /* تأكد من الشفافية هنا أيضًا */
                        box-shadow: none; /* لا نريد الظل في الصورة الناتجة */
                    }
                    /* تعريف الخط العربي المخصص */
                    @font-face {
                        font-family: 'ArabicFont';
                        src: url('${FONT_PATH_RELATIVE}') format('truetype');
                    }
                    /* أنماط عامة لطبقات النصوص */
                    .text-overlay {
                        position: absolute;
                        font-family: 'ArabicFont', 'Arial', sans-serif; /* استخدم خطك المخصص أولاً ثم الخطوط الاحتياطية */
                        text-wrap: wrap; /* للسماح بلف النص إذا كان طويلاً */
                        line-height: 1.2; /* لضبط تباعد الأسطر إذا كان النص يلتف */
                    }
                    /* أنماط كل حقل نصي بناءً على إعدادات TEXT_STYLES */
                    #student-name {
                        top: ${TEXT_STYLES.STUDENT_NAME.top};
                        font-size: ${TEXT_STYLES.STUDENT_NAME.fontSize};
                        color: ${TEXT_STYLES.STUDENT_NAME.color};
                        text-align: ${TEXT_STYLES.STUDENT_NAME.textAlign};
                        width: ${TEXT_STYLES.STUDENT_NAME.width};
                        left: ${TEXT_STYLES.STUDENT_NAME.left};
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

        // تعيين محتوى HTML للصفحة وانتظار تحميل جميع موارد الشبكة
        await page.setContent(htmlContentForScreenshot, { waitUntil: 'networkidle0' });

        // تحديد العنصر (حاوية الشهادة) الذي نريد التقاط لقطة شاشة له
        const certificateElement = await page.$('.certificate-container');

        // التقاط لقطة الشاشة كصورة PNG مشفرة بنظام Base64
        const imageBuffer = await certificateElement.screenshot({
            type: 'png', // يمكن تغييرها إلى 'jpeg' إذا كنت تفضل حجماً أصغر على حساب الجودة
            encoding: 'base64', // لإرجاع البيانات كـ Base64 بدلاً من Buffer
        });

        // إرجاع الصورة كاستجابة HTTP
        return {
            statusCode: 200,
            body: imageBuffer,
            isBase64Encoded: true, // مهم: لإخبار Netlify بأن الـ body مشفر بـ Base64
            headers: {
                'Content-Type': 'image/png', // تحديد نوع المحتوى كصورة PNG
                // التحكم في تخزين الشهادة مؤقتاً لضمان الحصول على أحدث نسخة دائماً
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            },
        };
    } catch (error) {
        console.error('خطأ في وظيفة توليد الشهادة:', error);
        // إرجاع رسالة خطأ واضحة للمستخدم
        return {
            statusCode: 500,
            body: `<h1>حدث خطأ أثناء توليد الشهادة</h1><p>${error.message}</p>`,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        };
    } finally {
        // إغلاق اتصال MongoDB والمتصفح في جميع الأحوال (سواء نجحت العملية أو فشلت)
        if (client) await client.close();
        if (browser) await browser.close();
    }
};