import { ImageResponse, html } from '@vercel/og';
import { MongoClient, ObjectId } from 'mongodb';

// استيراد كود Base64 للصورة من الملف المنفصل
import { CERTIFICATE_IMAGE_BASE64 } from './assets/certificateImage.js';

// متغيرات MongoDB
const uri = Deno.env.get('MONGODB_URI'); // تأكد أن هذا المتغير موجود في إعدادات Netlify
const dbName = 'Cluster0';
const collectionName = 'enrolled_students_tbl';

// أبعاد صورة الشهادة الخلفية (تم تحديثها بناءً على 978x1280)
const CERTIFICATE_WIDTH = 978;
const CERTIFICATE_HEIGHT = 1280;

// الألوان المستخدمة للنصوص
const TEXT_COLOR_HEX = '#000000'; // أسود
const WHITE_COLOR_HEX = '#FFFFFF'; // أبيض

// تعريف إحداثيات النصوص (سيتطلب منك التعديل الدقيق بناءً على تصميم شهادتك)
// هذه القيم هي إحداثيات (x=left, y=top) ومقاسات الخطوط وألوانها
const TEXT_POSITIONS = {
    STUDENT_NAME: { x: 400, y: 150, fontSize: 48, color: WHITE_COLOR_HEX, alignment: 'center' },
    SERIAL_NUMBER: { x: 90, y: 220, fontSize: 28, color: WHITE_COLOR_HEX, alignment: 'left' },
    DOCUMENT_SERIAL_NUMBER: { x: 400, y: 280, fontSize: 20, color: TEXT_COLOR_HEX, alignment: 'center' },
    PLATE_NUMBER: { x: 400, y: 320, fontSize: 20, color: TEXT_COLOR_HEX, alignment: 'center' },
    CAR_TYPE: { x: 400, y: 360, fontSize: 20, color: TEXT_COLOR_HEX, alignment: 'center' },
    COLOR: { x: 400, y: 400, fontSize: 20, color: TEXT_COLOR_HEX, alignment: 'center' },
};

