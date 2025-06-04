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

    // تسجيل الخطوط العربية
    registerFont(path.join(fontsDir, "arabic-regular.ttf"), { family: ARABIC_FONTS.ARABIC_REGULAR })
    registerFont(path.join(fontsDir, "arabic-bold.ttf"), { family: ARABIC_FONTS.ARABIC_BOLD })

    // تسجيل الخطوط الإنجليزية إذا كانت مطلوبة
    registerFont(path.join(fontsDir, "english-regular.ttf"), { family: ARABIC_FONTS.ENGLISH_REGULAR })
    registerFont(path.join(fontsDir, "english-bold.ttf"), { family: ARABIC_FONTS.ENGLISH_BOLD })

    return true
  } catch (error) {
    console.error("خطأ في تسجيل الخطوط:", error)
    throw new Error(`فشل في تسجيل الخطوط: ${error.message}`)
  }
}

// إنشاء نص عربي باستخدام Canvas
export async function createArabicTextWithCanvas({ text, font, fontSize, color, width, height, textAlign = "center" }) {
  // إنشاء كانفاس بالأبعاد المطلوبة
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext("2d")

  // تعيين خصائص النص
  ctx.font = `${fontSize}px ${font}`
  ctx.fillStyle = color
  ctx.textAlign = textAlign
  ctx.textBaseline = "middle"

  // كتابة النص العربي (من اليمين إلى اليسار)
  ctx.direction = "rtl"
  ctx.fillText(text, width / 2, height / 2)

  // تحويل الكانفاس إلى صورة
  return canvas.toBuffer("image/png")
}

// دالة لإنشاء نص إنجليزي إذا كنت بحاجة إليها
export function registerEnglishFonts() {
  // يمكنك إضافة تنفيذ هذه الدالة إذا كنت بحاجة إليها
  console.log("تسجيل الخطوط الإنجليزية")
}
