// netlify/functions/updateStudent.js
const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGODB_URI;
const dbName = "Cluster0";
const collectionName = 'enrolled_students_tbl';

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    let client;

    try {
        const {
            id,
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

        if (!id || !serial_number || !residency_number) {
            return { statusCode: 400, body: JSON.stringify({ error: 'مُعرّف الطالب والرقم التسلسلي ورقم الإقامة كلها مطلوبة.' }) };
        }

        client = new MongoClient(uri);
        await client.connect();
        const database = client.db(dbName);
        const studentsCollection = database.collection(collectionName);

        const updateResult = await studentsCollection.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
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
                }
            }
        );

        if (updateResult.modifiedCount > 0) {
            return { statusCode: 200, body: JSON.stringify({ message: 'تم تحديث بيانات الطالب بنجاح!' }) };
        } else {
            return { statusCode: 404, body: JSON.stringify({ error: 'لم يتم العثور على الطالب لتحديثه.' }) };
        }

    } catch (error) {
        console.error('خطأ في وظيفة تحديث الطالب:', error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    } finally {
        if (client) {
            await client.close();
        }
    }
};