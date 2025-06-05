import { MongoClient, ObjectId } from "mongodb"

const uri = process.env.MONGODB_URI
const dbName = "Cluster0"
const collectionName = "enrolled_students_tbl"

export default async function handler(req, res) {
  // إضافة headers للـ CORS
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")

  if (req.method === "OPTIONS") {
    return res.status(200).end()
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" })
  }

  let client

  try {
    if (!uri) {
      console.error("MONGODB_URI is not defined in environment variables.")
      return res.status(500).json({
        error: "خطأ في تهيئة الخادم: MONGODB_URI غير معرف.",
      })
    }

    client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })

    await client.connect()
    const database = client.db(dbName)
    const studentsCollection = database.collection(collectionName)

    const searchTerm = req.query.search
    const studentId = req.query.id

    if (studentId) {
      // جلب طالب واحد بالمعرف
      let query
      try {
        const objectId = new ObjectId(studentId)
        query = { _id: objectId }
      } catch (error) {
        return res.status(400).json({
          error: "مُعرّف الطالب غير صالح. يجب أن يكون ObjectId صحيحًا.",
        })
      }

      const student = await studentsCollection.findOne(query)

      if (student) {
        return res.status(200).json({
          id: student._id.toString(),
          serial_number: student.serial_number || "",
          residency_number: student.residency_number || "",
          document_serial_number: student.document_serial_number || "",
          plate_number: student.plate_number || "",
          inspection_date: student.inspection_date || "",
          manufacturer: student.manufacturer || "",
          inspection_expiry_date: student.inspection_expiry_date || "",
          car_type: student.car_type || "",
          counter_reading: student.counter_reading || "",
          chassis_number: student.chassis_number || "",
          vehicle_model: student.vehicle_model || "",
          color: student.color || "",
          serial_number_duplicate: student.serial_number_duplicate || "",
          created_at: student.created_at ? new Date(student.created_at).toLocaleDateString("ar-EG") : "غير محدد",
          arabic_name: student.arabic_name || "",
        })
      } else {
        return res.status(404).json({
          error: "لم يتم العثور على طالب بهذا المُعرّف.",
        })
      }
    } else {
      // جلب جميع الطلاب أو البحث
      let query = {}
      if (searchTerm) {
        query = {
          $or: [
            { serial_number: { $regex: searchTerm, $options: "i" } },
            { residency_number: { $regex: searchTerm, $options: "i" } },
            { plate_number: { $regex: searchTerm, $options: "i" } },
            { chassis_number: { $regex: searchTerm, $options: "i" } },
          ],
        }
      }

      const students = await studentsCollection.find(query).toArray()
      const formattedStudents = students.map((student) => ({
        id: student._id.toString(),
        serial_number: student.serial_number || "",
        residency_number: student.residency_number || "",
        document_serial_number: student.document_serial_number || "",
        plate_number: student.plate_number || "",
        inspection_date: student.inspection_date || "",
        manufacturer: student.manufacturer || "",
        inspection_expiry_date: student.inspection_expiry_date || "",
        car_type: student.car_type || "",
        counter_reading: student.counter_reading || "",
        chassis_number: student.chassis_number || "",
        vehicle_model: student.vehicle_model || "",
        color: student.color || "",
        serial_number_duplicate: student.serial_number_duplicate || "",
        created_at: student.created_at ? new Date(student.created_at).toLocaleDateString("ar-EG") : "غير محدد",
        arabic_name: student.arabic_name || "",
      }))

      return res.status(200).json(formattedStudents)
    }
  } catch (error) {
    console.error("خطأ في وظيفة جلب الطلاب:", error)
    return res.status(500).json({
      error: "حدث خطأ أثناء محاولة تحميل بيانات الطلاب. يرجى المحاولة مرة أخرى.",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  } finally {
    if (client) {
      try {
        await client.close()
      } catch (closeError) {
        console.error("خطأ في إغلاق اتصال قاعدة البيانات:", closeError)
      }
    }
  }
}
