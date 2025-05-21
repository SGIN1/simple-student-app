import { ImageResponse, html } from '@vercel/og'; // استيراد html tag function
import sharp from 'sharp';
import { MongoClient, ObjectId } from 'mongodb';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

// تحديد المسار الصحيح للملفات
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// مسار ملف الخطوط داخل مجلد Edge Function
const ARABIC_FONT_PATH = join(__dirname, 'fonts', 'arial.ttf');

// مسار صورة الشهادة الأساسية
const CERTIFICATE_IMAGE_PATH = join(__dirname, 'images', 'wwee.jpg'); // تأكد أن المجلد اسمه 'images'

// متغيرات MongoDB
const uri = Deno.env.get('MONGODB_URI');
const dbName = 'Cluster0';
const collectionName = 'enrolled_students_tbl';


const TEXT_COLOR_HEX = '#000000'; // أسود
const WHITE_COLOR_HEX = '#FFFFFF'; // أبيض

// تعريف إحداثيات النصوص (سيتطلب الأمر بعض التعديل الدقيق بناءً على حجم الخط وتصميمه)
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

        const serialNumber = student.serial_number;
        const studentNameArabic = student.arabic_name || '';
        const documentSerialNumber = student.document_serial_number || '';
        const plateNumber = student.plate_number || '';
        const carType = student.car_type || '';
        const color = student.color || '';

        // 1. قراءة الخط
        const arabicFontData = await fs.readFile(ARABIC_FONT_PATH);

        // 2. قراءة صورة الشهادة الأساسية باستخدام sharp
        const baseImageBufferRaw = await fs.readFile(CERTIFICATE_IMAGE_PATH);
        const baseImageUint8Array = new Uint8Array(baseImageBufferRaw.buffer);

        const baseImage = sharp(baseImageUint8Array);
        const metadata = await baseImage.metadata();
        const imageWidth = metadata.width;
        const imageHeight = metadata.height;

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

            const textSvgArrayBuffer = await new ImageResponse(
                html`<div style="
                        display: flex;
                        position: absolute;
                        top: ${pos.y}px;
                        left: ${pos.x}px;
                        font-size: ${pos.fontSize}px;
                        color: ${pos.color};
                        font-family: 'ArialCustom';
                        justify-content: ${pos.alignment === 'center' ? 'center' : (pos.alignment === 'left' ? 'flex-start' : 'flex-end')};
                        align-items: center;
                        width: auto;
                        white-space: nowrap;
                    ">
                        ${textContent}
                    </div>`,
                {
                    width: imageWidth,
                    height: imageHeight,
                    fonts: [
                        {
                            name: 'ArialCustom',
                            data: arabicFontData,
                            style: 'normal',
                            weight: 400,
                        },
                    ],
                }
            ).arrayBuffer();

            textOverlays.push({
                input: new Uint8Array(textSvgArrayBuffer),
                top: 0,
                left: 0,
                blend: 'overlay',
            });
        }

        // 4. تركيب الـ SVG على الصورة الأساسية باستخدام sharp
        const processedImageBuffer = await baseImage
            .composite(textOverlays)
            .jpeg({ quality: 90 })
            .toBuffer();

        // 5. إرجاع الصورة
        return new Response(processedImageBuffer, {
            headers: {
                'Content-Type': 'image/jpeg',
                'Cache-Control': 'public, max-age=3600',
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