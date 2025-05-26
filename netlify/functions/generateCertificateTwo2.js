const { MongoClient, ObjectId } = require('mongodb');
const fetch = require('node-fetch');

// ... (بقية المتغيرات والثوابت كما هي) ...

exports.handler = async (event, context) => {
    // ... (جزء استخراج studentId وتهيئة MongoDB وتحميل بيانات الطالب) ...

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
                    position: absolute;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    box-sizing: border-box;
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
                <div class="text-overlay document-serial_number">${documentSerialNumber}</div>
                <div class="text-overlay plate-number">${plateNumber}</div>
                <div class="text-overlay car-type">${carType}</div>
                <div class="text-overlay color">${color}</div>
            </div>
        </body>
        </html>
    `.trim();

    // نقطة نهاية API الخاصة بـ ScreenshotOne لتحويل HTML.
    // ** هذا هو الرابط الصحيح لتحويل HTML مباشرةً **
    const screenshotOneApiUrl = `https://api.screenshotone.com/html`; // تأكد من استخدام هذا الرابط

    // بناء جسم الطلب (Payload) لإرساله إلى ScreenshotOne.
    const screenshotOneRequestBody = {
        access_key: SCREENSHOTONE_ACCESS_KEY,
        html: htmlContent, // هنا نرسل محتوى HTML مباشرةً
        format: "jpeg",
        response_type: "by_format", // نعود لطلب الصورة مباشرةً إذا كان هذا الـ endpoint يدعمه
        viewport_width: 1123,
        viewport_height: 794,
        full_page: true,
        // debug: true, // قم بتفعيل هذا للحصول على معلومات تصحيح الأخطاء
    };

    console.log("Sending HTML to ScreenshotOne API...");

    const response = await fetch(screenshotOneApiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'image/jpeg' // نتوقع صورة JPEG مباشرةً
        },
        body: JSON.stringify(screenshotOneRequestBody),
    });

    // ... (بقية معالجة الاستجابة والتعامل مع الأخطاء وإرجاع الصورة) ...
};