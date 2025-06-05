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
    const { id } = req.body

    if (!id) {
      return res.status(400).json({
        error: "مُعرّف الطالب مطلوب للحذف.",
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

    // التحقق من وجود الطالب قبل الحذف
    const existingStudent = await studentsCollection.findOne({ _id: objectId })
    if (!existingStudent) {
      return res.status(404).json({
        error: "لم يتم العثور على الطالب المطلوب حذفه.",
      })
    }

    // حذف الطالب
    const deleteResult = await studentsCollection.deleteOne({ _id: objectId })

    if (deleteResult.deletedCount > 0) {
      return res.status(200).json({
        message: "تم حذف الطالب بنجاح!",
      })
    } else {
      return res.status(500).json({
        error: "فشل في حذف الطالب من قاعدة البيانات.",
      })
    }
  } catch (error) {
    console.error("خطأ في وظيفة حذف الطالب:", error)
    return res.status(500).json({
      error: "حدث خطأ أثناء حذف الطالب. يرجى المحاولة مرة أخرى.",
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
