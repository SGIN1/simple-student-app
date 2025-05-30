// قم بإزالة هذه الاستيرادات من الأعلى
// import { ImageResponse } from '@vercel/og';
// import React from 'react';

import path from 'path';
import { promises as fs } from 'fs';

// *******************************************************************
// تأكد من أن هذا السطر غير موجود إطلاقًا في هذا الملف:
// export const config = { runtime: 'edge' };
// *******************************************************************

// المسارات الأكثر موثوقية:
const LOCAL_FONT_PATH = path.join(__dirname, '..', 'public', 'fonts', 'andlso.ttf');
const BACKGROUND_IMAGE_PATH = path.join(__dirname, '..', 'public', 'images', 'full', 'wwee.jpg');

export default async function handler(req) {
    try {
        // استيراد ImageResponse و React داخل الدالة بشكل ديناميكي
        // هذا قد يتجاوز مشكلات التهيئة المبكرة
        const { ImageResponse } = await import('@vercel/og');
        const React = await import('react');

        console.log('--- Function Invoked ---');
        console.log('Current Working Directory (process.cwd()):', process.cwd());
        console.log('Directory Name (__dirname):', __dirname);
        console.log('Attempting to load font from path:', LOCAL_FONT_PATH);
        console.log('Attempting to load image from path:', BACKGROUND_IMAGE_PATH);

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
        let fontData = null;
        let backgroundImageData = null;

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

            // --- محاولة تحميل الخط والصورة بشكل مباشر من مجلد المشروع باستخدام fs/promises ---
            try {
                fontData = await fs.readFile(LOCAL_FONT_PATH);
                console.log("Font loaded successfully from file system.");
            } catch (fontFileError) {
                console.error("Failed to load font from file system at path:", LOCAL_FONT_PATH, "Error:", fontFileError.message);
                fontData = null;
            }

            try {
                backgroundImageData = await fs.readFile(BACKGROUND_IMAGE_PATH);
                console.log("Background image loaded successfully from file system.");
            } catch (imageFileError) {
                console.error("Failed to load background image from file system at path:", BACKGROUND_IMAGE_PATH, "Error:", imageFileError.message);
                backgroundImageData = null;
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
            console.error("Critical error inside handler:", error);
            return new Response(`A critical error occurred: ${error.message || 'An unexpected server error occurred.'}\nStack: ${error.stack || 'No stack trace'}`, { status: 500 });
        }
    } catch (globalError) {
        // هذا catch سيظهر أي أخطاء تحدث حتى قبل تنفيذ الدالة handler
        console.error("Global error outside handler:", globalError);
        return new Response(`A global error occurred before handler: ${globalError.message || 'An unexpected server error occurred.'}\nStack: ${globalError.stack || 'No stack trace'}`, { status: 500 });
    }
}