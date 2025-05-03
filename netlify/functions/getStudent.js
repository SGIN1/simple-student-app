// netlify/functions/getStudent.js
const { MongoClient, ObjectId } = require('mongodb');

// تعريف رابط الاتصال واسم قاعدة البيانات من متغيرات البيئة
const uri = process.env.MONGODB_URI;
const dbName = "Cluster0";
const collectionName = 'enrolled_students_tbl';

exports.handler = async (event, context) => {
    let client; // تعريف الـ client هنا
    const studentId = event.queryStringParameters.id;

    try {
        // التحقق من وجود رابط الاتصال
        if (!uri) {
            throw new Error('لم يتم العثور على رابط اتصال MongoDB في متغيرات البيئة.');
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
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: 'مُعرّف الطالب غير صالح.' }),
                    headers: { 'Content-Type': 'application/json' },
                };
            }
            const student = await studentsCollection.findOne(query);

            if (student) {
                return {
                    statusCode: 200,
                    body: JSON.stringify({
                        id: student._id.toString(),
                        serial_number: student.serial_number,
                        residency_number: student.residency_number,
                        created_at: student.created_at ? new Date(student.created_at).toLocaleDateString() : 'غير محدد'
                    }),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                };
            } else {
                return {
                    statusCode: 404,
                    body: JSON.stringify({ error: 'لم يتم العثور على طالب بهذا المُعرّف.' }),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                };
            }
        } else {
            // إذا لم يتم توفير مُعرّف الطالب، قم بجلب جميع الطلاب
            const students = await studentsCollection.find({}).toArray();
            const formattedStudents = students.map(student => ({
                id: student._id.toString(),
                serial_number: student.serial_number,
                residency_number: student.residency_number,
                created_at: student.created_at ? new Date(student.created_at).toLocaleDateString() : 'غير محدد'
            }));

            return {
                statusCode: 200,
                body: JSON.stringify(formattedStudents),
                headers: {
                    'Content-Type': 'application/json'
                }
            };
        }

    } catch (error) {
        console.error('خطأ في وظيفة جلب الطلاب:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
            headers: {
                'Content-Type': 'application/json'
            }
        };
    } finally {
        if (client) {
            await client.close();
        }
    }
};