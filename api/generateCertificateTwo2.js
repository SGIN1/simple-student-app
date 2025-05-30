import { ImageResponse } from '@vercel/og';
import React from 'react';

export const config = {
  runtime: 'edge', // تأكد من تفعيل Edge Runtime
};

const FONT_URL = 'https://your-deployment-url.vercel.app/fonts/andlso.ttf'; // استبدل بمسار مشروعك الفعلي
const BACKGROUND_IMAGE_URL = 'https://your-deployment-url.vercel.app/images/full/wwee.jpg'; // استبدل بمسار مشروعك الفعلي

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

        // إذا أردت استخدام المسار الديناميكي، تأكد من صحته
        const dynamicFontUrl = `<span class="math-inline">\{protocol\}\://</span>{host}/fonts/andlso.ttf`;
        const dynamicBackgroundImageUrl = `<span class="math-inline">\{protocol\}\://</span>{host}/images/full/wwee.jpg`;

        console.log("Fetching student data from:", `<span class="math-inline">\{protocol\}\://</span>{host}/api/getStudent?id=${studentId}`);
        const studentResponse = await fetch(`<span class="math-inline">\{protocol\}\://</span>{host}/api/getStudent?id=${studentId}`);

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

        // جلب الخط كـ ArrayBuffer
        try {
            const fontResponse = await fetch(dynamicFontUrl); // أو FONT_URL الثابت
            if (!fontResponse.ok) throw new Error(`Failed to fetch font: ${fontResponse.statusText}`);
            fontData = await fontResponse.arrayBuffer();
            console.log("Font loaded successfully via HTTP.");
        } catch (fontFetchError) {
            console.error("Failed to fetch font via HTTP:", fontFetchError.message);
            fontData = null;
        }

        // جلب الصورة كـ ArrayBuffer ثم تحويلها إلى Base64
        try {
            const imageResponse = await fetch(dynamicBackgroundImageUrl); // أو BACKGROUND_IMAGE_URL الثابت
            if (!imageResponse.ok) throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
            const imageBuffer = await imageResponse.arrayBuffer();
            backgroundImageData = Buffer.from(imageBuffer).toString('base64');
            console.log("Background image loaded successfully via HTTP.");
        } catch (imageFetchError) {
            console.error("Failed to fetch background image via HTTP:", imageFetchError.message);
            backgroundImageData = null;
        }

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
                fonts: fontData ? [{ name: 'andlso', data: fontData, style: 'normal', weight: 400 }] : [],
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
                </div>
            ),
            { width: 1200, height: 630, status: 500 }
        );
    }
}