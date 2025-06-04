import { MongoClient, ObjectId } from "mongodb"
import sharp from "sharp"
import path from "path"
import fs from "fs/promises"
import { fileURLToPath } from "url"

// استخدام مسار مطلق بدلاً من مسار نسبي
import { registerArabicFonts, createArabicTextWithCanvas, ARABIC_FONTS } from "@/utils/imageUtils.js"

// تحديد المسار الحالي
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const uri = process.env.MONGODB_URI
const dbName = "Cluster0"
const collectionName = "enrolled_students_tbl"

// استخدام مسار مطلق للصورة
const CERTIFICATE_IMAGE_PATH = path.join(process.cwd(), "public", "images", "full", "wwee.jpg")

export default async function handler(req, res) {
  // استخراج معرف الطالب من المسار
  const { id } = req.query

  if (!id) {
    return res.status(400).json({ error: "يجب توفير معرف الطالب" })
  }

  try {
    // الاتصال بقاعدة البيانات
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    await client.connect()

    const db = client.db(dbName)
    const collection = db.collection(collectionName)

    // البحث عن الطالب باستخدام المعرف
    const student = await collection.findOne({ _id: new ObjectId(id) })

    if (!student) {
      await client.close()
      return res.status(404).json({ error: "لم يتم العثور على الطالب" })
    }

    // تسجيل الخطوط العربية
    await registerArabicFonts()

    // قراءة صورة الشهادة
    const certificateBuffer = await fs.readFile(CERTIFICATE_IMAGE_PATH)

    // إنشاء صورة الشهادة باستخدام sharp
    const image = sharp(certificateBuffer)

    // إضافة اسم الطالب بالعربية
    const studentNameBuffer = await createArabicTextWithCanvas({
      text: student.name,
      font: ARABIC_FONTS.ARABIC_BOLD,
      fontSize: 60,
      color: "#000000",
      width: 800,
      height: 120,
      textAlign: "center",
    })

    // دمج النص مع الصورة
    const finalImage = await image
      .composite([
        {
          input: studentNameBuffer,
          top: 400, // تعديل الموضع حسب الحاجة
          left: 350, // تعديل الموضع حسب الحاجة
        },
      ])
      .toBuffer()

    // إغلاق اتصال قاعدة البيانات
    await client.close()

    // إرسال الصورة كاستجابة
    res.setHeader("Content-Type", "image/jpeg")
    res.send(finalImage)
  } catch (error) {
    console.error("خطأ في إنشاء الشهادة:", error)
    res.status(500).json({ error: "حدث خطأ أثناء إنشاء الشهادة", details: error.message })
  }
}
