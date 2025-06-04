import { MongoClient, ObjectId } from "mongodb"

// تعريف متغيرات الاتصال بقاعدة البيانات
const uri = process.env.MONGODB_URI
const dbName = "Cluster0"
const collectionName = "enrolled_students_tbl"

export default async function handler(req, res) {
  // إضافة CORS headers للسماح بالوصول من أي مصدر
  res.setHeader("Access-Control-Allow-Credentials", true)
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,POST,DELETE")
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
  )

  // التعامل مع طلبات OPTIONS
  if (req.method === "OPTIONS") {
    res.status(200).end()
    return
  }

  // التحقق من وجود رابط قاعدة البيانات
  if (!uri) {
    console.error("MONGODB_URI غير معرف في متغيرات البيئة")
    return res.status(500).json({
      error: "خطأ في إعدادات الخادم: MONGODB_URI غير معرف",
      details: "يرجى التأكد من إضافة متغير البيئة MONGODB_URI في إعدادات Vercel",
    })
  }

  let client = null

  try {
    // طباعة معلومات تصحيح الأخطاء
    console.log("محاولة الاتصال بقاعدة البيانات...")

    // إنشاء عميل MongoDB مع خيارات متقدمة
    client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 30000,
    })

    // الاتصال بقاعدة البيانات
    await client.connect()
    console.log("تم الاتصال بقاعدة البيانات بنجاح")

    const database = client.db(dbName)
    const studentsCollection = database.collection(collectionName)

    // استخراج معلمات البحث
    const searchTerm = req.query.search
    const studentId = req.query.id

    if (req.method === "GET") {
      // حالة البحث عن طالب محدد بواسطة المعرف
      if (studentId) {
        console.log(`البحث عن الطالب بالمعرف: ${studentId}`)

        let query
        try {
          const objectId = new ObjectId(studentId)
          query = { _id: objectId }
        } catch (error) {
          console.error("خطأ في تحويل المعرف:", error)
          return res.status(400).json({
            error: "مُعرّف الطالب غير صالح",
            details: "يجب أن يكون المعرف بتنسيق ObjectId صحيح",
          })
        }

        const student = await studentsCollection.findOne(query)

        if (student) {
          console.log("تم العثور على الطالب:", student._id.toString())

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
            created_at: student.created_at ? new Date(student.created_at).toLocaleDateString() : "غير محدد",
            arabic_name: student.arabic_name || "",
            name: student.name || student.arabic_name || "", // للتوافق مع الأكواد القديمة
          })
        } else {
          console.log(`لم يتم العثور على طالب بالمعرف: ${studentId}`)
          return res.status(404).json({ error: "لم يتم العثور على طالب بهذا المُعرّف" })
        }
      }
      // حالة جلب جميع الطلاب أو البحث
      else {
        console.log("جلب قائمة الطلاب")
        if (searchTerm) {
          console.log(`البحث عن: ${searchTerm}`)
        }

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
        console.log(`تم العثور على ${students.length} طالب`)

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
          created_at: student.created_at ? new Date(student.created_at).toLocaleDateString() : "غير محدد",
          arabic_name: student.arabic_name || "",
          name: student.name || student.arabic_name || "", // للتوافق مع الأكواد القديمة
        }))

        return res.status(200).json(formattedStudents)
      }
    } else {
      return res.status(405).json({ error: "الطريقة غير مسموح بها" })
    }
  } catch (error) {
    console.error("خطأ في وظيفة جلب الطلاب:", error)

    // تحسين رسائل الخطأ
    let errorMessage = "حدث خطأ غير متوقع في الخادم"
    let errorDetails = error.message || ""

    if (error.name === "MongoServerSelectionError") {
      errorMessage = "فشل الاتصال بخادم MongoDB"
      errorDetails = "تأكد من صحة رابط الاتصال وأن الخادم متاح"
    } else if (error.name === "MongoParseError") {
      errorMessage = "رابط اتصال MongoDB غير صالح"
      errorDetails = "تأكد من تنسيق رابط الاتصال"
    }

    return res.status(500).json({
      error: errorMessage,
      details: errorDetails,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    })
  } finally {
    // إغلاق الاتصال بقاعدة البيانات
    if (client) {
      try {
        await client.close()
        console.log("تم إغلاق اتصال قاعدة البيانات")
      } catch (closeError) {
        console.error("خطأ في إغلاق اتصال قاعدة البيانات:", closeError)
      }
    }
  }
}
