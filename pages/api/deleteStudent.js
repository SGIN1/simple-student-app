// api/getStudent.js
const { MongoClient, ObjectId } = require('mongodb');

// تعريف رابط الاتصال واسم قاعدة البيانات من متغيرات البيئة
const uri = process.env.MONGODB_URI;
const dbName = "Cluster0";
const collectionName = 'enrolled_students_tbl';

// Vercel functions تستخدم (req, res) بدلاً من (event, context)
module.exports = async (req, res) => {
    let client; // تعريف الـ client هنا

    // في Vercel، يمكن الوصول إلى معايير الاستعلام (query parameters) عبر req.query
    const studentId = req.query.id; 

    try {
        // التحقق من وجود رابط الاتصال
        if (!uri) {
            console.error('MONGODB_URI is not defined in environment variables.');
            // استخدام res.status().json() لإرجاع الاستجابة في Vercel
            return res.status(500).json({ error: 'خطأ في تهيئة الخادم: MONGODB_URI غير معرف.' });
        }

        // إنشاء عميل MongoDB والاتصال
        client = new MongoClient(uri);
        await client.connect();
        const database = client.db(dbName);
        const studentsCollection = database.collection(collectionName);

        if (studentId) {
            // إذا تم توفير مُعرّف الطالب، قم بجلب طالب واحد
            let query;
            try {
                const objectId = new ObjectId(studentId);
                query = { _id: objectId };
            } catch (error) {
                return res.status(400).json({ error: 'مُعرّف الطالب غير صالح.' });
            }
            const student = await studentsCollection.findOne(query);

            if (student) {
                return res.status(200).json({
                    id: student._id.toString(),
                    serial_number: student.serial_number,
                    residency_number: student.residency_number,
                    document_serial_number: student.document_serial_number,
                    plate_number: student.plate_number,
                    inspection_date: student.inspection_date,
                    manufacturer: student.manufacturer,
                    inspection_expiry_date: student.inspection_expiry_date,
                    car_type: student.car_type,
                    counter_reading: student.counter_reading,
                    chassis_number: student.chassis_number,
                    vehicle_model: student.vehicle_model,
                    color: student.color,
                    serial_number_duplicate: student.serial_number_duplicate,
                    created_at: student.created_at ? new Date(student.created_at).toLocaleDateString() : 'غير محدد'
                });
            } else {
                return res.status(404).json({ error: 'لم يتم العثور على طالب بهذا المُعرّف.' });
            }
        } else {
            // إذا لم يتم توفير مُعرّف الطالب، قم بجلب جميع الطلاب
            const students = await studentsCollection.find({}).toArray();
            const formattedStudents = students.map(student => ({
                id: student._id.toString(),
                serial_number: student.serial_number,
                residency_number: student.residency_number,
                document_serial_number: student.document_serial_number,
                plate_number: student.plate_number,
                inspection_date: student.inspection_date,
                manufacturer: student.manufacturer,
                inspection_expiry_date: student.inspection_expiry_date,
                car_type: student.car_type,
                counter_reading: student.counter_reading,
                chassis_number: student.chassis_number,
                vehicle_model: student.vehicle_model,
                color: student.color,
                serial_number_duplicate: student.serial_number_duplicate,
                created_at: student.created_at ? new Date(student.created_at).toLocaleDateString() : 'غير محدد'
            }));

            return res.status(200).json(formattedStudents);
        }

    } catch (error) {
        console.error('خطأ في وظيفة جلب الطلاب:', error);
        return res.status(500).json({ error: error.message || 'حدث خطأ غير متوقع.' });
    } finally {
        if (client) {
            await client.close();
        }
    }
};