import { ImageResponse } from '@vercel/og';
import React from 'react';
// لا نحتاج إلى إزالة export const config = { runtime: 'edge' };
// لأننا تأكدنا من أنها Node.js Function بالفعل.

// مسار الخط المحلي من مجلد public
// تأكد من وجود ملف andlso.ttf داخل public/fonts/ في جذر مشروعك
const LOCAL_FONT_PATH = 'public/fonts/andlso.ttf'; // مسار الملف داخل مشروعك
const BACKGROUND_IMAGE_PATH = 'public/images/full/wwee.jpg'; // مسار الصورة داخل مشروعك

export default async function handler(req) {
    if (req.method !== 'GET') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    const url = new URL(req.url);
    const studentId = url.searchParams.get('id');

    if (!studentId) {
        return new ImageResponse(
            (
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%', backgroundColor: '#fff', fontSize: 36, color: 'black' }}>
                    <h1>معرف الطالب مطلوب</h1>
                    <p>الرابط الذي استخدمته غير صحيح.</p>
                </div>
            ),
            { width: 1200, height: 630 }
        );
    }

    let student;
    let fontData;
    let backgroundImageData; // لبيانات الصورة إذا احتجنا لتحميلها كـ Buffer

    try {
        const host = req.headers.get('host');
        const protocol = req.headers.get('x-forwarded-proto') || 'http';

        const studentDataUrl = `${protocol}://${host}/api/getStudent?id=${studentId}`;
        console.log("Fetching student data from:", studentDataUrl);

        const response = await fetch(studentDataUrl);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Failed to fetch student data from /api/getStudent: ${response.status} - ${errorText}`);
            let errorMessage = `Failed to get student data (Status: ${response.status})`;
            try {
                if (response.headers.get('content-type')?.includes('application/json')) {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.error || errorMessage;
                } else {
                    errorMessage = errorText.substring(0, 150) || errorMessage;
                }
            } catch (e) {
                errorMessage = errorText.substring(0, 150) || errorMessage;
            }
            return new ImageResponse(
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%', backgroundColor: '#fff', fontSize: 36, color: 'red' }}>
                    <h1>خطأ في جلب بيانات الطالب</h1>
                    <p>{errorMessage}</p>
                </div>,
                { width: 1200, height: 630 }
            );
        }
        
        student = await response.json();
        console.log("Student data fetched successfully:", student.arabic_name);

        // --- محاولة تحميل الخط والصورة بشكل مباشر من مجلد المشروع ---
        // هذا يتطلب استخدام Node.js 'fs' module
        // Vercel Serverless Functions تدعم 'fs' لقراءة الملفات المضمنة في النشر.
        const path = await import('path'); // استيراد path ديناميكيًا
        const fs = await import('fs/promises'); // استيراد fs/promises ديناميكيًا

        try {
            // استخدام process.cwd() للحصول على المسار الأساسي للمشروع
            const fontFilePath = path.join(process.cwd(), LOCAL_FONT_PATH);
            fontData = await fs.readFile(fontFilePath);
            console.log("Font loaded successfully from file system.");
        } catch (fontFileError) {
            console.error("Failed to load font from file system:", fontFileError.message);
            // سنستمر بدون خط مخصص إذا فشل التحميل
            fontData = null; // تأكد من أن fontData فارغ إذا فشل التحميل
        }

        try {
            const imageFilePath = path.join(process.cwd(), BACKGROUND_IMAGE_PATH);
            backgroundImageData = await fs.readFile(imageFilePath); // قراءة الصورة كـ Buffer
            console.log("Background image loaded successfully from file system.");
        } catch (imageFileError) {
            console.error("Failed to load background image from file system:", imageFileError.message);
            backgroundImageData = null; // تأكد من أن backgroundImageData فارغ إذا فشل التحميل
        }

        const imageUrl = backgroundImageData ? `data:image/jpeg;base64,${backgroundImageData.toString('base64')}` : undefined;


        return new ImageResponse(
            (
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
                        fontFamily: 'andlso', // اسم الخط الذي سيتم استخدامه في CSS
                        backgroundImage: imageUrl ? `url(${imageUrl})` : undefined, // استخدام بيانات الصورة كـ Data URL
                        backgroundSize: '100% 100%',
                        backgroundRepeat: 'no-repeat',
                        color: 'black', // يجب أن يكون اللون واضحًا على الخلفية
                    }}
                >
                    <div style={{ position: 'absolute', top: '40%', width: '100%', textAlign: 'center', fontSize: '36px' }}>
                        {student.arabic_name || 'اسم غير معروف'}
                    </div>
                    {/* أعدت الألوان إلى الأبيض بناءً على تصميمك مع صورة الخلفية */}
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
                width: 1200,
                height: 630,
                fonts: fontData ? [ // نرسل بيانات الخط فقط إذا تم تحميلها بنجاح
                    {
                        name: 'andlso', // اسم الخط الذي تم تحميله
                        data: fontData,
                        style: 'normal',
                        weight: 400,
                    },
                ] : [], // إذا لم يتم تحميل الخط، نرسل مصفوفة فارغة
            }
        );

    } catch (error) {
        console.error("Critical error in generateCertificateTwo2:", error);
        return new Response(`A critical error occurred: ${error.message || 'An unexpected server error occurred.'}\nStack: ${error.stack || 'No stack trace'}`, { status: 500 });
    }
}