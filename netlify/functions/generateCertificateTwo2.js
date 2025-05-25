const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGODB_URI;
const dbName = 'Cluster0';
const collectionName = 'enrolled_students_tbl';

const CERTIFICATE_IMAGE_RELATIVE_PATH = '/images/full/wwee.jpg';

exports.handler = async (event, context) => {
    const studentId = event.path.split('/').pop();
    console.log('ID المستلم في وظيفة generateCertificateTwo2:', studentId);

    let client;
    try {
        if (!uri) {
            throw new Error("MONGODB_URI is not set in environment variables. Please set it in Netlify.");
        }

        const htmlContent = `
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>الشهادة ${studentId}</title>
            </head>
            <body>
                <img src="${CERTIFICATE_IMAGE_RELATIVE_PATH}" alt="الشهادة">
            </body>
            </html>
        `.trim();

        
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
            },
            body: htmlContent,
        };

    } catch (error) {
        console.error('خطأ في وظيفة عرض الشهادة:', error);
        return {
            statusCode: 500,
            body: `<h1>حدث خطأ أثناء عرض الشهادة</h1><p>${error.message}</p>`,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        };
    } finally {
        if (client) await client.close();
    }
};