export default async (request, context) => {
    const url = new URL(request.url);
    const studentId = url.pathname.split('/').pop();
    console.log('ID المستلم في وظيفة generateCertificateTwo2 Edge:', studentId);

    let client;
    let student;

    try {
        if (!uri) {
            throw new Error("MONGODB_URI is not set in environment variables.");
        }
        client = new MongoClient(uri);
        await client.connect();
        const database = client.db(dbName);
        const studentsCollection = database.collection(collectionName);

        try {
            student = await studentsCollection.findOne({ _id: new ObjectId(studentId) });
        } catch (objectIdError) {
            console.error('خطأ في إنشاء ObjectId:', objectIdError);
            return new Response(JSON.stringify({ error: 'معرف الطالب غير صالح' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        if (!student) {
            return new Response(JSON.stringify({ error: `لم يتم العثور على طالب بالمعرف: ${studentId}` }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // جلب بيانات الطالب من قاعدة البيانات
        const serialNumber = student.serial_number;
        const studentNameArabic = student.arabic_name || '';
        const documentSerialNumber = student.document_serial_number || '';
        const plateNumber = student.plate_number || '';
        const carType = student.car_type || '';
        const color = student.color || '';

        // بناء محتوى HTML الذي سيتم تحويله إلى صورة
        const certificateHtmlContent = html`
            <div style="
                position: relative;
                width: ${CERTIFICATE_WIDTH}px;
                height: ${CERTIFICATE_HEIGHT}px;
                background-image: url('${CERTIFICATE_IMAGE_BASE64}');
                background-size: cover;
                background-repeat: no-repeat;
                background-position: center center;
                font-family: 'sans-serif'; /* استخدام خط افتراضي مؤقتًا */
                color: ${TEXT_COLOR_HEX}; /* لون افتراضي للنصوص إذا لم يتم تحديده */
                display: flex; /* لجعل العناصر تتكدس عموديًا */
                flex-direction: column;
                align-items: flex-start; /* محاذاة كل شيء إلى اليسار افتراضيًا */
                justify-content: flex-start; /* محاذاة كل شيء إلى الأعلى افتراضيًا */
            ">
                <div style="
                    position: absolute;
                    top: ${TEXT_POSITIONS.STUDENT_NAME.y}px;
                    ${TEXT_POSITIONS.STUDENT_NAME.alignment === 'center' ? `left: 50%; transform: translateX(-50%); text-align: center;` : `left: ${TEXT_POSITIONS.STUDENT_NAME.x}px; text-align: ${TEXT_POSITIONS.STUDENT_NAME.alignment};`}
                    font-size: ${TEXT_POSITIONS.STUDENT_NAME.fontSize}px;
                    color: ${TEXT_POSITIONS.STUDENT_NAME.color};
                    white-space: nowrap; /* منع النص من الالتفاف */
                    width: auto; /* يجعل الـ div يأخذ عرض النص فقط */
                ">
                    ${studentNameArabic}
                </div>

                <div style="
                    position: absolute;
                    top: ${TEXT_POSITIONS.SERIAL_NUMBER.y}px;
                    ${TEXT_POSITIONS.SERIAL_NUMBER.alignment === 'center' ? `left: 50%; transform: translateX(-50%); text-align: center;` : `left: ${TEXT_POSITIONS.SERIAL_NUMBER.x}px; text-align: ${TEXT_POSITIONS.SERIAL_NUMBER.alignment};`}
                    font-size: ${TEXT_POSITIONS.SERIAL_NUMBER.fontSize}px;
                    color: ${TEXT_POSITIONS.SERIAL_NUMBER.color};
                    white-space: nowrap;
                    width: auto;
                ">
                    ${serialNumber}
                </div>

                <div style="
                    position: absolute;
                    top: ${TEXT_POSITIONS.DOCUMENT_SERIAL_NUMBER.y}px;
                    ${TEXT_POSITIONS.DOCUMENT_SERIAL_NUMBER.alignment === 'center' ? `left: 50%; transform: translateX(-50%); text-align: center;` : `left: ${TEXT_POSITIONS.DOCUMENT_SERIAL_NUMBER.x}px; text-align: ${TEXT_POSITIONS.DOCUMENT_SERIAL_NUMBER.alignment};`}
                    font-size: ${TEXT_POSITIONS.DOCUMENT_SERIAL_NUMBER.fontSize}px;
                    color: ${TEXT_POSITIONS.DOCUMENT_SERIAL_NUMBER.color};
                    white-space: nowrap;
                    width: auto;
                ">
                    ${documentSerialNumber}
                </div>

                <div style="
                    position: absolute;
                    top: ${TEXT_POSITIONS.PLATE_NUMBER.y}px;
                    ${TEXT_POSITIONS.PLATE_NUMBER.alignment === 'center' ? `left: 50%; transform: translateX(-50%); text-align: center;` : `left: ${TEXT_POSITIONS.PLATE_NUMBER.x}px; text-align: ${TEXT_POSITIONS.PLATE_NUMBER.alignment};`}
                    font-size: ${TEXT_POSITIONS.PLATE_NUMBER.fontSize}px;
                    color: ${TEXT_POSITIONS.PLATE_NUMBER.color};
                    white-space: nowrap;
                    width: auto;
                ">
                    رقم اللوحة: ${plateNumber}
                </div>

                <div style="
                    position: absolute;
                    top: ${TEXT_POSITIONS.CAR_TYPE.y}px;
                    ${TEXT_POSITIONS.CAR_TYPE.alignment === 'center' ? `left: 50%; transform: translateX(-50%); text-align: center;` : `left: ${TEXT_POSITIONS.CAR_TYPE.x}px; text-align: ${TEXT_POSITIONS.CAR_TYPE.alignment};`}
                    font-size: ${TEXT_POSITIONS.CAR_TYPE.fontSize}px;
                    color: ${TEXT_POSITIONS.CAR_TYPE.color};
                    white-space: nowrap;
                    width: auto;
                ">
                    نوع السيارة: ${carType}
                </div>

                <div style="
                    position: absolute;
                    top: ${TEXT_POSITIONS.COLOR.y}px;
                    ${TEXT_POSITIONS.COLOR.alignment === 'center' ? `left: 50%; transform: translateX(-50%); text-align: center;` : `left: ${TEXT_POSITIONS.COLOR.x}px; text-align: ${TEXT_POSITIONS.COLOR.alignment};`}
                    font-size: ${TEXT_POSITIONS.COLOR.fontSize}px;
                    color: ${TEXT_POSITIONS.COLOR.color};
                    white-space: nowrap;
                    width: auto;
                ">
                    اللون: ${color}
                </div>
            </div>
        `;

        // توليد الصورة النهائية باستخدام ImageResponse
        const finalImageBuffer = await new ImageResponse(
            certificateHtmlContent,
            {
                width: CERTIFICATE_WIDTH,
                height: CERTIFICATE_HEIGHT,
                // لا نستخدم الخطوط هنا حاليًا
                // fonts: [ ... ],
                headers: {
                    'Content-Type': 'image/jpeg', // تأكد أن النوع صحيح
                },
            }
        ).arrayBuffer();

        // إرجاع الصورة
        return new Response(finalImageBuffer, {
            headers: {
                'Content-Type': 'image/jpeg',
                'Cache-Control': 'public, max-age=3600', // إعدادات التخزين المؤقت
            },
        });

    } catch (error) {
        console.error('خطأ في وظيفة توليد الشهادة Edge:', error);
        return new Response(JSON.stringify({ error: 'حدث خطأ أثناء توليد الشهادة', details: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    } finally {
        if (client) await client.close();
    }
};