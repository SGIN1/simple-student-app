const { MongoClient, ObjectId } = require('mongodb');
const fetch = require('node-fetch');

const uri = process.env.MONGODB_URI;
const dbName = 'Cluster0';
const collectionName = 'enrolled_students_tbl';

// ******************************************************
// ** تأكد من استخدام مفتاح ConvertAPI السري هنا          **
// ** يجب أن يكون هذا متغير بيئة في Netlify               **
// ******************************************************
const CONVERTAPI_SECRET = process.env.CONVERTAPI_SECRET; 

const CERTIFICATE_IMAGE_PUBLIC_URL = `https://ssadsd.kozow.com/images/full/wwee.jpg`; 

exports.handler = async (event, context) => {
    const studentId = event.path.split('/').pop();

    let client;
    try {
        if (!CONVERTAPI_SECRET) {
            return {
                statusCode: 500,
                body: "<h1>خطأ في الخادم</h1><p>CONVERTAPI_SECRET غير مضبوط.</p>",
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            };
        }
        if (!uri) {
            return {
                statusCode: 500,
                body: "<h1>خطأ في الخادم</h1><p>MONGODB_URI غير مضبوط.</p>",
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            };
        }

        client = new MongoClient(uri);
        await client.connect();
        const database = client.db(dbName);
        const studentsCollection = database.collection(collectionName);

        let student;
        try {
            student = await studentsCollection.findOne({ _id: new ObjectId(studentId) });
        } catch (objectIdError) {
            return {
                statusCode: 400,
                body: '<h1>معرف الطالب غير صالح</h1><p>يجب أن يكون المعرف سلسلة نصية مكونة من 24 حرفًا سداسيًا عشريًا.</p>',
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            };
        }

        if (!student) {
            student = {
                arabic_name: "الطالب التجريبي",
                serial_number: "SN-12345",
                document_serial_number: "DOC-67890",
                plate_number: "ABC-123",
                car_type: "Sedan",
                color: "Red"
            };
        }

        const studentNameArabic = student.arabic_name || 'اسم غير معروف';
        const serialNumber = student.serial_number || 'N/A';
        const documentSerialNumber = student.document_serial_number || 'N/A';
        const plateNumber = student.plate_number || 'N/A';
        const carType = student.car_type || 'N/A';
        const color = student.color || 'N/A';

        let htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Certificate</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        position: relative;
                    }
                    .certificate-container {
                        position: relative;
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
                        /* هذه القيم افتراضية. إذا لم تظهر النصوص في المكان الصحيح،
                           فسنحتاج لتعديلها لتعكس مواضعها الفعلية على قالب الصورة. */
                        top: 0px; 
                        left: 0px; 
                        font-size: 30px; 
                        color: #000;
                    }
                    /* يمكن إضافة أنماط محددة لكل نص هنا إذا تطلب الأمر لتحديد موضع كل نص على حدة */
                    .student-name { top: 220px; left: 10%; width: 80%; text-align: center; font-size: 30px; }
                    .serial-number { top: 260px; left: 60px; font-size: 18px; color: #fff; }
                    /* أضف أنماطاً مماثلة لبقية النصوص هنا بناءً على تصميمك */
                </style>
            </head>
            <body>
                <div class="certificate-container">
                    <div class="text-overlay student-name">${studentNameArabic}</div>
                    <div class="text-overlay serial-number">${serialNumber}</div>
                    <div class="text-overlay" style="top: 300px; left: 10%; width: 80%; text-align: center; font-size: 16px; color: #000;">${documentSerialNumber}</div>
                    <div class="text-overlay" style="top: 330px; left: 10%; width: 80%; text-align: center; font-size: 16px; color: #000;">${plateNumber}</div>
                    <div class="text-overlay" style="top: 360px; left: 10%; width: 80%; text-align: center; font-size: 16px; color: #000;">${carType}</div>
                    <div class="text-overlay" style="top: 390px; left: 10%; width: 80%; text-align: center; font-size: 16px; color: #000;">${color}</div>
                </div>
            </body>
            </html>
        `.trim();

        const convertApiUrl = `https://v2.convertapi.com/convert/html/to/jpg?Secret=${CONVERTAPI_SECRET}`;

        const response = await fetch(convertApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/html', // يجب أن يكون نوع المحتوى HTML
                'Accept': 'application/json', // نتوقع استجابة JSON تحتوي على رابط الملف
            },
            body: htmlContent, // إرسال محتوى HTML مباشرة
        });

        if (!response.ok) {
            const errorText = await response.text();
            try {
                const errorData = JSON.parse(errorText);
                return {
                    statusCode: response.status,
                    body: `<h1>خطأ في توليد الشهادة من ConvertAPI</h1><p>${JSON.stringify(errorData, null, 2)}</p>`,
                    headers: { 'Content-Type': 'text/html; charset=utf-8' },
                };
            } catch (jsonParseError) {
                return {
                    statusCode: response.status,
                    body: `<h1>خطأ في توليد الشهادة من ConvertAPI</h1><p>استجابة غير متوقعة: ${errorText}</p>`,
                    headers: { 'Content-Type': 'text/html; charset=utf-8' },
                };
            }
        }

        const result = await response.json();
        if (!result.Files || result.Files.length === 0) {
            return {
                statusCode: 500,
                body: `<h1>خطأ في توليد الشهادة</h1><p>ConvertAPI لم ترجع أي ملفات.</p>`,
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            };
        }

        const fileUrl = result.Files[0].Url;
        const fileResponse = await fetch(fileUrl);

        if (!fileResponse.ok) {
            const errorText = await fileResponse.text();
            return {
                statusCode: fileResponse.status,
                body: `<h1>خطأ في استرجاع الصورة من ConvertAPI</h1><p>${errorText}</p>`,
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            };
        }

        const imageBuffer = await fileResponse.buffer();

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'image/jpeg', 
                'Content-Disposition': `inline; filename="certificate.jpg"`, 
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            },
            body: imageBuffer.toString('base64'),
            isBase64Encoded: true,
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: `<h1>حدث خطأ أثناء توليد الشهادة</h1><p>${error.message}</p>`,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        };
    } finally {
        if (client) await client.close();
    }
};