import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = "Cluster0";
const collectionName = 'enrolled_students_tbl';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    let client;

    try {
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
            serial_number_duplicate,
            arabic_name // تأكد أن هذا الحقل يأتي مع البيانات المرسلة
        } = req.body;

        if (!serial_number || !residency_number) {
            return res.status(400).json({ error: 'الرقم التسلسلي ورقم الإقامة كلاهما مطلوبان.' });
        }

        if (!uri) {
            console.error('MONGODB_URI is not defined in environment variables.');
            return res.status(500).json({ error: 'خطأ في تهيئة الخادم: MONGODB_URI غير معرف.' });
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
            counter_reading,
            chassis_number,
            vehicle_model,
            color,
            serial_number_duplicate,
            arabic_name, // إضافة الحقل الجديد هنا
            created_at: new Date()
        });

        if (result.acknowledged && result.insertedId) {
            return res.status(200).json({ message: 'تم إضافة الطالب بنجاح!', id: result.insertedId.toString() });
        } else {
            return res.status(500).json({ error: 'فشل في إضافة الطالب إلى قاعدة البيانات.' });
        }

    } catch (error) {
        console.error('خطأ في وظيفة إضافة الطالب:', error);
        return res.status(500).json({ error: error.message || 'حدث خطأ غير متوقع.' });
    } finally {
        if (client) {
            await client.close();
        }
    }
}