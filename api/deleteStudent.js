const { MongoClient, ObjectId } = require('mongodb');

// رابط اتصال قاعدة البيانات MongoDB.
// يجب ضبط هذا المتغير (MONGODB_URI) في إعدادات Vercel كمتغير بيئة.
const uri = process.env.MONGODB_URI;
// اسم قاعدة البيانات في MongoDB
const dbName = "Cluster0";
// اسم المجموعة (Collection) في قاعدة البيانات
const collectionName = 'enrolled_students_tbl';

exports.handler = async (event, context) => {
    // هذه الدالة تستقبل طلبات POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed - Only POST requests are accepted.' }),
            headers: { 'Content-Type': 'application/json' },
        };
    }

    let studentId;
    try {
        // يتم إرسال معرف الطالب في جسم الطلب (body) عند استخدام POST
        const data = JSON.parse(event.body);
        studentId = data.id;
    } catch (parseError) {
        console.error("Error parsing request body:", parseError);
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Invalid JSON in request body.' }),
            headers: { 'Content-Type': 'application/json' },
        };
    }

    // التحقق من وجود معرف الطالب
    if (!studentId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Student ID is required.' }),
            headers: { 'Content-Type': 'application/json' },
        };
    }

    let client; // متغير لتخزين كائن عميل MongoDB

    try {
        // التحقق مما إذا كان URI الخاص بـ MongoDB مضبوطًا.
        if (!uri) {
            console.error("MONGODB_URI is not set.");
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'MongoDB URI is not configured.' }),
                headers: { 'Content-Type': 'application/json' },
            };
        }

        // إنشاء اتصال بقاعدة بيانات MongoDB.
        client = new MongoClient(uri);
        await client.connect();
        const database = client.db(dbName);
        const studentsCollection = database.collection(collectionName);

        // حذف الطالب من قاعدة البيانات باستخدام المعرف
        const result = await studentsCollection.deleteOne({ _id: new ObjectId(studentId) });

        if (result.deletedCount === 1) {
            console.log(`Student with ID ${studentId} deleted successfully.`);
            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Student deleted successfully.' }),
                headers: { 'Content-Type': 'application/json' },
            };
        } else {
            console.warn(`Student with ID ${studentId} not found for deletion.`);
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Student not found.' }),
                headers: { 'Content-Type': 'application/json' },
            };
        }

    } catch (error) {
        console.error('Error deleting student:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: `An error occurred while deleting the student: ${error.message}` }),
            headers: { 'Content-Type': 'application/json' },
        };
    } finally {
        if (client) {
            console.log("Closing MongoDB connection.");
            await client.close();
        }
    }
};