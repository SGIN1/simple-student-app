// api/generateCertificateTwo2.js

// تغيير 'require' إلى 'import'
import { MongoClient, ObjectId } from 'mongodb'; // قد لا يعمل هذا في Edge Functions
import { ImageResponse } from '@vercel/og';
import React from 'react'; // React 19 بيدعم import React from 'react'

const uri = process.env.MONGODB_URI;
const dbName = 'Cluster0';
const collectionName = 'enrolled_students_tbl';

const fontUrl = 'https://fonts.gstatic.com/s/cairo/v29/SLXGc1gY6HPz_mkYx_U62B2JpB4.woff2';

// تعريف الدالة كـ Edge Function
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    const url = new URL(req.url);
    const studentId = url.searchParams.get('id'); // جلب الـ ID من الـ URLSearchParams
    console.log('ID المستلم في وظيفة generateCertificateTwo2:', studentId);

    if (!studentId) {
        return new ImageResponse(
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%', backgroundColor: '#fff', fontSize: 36, color: 'black' }}>
                <h1>معرف الطالب مطلوب</h1>
                <p>الرابط الذي استخدمته غير صحيح.</p>
            </div>,
            { width: 1200, height: 630 }
        );
    }

    let client;
    let student;

    try {
        if (!process.env.MONGODB_URI) {
            console.error("MONGODB_URI is not set.");
            return new Response("Server Error: MONGODB_URI is not configured.", { status: 500 });
        }

        const host = req.headers.get('host'); // جلب الهوست في Edge Functions
        const protocol = req.headers.get('x-forwarded-proto') || 'http';
        const absoluteBackgroundImagePath = `<span class="math-inline">\{protocol\}\://</span>{host}/images/full/wwee.jpg`;

        // **نقطة مهمة:** اتصال MongoDB قد لا يعمل بشكل مباشر في Edge Functions.
        // إذا واجهت مشاكل هنا، قد نحتاج لفصل جلب البيانات إلى Serverless Function منفصلة.
        client = new MongoClient(uri);
        await client.connect();
        const database = client.db(dbName);
        const studentsCollection = database.collection(collectionName);

        try {
            student = await studentsCollection.findOne({ _id: new ObjectId(studentId) });
        } catch (objectIdError) {
            console.error("MongoDB ObjectId conversion error for ID:", studentId, objectIdError);
            return new Response('Invalid Student ID: The link you used is incorrect.', { status: 400 });
        }

        if (!student) {
            console.warn("Student not found, using fallback data for ID:", studentId);
            student = {
                arabic_name: "اسم الطالب التجريبي",
                serial_number: "SN-TEST-123",
                document_serial_number: "DOC-TEST-456",
                plate_number: "ABC-TEST-789",
                car_type: "Sedan Test",
                color: "Red Test"
            };
        } else {
            console.log("Student found:", student.arabic_name);
        }

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
        console.error("Unexpected error in Vercel Edge Function:", error);
        return new Response(`An error occurred: ${error.message || 'An unexpected server error occurred.'}`, { status: 500 });
    } finally {
        if (client) {
            console.log("Closing MongoDB connection.");
            await client.close();
        }
    }
}

// إعداد الدالة كـ Edge Function
export const config = {
    runtime: 'edge', // هذا هو المفتاح!
    regions: ['cdg1'], // يمكن تحديد أقرب منطقة لـ Ma'rib لو عايز سرعة أكبر
};