import { ImageResponse } from '@vercel/og';
import React from 'react';

// تم إزالة السطر: export const config = { runtime: 'edge' };

// مسار الخط المحلي الآن من مجلد public
// تأكد من وجود ملف andlso.ttf داخل public/fonts/ في جذر مشروعك
const localFontPath = '/fonts/andlso.ttf'; // هذا هو المسار الذي يمكن لـ Vercel الوصول إليه

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
    let absoluteBackgroundImagePath; // تعريف المتغير هنا

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

        // تحميل الخط من المسار العام public
        const fullFontUrl = `${protocol}://${host}${localFontPath}`;
        try {
            fontData = await fetch(fullFontUrl).then((res) => res.arrayBuffer());
            console.log("Font loaded successfully.");
        } catch (fontError) {
            console.error("Failed to load font:", fontError);
            // يمكنك هنا اختيار إرجاع خطأ أو الاستمرار بدون خط مخصص
            // للتبسيط، سنستمر مع تحذير في السجلات
        }

        // تحميل الصورة الخلفية من المسار العام public
        absoluteBackgroundImagePath = `${protocol}://${host}/images/full/wwee.jpg`;
        // لا نحتاج لتحميلها كـ arrayBuffer هنا، لأنها تستخدم في CSS

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
                        backgroundImage: `url(${absoluteBackgroundImagePath})`, // استخدام مسار الصورة
                        backgroundSize: '100% 100%',
                        backgroundRepeat: 'no-repeat',
                        color: 'black',
                    }}
                >
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
                width: 1200,
                height: 630,
                fonts: fontData ? [ // نرسل بيانات الخط فقط إذا تم تحميلها بنجاح
                    {
                        name: 'andlso', // اسم الخط الذي تم تحميله
                        data: fontData,
                        style: 'normal',
                        weight: 400, // يمكنك تعديل الوزن حسب نوع الخط
                    },
                ] : [], // إذا لم يتم تحميل الخط، نرسل مصفوفة فارغة
            }
        );

    } catch (error) {
        console.error("Unexpected error in generateCertificateTwo2:", error);
        // اجعل رسالة الخطأ أكثر تفصيلاً للمساعدة في تصحيح الأخطاء إذا استمرت
        return new Response(`An error occurred: ${error.message || 'An unexpected server error occurred.'}\nStack: ${error.stack || 'No stack trace'}`, { status: 500 });
    }
}