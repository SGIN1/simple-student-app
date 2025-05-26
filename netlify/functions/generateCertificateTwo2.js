const { MongoClient, ObjectId } = require('mongodb');
const fetch = require('node-fetch');

// رابط اتصال قاعدة البيانات MongoDB.
// يجب ضبط هذا المتغير (MONGODB_URI) في إعدادات Netlify كمتغير بيئة.
const uri = process.env.MONGODB_URI;
// اسم قاعدة البيانات في MongoDB
const dbName = 'Cluster0';
// اسم المجموعة (Collection) في قاعدة البيانات
const collectionName = 'enrolled_students_tbl';

// مفتاح الوصول لخدمة ScreenshotOne API.
// يجب ضبط هذا المتغير (SCREENSHOTONE_ACCESS_KEY) في إعدادات Netlify كمتغير بيئة.
const SCREENSHOTONE_ACCESS_KEY = process.env.SCREENSHOTONE_ACCESS_KEY; 

// الرابط العام (Public URL) للصورة الخلفية للشهادة.
// تأكد أن هذا الرابط صحيح ويمكن الوصول إليه من الإنترنت.
const CERTIFICATE_IMAGE_PUBLIC_URL = `https://ssadsd.kozow.com/images/full/wwee.jpg`; 

// دالة Netlify الرئيسية التي ستُستدعى عند طلب الرابط.
exports.handler = async (event, context) => {
    // استخراج معرف الطالب من مسار URL (مثلاً: /certificate/SOME_ID_HERE)
    const studentId = event.path.split('/').pop();

    let client; // متغير لتخزين كائن عميل MongoDB
    try {
        // التحقق مما إذا كان مفتاح ScreenshotOne مضبوطًا.
        // إذا لم يكن مضبوطًا، فسيتم إرجاع خطأ 500 للمستخدم.
        if (!SCREENSHOTONE_ACCESS_KEY) { 
            return {
                statusCode: 500,
                body: "<h1>خطأ في الخادم</h1><p>SCREENSHOTONE_ACCESS_KEY غير مضبوط. يرجى التحقق من متغيرات البيئة في Netlify.</p>",
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            };
        }
        // التحقق مما إذا كان URI الخاص بـ MongoDB مضبوطًا.
        if (!uri) {
            return {
                statusCode: 500,
                body: "<h1>خطأ في الخادم</h1><p>MONGODB_URI غير مضبوط.</p>",
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            };
        }

        // إنشاء اتصال بقاعدة بيانات MongoDB.
        client = new MongoClient(uri);
        await client.connect();
        const database = client.db(dbName);
        const studentsCollection = database.collection(collectionName);

        let student; // متغير لتخزين بيانات الطالب
        try {
            // البحث عن الطالب في قاعدة البيانات باستخدام المعرف.
            // نستخدم new ObjectId(studentId) لتحويل الـ ID النصي إلى كائن ObjectId.
            student = await studentsCollection.findOne({ _id: new ObjectId(studentId) });
        } catch (objectIdError) {
            // التعامل مع خطأ إذا كان معرف الطالب غير صالح (ليس 24 حرفًا سداسيًا عشريًا).
            console.error("MongoDB ObjectId conversion error:", objectIdError); // للسجلات
            return {
                statusCode: 400,
                body: '<h1>معرف الطالب غير صالح</h1><p>الرابط الذي استخدمته غير صحيح. يرجى التأكد من صحة معرف الطالب.</p>',
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            };
        }

        // إذا لم يتم العثور على الطالب في قاعدة البيانات، يتم استخدام بيانات تجريبية (Fallback data).
        if (!student) {
            console.log("Student not found, using fallback data for ID:", studentId); // للسجلات
            student = {
                arabic_name: "اسم الطالب التجريبي",
                serial_number: "SN-TEST-123",
                document_serial_number: "DOC-TEST-456",
                plate_number: "ABC-TEST-789",
                car_type: "Sedan Test",
                color: "Red Test"
            };
        } else {
            console.log("Student found:", student.arabic_name); // للسجلات
        }

        // استخراج البيانات من كائن الطالب أو استخدام "N/A" إذا كانت غير موجودة.
        // هذا يضمن أن تكون جميع المتغيرات تحتوي على قيمة نصية.
        const studentNameArabic = student.arabic_name || 'اسم غير معروف';
        const serialNumber = student.serial_number || 'غير متوفر';
        const documentSerialNumber = student.document_serial_number || 'غير متوفر';
        const plateNumber = student.plate_number || 'غير متوفر';
        const carType = student.car_type || 'غير متوفر';
        const color = student.color || 'غير متوفر';

        // بناء محتوى HTML الكامل للشهادة.
        // يتضمن هذا كلاً من الصورة الخلفية والنصوص مع تحديد مواضعها.
        // الأنماط (CSS) هنا هي التي تتحكم في موضع وحجم النصوص على الشهادة.
        let htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Certificate</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 0;
                        position: relative;
                        /* قد تحتاج إلى ضبط أبعاد الجسم بناءً على أبعاد الصورة الخلفية */
                        /* مثلاً، إذا كانت الصورة 1123px عرضًا و 794px ارتفاعًا: */
                        /* width: 1123px; */
                        /* height: 794px; */
                    }
                    .certificate-container {
                        position: relative;
                        width: 1123px; /* تأكد أن هذا يطابق عرض الصورة الخلفية */
                        height: 794px; /* تأكد أن هذا يطابق ارتفاع الصورة الخلفية */
                        background-image: url('${CERTIFICATE_IMAGE_PUBLIC_URL}');
                        background-size: cover; 
                        background-repeat: no-repeat;
                        background-position: center;
                    }
                    .text-overlay {
                        position: absolute; /* مهم جداً لوضع النصوص فوق الصورة */
                        white-space: nowrap; /* يمنع التفاف النص إلى سطر جديد */
                        overflow: hidden; /* يخفي أي نص يتجاوز مساحته */
                        text-overflow: ellipsis; /* يضيف علامة ... إذا كان النص طويلاً جداً */
                        box-sizing: border-box; /* يضمن أن العرض يشمل الحشو والحدود */
                        /* هذه القيم تحتاج إلى ضبط دقيق جدًا لتتناسب مع تصميم قالب الشهادة (wwee.jpg).
                           إذا لم تظهر النصوص بشكل صحيح، هذه هي الأماكن التي يجب تعديلها. */
                    }
                    /* أنماط محددة لكل عنصر نصي لضبط موقعه وشكله على الشهادة */
                    .student-name { top: 220px; left: 10%; width: 80%; text-align: center; font-size: 30px; color: #000; }
                    .serial-number { top: 260px; left: 60px; font-size: 18px; color: #fff; text-align: left; width: 150px; }
                    .document-serial-number { top: 300px; left: 10%; width: 80%; text-align: center; font-size: 16px; color: #000; }
                    .plate-number { top: 330px; left: 10%; width: 80%; text-align: center; font-size: 16px; color: #000; }
                    .car-type { top: 360px; left: 10%; width: 80%; text-align: center; font-size: 16px; color: #000; }
                    .color { top: 390px; left: 10%; width: 80%; text-align: center; font-size: 16px; color: #000; }
                </style>
            </head>
            <body>
                <div class="certificate-container">
                    <div class="text-overlay student-name">${studentNameArabic}</div>
                    <div class="text-overlay serial-number">${serialNumber}</div>
                    <div class="text-overlay document-serial-number">${documentSerialNumber}</div>
                    <div class="text-overlay plate-number">${plateNumber}</div>
                    <div class="text-overlay car-type">${carType}</div>
                    <div class="text-overlay color">${color}</div>
                </div>
            </body>
            </html>
        `.trim();

        // نقطة نهاية API الخاصة بـ ScreenshotOne لتحويل HTML.
        const screenshotOneApiUrl = `https://api.screenshotone.com/html`; 
        // بناء جسم الطلب (Payload) لإرساله إلى ScreenshotOne.
        const screenshotOneRequestBody = {
            access_key: SCREENSHOTONE_ACCESS_KEY, // مفتاح الوصول الخاص بك
            html: htmlContent, // محتوى HTML الذي سيتم تحويله
            format: "jpg", // تنسيق الصورة المطلوب (JPG)
            response_type: "by_format", // طلب استجابة مباشرة بالصورة (صورة ثنائية)
            // يمكن إضافة خيارات إضافية هنا لتحسين اللقطة، مثل:
            // viewport_width: 1123, // عرض المتصفح ليتناسب مع الصورة الخلفية
            // viewport_height: 794, // ارتفاع المتصفح ليتناسب مع الصورة الخلفية
            full_page: true, // التقاط الصفحة بالكامل
            // ignore_host_errors: true, // يمكن تفعيل هذا إذا كنت تريد التقاط صفحة الخطأ 404
        };

        console.log("Sending HTML to ScreenshotOne API..."); // للسجلات

        // إرسال طلب POST إلى ScreenshotOne API.
        const response = await fetch(screenshotOneApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', // نوع المحتوى هو JSON
                'Accept': 'image/jpeg' // نتوقع استجابة بنوع صورة JPEG
            },
            body: JSON.stringify(screenshotOneRequestBody), // تحويل الجسم إلى JSON
        });

        // التحقق مما إذا كانت الاستجابة من ScreenshotOne ناجحة (status code 2xx).
        if (!response.ok) {
            const errorText = await response.text();
            console.error("ScreenshotOne API error response:", response.status, errorText); // للسجلات
            try {
                // محاولة تحليل رسالة الخطأ إذا كانت بصيغة JSON.
                const errorData = JSON.parse(errorText);
                return {
                    statusCode: response.status,
                    body: `<h1>خطأ في توليد الشهادة من ScreenshotOne</h1><p>${JSON.stringify(errorData, null, 2)}</p>`,
                    headers: { 'Content-Type': 'text/html; charset=utf-8' },
                };
            } catch (jsonParseError) {
                // إذا لم تكن رسالة الخطأ بصيغة JSON.
                return {
                    statusCode: response.status,
                    body: `<h1>خطأ في توليد الشهادة من ScreenshotOne</h1><p>استجابة غير متوقعة: ${errorText}</p>`,
                    headers: { 'Content-Type': 'text/html; charset=utf-8' },
                };
            }
        }

        // الحصول على بيانات الصورة المحولة كـ Buffer.
        const imageBuffer = await response.buffer();

        // التحقق مما إذا كانت الصورة الناتجة فارغة.
        if (imageBuffer.length === 0) {
            console.error("ScreenshotOne API returned an empty image buffer."); // للسجلات
            return {
                statusCode: 500,
                body: `<h1>خطأ في توليد الشهادة</h1><p>ScreenshotOne API أرجعت صورة فارغة. قد يكون هناك مشكلة في البيانات المدخلة أو حدود الخطة.</p>`,
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            };
        }

        // إرجاع الصورة كاستجابة HTTP.
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'image/jpeg', // تحديد نوع المحتوى كصورة JPEG
                'Content-Disposition': `inline; filename="certificate.jpg"`, // جعل المتصفح يعرض الصورة مباشرة
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate', // منع التخزين المؤقت
                'Pragma': 'no-cache',
                'Expires': '0',
            },
            body: imageBuffer.toString('base64'), // تحويل الصورة إلى Base64 للإرجاع
            isBase64Encoded: true, // إعلام Netlify بأن الجسم مشفر بـ Base64
        };

    } catch (error) {
        // التعامل مع أي أخطاء غير متوقعة تحدث أثناء تنفيذ الدالة.
        console.error("Unexpected error in Netlify function:", error); // للسجلات
        return {
            statusCode: 500,
            body: `<h1>حدث خطأ أثناء توليد الشهادة</h1><p>تفاصيل الخطأ: ${error.message}</p><p>الرجاء مراجعة سجلات وظيفة Netlify.</p>`,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        };
    } finally {
        // إغلاق اتصال MongoDB في كل الأحوال.
        if (client) {
            console.log("Closing MongoDB connection."); // للسجلات
            await client.close();
        }
    }
};