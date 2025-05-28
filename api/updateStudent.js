// api/updateStudent.js
const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGODB_URI;
const dbName = "Cluster0";
const collectionName = 'enrolled_students_tbl';

// التصدير الافتراضي لدالة معالجة الطلبات لـ Vercel
module.exports = async (req, res) => {
    // التأكد من أن الطلب من نوع POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    let client;

    try {
        // جلب البيانات من جسم الطلب (req.body) مباشرة
        const {
            id, // معرّف الطالب المطلوب تعديله
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
        } = req.body; // هنا التغيير الأساسي

        if (!id || !serial_number || !residency_number) {
            return res.status(400).json({ error: 'مُعرّف الطالب والرقم التسلسلي ورقم الإقامة كلها مطلوبة.' });
        }

        if (!uri) {
            return res.status(500).json({ error: 'لم يتم العثور على رابط اتصال MongoDB في متغيرات البيئة. تأكد من إعداده في Vercel.' });
        }

        client = new MongoClient(uri);
        await client.connect();
        const database = client.db(dbName);
        const studentsCollection = database.collection(collectionName);

        const updateResult = await studentsCollection.updateOne(
            { _id: new ObjectId(id) }, // البحث بواسطة _id
            {
                $set: {
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
                }
            }
        );

        if (updateResult.modifiedCount > 0) {
            return res.status(200).json({ message: 'تم تحديث بيانات الطالب بنجاح!' });
        } else {
            // يمكن أن يحدث هذا إذا كان ID غير صحيح أو لم يتم تغيير أي حقول
            return res.status(404).json({ error: 'لم يتم العثور على الطالب لتحديثه، أو لم يتم تغيير أي بيانات.' });
        }

    } catch (error) {
        console.error('خطأ في وظيفة تحديث الطالب:', error);
        // التحقق مما إذا كان الخطأ متعلقًا بمعرف ObjectId غير صالح
        if (error.message.includes('Argument passed in must be a string of 12 bytes or a string of 24 hex characters or an integer')) {
            return res.status(400).json({ error: 'مُعرّف الطالب غير صالح. تأكد من أنه تنسيق صحيح.' });
        }
        return res.status(500).json({ error: error.message || 'حدث خطأ غير متوقع في الخادم.' });
    } finally {
        if (client) {
            await client.close();
        }
    }
};