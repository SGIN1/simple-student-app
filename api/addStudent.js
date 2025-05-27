// api/addStudent.js
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const dbName = "Cluster0";
const collectionName = 'enrolled_students_tbl';

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method Not Allowed. Only POST requests are accepted.' });
        return;
    }

    let client;

    try {
        if (!uri) {
            res.status(500).json({ error: 'لم يتم العثور على رابط اتصال MongoDB في متغيرات البيئة.' });
            return;
        }

        const {
            serial_number,
            residency_number,
            document_serial_number,
            plate_number,
            inspection_date,
            manufacturer,
            inspection_expiry_date,
            car_type,
            counter_reading,
            chassis_number,
            vehicle_model,
            color,
            serial_number_duplicate
        } = req.body;

        if (!serial_number || !residency_number) {
            res.status(400).json({ error: 'الرقم التسلسلي ورقم الإقامة كلاهما مطلوبان.' });
            return;
        }

        client = new MongoClient(uri);
        await client.connect();
        const database = client.db(dbName);
        const studentsCollection = database.collection(collectionName);

        const result = await studentsCollection.insertOne({
            serial_number,
            residency_number,
            document_serial_number,
            plate_number,
            inspection_date,
            manufacturer,
            inspection_expiry_date,
            car_type,
            counter_reading: Number(counter_reading),
            chassis_number,
            vehicle_model,
            color,
            serial_number_duplicate,
            created_at: new Date()
        });

        if (result.acknowledged && result.insertedId) {
            res.status(200).json({ message: 'تم إضافة الطالب بنجاح!', id: result.insertedId.toString() });
        } else {
            res.status(500).json({ error: 'فشل في إضافة الطالب إلى قاعدة البيانات.' });
        }

    } catch (error) {
        console.error('خطأ في وظيفة إضافة الطالب:', error);
        res.status(500).json({ error: error.message || 'حدث خطأ غير متوقع في الخادم.' });
    } finally {
        if (client) {
            await client.close();
        }
    }
};