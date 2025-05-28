const { MongoClient } = require('mongodb');

// تعريف رابط الاتصال واسم قاعدة البيانات من متغيرات البيئة
const uri = process.env.MONGODB_URI;
const dbName = "Cluster0";
const collectionName = 'enrolled_students_tbl';

// Vercel functions تستخدم (req, res) بدلاً من (event, context)
module.exports = async (req, res) => {
    // التحقق من طريقة الطلب (HTTP Method)
    if (req.method !== 'POST') {
        // استخدام res.status().json() لإرجاع الاستجابة في Vercel
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    let client; // تعريف الـ client هنا عشان يكون متاح في الـ finally

    try {
        // البيانات المرسلة تكون في req.body مباشرة في Vercel
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
        } = req.body; // هنا التغيير: استخدام req.body بدلاً من JSON.parse(event.body)

        if (!serial_number || !residency_number) {
            return res.status(400).json({ error: 'الرقم التسلسلي ورقم الإقامة كلاهما مطلوبان.' });
        }

        // التأكد من وجود URI الاتصال بقاعدة البيانات
        if (!uri) {
            console.error('MONGODB_URI is not defined in environment variables.');
            return res.status(500).json({ error: 'خطأ في تهيئة الخادم: MONGODB_URI غير معرف.' });
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
        return res.status(500).json({ error: error.message || 'حدث خطأ غير متوقع.' });
    } finally {
        if (client) { // التأكد إن الـ client تم إنشاؤه قبل محاولة إغلاقه
            await client.close();
        }
    }
};