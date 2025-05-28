// api/addStudent.js
const { MongoClient } = require('mongodb');

// تعريف رابط الاتصال واسم قاعدة البيانات من متغيرات البيئة
const uri = process.env.MONGODB_URI;
const dbName = "Cluster0";
const collectionName = 'enrolled_students_tbl';

// التصدير الافتراضي لدالة معالجة الطلبات لـ Vercel
module.exports = async (req, res) => {
    // التأكد من أن الطلب من نوع POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    let client; // تعريف الـ client هنا عشان يكون متاح في الـ finally

    try {
        // جلب البيانات من جسم الطلب (req.body) مباشرة
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
        } = req.body; // هنا التغيير الأساسي: نستخدم req.body بدلاً من JSON.parse(event.body)

        if (!serial_number || !residency_number) {
            return res.status(400).json({ error: 'الرقم التسلسلي ورقم الإقامة كلاهما مطلوبان.' });
        }

        if (!uri) {
            return res.status(500).json({ error: 'لم يتم العثور على رابط اتصال MongoDB في متغيرات البيئة. تأكد من إعداده في Vercel.' });
        }

        client = new MongoClient(uri); // إنشاء الـ client
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
            created_at: new Date() // إضافة تاريخ الإنشاء التلقائي
        });

        if (result.acknowledged && result.insertedId) {
            return res.status(200).json({ message: 'تم إضافة الطالب بنجاح!' });
        } else {
            return res.status(500).json({ error: 'فشل في إضافة الطالب إلى قاعدة البيانات.' });
        }

    } catch (error) {
        console.error('خطأ في وظيفة إضافة الطالب:', error);
        return res.status(500).json({ error: error.message || 'حدث خطأ غير متوقع في الخادم.' });
    } finally {
        if (client) { // التأكد إن الـ client تم إنشاؤه قبل محاولة إغلاقه
            await client.close();
        }
    }
};