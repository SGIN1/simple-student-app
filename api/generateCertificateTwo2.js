// api/generateCertificateTwo2.js

// **التغييرات هنا: استخدام import بدلاً من require**
import { MongoClient, ObjectId } from 'mongodb';
import { renderToBuffer } from '@react-pdf/renderer'; // الآن يتم استيراده بشكل صحيح
import React from 'react'; // استخدام import بدلاً من require
import CertificatePdfDocument from '../components/CertificatePdfDocument'; // استخدام import بدلاً من require

// **تعديل جديد: لإتاحة بعض المتغيرات العامة التي كانت موجودة في بيئة CommonJS**
// في بيئة ESM، لا توجد متغيرات مثل __dirname و require بشكل عام
// لحل هذا في دوال Vercel، يمكننا استخدام حل بديل.
// لحسن الحظ، في Vercel، `process.env` يعمل بشكل طبيعي.

const uri = process.env.MONGODB_URI;
const dbName = 'Cluster0';
const collectionName = 'enrolled_students_tbl';

// **التغيير هنا: استخدام export default بدلاً من module.exports**
export default async function handler(req, res) { // يمكن تسمية الدالة بأي اسم، غالباً ما تُسمى `handler`
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const studentId = req.query.id;
    console.log('ID المستلم في وظيفة generateCertificateTwo2:', studentId);

    if (!studentId) {
        return res.status(400).send('<h1>معرف الطالب مطلوب</h1><p>الرابط الذي استخدمته غير صحيح. يرجى التأكد من صحة معرف الطالب.</p>');
    }

    let client;

    try {
        if (!process.env.MONGODB_URI) {
            console.error("MONGODB_URI is not set.");
            return res.status(500).send("<h1>Server Error</h1><p>MONGODB_URI is not configured. Please check Vercel environment variables.</p>");
        }

        const host = req.headers.host;
        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const absoluteImagePath = `${protocol}://${host}/images/full/wwee.jpg`;
        console.log("Absolute image path for certificate:", absoluteImagePath);

        client = new MongoClient(uri);
        await client.connect();
        const database = client.db(dbName);
        const studentsCollection = database.collection(collectionName);

        let student;
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

        const pdfBuffer = await renderToBuffer(
            React.createElement(CertificatePdfDocument, {
                studentData: student,
                absoluteImagePath: absoluteImagePath
            })
        );

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="certificate_${studentId}.pdf"`);
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        return res.status(200).send(pdfBuffer);

    } catch (error) {
        console.error("Unexpected error in Vercel function:", error);
        return res.status(500).send(`<h1>An error occurred while generating the certificate</h1><p>Error details: ${error.message || 'An unexpected server error occurred.'}</p><p>Please check Vercel function logs.</p>`);
    } finally {
        if (client) {
            console.log("Closing MongoDB connection.");
            await client.close();
        }
    }
}