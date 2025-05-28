// api/generateCertificateTwo2.js
const { MongoClient, ObjectId } = require('mongodb');
const fetch = require('node-fetch');

const uri = process.env.MONGODB_URI;
const dbName = 'Cluster0';
const collectionName = 'enrolled_students_tbl';

// الرابط العام (Public URL) للصورة الخلفية للشهادة.
// سنقوم ببناء هذا المسار ديناميكيا باستخدام عنوان الـ Host.
// const CERTIFICATE_IMAGE_PATH = '/images/full/wwee.jpg'; // هذا سيكون مسارًا نسبيًا فقط، سنبني الرابط الكامل في الدالة

module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const studentId = req.query.id;
    console.log('ID المستلم في وظيفة generateCertificateTwo2:', studentId);

    if (!studentId) {
        return res.status(400).send('<h1>معرف الطالب مطلوب</h1><p>الرابط الذي استخدمته غير صحيح. يرجى التأكد من صحة معرف الطالب.</p>');
    }

    let client;

    try {
        if (!process.env.MONGODB_URI) {
            console.error("MONGODB_URI is not set.");
            return res.status(500).send("<h1>Server Error</h1><p>MONGODB_URI is not configured. Please check Vercel environment variables.</p>");
        }

        const SCREENSHOTONE_ACCESS_KEY = process.env.SCREENSHOTONE_ACCESS_KEY;
        if (!SCREENSHOTONE_ACCESS_KEY) {
            console.warn("SCREENSHOTONE_ACCESS_KEY is not set. Screenshot generation will be skipped.");
            return res.status(501).send("<h1>Certificate Generation Unavailable</h1><p>Image certificate generation is temporarily disabled (SCREENSHOTONE_ACCESS_KEY is not set). Please contact the administrator.</p>");
        }

        // ***** الجزء المُضاف أو المُعدّل هنا لبناء المسار المطلق للصورة *****
        const host = req.headers.host; // سيحتوي على 'your-app-name.vercel.app'
        const protocol = req.headers['x-forwarded-proto'] || 'http'; // للحصول على 'http' أو 'https'
        const absoluteImagePath = `${protocol}://${host}/images/full/wwee.jpg`;
        console.log("Absolute image path for certificate:", absoluteImagePath);
        // *******************************************************************

        client = new MongoClient(uri);
        await client.connect();
        const database = client.db(dbName);
        const studentsCollection = database.collection(collectionName);

        let student;
        try {
            student = await studentsCollection.findOne({ _id: new ObjectId(studentId) });
        } catch (objectIdError) {
            console.error("MongoDB ObjectId conversion error for ID:", studentId, objectIdError);
            return res.status(400).send('<h1>Invalid Student ID</h1><p>The link you used is incorrect. Please ensure the student ID is valid.</p>');
        }

        if (!student) {
            console.warn("Student not found, using fallback data for ID:", studentId);
            student = {
                arabic_name: "اسم الطالب التجريبي", // تأكد من وجود هذا الحقل في قاعدة بياناتك
                serial_number: "SN-TEST-123",
                document_serial_number: "DOC-TEST-456",
                plate_number: "ABC-TEST-789",
                car_type: "Sedan Test",
                color: "Red Test"
            };
        } else {
            // ملاحظة: تأكد أن حقل اسم الطالب في قاعدة البيانات هو 'arabic_name'
            console.log("Student found:", student.arabic_name);
        }

        const studentNameArabic = student.arabic_name || 'اسم غير معروف';
        const serialNumber = student.serial_number || 'غير متوفر';
        const documentSerialNumber = student.document_serial_number || 'غير متوفر';
        const plateNumber = student.plate_number || 'غير متوفر';
        const carType = student.car_type || 'غير متوفر';
        const color = student.color || 'غير متوفر';

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
                        width: 978px;
                        height: 1280px;
                        background-image: url('${absoluteImagePath}'); /* هنا تم استخدام المسار المطلق */
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
                    /* ستحتاج إلى تعديل هذه القيم (top, left, width, font-size) لتتناسب مع الأبعاد الجديدة للشهادة (978x1280) */
                    /* القيم الحالية كانت مصممة لـ 1123x794، ستبدو غير مناسبة وقد تحتاج إلى إعادة ضبطها يدوياً */
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

        const screenshotOneApiUrl = `https://api.screenshotone.com/take`;

        const screenshotOneRequestBody = {
            access_key: SCREENSHOTONE_ACCESS_KEY,
            html: htmlContent,
            format: "jpeg",
            response_type: "by_format",
            viewport_width: 978,
            viewport_height: 1280,
            full_page: true, // تأكد أن هذا الخيار لا يسبب قص الصورة إذا كان الـ viewport_height لا يكفي
        };

        console.log("Sending HTML to ScreenshotOne API...");

        const responseFromScreenshotOne = await fetch(screenshotOneApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'image/jpeg'
            },
            body: JSON.stringify(screenshotOneRequestBody),
        });

        if (!responseFromScreenshotOne.ok) {
            const errorText = await responseFromScreenshotOne.text();
            console.error("ScreenshotOne API error response:", responseFromScreenshotOne.status, errorText);
            try {
                const errorData = JSON.parse(errorText);
                return res.status(responseFromScreenshotOne.status).send(`<h1>Error generating certificate from ScreenshotOne</h1><p>Error details: ${JSON.stringify(errorData, null, 2)}</p>`);
            } catch (jsonParseError) {
                return res.status(responseFromScreenshotOne.status).send(`<h1>Error generating certificate from ScreenshotOne</h1><p>Unexpected response: ${errorText}</p>`);
            }
        }

        const imageBuffer = await responseFromScreenshotOne.buffer();

        if (imageBuffer.length === 0) {
            console.error("ScreenshotOne API returned an empty image buffer.");
            return res.status(500).send(`<h1>Error generating certificate</h1><p>ScreenshotOne API returned an empty image. There might be an issue with input data or plan limits.</p>`);
        }

        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Content-Disposition', `inline; filename="certificate.jpg"`);
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        return res.status(200).send(imageBuffer);

    } catch (error) {
        console.error("Unexpected error in Vercel function:", error);
        return res.status(500).send(`<h1>An error occurred while generating the certificate</h1><p>Error details: ${error.message || 'حدث خطأ غير متوقع في الخادم.'}</p><p>Please check Vercel function logs.</p>`);
    } finally {
        if (client) {
            console.log("Closing MongoDB connection.");
            await client.close();
        }
    }
};