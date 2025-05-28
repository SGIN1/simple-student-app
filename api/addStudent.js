// api/addStudent.js
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const dbName = "Cluster0";
const collectionName = 'enrolled_students_tbl';

module.exports = async (req, res) => {
    let client;

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        if (!uri) {
            throw new Error('لم يتم العثور على رابط اتصال MongoDB في متغيرات البيئة.');
        }

        client = new MongoClient(uri);
        await client.connect();
        const database = client.db(dbName);
        const studentsCollection = database.collection(collectionName);

        const newStudentData = req.body;

        const studentToInsert = {
            ...newStudentData,
            created_at: new Date() // إضافة تاريخ ووقت الإنشاء
        };

        const result = await studentsCollection.insertOne(studentToInsert);

        return res.status(201).json({
            message: 'تم إضافة الطالب بنجاح!',
            studentId: result.insertedId.toString()
        });

    } catch (error) {
        console.error('خطأ في وظيفة إضافة الطالب:', error);
        return res.status(500).json({ error: error.message });
    } finally {
        if (client) {
            await client.close();
        }
    }
};