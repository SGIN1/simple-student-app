const { MongoClient } = require('mongodb');

// تعريف رابط الاتصال واسم قاعدة البيانات من متغيرات البيئة
const uri = process.env.MONGODB_URI;
const dbName = "Cluster0";
const collectionName = 'enrolled_students_tbl';

// التصدير الافتراضي لدالة معالجة الطلبات
module.exports = async (req, res) => {
    let client;

    // التأكد أن الطلب من نوع POST فقط
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed - Only POST requests are accepted.' });
    }

    try {
        // التحقق من وجود رابط اتصال MongoDB في متغيرات البيئة
        if (!uri) {
            return res.status(500).json({ error: 'لم يتم العثور على رابط اتصال MongoDB في متغيرات البيئة. تأكد من إعداده في Vercel.' });
        }

        // استخراج البيانات من جسم الطلب (req.body)
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

        // التحقق من وجود الحقول الأساسية المطلوبة
        if (!serial_number || !residency_number || !plate_number || !chassis_number) {
            return res.status(400).json({ error: 'الرقم التسلسلي، رقم الإقامة، رقم اللوحة، ورقم الشاسيه هي حقول مطلوبة.' });
        }

        // إنشاء اتصال بقاعدة بيانات MongoDB
        client = new MongoClient(uri);
        await client.connect();
        const database = client.db(dbName);
        const studentsCollection = database.collection(collectionName);

        // إنشاء كائن الطالب الجديد مع إضافة تاريخ الإنشاء
        const newStudent = {
            serial_number,
            residency_number,
            document_serial_number: document_serial_number || null, // يمكن أن يكون اختيارياً
            plate_number,
            inspection_date: inspection_date || null,
            manufacturer: manufacturer || null,
            inspection_expiry_date: inspection_expiry_date || null,
            car_type: car_type || null,
            counter_reading: counter_reading || null,
            chassis_number,
            vehicle_model: vehicle_model || null,
            color: color || null,
            serial_number_duplicate: serial_number_duplicate || null,
            created_at: new Date(), // تسجيل تاريخ ووقت الإضافة
        };

        // إدراج الطالب الجديد في قاعدة البيانات
        const result = await studentsCollection.insertOne(newStudent);

        // إرسال استجابة النجاح
        return res.status(201).json({
            message: 'تم إضافة الطالب بنجاح!',
            studentId: result.insertedId.toString()
        });

    } catch (error) {
        // معالجة الأخطاء وإرسال استجابة خطأ
        console.error('خطأ في وظيفة إضافة الطالب:', error);
        return res.status(500).json({ error: error.message || 'حدث خطأ غير متوقع في الخادم أثناء إضافة الطالب.' });
    } finally {
        // التأكد من إغلاق الاتصال بقاعدة البيانات
        if (client) {
            await client.close();
        }
    }
};