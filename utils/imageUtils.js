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
        // استخدام خط افتراضي إذا لم يوجد الخط المطلوب
        if (font.family.includes("ARABIC")) {
          // يمكن استخدام خط نظام افتراضي للعربية
          console.log(`استخدام خط افتراضي بدلاً من: ${font.family}`)
        }
      }
    }

    return true
  } catch (error) {
    console.error("خطأ في تسجيل الخطوط:", error)
    // لا نرمي خطأ هنا، بل نستخدم الخطوط الافتراضية
    console.log("سيتم استخدام الخطوط الافتراضية للنظام")
    return false
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

  // تعيين خصائص النص مع fallback للخطوط
  let fontFamily = font
  try {
    ctx.font = `${fontSize}px ${fontFamily}`
  } catch (error) {
    // استخدام خط افتراضي إذا فشل الخط المطلوب
    fontFamily = "Arial, sans-serif"
    ctx.font = `${fontSize}px ${fontFamily}`
    console.warn(`استخدام خط افتراضي: ${fontFamily}`)
  }

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

  // تحويل الكانفاس إلى صورة PNG عالية الجودة
  return canvas.toBuffer("image/png", { compressionLevel: 6, filters: canvas.PNG_FILTER_NONE })
}

// دالة لإنشاء نص إنجليزي
export function registerEnglishFonts() {
  console.log("تسجيل الخطوط الإنجليزية")
}
