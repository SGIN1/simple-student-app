// api/generateCertificateTwo2.js
import { ImageResponse } from '@vercel/og';
import React from 'react';
import { MongoClient, ObjectId } from 'mongodb'; // استيراد MongoClient و ObjectId

// --- Configuration for Edge Runtime (essential for Vercel/OG) ---
export const config = {
    runtime: 'edge',
};

const fontUrl = 'https://fonts.gstatic.com/s/cairo/v29/SLXGc1gY6HPz_mkYx_U62B2JpB4.woff2';
const uri = process.env.MONGODB_URI; // جلب URI من متغيرات البيئة
const dbName = "Cluster0";
const collectionName = 'enrolled_students_tbl';

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

    let client;
    let student;
    try {
        if (!uri) {
            console.error('MongoDB URI is not set in environment variables.');
            return new ImageResponse(
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%', backgroundColor: '#fff', fontSize: 36, color: 'red' }}>
                    <h1>خطأ في الاتصال بقاعدة البيانات</h1>
                    <p>الرجاء التأكد من إعداد متغيرات البيئة.</p>
                </div>,
                { width: 1200, height: 630 }
            );
        }

        // Connect directly to MongoDB
        client = new MongoClient(uri);
        await client.connect();
        const database = client.db(dbName);
        const studentsCollection = database.collection(collectionName);

        let query;
        try {
            const objectId = new ObjectId(studentId);
            query = { _id: objectId };
        } catch (error) {
            return new ImageResponse(
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%', backgroundColor: '#fff', fontSize: 36, color: 'red' }}>
                    <h1>معرف الطالب غير صالح</h1>
                    <p>يجب أن يكون ObjectId صحيحًا.</p>
                </div>,
                { width: 1200, height: 630 }
            );
        }

        student = await studentsCollection.findOne(query);

        if (!student) {
            return new ImageResponse(
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%', backgroundColor: '#fff', fontSize: 36, color: 'red' }}>
                    <h1>لم يتم العثور على طالب</h1>
                    <p>لا يوجد طالب بهذا المُعرّف.</p>
                </div>,
                { width: 1200, height: 630 }
            );
        }

        console.log("Student data fetched successfully for certificate:", student.arabic_name);

        const absoluteBackgroundImagePath = `https://${req.headers.get('host')}/images/full/wwee.jpg`;
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
        console.error("Unexpected error in generateCertificateTwo2:", error);
        return new ImageResponse(
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%', backgroundColor: '#fff', fontSize: 36, color: 'red' }}>
                <h1>حدث خطأ غير متوقع</h1>
                <p>{error.message || 'خطأ في الخادم'}</p>
            </div>,
            { width: 1200, height: 630 }
        );
    } finally {
        if (client) {
            await client.close();
        }
    }
}