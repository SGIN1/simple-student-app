// api/generateCertificateTwo2.js (ملف معدّل)

import { ImageResponse } = from '@vercel/og';
import React from 'react';

// --- Configuration for Edge Function ---
export const config = {
    runtime: 'edge',
    // regions: ['cdg1'], // يمكن تحديد أقرب منطقة لك
};
// --- End Configuration ---

const fontUrl = 'https://fonts.gstatic.com/s/cairo/v29/SLXGc1gY6HPz_mkYx_U62B2JpB4.woff2';

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
    try {
        const host = req.headers.get('host');
        const protocol = req.headers.get('x-forwarded-proto') || 'http';

        // **هنا نقوم بطلب البيانات من دالة api/getStudent.js الموجودة بالفعل**
        const studentDataUrl = `${protocol}://${host}/api/getStudent?id=${studentId}`;
        console.log("Fetching student data from:", studentDataUrl);

        const response = await fetch(studentDataUrl);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Failed to fetch student data from /api/getStudent: ${response.status} - ${errorText}`);
            // حاول تفسير رسالة الخطأ من getStudent.js لو كانت JSON
            let errorMessage = `Failed to get student data (Status: ${response.status})`;
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.error || errorMessage;
            } catch (e) {
                // ليس JSON، استخدم النص كما هو
                errorMessage = errorText;
            }
            return new ImageResponse(
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%', backgroundColor: '#fff', fontSize: 36, color: 'red' }}>
                    <h1>خطأ في جلب بيانات الطالب</h1>
                    <p>{errorMessage.substring(0, 150)}</p>
                </div>,
                { width: 1200, height: 630 }
            );
        }
        
        student = await response.json();

        // لو الدالة اللي بتجيب البيانات رجعت بيانات افتراضية
        // (إذا كانت دالة getStudent.js ترجع بيانات افتراضية في حالة عدم العثور)
        // يمكنك إضافة هذا الشرط إذا كنت ترجع بيانات افتراضية من getStudent.js
        /*
        if (!student || Object.keys(student).length === 0) {
            console.warn("Student data not found in DB or empty, using fallback data for image generation.");
            student = {
                arabic_name: "اسم الطالب التجريبي",
                serial_number: "SN-TEST-123",
                document_serial_number: "DOC-TEST-456",
                plate_number: "ABC-TEST-789",
                car_type: "Sedan Test",
                color: "Red Test"
            };
        } else {
            console.log("Student data fetched successfully:", student.arabic_name);
        }
        */
        // ملاحظة: دالة getStudent.js لديك ترجع 404 لو الطالب مش موجود، فمش هنحتاج لـ fallback هنا
        console.log("Student data fetched successfully:", student.arabic_name);


        const absoluteBackgroundImagePath = `${protocol}://${host}/images/full/wwee.jpg`;
        const fontData = await fetch(fontUrl).then((res) => res.arrayBuffer());

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
                        fontFamily: 'Cairo',
                        backgroundImage: `url(${absoluteBackgroundImagePath})`,
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
                fonts: [
                    {
                        name: 'Cairo',
                        data: fontData,
                        style: 'normal',
                        weight: 400,
                    },
                    {
                        name: 'Cairo',
                        data: fontData,
                        style: 'normal',
                        weight: 700,
                    },
                ],
            }
        );

    } catch (error) {
        console.error("Unexpected error in Edge Function (generateCertificateTwo2):", error);
        return new Response(`An error occurred: ${error.message || 'An unexpected server error occurred.'}`, { status: 500 });
    }
}