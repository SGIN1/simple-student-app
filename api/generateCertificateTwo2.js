import { ImageResponse } from '@vercel/og'; // اترك هذا الاستيراد
// import React from 'react'; // قم بإلغاء هذا السطر (ضعه كتعليق)

export const config = {
    runtime: 'edge',
};

// const fontUrl = 'https://fonts.gstatic.com/s/cairo/v29/SLXGc1gY6HPz_mkYx_U62B2JpB4.woff2'; // قم بإلغاء هذا السطر

export default async function handler(req) {
    if (req.method !== 'GET') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    const url = new URL(req.url);
    const studentId = url.searchParams.get('id');

    // لا يزال بإمكاننا استخدام ImageResponse ولكن بشكل أبسط
    if (!studentId) {
        return new ImageResponse(
            (
                // هنا نستخدم JSX مباشرة، وهو ما يجب أن تدعمه ImageResponse
                <div style={{ display: 'flex' }}>
                    <h1>معرف الطالب مطلوب (Edge Test)</h1>
                </div>
            ),
            { width: 400, height: 100 }
        );
    }

    let student;
    try {
        const host = req.headers.get('host');
        const protocol = req.headers.get('x-forwarded-proto') || 'http';

        const studentDataUrl = `<span class="math-inline">\{protocol\}\://</span>{host}/api/getStudent?id=${studentId}`;
        console.log("Fetching student data from:", studentDataUrl);

        // Fetching from a Node.js function from an Edge function is fine
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
                <div style={{ display: 'flex', color: 'red' }}>
                    <h1>خطأ: {errorMessage}</h1>
                </div>,
                { width: 600, height: 150 }
            );
        }

        student = await response.json();
        console.log("Student data fetched successfully:", student.arabic_name);

        // هنا سنرجع صورة بسيطة جدًا بدون تعقيدات الخطوط أو الخلفيات
        return new ImageResponse(
            (
                <div style={{ display: 'flex', fontSize: 24, color: 'blue' }}>
                    <h1>طالب: {student.arabic_name || 'غير معروف'}</h1>
                </div>
            ),
            {
                width: 600,
                height: 200,
                // لا تضع الخطوط هنا مؤقتًا
            }
        );

    } catch (error) {
        console.error("Unexpected error in generateCertificateTwo2:", error);
        return new Response(`An error occurred: ${error.message || 'An unexpected server error occurred.'}`, { status: 500 });
    }
}