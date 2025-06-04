// C:\wamp64\www\simple-student-app\utils\imageUtils.ts

import { createCanvas, registerFont } from "canvas"
import path from "path"
import fs from "fs/promises"

// تعريف مسارات الخطوط (تأكد من وجود ملفات الخطوط هذه في public/fonts)
export const ARABIC_FONTS = {
    ARABIC_REGULAR: "Arabic-Regular", // اسم الخط الذي سيتم تسجيله في Canvas
    ARABIC_BOLD: "Arabic-Bold",     // اسم الخط الذي سيتم تسجيله في Canvas
    ENGLISH_REGULAR: "English-Regular",
    ENGLISH_BOLD: "English-Bold",
}

// متغير لتتبع ما إذا كانت الخطوط قد تم تسجيلها بالفعل لتجنب التسجيل المتكرر
let fontsRegistered = false;

// تسجيل الخطوط العربية (تم جعلها async لأنها تستخدم fs.access)
export async function registerArabicFonts() {
    if (fontsRegistered) {
        console.log("الخطوط العربية مسجلة بالفعل.");
        return true;
    }

    const fontsDir = path.join(process.cwd(), "public", "fonts");

    try {
        // تأكد من وجود مجلد الخطوط
        await fs.access(fontsDir); // استخدام await مع fs.access
        console.log(`✅ تم العثور على مجلد الخطوط: ${fontsDir}`);

        // قائمة ملفات الخطوط للتسجيل (تأكد من الأسماء الفعلية لملفات .ttf)
        const fontFilesToRegister = [
            { name: ARABIC_FONTS.ARABIC_REGULAR, path: path.join(fontsDir, "arabic-regular.ttf") },
            { name: ARABIC_FONTS.ARABIC_BOLD, path: path.join(fontsDir, "arabic-bold.ttf") },
            { name: ARABIC_FONTS.ENGLISH_REGULAR, path: path.join(fontsDir, "english-regular.ttf") },
            { name: ARABIC_FONTS.ENGLISH_BOLD, path: path.join(fontsDir, "english-bold.ttf") },
        ];

        fontFilesToRegister.forEach(font => {
            if (fs.existsSync(font.path)) { // fs.existsSync لا يدعم await
                registerFont(font.path, { family: font.name });
                console.log(`✅ تم تسجيل خط ${font.name} بنجاح من: ${font.path}`);
            } else {
                console.warn(`⚠️ لم يتم العثور على ملف خط ${font.name} في: ${font.path}. يرجى التأكد من وجوده في public/fonts.`);
            }
        });

        fontsRegistered = true; // تعيين العلامة بعد التسجيل الناجح
        return true;
    } catch (error) {
        console.error("❌ خطأ أثناء تسجيل الخطوط:", error);
        throw new Error(`فشل في تسجيل الخطوط: ${error.message}`);
    }
}

// إنشاء نص عربي باستخدام Canvas
export async function createArabicTextWithCanvas({ text, font, fontSize, color, width, height, textAlign = "center" }) {
    // إنشاء كانفاس بالأبعاد المطلوبة
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // تعيين خصائص النص
    ctx.font = `${fontSize}px "${font}"`; // استخدام الخط الذي تم تمريره
    ctx.fillStyle = color;
    ctx.textAlign = textAlign;
    ctx.textBaseline = "middle";

    // كتابة النص العربي (من اليمين إلى اليسار)
    // هذا مهم جدا للنصوص العربية
    ctx.direction = "rtl";

    let x;
    switch (textAlign) {
        case "left":
            x = 0; // عادة يكون 0 أو هامش صغير
            break;
        case "right":
            x = width; // عادة يكون العرض الكامل أو هامش صغير من النهاية
            break;
        case "center":
        default:
            x = width / 2;
            break;
    }

    ctx.fillText(text, x, height / 2);

    // تحويل الكانفاس إلى صورة
    return canvas.toBuffer("image/png");
}

// دالة registerEnglishFonts (إذا كنت تستخدمها في مكان آخر في تطبيقك)
// إذا كانت لا تستخدم، يمكن إزالتها لتجنب التصدير غير الضروري.
export function registerEnglishFonts() {
    console.log("تسجيل الخطوط الإنجليزية (دالة لا تقوم بالتسجيل الفعلي للخطوط من ملفات الخطوط)");
    // إذا كنت بحاجة لتسجيل خطوط إنجليزية فعلية، يجب إضافة الكود هنا
    // مثل:
    // registerFont(path.join(process.cwd(), "public", "fonts", "english-regular.ttf"), { family: "English-Regular" });
}

// دوال إضافية من الكود الأصلي (إذا كنت لا تزال تستخدمها، أبقها)
// export function createArabicTextSVG(...) { ... }
// export async function compositeTextOnImage(...) { ... }
// export async function generateCertificateWithArabicText(...) { ... }