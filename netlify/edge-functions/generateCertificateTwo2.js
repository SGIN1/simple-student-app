import { ImageResponse } from '@vercel/og';
import sharp from 'sharp'; // استخدام sharp لتركيب الصورة النهائية
import { MongoClient, ObjectId } from 'mongodb'; // MongoDB سيظل كما هو
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises'; // لقراءة ملف الخط

// تحديد المسار الصحيح للملفات
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// مسار ملف الخطوط داخل مجلد Edge Function
const ARABIC_FONT_PATH = join(__dirname, 'fonts', 'arial.ttf');

// مسار صورة الشهادة الأساسية
// بما أن Edge Functions لا ترى مجلد public مباشرة بنفس طريقة Functions العادية،
// سنحتاج إلى تحميلها من مسارها المطلق إذا كانت منشورة في public
// أو الأفضل، ضعها بجانب الوظيفة أو قم بتحميلها من URL إذا كانت متاحة علناً
// لتسهيل الأمور الآن، سأفترض أنها ستكون داخل مجلد edge-functions/images
// ********* انتبه هنا! *********
// إذا كانت صورة wwee.jpg ستبقى في public/images_temp
// فسنحتاج إلى طريقة مختلفة لتحميلها في Edge Function.
// حالياً، لأغراض الاختبار، سأضعها في مسار نسبي داخل edge-functions.
// الحل الأفضل هو تحميلها من URL العام بعد النشر، أو تضمينها كـ base64 إذا كانت صغيرة.
// لكن بما أن sharp يحتاج لـ path، سنضعها مؤقتاً هنا.
const CERTIFICATE_IMAGE_PATH = join(__dirname, 'images', 'wwee.jpg'); // يجب أن يكون لديك مجلد images داخل edge-functions وبه الصورة

// تأكد من أنك قمت بتضمين صورة wwee.jpg في مسار:
// C:\wamp64\www\simple-student-app\netlify\edge-functions\images\wwee.jpg
// (قم بإنشاء مجلد images وانسخ الصورة إليه)


// متغيرات MongoDB
const uri = Deno.env.get('MONGODB_URI'); // Edge Functions تستخدم Deno.env.get
const dbName = 'Cluster0';
const collectionName = 'enrolled_students_tbl';


const TEXT_COLOR_HEX = '#000000'; // أسود
const WHITE_COLOR_HEX = '#FFFFFF'; // أبيض

// تعريف إحداثيات النصوص (سيتطلب الأمر بعض التعديل الدقيق بناءً على حجم الخط وتصميمه)
// هذه القيم تقريبية وقد تحتاج إلى تعديل بناءً على الخط وحجم الصورة
// تذكر: ImageResponse يستخدم نظام إحداثيات مختلف قليلاً عن sharp
// 'top' و 'left' هنا هي إحداثيات CSS عادية.
const TEXT_POSITIONS = {
    STUDENT_NAME: { x: 300, y: 150, fontSize: 48, color: WHITE_COLOR_HEX, alignment: 'center' },
    SERIAL_NUMBER: { x: 90, y: 220, fontSize: 28, color: WHITE_COLOR_HEX, alignment: 'center' },
    DOCUMENT_SERIAL_NUMBER: { x: 300, y: 280, fontSize: 20, color: TEXT_COLOR_HEX, alignment: 'center' },
    PLATE_NUMBER: { x: 300, y: 320, fontSize: 20, color: TEXT_COLOR_HEX, alignment: 'center' },
    CAR_TYPE: { x: 300, y: 360, fontSize: 20, color: TEXT_COLOR_HEX, alignment: 'center' },
    COLOR: { x: 300, y: 400, fontSize: 20, color: TEXT_COLOR_HEX, alignment: 'center' },
};


