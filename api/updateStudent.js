// api/updateStudent.js
const { MongoClient, ObjectId } = require('mongodb');

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

    let client;

    try {
        // البيانات المرسلة تكون في req.body مباشرة في Vercel
        const {
            id,
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

        if (!id || !serial_number || !residency_number) {
            return res.status(400).json({ error: 'مُعرّف الطالب والرقم التسلسلي ورقم الإقامة كلها مطلوبة.' });
        }

        // التأكد من وجود URI الاتصال بقاعدة البيانات
        if (!uri) {
            console.error('MONGODB_URI is not defined in environment variables.');
            return res.status(500).json({ error: 'خطأ في تهيئة الخادم: MONGODB_URI غير معرف.' });
        }

        client = new MongoClient(uri);
        await client.connect();
        const database = client.db(dbName);
        const studentsCollection = database.collection(collectionName);

        const updateResult = await studentsCollection.updateOne(
            { _id: new ObjectId(id) }, // البحث عن المستند بواسطة ID
            {
                $set: { // استخدام $set لتحديث الحقول المحددة
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
            // إذا لم يتم تعديل أي مستند، قد يكون ID غير موجود أو لم تتغير البيانات
            return res.status(404).json({ error: 'لم يتم العثور على الطالب لتحديثه، أو لم يتم تغيير أي بيانات.' });
        }

    } catch (error) {
        console.error('خطأ في وظيفة تحديث الطالب:', error);
        return res.status(500).json({ error: error.message || 'حدث خطأ غير متوقع.' });
    } finally {
        if (client) {
            await client.close();
        }
    }
};