// api/إضافة طالب.js  (اسم الملف الفعلي يجب أن يكون هكذا ليتوافق مع المسار الذي ظهر في سجلات Vercel)
const { MongoClient } = require('mongodb');

// تعريف رابط الاتصال واسم قاعدة البيانات من متغيرات البيئة
const uri = process.env.MONGODB_URI;
const dbName = "Cluster0"; // تأكد من أن هذا هو اسم قاعدة البيانات الصحيح
const collectionName = 'enrolled_students_tbl'; // تأكد من أن هذا هو اسم الكولكشن الصحيح

exports.handler = async (event, context) => {
    // التحقق من أن الطلب هو POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed. Only POST requests are accepted.' }) };
    }

    let client; // تعريف الـ client هنا ليكون متاحًا في الـ finally

    try {
        // التحقق من وجود رابط الاتصال
        if (!uri) {
            throw new Error('لم يتم العثور على رابط اتصال MongoDB في متغيرات البيئة. تأكد من إعداده في Vercel.');
        }

        // تحليل بيانات الـ JSON المرسلة في جسم الطلب
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
        } = JSON.parse(event.body);

        // التحقق من الحقول الإلزامية
        if (!serial_number || !residency_number) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'الرقم التسلسلي ورقم الإقامة كلاهما مطلوبان لإضافة الطالب.' }),
                headers: { 'Content-Type': 'application/json' },
            };
        }

        // إنشاء عميل MongoDB والاتصال بقاعدة البيانات
        client = new MongoClient(uri);
        await client.connect();
        const database = client.db(dbName);
        const studentsCollection = database.collection(collectionName);

        // إدخال مستند الطالب الجديد إلى الكولكشن
        const result = await studentsCollection.insertOne({
            serial_number,
            residency_number,
            document_serial_number,
            plate_number,
            inspection_date,
            manufacturer,
            inspection_expiry_date,
            car_type,
            counter_reading: Number(counter_reading), // التأكد من تحويلها لرقم
            chassis_number,
            vehicle_model,
            color,
            serial_number_duplicate,
            created_at: new Date() // إضافة تاريخ الإنشاء التلقائي
        });

        // التحقق من نجاح عملية الإدخال
        if (result.acknowledged && result.insertedId) {
            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'تم إضافة الطالب بنجاح!', id: result.insertedId.toString() }),
                headers: { 'Content-Type': 'application/json' },
            };
        } else {
            // في حالة عدم نجاح الإدخال بالكامل
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'فشل في إضافة الطالب إلى قاعدة البيانات. ربما لم يتم إدخال المستند.' }),
                headers: { 'Content-Type': 'application/json' },
            };
        }

    } catch (error) {
        // التعامل مع أي أخطاء تحدث أثناء العملية
        console.error('خطأ في وظيفة إضافة الطالب:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message || 'حدث خطأ غير متوقع في الخادم أثناء إضافة الطالب.' }),
            headers: { 'Content-Type': 'application/json' },
        };
    } finally {
        if (client) {
            // إغلاق الاتصال بقاعدة البيانات لضمان عدم وجود اتصالات معلقة
            await client.close();
        }
    }
};