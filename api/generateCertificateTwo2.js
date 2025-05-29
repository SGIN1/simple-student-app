// api/generateCertificateTwo2.js

const { MongoClient, ObjectId } = require('mongodb');
const { ImageResponse } = require('@vercel/og');
const React = require('react');

const uri = process.env.MONGODB_URI;
const dbName = 'Cluster0';
const collectionName = 'enrolled_students_tbl';

const fontUrl = 'https://fonts.gstatic.com/s/cairo/v29/SLXGc1gY6HPz_mkYx_U62B2JpB4.woff2'; // استخدام خط القاهرة

module.exports = async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const studentId = req.query.id;
    console.log('ID المستلم في وظيفة generateCertificateTwo2:', studentId);

    if (!studentId) {
        return res.status(400).send('<h1>معرف الطالب مطلوب</h1><p>الرابط الذي استخدمته غير صحيح. يرجى التأكد من صحة معرف الطالب.</p>');
    }

    let client;
    let student;

    try {
        if (!process.env.MONGODB_URI) {
            console.error("MONGODB_URI is not set.");
            return res.status(500).send("<h1>Server Error</h1><p>MONGODB_URI is not configured. Please check Vercel environment variables.</p>");
        }

        const host = req.headers.host;
        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const absoluteBackgroundImagePath = `${protocol}://${host}/images/full/wwee.jpg`;

        client = new MongoClient(uri);
        await client.connect();
        const database = client.db(dbName);
        const studentsCollection = database.collection(collectionName);

        try {
            student = await studentsCollection.findOne({ _id: new ObjectId(studentId) });
        } catch (objectIdError) {
            console.error("MongoDB ObjectId conversion error for ID:", studentId, objectIdError);
            return res.status(400).send('<h1>Invalid Student ID</h1><p>The link you used is incorrect. Please ensure the student ID is valid.</p>');
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
        console.error("Unexpected error in Vercel function (OG Image):", error);
        return res.status(500).send(`<h1>An error occurred while generating the certificate image</h1><p>Error details: ${error.message || 'An unexpected server error occurred.'}</p><p>Please check Vercel function logs.</p>`);
    } finally {
        if (client) {
            console.log("Closing MongoDB connection.");
            await client.close();
        }
    }
};