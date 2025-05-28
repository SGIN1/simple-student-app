// api/getStudent.js
const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGODB_URI;
const dbName = "Cluster0";
const collectionName = 'enrolled_students_tbl';

module.exports = async (req, res) => {
    let client;
    const studentId = req.query.id; // Vercel يستخدم req.query لـ query parameters

    try {
        if (!uri) {
            throw new Error('لم يتم العثور على رابط اتصال MongoDB في متغيرات البيئة.');
        }

        client = new MongoClient(uri);
        await client.connect();
        const database = client.db(dbName);
        const studentsCollection = database.collection(collectionName);

        if (req.method === 'GET') {
            if (studentId) {
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
                        created_at: student.created_at ? new Date(student.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'numeric', day: 'numeric' }) : 'غير محدد'
                    });
                } else {
                    return res.status(404).json({ error: 'لم يتم العثور على طالب بهذا المُعرّف.' });
                }
            } else {
                const searchTerm = req.query.search;
                let query = {};
                if (searchTerm) {
                    query = { residency_number: { $regex: searchTerm, $options: 'i' } };
                }

                // *** التعديل الرئيسي هنا: الترتيب من قاعدة البيانات ***
                const students = await studentsCollection.find(query)
                                                           .sort({ created_at: -1 }) // الأحدث أولاً
                                                           .toArray();
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
                    created_at: student.created_at ? new Date(student.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'numeric', day: 'numeric' }) : 'غير محدد'
                }));

                return res.status(200).json(formattedStudents);
            }
        } else {
            return res.status(405).json({ error: 'Method Not Allowed' });
        }

    } catch (error) {
        console.error('خطأ في وظيفة جلب الطلاب:', error);
        return res.status(500).json({ error: error.message });
    } finally {
        if (client) {
            await client.close();
        }
    }
};