export default async (request, context) => {
    const url = new URL(request.url);
    const studentId = url.pathname.split('/').pop();
    console.log('ID المستلم في وظيفة generateCertificateTwo2 Edge:', studentId);

    let client;
    let student;

    try {
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

        const serialNumber = student.serial_number;
        const studentNameArabic = student.arabic_name || '';
        const documentSerialNumber = student.document_serial_number || '';
        const plateNumber = student.plate_number || '';
        const carType = student.car_type || '';
        const color = student.color || '';

        // 1. قراءة الخط
        const arabicFontData = await fs.readFile(ARABIC_FONT_PATH);

        // 2. قراءة صورة الشهادة الأساسية باستخدام sharp
        const baseImageBuffer = await fs.readFile(CERTIFICATE_IMAGE_PATH);
        const baseImage = sharp(baseImageBuffer);
        const metadata = await baseImage.metadata();
        const imageWidth = metadata.width;
        const imageHeight = metadata.height; // احصل على ارتفاع الصورة

        // 3. إنشاء النصوص كـ SVG باستخدام ImageResponse
        const textOverlays = [];

        for (const [key, pos] of Object.entries(TEXT_POSITIONS)) {
            let textContent = '';
            switch (key) {
                case 'STUDENT_NAME':
                    textContent = studentNameArabic;
                    break;
                case 'SERIAL_NUMBER':
                    textContent = serialNumber;
                    break;
                case 'DOCUMENT_SERIAL_NUMBER':
                    textContent = documentSerialNumber;
                    break;
                case 'PLATE_NUMBER':
                    textContent = `رقم اللوحة: ${plateNumber}`;
                    break;
                case 'CAR_TYPE':
                    textContent = `نوع السيارة: ${carType}`;
                    break;
                case 'COLOR':
                    textContent = `اللون: ${color}`;
                    break;
            }

            const textSvg = await new ImageResponse(
                (
                    <div style={{
                        display: 'flex',
                        position: 'absolute',
                        top: `${pos.y}px`, // استخدام pos.y لتحديد الموضع الرأسي
                        left: `${pos.x}px`, // استخدام pos.x لتحديد الموضع الأفقي
                        fontSize: `${pos.fontSize}px`,
                        color: pos.color,
                        fontFamily: 'ArialCustom',
                        justifyContent: pos.alignment === 'center' ? 'center' : pos.alignment === 'left' ? 'flex-start' : 'flex-end',
                        alignItems: 'center',
                        width: 'auto', // جعل العرض تلقائي للنص
                        whiteSpace: 'nowrap', // منع التفاف النص
                    }}>
                        {textContent}
                    </div>
                ),
                {
                    width: imageWidth, // عرض الـ SVG الكلي كعرض الصورة الأساسية
                    height: imageHeight, // ارتفاع الـ SVG الكلي كارتفاع الصورة الأساسية
                    fonts: [
                        {
                            name: 'ArialCustom',
                            data: arabicFontData,
                            style: 'normal',
                            weight: 400, // يمكن تحديد الوزن (عادي)
                        },
                    ],
                }
            ).arrayBuffer(); // احصل على SVG كـ ArrayBuffer

            textOverlays.push({
                input: Buffer.from(textSvg), // تحويل ArrayBuffer إلى Buffer لـ sharp
                top: 0, // وضع الـ SVG على الأصل (0,0) لأننا تحكمنا في الموضع داخله
                left: 0,
                blend: 'overlay', // أو 'atop' أو 'over' حسب التأثير المطلوب
            });
        }


        // 4. تركيب الـ SVG على الصورة الأساسية باستخدام sharp
        const processedImageBuffer = await baseImage
            .composite(textOverlays)
            .jpeg({ quality: 90 }) // يمكنك تعديل جودة الصورة هنا
            .toBuffer();

        // 5. إرجاع الصورة
        return new Response(processedImageBuffer, {
            headers: {
                'Content-Type': 'image/jpeg',
                'Cache-Control': 'public, max-age=3600', // تحسين التخزين المؤقت
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