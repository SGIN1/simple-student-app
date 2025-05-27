// api/getStudent.js
const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGODB_URI;
const dbName = "Cluster0";
const collectionName = 'enrolled_students_tbl';

module.exports = async (req, res) => {
    let client;

    try {
        if (!uri) {
            res.status(500).json({ error: 'لم يتم العثور على رابط اتصال MongoDB في متغيرات البيئة.' });
            return;
        }

        client = new MongoClient(uri);
        await client.connect();
        const database = client.db(dbName);
        const studentsCollection = database.collection(collectionName);

        const searchTerm = req.query.search;
        const studentId = req.query.id;

        if (studentId) {
            let query;
            try {
                const objectId = new ObjectId(studentId);
                query = { _id: objectId };
            } catch (error) {
                res.status(400).json({ error: 'مُعرّف الطالب غير صالح.' });
                return;
            }
            const student = await studentsCollection.findOne(query);

            if (student) {
                res.status(200).json({
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
                res.status(404).json({ error: 'لم يتم العثور على طالب بهذا المُعرّف.' });
            }
        } else {
            let query = {};
            if (searchTerm) {
                query = {
                    $or: [
                        { serial_number: { $regex: searchTerm, $options: 'i' } },
                        { plate_number: { $regex: searchTerm, $options: 'i' } },
                        { chassis_number: { $regex: searchTerm, $options: 'i' } }
                    ]
                };
            }

            const students = await studentsCollection.find(query).toArray();
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

            res.status(200).json(formattedStudents);
        }

    } catch (error) {
        console.error('خطأ في وظيفة جلب الطلاب:', error);
        res.status(500).json({ error: error.message || 'حدث خطأ غير متوقع في الخادم.' });
    } finally {
        if (client) {
            await client.close();
        }
    }
};