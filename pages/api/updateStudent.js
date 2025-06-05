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

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" })
  }

  let client

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
      serial_number_duplicate,
      arabic_name,
    } = req.body

    // التحقق من البيانات المطلوبة
    if (!id || !serial_number || !residency_number) {
      return res.status(400).json({
        error: "مُعرّف الطالب والرقم التسلسلي ورقم الإقامة كلها مطلوبة.",
      })
    }

    if (!uri) {
      console.error("MONGODB_URI is not defined in environment variables.")
      return res.status(500).json({
        error: "خطأ في تهيئة الخادم: MONGODB_URI غير معرف.",
      })
    }

    // التحقق من صحة ObjectId
    let objectId
    try {
      objectId = new ObjectId(id)
    } catch (error) {
      return res.status(400).json({
        error: "مُعرّف الطالب غير صالح.",
      })
    }

    client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })

    await client.connect()
    const database = client.db(dbName)
    const studentsCollection = database.collection(collectionName)

    // التحقق من وجود الطالب
    const existingStudent = await studentsCollection.findOne({ _id: objectId })
    if (!existingStudent) {
      return res.status(404).json({
        error: "لم يتم العثور على الطالب المطلوب تحديثه.",
      })
    }

    // التحقق من عدم تضارب البيانات مع طلاب آخرين
    const duplicateStudent = await studentsCollection.findOne({
      _id: { $ne: objectId },
      $or: [{ serial_number: serial_number.trim() }, { residency_number: residency_number.trim() }],
    })

    if (duplicateStudent) {
      return res.status(400).json({
        error: "يوجد طالب آخر مسجل بالفعل بنفس الرقم التسلسلي أو رقم الإقامة.",
      })
    }

    // تحديث بيانات الطالب
    const updateResult = await studentsCollection.updateOne(
      { _id: objectId },
      {
        $set: {
          serial_number: serial_number.trim(),
          residency_number: residency_number.trim(),
          document_serial_number: document_serial_number?.trim() || "",
          plate_number: plate_number?.trim() || "",
          inspection_date: inspection_date || "",
          manufacturer: manufacturer?.trim() || "",
          inspection_expiry_date: inspection_expiry_date || "",
          car_type: car_type?.trim() || "",
          counter_reading: counter_reading || "",
          chassis_number: chassis_number?.trim() || "",
          vehicle_model: vehicle_model?.trim() || "",
          color: color?.trim() || "",
          serial_number_duplicate: serial_number_duplicate?.trim() || "",
          arabic_name: arabic_name?.trim() || "",
          updated_at: new Date(),
        },
      },
    )

    if (updateResult.modifiedCount > 0) {
      return res.status(200).json({
        message: "تم تحديث بيانات الطالب بنجاح!",
      })
    } else if (updateResult.matchedCount > 0) {
      return res.status(200).json({
        message: "لم يتم تغيير أي بيانات (البيانات مطابقة للموجود).",
      })
    } else {
      return res.status(404).json({
        error: "لم يتم العثور على الطالب لتحديثه.",
      })
    }
  } catch (error) {
    console.error("خطأ في وظيفة تحديث الطالب:", error)
    return res.status(500).json({
      error: "حدث خطأ أثناء تحديث بيانات الطالب. يرجى المحاولة مرة أخرى.",
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
