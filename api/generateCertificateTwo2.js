import { ImageResponse } from '@vercel/og';
import React from 'react';

// 1. تحديد Edge Runtime: هذا السطر حيوي لتشغيل الدالة كـ Edge Function
export const config = {
  runtime: 'edge',
};

// لا نحتاج إلى مسارات الملفات المحلية بعد الآن، سنقوم بجلبها عبر HTTP

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
    let backgroundImageData;

    try {
        const host = req.headers.get('host');
        const protocol = req.headers.get('x-forwarded-proto') || 'http';

        // 2. بناء مسارات URL للخط والصورة
        // هذه المسارات ستشير إلى أصولك الثابتة (static assets) على Vercel
        const fontUrl = `${protocol}://${host}/fonts/andlso.ttf`;
        const backgroundImageUrl = `${protocol}://${host}/images/full/wwee.jpg`;

        // 3. جلب بيانات الطالب
        console.log("Fetching student data from:", `${protocol}://${host}/api/getStudent?id=${studentId}`);
        const studentResponse = await fetch(`${protocol}://${host}/api/getStudent?id=${studentId}`);

        if (!studentResponse.ok) {
            const errorText = await studentResponse.text();
            console.error(`Failed to fetch student data from /api/getStudent: ${studentResponse.status} - ${errorText}`);
            let errorMessage = `Failed to get student data (Status: ${studentResponse.status})`;
            try {
                if (studentResponse.headers.get('content-type')?.includes('application/json')) {
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

        student = await studentResponse.json();
        console.log("Student data fetched successfully:", student.arabic_name);

        // 4. جلب الخط كـ ArrayBuffer باستخدام 'fetch'
        try {
            console.log("Fetching font from:", fontUrl);
            const fontResponse = await fetch(fontUrl);
            if (!fontResponse.ok) {
                // إذا فشل جلب الخط، أبلغ عن الخطأ واستمر بدون الخط المخصص
                console.error(`Failed to fetch font: ${fontResponse.status} - ${fontResponse.statusText}`);
                fontData = null;
            } else {
                fontData = await fontResponse.arrayBuffer(); // Edge Runtime يتوقع ArrayBuffer
                console.log("Font loaded successfully via HTTP.");
            }
        } catch (fontFetchError) {
            console.error("Critical error fetching font via HTTP:", fontFetchError.message);
            fontData = null;
        }

        // 5. جلب الصورة كـ ArrayBuffer ثم تحويلها إلى Base64
        try {
            console.log("Fetching background image from:", backgroundImageUrl);
            const imageResponse = await fetch(backgroundImageUrl);
            if (!imageResponse.ok) {
                // إذا فشل جلب الصورة، أبلغ عن الخطأ واستمر بدون الصورة
                console.error(`Failed to fetch background image: ${imageResponse.status} - ${imageResponse.statusText}`);
                backgroundImageData = null;
            } else {
                const imageBuffer = await imageResponse.arrayBuffer();
                // في Edge Runtime، لا يوجد 'Buffer' بنفس طريقة Node.js.
                // يمكنك استخدام 'btoa' أو تحويل ArrayBuffer إلى Base64 بطريقة أخرى إذا كان 'ImageResponse' لا يقبله مباشرة.
                // ومع ذلك، `ImageResponse` عادة ما تتعامل مع `data:image` URLs بشكل جيد.
                // لنستخدم طريقة لتحويل ArrayBuffer إلى Base64:
                const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
                backgroundImageData = base64Image;
                console.log("Background image loaded successfully via HTTP.");
            }
        } catch (imageFetchError) {
            console.error("Critical error fetching background image via HTTP:", imageFetchError.message);
            backgroundImageData = null;
        }

        // 6. استخدام بيانات الصورة كـ Data URL
        const imageUrl = backgroundImageData ? `data:image/jpeg;base64,${backgroundImageData}` : undefined;

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
                        fontFamily: 'andlso',
                        backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
                        backgroundSize: '100% 100%',
                        backgroundRepeat: 'no-repeat',
                        color: 'black', // تأكد أن اللون واضح على الخلفية
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
                // 7. تمرير بيانات الخط فقط إذا تم تحميلها بنجاح
                fonts: fontData ? [
                    {
                        name: 'andlso',
                        data: fontData,
                        style: 'normal',
                        weight: 400,
                    },
                ] : [],
            }
        );

    } catch (error) {
        console.error("Critical error in generateCertificateTwo2:", error);
        // يمكنك تخصيص صفحة الخطأ أكثر هنا
        return new ImageResponse(
            (
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%', backgroundColor: '#fdd', fontSize: 36, color: 'darkred' }}>
                    <h1>خطأ غير متوقع</h1>
                    <p>{error.message || 'حدث خطأ غير متوقع.'}</p>
                    <p>يرجى التحقق من السجلات لمزيد من التفاصيل.</p>
                </div>
            ),
            { width: 1200, height: 630, status: 500 }
        );
    }
}