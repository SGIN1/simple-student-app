import { MongoClient, ObjectId } from "mongodb"
import sharp from "sharp"
import path from "path"
import fs from "fs/promises"
import { fileURLToPath } from "url"
// تصحيح مسار الاستيراد للـ Pages Router
import { registerArabicFonts, createArabicTextWithCanvas, ARABIC_FONTS } from "../../utils/imageUtils.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const uri = process.env.MONGODB_URI
const dbName = "Cluster0"
const collectionName = "enrolled_students_tbl"

const CERTIFICATE_IMAGE_PATH = path.join(process.cwd(), "public", "images", "full", "wwee.jpg")

export default async function handler(req, res) {
  const { id } = req.query

  if (!id) {
    return res.status(400).json({ error: "يجب توفير معرف الطالب" })
  }

  let client

  try {
    // الاتصال بقاعدة البيانات
    client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    await client.connect()

    const db = client.db(dbName)
    const collection = db.collection(collectionName)

    // البحث عن الطالب باستخدام المعرف
    const student = await collection.findOne({ _id: new ObjectId(id) })

    if (!student) {
      return res.status(404).json({ error: "لم يتم العثور على الطالب" })
    }

    // تسجيل الخطوط العربية
    await registerArabicFonts()

    // التأكد من وجود صورة الشهادة
    try {
      await fs.access(CERTIFICATE_IMAGE_PATH)
    } catch (error) {
      console.error("صورة الشهادة غير موجودة:", CERTIFICATE_IMAGE_PATH)
      return res.status(500).json({ error: "صورة الشهادة غير موجودة" })
    }

    // قراءة صورة الشهادة
    const certificateBuffer = await fs.readFile(CERTIFICATE_IMAGE_PATH)

    // إنشاء صورة الشهادة باستخدام sharp
    const image = sharp(certificateBuffer)
    const metadata = await image.metadata()

    // التأكد من وجود الاسم العربي
    const arabicName = student.arabic_name || student.name || "غير محدد"

    console.log("اسم الطالب:", arabicName)

    // إنشاء النص العربي للاسم
    const studentNameBuffer = await createArabicTextWithCanvas({
      text: arabicName,
      font: ARABIC_FONTS.ARABIC_BOLD,
      fontSize: 48,
      color: "#000000",
      width: 600,
      height: 100,
      textAlign: "center",
    })

    // إنشاء نص إضافي للرقم التسلسلي
    const serialNumberBuffer = await createArabicTextWithCanvas({
      text: `الرقم التسلسلي: ${student.serial_number}`,
      font: ARABIC_FONTS.ARABIC_REGULAR,
      fontSize: 32,
      color: "#333333",
      width: 500,
      height: 80,
      textAlign: "center",
    })

    // إنشاء نص لرقم الإقامة
    const residencyNumberBuffer = await createArabicTextWithCanvas({
      text: `رقم الإقامة: ${student.residency_number}`,
      font: ARABIC_FONTS.ARABIC_REGULAR,
      fontSize: 32,
      color: "#333333",
      width: 500,
      height: 80,
      textAlign: "center",
    })

    // دمج النصوص مع الصورة
    const finalImage = await image
      .composite([
        {
          input: studentNameBuffer,
          top: Math.floor(metadata.height * 0.4), // 40% من ارتفاع الصورة
          left: Math.floor((metadata.width - 600) / 2), // توسيط النص
        },
        {
          input: serialNumberBuffer,
          top: Math.floor(metadata.height * 0.55), // 55% من ارتفاع الصورة
          left: Math.floor((metadata.width - 500) / 2),
        },
        {
          input: residencyNumberBuffer,
          top: Math.floor(metadata.height * 0.65), // 65% من ارتفاع الصورة
          left: Math.floor((metadata.width - 500) / 2),
        },
      ])
      .jpeg({ quality: 90 })
      .toBuffer()

    // إرسال الصورة كاستجابة
    res.setHeader("Content-Type", "image/jpeg")
    res.setHeader("Cache-Control", "public, max-age=3600")
    res.send(finalImage)
  } catch (error) {
    console.error("خطأ في إنشاء الشهادة:", error)
    res.status(500).json({
      error: "حدث خطأ أثناء إنشاء الشهادة",
      details: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    })
  } finally {
    if (client) {
      await client.close()
    }
  }
}
