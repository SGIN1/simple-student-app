const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGODB_URI;
const dbName = 'Cluster0';
const collectionName = 'enrolled_students_tbl';

exports.handler = async (event, context) => {
    const studentId = event.queryStringParameters.id;
    console.log('ID المستلم في وظيفة generateCertificateTwo2:', studentId);

    let client;

    try {
        client = new MongoClient(uri);
        await client.connect();
        const database = client.db(dbName);
        const studentsCollection = database.collection(collectionName);

        let student;
        try {
            student = await studentsCollection.findOne({ _id: new ObjectId(studentId) });
        } catch (objectIdError) {
            console.error('خطأ في إنشاء ObjectId:', objectIdError);
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'معرف الطالب غير صالح' }),
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
            };
        }

        if (!student) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: `لم يتم العثور على طالب بالمعرف: ${studentId}` }),
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
            };
        }

        // إرجاع بيانات الطالب كـ JSON
        return {
            statusCode: 200,
            body: JSON.stringify({
                arabic_name: student.arabic_name,
                serial_number: student.serial_number,
                // يمكنك إضافة المزيد من البيانات هنا إذا لزم الأمر
            }),
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
        };

    } catch (error) {
        console.error('خطأ في وظيفة توليد الشهادة:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'حدث خطأ أثناء توليد الشهادة', message: error.message }),
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
        };
    } finally {
        if (client) await client.close();
    }
};