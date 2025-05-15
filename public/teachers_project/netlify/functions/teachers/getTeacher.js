// teachers_project/netlify/functions/getTeacher.js
const { MongoClient, ObjectId } = require('mongodb');

// تعريف رابط الاتصال واسم قاعدة البيانات واسم المجموعة الخاصة بالمعلمين من متغيرات البيئة
const uri = process.env.MONGODB_URI_TEACHERS;
const dbName = "TeachersDB";
const collectionName = 'enrolled_teachers_tbl';

exports.handler = async (event, context) => {
    let client; // تعريف الـ client هنا
    const teacherId = event.queryStringParameters.id;

    try {
        // التحقق من وجود رابط الاتصال
        if (!uri) {
            throw new Error('لم يتم العثور على رابط اتصال MongoDB الخاص بالمعلمين في متغيرات البيئة.');
        }

        // إنشاء عميل MongoDB والاتصال
        client = new MongoClient(uri);
        await client.connect();
        const database = client.db(dbName);
        const teachersCollection = database.collection(collectionName);

        if (teacherId) {
            // إذا تم توفير مُعرّف المعلم، قم بجلب معلم واحد
            let query;
            try {
                const objectId = new ObjectId(teacherId);
                query = { _id: objectId };
            } catch (error) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: 'مُعرّف المعلم غير صالح.' }),
                    headers: { 'Content-Type': 'application/json' },
                };
            }
            const teacher = await teachersCollection.findOne(query);

            if (teacher) {
                return {
                    statusCode: 200,
                    body: JSON.stringify({
                        id: teacher._id.toString(),
                        serial_number: teacher.serial_number,
                        residency_number: teacher.residency_number,
                        created_at: teacher.created_at ? new Date(teacher.created_at).toLocaleDateString() : 'غير محدد'
                    }),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                };
            } else {
                return {
                    statusCode: 404,
                    body: JSON.stringify({ error: 'لم يتم العثور على معلم بهذا المُعرّف.' }),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                };
            }
        } else {
            // إذا لم يتم توفير مُعرّف المعلم، قم بجلب جميع المعلمين
            const teachers = await teachersCollection.find({}).toArray();
            const formattedTeachers = teachers.map(teacher => ({
                id: teacher._id.toString(),
                serial_number: teacher.serial_number,
                residency_number: teacher.residency_number,
                created_at: teacher.created_at ? new Date(teacher.created_at).toLocaleDateString() : 'غير محدد'
            }));

            return {
                statusCode: 200,
                body: JSON.stringify(formattedTeachers),
                headers: {
                    'Content-Type': 'application/json'
                }
            };
        }

    } catch (error) {
        console.error('خطأ في وظيفة جلب المعلمين:', error);
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