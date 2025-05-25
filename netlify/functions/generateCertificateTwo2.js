// netlify/functions/generateCertificateTwo2.js

const { MongoClient, ObjectId } = require('mongodb'); // تظل موجودة إذا كنت تخطط لاستخدام MongoDB
const fetch = require('node-fetch'); // تم التأكد الآن من تثبيتها!

const uri = process.env.MONGODB_URI; // لـ MongoDB، احتفظ بها كمتغير بيئي
const dbName = 'Cluster0'; // اسم قاعدة البيانات
const collectionName = 'enrolled_students_tbl'; // اسم المجموعة

// مفتاح ConvertAPI السري. يجب تعيينه كمتغير بيئي في Netlify.
// لا تضع المفتاح الحقيقي هنا مباشرة في بيئة الإنتاج لأسباب أمنية.
const CONVERTAPI_SECRET = process.env.CONVERTAPI_SECRET; 

// رابط الصورة العلني للشهادة على موقعك في Netlify.
// تأكد 100% أن هذا الرابط صحيح وأن الصورة متاحة للعامة.
const CERTIFICATE_IMAGE_PUBLIC_URL = `https://ssadsd.kozow.com/images/full/wwee.jpg`;

exports.handler = async (event, context) => {
    const studentId = event.path.split('/').pop();
    console.log('ID المستلم في وظيفة generateCertificateTwo2:', studentId);

    let client; // لتعريف اتصال MongoDB، لا يستخدم حاليا
    try {
        // التحقق من مفتاح ConvertAPI السري
        if (!CONVERTAPI_SECRET) {
            throw new Error("CONVERTAPI_SECRET is not set in environment variables. Please set it in Netlify.");
        }
        
        // إذا كنت ستستخدم MongoDB، ستحتاج لإلغاء التعليق على الأسطر التالية:
        /*
        if (!uri) {
            throw new Error("MONGODB_URI is not set in environment variables. Please set it in Netlify.");
        }
        client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        const database = client.db(dbName);
        const collection = database.collection(collectionName);
        const student = await collection.findOne({ _id: new ObjectId(studentId) });
        if (!student) {
            return {
                statusCode: 404,
                body: `<h1>الطالب ${studentId} غير موجود.</h1>`,
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            };
        }
        const studentName = student.name || 'الاسم غير متوفر'; // افترض وجود حقل 'name'
        */

        // بناء محتوى HTML للشهادة
        // يمكنك إضافة متغيرات ديناميكية هنا مثل ${studentName}
        const htmlContent = `
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>الشهادة ${studentId}</title>
                <style>
                    body { margin: 0; padding: 0; }
                    img { width: 100%; height: auto; display: block; }
                    /* يمكنك إضافة CSS لتحديد موضع اسم الطالب على الصورة إذا كان ديناميكياً */
                    /* .student-name {
                        position: absolute;
                        top: 50%; // مثال: عدّل لتحديد الموضع بدقة
                        left: 50%; // مثال: عدّل لتحديد الموضع بدقة
                        transform: translate(-50%, -50%);
                        color: black;
                        font-size: 3em;
                        font-weight: bold;
                        text-align: center;
                        width: 80%; // لمنع تجاوز الاسم لحدود معينة
                    } */
                </style>
            </head>
            <body>
                <img src="${CERTIFICATE_IMAGE_PUBLIC_URL}" alt="الشهادة">
                </body>
            </html>
        `.trim();

        // تحويل محتوى HTML إلى Base64
        const htmlBase64 = Buffer.from(htmlContent).toString('base64');

        // إعداد طلب ConvertAPI لتحويل HTML إلى JPG باستخدام Base64
        const convertApiUrl = `https://v2.convertapi.com/convert/html/to/jpg`;
        const convertApiRequestBody = {
            Secret: CONVERTAPI_SECRET,
            Parameters: [
                {
                    Name: "File",
                    FileValue: htmlBase64, // إرسال HTML كـ Base64
                    FileName: "certificate.html"
                }
            ]
        };

        const response = await fetch(convertApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', // نوع المحتوى هو JSON
            },
            body: JSON.stringify(convertApiRequestBody), // إرسال الجسم كـ JSON
        });

        // التعامل مع أخطاء ConvertAPI
        if (!response.ok) {
            const errorText = await response.text();
            console.error('خطأ من ConvertAPI (الاستجابة النصية):', errorText);
            try {
                const errorData = JSON.parse(errorText);
                console.error('خطأ من ConvertAPI (JSON المحلل):', errorData);
                return {
                    statusCode: response.status,
                    body: `<h1>خطأ في توليد الشهادة من ConvertAPI</h1><p>${JSON.stringify(errorData, null, 2)}</p>`,
                    headers: { 'Content-Type': 'text/html; charset=utf-8' },
                };
            } catch (jsonParseError) {
                console.error('فشل تحليل JSON من استجابة ConvertAPI:', jsonParseError);
                return {
                    statusCode: response.status,
                    body: `<h1>خطأ في توليد الشهادة من ConvertAPI</h1><p>استجابة غير متوقعة: ${errorText}</p>`,
                    headers: { 'Content-Type': 'text/html; charset=utf-8' },
                };
            }
        }

        const result = await response.json();
        // التأكد من أن ConvertAPI أعاد ملفاً
        if (!result.Files || result.Files.length === 0) {
            throw new Error('ConvertAPI did not return any files in the response.');
        }
        const imageFileUrl = result.Files[0].Url; // رابط الصورة الناتجة من ConvertAPI

        // جلب الصورة الناتجة من ConvertAPI
        const imageResponse = await fetch(imageFileUrl);
        if (!imageResponse.ok) {
            throw new Error(`Failed to fetch image from ConvertAPI URL: ${imageResponse.statusText}`);
        }
        const imageBuffer = await imageResponse.buffer();

        // إرجاع الصورة كاستجابة مباشرة للمتصفح
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'image/jpeg', // يخبر المتصفح أن المحتوى هو صورة JPEG
                'Content-Disposition': `inline; filename="certificate_${studentId}.jpg"`, // 'inline' للعرض المباشر
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate', // رؤوس لمنع التخزين المؤقت
                'Pragma': 'no-cache',
                'Expires': '0',
            },
            body: imageBuffer.toString('base64'), // يجب أن يكون body نصًا Base64
            isBase64Encoded: true, // مهم جداً لـ Netlify Functions
        };

    } catch (error) {
        console.error('خطأ في وظيفة توليد الشهادة:', error);
        return {
            statusCode: 500,
            body: `<h1>حدث خطأ أثناء توليد الشهادة</h1><p>${error.message}</p>`,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        };
    } finally {
        if (client) await client.close(); // إغلاق اتصال MongoDB إذا كان مفتوحاً
    }
};