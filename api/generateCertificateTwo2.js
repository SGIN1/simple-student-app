// api/generateCertificateTwo2.js

const { MongoClient, ObjectId } = require('mongodb');
const { ImageResponse } = require('@vercel/og'); // **الجديد: استيراد ImageResponse**
const React = require('react'); // هنحتاجه لـ JSX

const uri = process.env.MONGODB_URI;
const dbName = 'Cluster0';
const collectionName = 'enrolled_students_tbl';

// يمكنك تضمين محتوى تصميم الشهادة هنا مباشرة كـ JSX
// أو استيرادها من ملف آخر (وهو الأفضل لتنظيم الكود)
// ولكن لتبسيط الأمور، سنضع التصميم الأساسي هنا مؤقتًا.

// *** ملاحظة هامة: الخطوط في @vercel/og تعمل بشكل مختلف.
// ستحتاج لتحميل الخطوط من URL مباشر أو استخدام خطوط Google Fonts.
// سنستخدم خط Google Fonts هنا كمثال.
// لو أردت استخدام Hacen Egypt، ستحتاج لاستضافته على Vercel Public directory
// وتستخدم مساره المطلق هنا.
const fontPath = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap'; // مثال لخط عربي من Google Fonts

module.exports = async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const studentId = req.query.id;
    console.log('ID المستلم في وظيفة generateCertificateTwo2:', studentId);

    if (!studentId) {
        return res.status(400).send('<h1>معرف الطالب مطلوب</h1><p>الرابط الذي استخدمته غير صحيح. يرجى التأكد من صحة معرف الطالب.</p>');
    }

    let client;
    let student;

    try {
        if (!process.env.MONGODB_URI) {
            console.error("MONGODB_URI is not set.");
            return res.status(500).send("<h1>Server Error</h1><p>MONGODB_URI is not configured. Please check Vercel environment variables.</p>");
        }

        const host = req.headers.host;
        const protocol = req.headers['x-forwarded-proto'] || 'http';
        // المسار المطلق للصورة الخلفية (يجب أن تكون في مجلد public)
        const absoluteBackgroundImagePath = `${protocol}://${host}/images/full/wwee.jpg`;

        client = new MongoClient(uri);
        await client.connect();
        const database = client.db(dbName);
        const studentsCollection = database.collection(collectionName);

        try {
            student = await studentsCollection.findOne({ _id: new ObjectId(studentId) });
        } catch (objectIdError) {
            console.error("MongoDB ObjectId conversion error for ID:", studentId, objectIdError);
            return res.status(400).send('<h1>Invalid Student ID</h1><p>The link you used is incorrect. Please ensure the student ID is valid.</p>');
        }

        if (!student) {
            console.warn("Student not found, using fallback data for ID:", studentId);
            student = {
                arabic_name: "اسم الطالب التجريبي",
                serial_number: "SN-TEST-123",
                document_serial_number: "DOC-TEST-456",
                plate_number: "ABC-TEST-789",
                car_type: "Sedan Test",
                color: "Red Test"
            };
        } else {
            console.log("Student found:", student.arabic_name);
        }

        // تحضير الخط (fetch)
        // هذا مثال لتحميل خط Cairo من Google Fonts
        // لو عندك Hacen Egypt.ttf في مجلد public/fonts/، ممكن تستخدم:
        // const fontData = await fetch(`${protocol}://${host}/fonts/HacenEgypt.ttf`).then((res) => res.arrayBuffer());
        const fontData = await fetch('https://fonts.gstatic.com/s/cairo/v29/SLXGc1gY6HPz_mkYx_U62B2JpB4.woff2').then((res) => res.arrayBuffer());


        // إنشاء الصورة باستخدام ImageResponse
        return new ImageResponse(
            (
                // هنا تبدأ بكتابة تصميم الشهادة كـ JSX
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: '100%',
                        height: '100%',
                        position: 'relative',
                        backgroundColor: '#fff',
                        fontSize: 36,
                        fontFamily: 'Cairo', // استخدم اسم الخط المسجل هنا
                        // يمكن استخدام صورة خلفية مباشرة هنا في الـ div
                        backgroundImage: `url(${absoluteBackgroundImagePath})`,
                        backgroundSize: '100% 100%',
                        backgroundRepeat: 'no-repeat',
                        color: 'black',
                    }}
                >
                    {/* يمكنك تعديل هذه الـ divs لتتناسب مع تصميم الشهادة الخاص بك */}
                    {/* الأنماط هنا هي Inline styles لأن Vercel OG لا يدعم StyleSheet.create */}
                    <div style={{ position: 'absolute', top: '40%', width: '100%', textAlign: 'center', fontSize: '36px' }}>
                        {student.arabic_name || 'اسم غير معروف'}
                    </div>
                    <div style={{ position: 'absolute', top: '15%', left: '10%', width: '30%', textAlign: 'left', fontSize: '16px', color: 'white' }}>
                        {student.serial_number || 'غير متوفر'}
                    </div>
                    <div style={{ position: 'absolute', top: '55%', width: '100%', textAlign: 'center', fontSize: '16px' }}>
                        {student.document_serial_number || 'غير متوفر'}
                    </div>
                    <div style={{ position: 'absolute', top: '60%', width: '100%', textAlign: 'center', fontSize: '16px' }}>
                        {student.plate_number || 'غير متوفر'}
                    </div>
                    <div style={{ position: 'absolute', top: '65%', width: '100%', textAlign: 'center', fontSize: '16px' }}>
                        {student.car_type || 'غير متوفر'}
                    </div>
                    <div style={{ position: 'absolute', top: '70%', width: '100%', textAlign: 'center', fontSize: '16px' }}>
                        {student.color || 'غير متوفر'}
                    </div>
                </div>
            ),
            {
                width: 1200, // عرض الصورة (يمكنك تعديله)
                height: 630, // ارتفاع الصورة (يمكنك تعديله)
                fonts: [
                    {
                        name: 'Cairo', // اسم الخط الذي ستستخدمه في تصميم الـ JSX
                        data: fontData,
                        style: 'normal',
                        weight: 400,
                    },
                    // لو في أوزان أخرى للخط، أضفها هنا
                    {
                        name: 'Cairo',
                        data: fontData, // استخدم نفس البيانات لو الوزن مش بيفرق كتير في الخط العربي
                        style: 'normal',
                        weight: 700,
                    },
                ],
                // headers: { 'Cache-Control': 'no-cache' } // يمكنك إضافة هيدرات للتحكم في الكاش
            }
        );

    } catch (error) {
        console.error("Unexpected error in Vercel function (OG Image):", error);
        return res.status(500).send(`<h1>An error occurred while generating the certificate image</h1><p>Error details: ${error.message || 'An unexpected server error occurred.'}</p><p>Please check Vercel function logs.</p>`);
    } finally {
        if (client) {
            console.log("Closing MongoDB connection.");
            await client.close();
        }
    }
};