import { createCanvas, registerFont } from "canvas"
import path from "path"
import fs from "fs/promises"

// تعريف مسارات الخطوط
export const ARABIC_FONTS = {
  ARABIC_REGULAR: "Arabic-Regular",
  ARABIC_BOLD: "Arabic-Bold",
  ENGLISH_REGULAR: "English-Regular",
  ENGLISH_BOLD: "English-Bold",
}

// تسجيل الخطوط العربية
export async function registerArabicFonts() {
  const fontsDir = path.join(process.cwd(), "public", "fonts")

  try {
    // تأكد من وجود مجلد الخطوط
    await fs.access(fontsDir)

    // قائمة الخطوط المطلوبة
    const fontFiles = [
      { file: "arabic-regular.ttf", family: ARABIC_FONTS.ARABIC_REGULAR },
      { file: "arabic-bold.ttf", family: ARABIC_FONTS.ARABIC_BOLD },
      { file: "english-regular.ttf", family: ARABIC_FONTS.ENGLISH_REGULAR },
      { file: "english-bold.ttf", family: ARABIC_FONTS.ENGLISH_BOLD },
    ]

    // تسجيل كل خط مع التحقق من وجوده
    for (const font of fontFiles) {
      const fontPath = path.join(fontsDir, font.file)
      try {
        await fs.access(fontPath)
        registerFont(fontPath, { family: font.family })
        console.log(`تم تسجيل الخط: ${font.family}`)
      } catch (error) {
        console.warn(`الخط غير موجود: ${font.file}`)
        // يمكنك إضافة خط افتراضي هنا إذا لزم الأمر
      }
    }

    return true
  } catch (error) {
    console.error("خطأ في تسجيل الخطوط:", error)
    throw new Error(`فشل في تسجيل الخطوط: ${error.message}`)
  }
}

// إنشاء نص عربي باستخدام Canvas مع تحسينات
export async function createArabicTextWithCanvas({
  text,
  font,
  fontSize,
  color,
  width,
  height,
  textAlign = "center",
  backgroundColor = "transparent",
}) {
  // إنشاء كانفاس بالأبعاد المطلوبة
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext("2d")

  // تعيين خلفية شفافة أو ملونة
  if (backgroundColor !== "transparent") {
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, width, height)
  }

  // تعيين خصائص النص
  ctx.font = `${fontSize}px ${font}`
  ctx.fillStyle = color
  ctx.textAlign = textAlign
  ctx.textBaseline = "middle"

  // تحسين جودة النص
  ctx.textRenderingOptimization = "optimizeQuality"
  ctx.antialias = "subpixel"

  // كتابة النص العربي (من اليمين إلى اليسار)
  ctx.direction = "rtl"

  // تحديد موضع النص بناءً على المحاذاة
  let x
  switch (textAlign) {
    case "left":
      x = 20
      break
    case "right":
      x = width - 20
      break
    case "center":
    default:
      x = width / 2
      break
  }

  // كتابة النص
  ctx.fillText(text, x, height / 2)

  // إضافة حدود للنص (اختياري)
  // ctx.strokeStyle = "#ffffff"
  // ctx.lineWidth = 2
  // ctx.strokeText(text, x, height / 2)

  // تحويل الكانفاس إلى صورة PNG عالية الجودة
  return canvas.toBuffer("image/png", { compressionLevel: 6, filters: canvas.PNG_FILTER_NONE })
}

// دالة مساعدة لقياس النص
export function measureArabicText(text, font, fontSize) {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")
  ctx.font = `${fontSize}px ${font}`
  return ctx.measureText(text)
}

// دالة لإنشاء نص متعدد الأسطر
export async function createMultiLineArabicText({
  lines,
  font,
  fontSize,
  color,
  width,
  lineHeight,
  textAlign = "center",
  backgroundColor = "transparent",
}) {
  const totalHeight = lines.length * lineHeight
  const canvas = createCanvas(width, totalHeight)
  const ctx = canvas.getContext("2d")

  // تعيين الخلفية
  if (backgroundColor !== "transparent") {
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, width, totalHeight)
  }

  // تعيين خصائص النص
  ctx.font = `${fontSize}px ${font}`
  ctx.fillStyle = color
  ctx.textAlign = textAlign
  ctx.textBaseline = "middle"
  ctx.direction = "rtl"

  // كتابة كل سطر
  lines.forEach((line, index) => {
    const y = (index + 0.5) * lineHeight
    let x
    switch (textAlign) {
      case "left":
        x = 20
        break
      case "right":
        x = width - 20
        break
      case "center":
      default:
        x = width / 2
        break
    }
    ctx.fillText(line, x, y)
  })

  return canvas.toBuffer("image/png", { compressionLevel: 6, filters: canvas.PNG_FILTER_NONE })
}

// دالة لإنشاء نص إنجليزي
export function registerEnglishFonts() {
  console.log("تسجيل الخطوط الإنجليزية")
  // يمكن إضافة تنفيذ إضافي هنا إذا لزم الأمر
}
