// api/getStudent.js
const { MongoClient, ObjectId } = require('mongodb');

// تعريف رابط الاتصال واسم قاعدة البيانات من متغيرات البيئة
const uri = process.env.MONGODB_URI;
const dbName = "Cluster0"; // تأكد من أن هذا هو اسم قاعدة البيانات الصحيح
const collectionName = 'enrolled_students_tbl'; // تأكد من أن هذا هو اسم الكولكشن الصحيح

exports.handler = async (event, context) => {
    let client; // تعريف الـ client هنا ليكون متاحًا في الـ finally

    try {
        // التحقق من وجود رابط الاتصال
        if (!uri) {
            throw new Error('لم يتم العثور على رابط اتصال MongoDB في متغيرات البيئة. تأكد من إعداده في Vercel.');
        }

        // إنشاء عميل MongoDB والاتصال
        client = new MongoClient(uri);
        await client.connect();
        const database = client.db(dbName);
        const studentsCollection = database.collection(collectionName);

        const searchTerm = event.queryStringParameters?.search; // جلب مصطلح البحث
        const studentId = event.queryStringParameters?.id; // جلب مُعرف الطالب إذا وجد

        if (studentId) {
            // إذا تم توفير مُعرّف الطالب، قم بجلب طالب واحد
            let query;
            try {
                // التأكد من أن الـ ID صالح لـ ObjectId
                const objectId = new ObjectId(studentId);
                query = { _id: objectId };
            } catch (error) {
                // إذا كان الـ ID غير صالح، أرجع خطأ 400
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: 'مُعرّف الطالب غير صالح. يجب أن يكون ObjectId صحيحًا.' }),
                    headers: { 'Content-Type': 'application/json' },
                };
            }
            const student = await studentsCollection.findOne(query);

            if (student) {
                // تنسيق البيانات لتضمين جميع الحقول المطلوبة وتحويل ObjectId إلى string
                return {
                    statusCode: 200,
                    body: JSON.stringify({
                        id: student._id.toString(), // تحويل ObjectId إلى string
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
                        // تنسيق التاريخ إذا كان موجودًا
                        created_at: student.created_at ? new Date(student.created_at).toLocaleDateString() : 'غير محدد'
                    }),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                };
            } else {
                // إذا لم يتم العثور على طالب بالـ ID
                return {
                    statusCode: 404,
                    body: JSON.stringify({ error: 'لم يتم العثور على طالب بهذا المُعرّف.' }),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                };
            }
        } else {
            // إذا لم يتم توفير مُعرّف الطالب، قم بجلب جميع الطلاب مع تطبيق البحث
            let query = {};
            if (searchTerm) {
                // استخدام تعبيرات منتظمة للبحث الجزئي وغير الحساس لحالة الأحرف
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
                id: student._id.toString(), // تحويل ObjectId إلى string
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
            body: JSON.stringify({ error: error.message || 'حدث خطأ غير متوقع في الخادم.' }),
            headers: {
                'Content-Type': 'application/json'
            }
        };
    } finally {
        if (client) {
            // إغلاق الاتصال بقاعدة البيانات لضمان عدم وجود اتصالات معلقة
            await client.close();
        }
    }
};