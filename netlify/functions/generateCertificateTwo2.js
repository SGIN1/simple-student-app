const { MongoClient, ObjectId } = require('mongodb');
const fetch = require('node-fetch');

const uri = process.env.MONGODB_URI;
const dbName = 'Cluster0';
const collectionName = 'enrolled_students_tbl';

const CONVERTAPI_TOKEN = process.env.CONVERTAPI_TOKEN;

const CERTIFICATE_IMAGE_PUBLIC_URL = `https://ssadsd.kozow.com/images/full/wwee.jpg`; 

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
        if (!CONVERTAPI_TOKEN) {
            console.error("خطأ: CONVERTAPI_TOKEN غير مضبوط.");
            return {
                statusCode: 500,
                body: "<h1>خطأ في الخادم</h1><p>CONVERTAPI_TOKEN غير مضبوط.</p>",
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            };
        }
        if (!uri) {
            console.error("خطأ: MONGODB_URI غير مضبوط.");
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
            console.error('خطأ في إنشاء ObjectId:', objectIdError);
            return {
                statusCode: 400,
                body: '<h1>معرف الطالب غير صالح</h1><p>يجب أن يكون المعرف سلسلة نصية مكونة من 24 حرفًا سداسيًا عشريًا.</p>',
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            };
        }

        if (!student) {
            console.warn(`تحذير: لم يتم العثور على طالب بالمعرف: ${studentId}. استخدام بيانات تجريبية.`);
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
                        margin: 0;
                        padding: 0;
                        font-family: Arial, sans-serif;
                        position: relative;
                        width: 794px; /* A4 width at 96dpi (approx) */
                        height: 1123px; /* A4 height at 96dpi (approx) */
                        overflow: hidden; /* Hide scrollbars if content overflows */
                    }
                    .certificate-container {
                        position: relative;
                        width: 100%;
                        height: 100%;
                        background-image: url('${CERTIFICATE_IMAGE_PUBLIC_URL}');
                        background-size: cover; /* Cover the entire container */
                        background-repeat: no-repeat;
                        background-position: center;
                    }
                    .text-overlay {
                        position: absolute;
                        white-space: nowrap; /* Prevent text from wrapping */
                        overflow: hidden; /* Hide overflow if text is too long */
                        text-overflow: ellipsis; /* Add ellipsis for overflowed text */
                    }
                </style>
            </head>
            <body>
                <div class="certificate-container">
                    <div class="text-overlay" style="top: ${TEXT_STYLES.STUDENT_NAME.top}; left: ${TEXT_STYLES.STUDENT_NAME.left}; width: ${TEXT_STYLES.STUDENT_NAME.width}; text-align: ${TEXT_STYLES.STUDENT_NAME.textAlign}; font-size: ${TEXT_STYLES.STUDENT_NAME.fontSize}; color: ${TEXT_STYLES.STUDENT_NAME.color};">${studentNameArabic}</div>
                    <div class="text-overlay" style="top: ${TEXT_STYLES.SERIAL_NUMBER.top}; left: ${TEXT_STYLES.SERIAL_NUMBER.left}; width: ${TEXT_STYLES.SERIAL_NUMBER.width}; text-align: ${TEXT_STYLES.SERIAL_NUMBER.textAlign}; font-size: ${TEXT_STYLES.SERIAL_NUMBER.fontSize}; color: ${TEXT_STYLES.SERIAL_NUMBER.color};">${serialNumber}</div>
                    <div class="text-overlay" style="top: ${TEXT_STYLES.DOCUMENT_SERIAL_NUMBER.top}; left: ${TEXT_STYLES.DOCUMENT_SERIAL_NUMBER.left}; width: ${TEXT_STYLES.DOCUMENT_SERIAL_NUMBER.width}; text-align: ${TEXT_STYLES.DOCUMENT_SERIAL_NUMBER.textAlign}; font-size: ${TEXT_STYLES.DOCUMENT_SERIAL_NUMBER.fontSize}; color: ${TEXT_STYLES.DOCUMENT_SERIAL_NUMBER.color};">${documentSerialNumber}</div>
                    <div class="text-overlay" style="top: ${TEXT_STYLES.PLATE_NUMBER.top}; left: ${TEXT_STYLES.PLATE_NUMBER.left}; width: ${TEXT_STYLES.PLATE_NUMBER.width}; text-align: ${TEXT_STYLES.PLATE_NUMBER.textAlign}; font-size: ${TEXT_STYLES.PLATE_NUMBER.fontSize}; color: ${TEXT_STYLES.PLATE_NUMBER.color};">${plateNumber}</div>
                    <div class="text-overlay" style="top: ${TEXT_STYLES.CAR_TYPE.top}; left: ${TEXT_STYLES.CAR_TYPE.left}; width: ${TEXT_STYLES.CAR_TYPE.width}; text-align: ${TEXT_STYLES.CAR_TYPE.textAlign}; font-size: ${TEXT_STYLES.CAR_TYPE.fontSize}; color: ${TEXT_STYLES.CAR_TYPE.color};">${carType}</div>
                    <div class="text-overlay" style="top: ${TEXT_STYLES.COLOR.top}; left: ${TEXT_STYLES.COLOR.left}; width: ${TEXT_STYLES.COLOR.width}; text-align: ${TEXT_STYLES.COLOR.textAlign}; font-size: ${TEXT_STYLES.COLOR.fontSize}; color: ${TEXT_STYLES.COLOR.color};">${color}</div>
                </div>
            </body>
            </html>
        `.trim();

        console.log('طول htmlContent قبل التشفير:', htmlContent.length);
        if (htmlContent.length === 0) {
            throw new Error("htmlContent فارغ قبل التشفير.");
        }
        console.log('أول 200 حرف من htmlContent:', htmlContent.substring(0, 200));

        const htmlBase64 = Buffer.from(htmlContent).toString('base64');
        console.log('طول htmlBase64 بعد التشفير:', htmlBase64.length);
        if (htmlBase64.length === 0) {
            throw new Error("htmlBase64 فارغ بعد التشفير.");
        }
        console.log('أول 200 حرف من htmlBase64:', htmlBase64.substring(0, 200));

        const convertApiUrl = `https://v2.convertapi.com/convert/html/to/jpg`; 
        const convertApiRequestBody = {
            Parameters: [
                {
                    Name: "File",
                    FileValue: {
                        Name: "certificate.html", 
                        Data: htmlBase64 
                    }
                }
            ]
        };

        console.log('جسم طلب ConvertAPI (أول 500 حرف):', JSON.stringify(convertApiRequestBody, null, 2).substring(0, 500));

        const response = await fetch(convertApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONVERTAPI_TOKEN}`
            },
            body: JSON.stringify(convertApiRequestBody),
        });

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
        // اطبع الاستجابة الكاملة من ConvertAPI لتتبع الأخطاء بشكل أفضل
        console.log('الاستجابة الكاملة من ConvertAPI:', JSON.stringify(result, null, 2));

        if (!result.Files || result.Files.length === 0 || !result.Files[0].Url) {
            console.error('ConvertAPI لم تُرجع أي ملفات أو رابط URL صالح في الاستجابة.');
            return {
                statusCode: 500,
                body: `<h1>خطأ في توليد الشهادة</h1><p>ConvertAPI لم تُرجع أي ملفات أو رابط URL صالح. تحقق من سجلات Netlify لمزيد من التفاصيل.</p>`,
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            };
        }

        let imageFileUrl = result.Files[0].Url;
        // هنا تم التأكد من أن imageFileUrl موجود قبل محاولة استخدام startsWith
        if (typeof imageFileUrl === 'string' && !imageFileUrl.startsWith('http://') && !imageFileUrl.startsWith('https://')) {
            // إذا كان الرابط نسبيًا، فقم ببناء رابط مطلق
            imageFileUrl = `https://v2.convertapi.com${imageFileUrl}`; 
            console.log('تم بناء رابط مطلق جديد:', imageFileUrl); // لتتبع السجلات
        } else if (typeof imageFileUrl !== 'string') {
             console.error('imageFileUrl ليس سلسلة نصية:', imageFileUrl);
             return {
                statusCode: 500,
                body: `<h1>خطأ في توليد الشهادة</h1><p>رابط الصورة المستلم من ConvertAPI غير صالح.</p>`,
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            };
        }


        const imageResponse = await fetch(imageFileUrl);
        if (!imageResponse.ok) {
            throw new Error(`فشل في جلب الصورة من رابط ConvertAPI: ${imageResponse.statusText}`);
        }
        const imageBuffer = await imageResponse.buffer();

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
        console.error('خطأ في وظيفة توليد الشهادة:', error);
        return {
            statusCode: 500,
            body: `<h1>حدث خطأ أثناء توليد الشهادة</h1><p>${error.message}</p>`,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        };
    } finally {
        if (client) await client.close();
    }
};