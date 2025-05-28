// api/getStudent.js
const { MongoClient, ObjectId } = require('mongodb');

// تعريف رابط الاتصال واسم قاعدة البيانات من متغيرات البيئة
const uri = process.env.MONGODB_URI;
const dbName = "Cluster0";
const collectionName = 'enrolled_students_tbl';

// التصدير الافتراضي لدالة معالجة الطلبات
module.exports = async (req, res) => {
    let client;

    try {
        if (!uri) {
            return res.status(500).json({ error: 'لم يتم العثور على رابط اتصال MongoDB في متغيرات البيئة. تأكد من إعداده في Vercel.' });
        }

        client = new MongoClient(uri);
        await client.connect();
        const database = client.db(dbName);
        const studentsCollection = database.collection(collectionName);

        // جلب مصطلح البحث أو مُعرف الطالب من req.query
        const searchTerm = req.query.search;
        const studentId = req.query.id; // هذا هو معرف الطالب الذي يتم تمريره لجلب طالب واحد

        if (req.method === 'GET') {
            if (studentId) {
                // إذا تم توفير مُعرف الطالب، قم بجلب طالب واحد
                let query;
                try {
                    const objectId = new ObjectId(studentId);
                    query = { _id: objectId };
                } catch (error) {
                    return res.status(400).json({ error: 'مُعرّف الطالب غير صالح. يجب أن يكون ObjectId صحيحًا.' });
                }
                const student = await studentsCollection.findOne(query);

                if (student) {
                    // أعد البيانات بصيغة id بدلاً من _id لتتناسب مع الواجهة الأمامية
                    return res.status(200).json({
                        id: student._id.toString(), // تحويل _id إلى id كنص
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
                // إذا لم يتم توفير مُعرف الطالب، قم بجلب جميع الطلاب (مع أو بدون بحث)
                let query = {};
                if (searchTerm) {
                    // بناء استعلام البحث باستخدام التعبيرات العادية لعدة حقول
                    query = {
                        $or: [
                            { serial_number: { $regex: searchTerm, $options: 'i' } },
                            { plate_number: { $regex: searchTerm, $options: 'i' } },
                            { chassis_number: { $regex: searchTerm, $options: 'i' } }
                        ]
                    };
                }
                const students = await studentsCollection.find(query).toArray();
                // تنسيق البيانات لـ id بدلاً من _id
                const formattedStudents = students.map(student => ({
                    id: student._id.toString(), // تحويل _id إلى id كنص
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
        } else {
            // إذا لم يكن الطلب من نوع GET
            return res.status(405).json({ error: 'Method Not Allowed' });
        }

    } catch (error) {
        console.error('خطأ في وظيفة جلب الطلاب:', error);
        return res.status(500).json({ error: error.message || 'حدث خطأ غير متوقع في الخادم.' });
    } finally {
        if (client) {
            await client.close();
        }
    }
};