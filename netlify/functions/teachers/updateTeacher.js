// teachers_project/netlify/functions/updateTeacher.js
const { MongoClient, ObjectId } = require('mongodb');

// تعريف رابط الاتصال واسم قاعدة البيانات واسم المجموعة الخاصة بالمعلمين من متغيرات البيئة
const uri = process.env.MONGODB_URI_TEACHERS;
const dbName = "TeachersDB";
const collectionName = 'enrolled_teachers_tbl';

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    let client;

    try {
        const { id, serial_number, residency_number } = JSON.parse(event.body);

        if (!id || !serial_number || !residency_number) {
            return { statusCode: 400, body: JSON.stringify({ error: 'مُعرّف المعلم والرقم التسلسلي ورقم الإقامة كلها مطلوبة.' }) };
        }

        client = new MongoClient(uri);
        await client.connect();
        const database = client.db(dbName);
        const teachersCollection = database.collection(collectionName);

        const updateResult = await teachersCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { serial_number, residency_number } }
        );

        if (updateResult.modifiedCount > 0) {
            return { statusCode: 200, body: JSON.stringify({ message: 'تم تحديث بيانات المعلم بنجاح!' }) };
        } else {
            return { statusCode: 404, body: JSON.stringify({ error: 'لم يتم العثور على المعلم لتحديثه.' }) };
        }

    } catch (error) {
        console.error('خطأ في وظيفة تحديث المعلم:', error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    } finally {
        if (client) {
            await client.close();
        }
    }
};