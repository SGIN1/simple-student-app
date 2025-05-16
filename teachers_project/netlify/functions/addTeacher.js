const { MongoClient } = require('mongodb');

// تعريف رابط الاتصال واسم قاعدة البيانات واسم المجموعة الخاصة بالمعلمين من متغيرات البيئة
const uri = process.env.MONGODB_URI_TEACHERS;
const dbName = "TeachersDB";
const collectionName = 'enrolled_teachers_tbl';

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    let client; // تعريف الـ client هنا عشان يكون متاح في الـ finally

    try {
        const { serial_number, residency_number } = JSON.parse(event.body);

        if (!serial_number || !residency_number) {
            return { statusCode: 400, body: JSON.stringify({ error: 'الرقم التسلسلي ورقم الإقامة كلاهما مطلوبان للمعلم.' }) };
        }

        client = new MongoClient(uri); // إنشاء الـ client باستخدام رابط اتصال المعلمين
        await client.connect();
        const database = client.db(dbName);
        const teachersCollection = database.collection(collectionName);

        const result = await teachersCollection.insertOne({ serial_number, residency_number, created_at: new Date() });

        if (result.acknowledged && result.insertedId) {
            return { statusCode: 200, body: JSON.stringify({ message: 'تمت إضافة المعلم بنجاح!' }) };
        } else {
            return { statusCode: 500, body: JSON.stringify({ error: 'فشل في إضافة المعلم إلى قاعدة البيانات.' }) };
        }

    } catch (error) {
        console.error('خطأ في وظيفة إضافة المعلم:', error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    } finally {
        if (client) { // التأكد إن الـ client تم إنشاؤه قبل محاولة إغلاقه
            await client.close();
        }
    }
};