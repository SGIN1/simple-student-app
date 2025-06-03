// C:\wamp64\www\simple-student-app\utils\imageUtils.ts

import { createCanvas, registerFont } from "canvas";
import path from "path";
import fs from "fs";
import sharp from "sharp"; // Sharp is still needed for compositing images

// تعريف الخطوط العربية المتاحة
export const ARABIC_FONTS = {
  arial: "Arial",
  notoSansArabic: "Noto Sans Arabic",
  amiri: "Amiri",
  cairo: "Cairo",
};

/**
 * دالة لتسجيل الخطوط العربية
 * يتم استدعاؤها مرة واحدة عند بدء التطبيق أو عند استدعاء الدالة التي تستخدم Canvas
 */
export function registerArabicFonts() {
  try {
    const fontsDir = path.join(process.cwd(), "public", "fonts");

    // تسجيل خط Arial إذا كان متوفراً
    const arialPath = path.join(fontsDir, "arial.ttf");
    if (fs.existsSync(arialPath)) {
      registerFont(arialPath, { family: "Arial" });
      console.log("✅ Arial font registered successfully");
    } else {
      console.warn(`⚠️ Arial font file not found at: ${arialPath}`);
    }

    // تسجيل خط Noto Sans Arabic إذا كان متوفراً
    const notoPath = path.join(fontsDir, "NotoSansArabic-Regular.ttf");
    if (fs.existsSync(notoPath)) {
      registerFont(notoPath, { family: "Noto Sans Arabic" });
      console.log("✅ Noto Sans Arabic font registered successfully");
    } else {
      console.warn(`⚠️ Noto Sans Arabic font file not found at: ${notoPath}`);
    }

    // يمكنك إضافة خطوط أخرى هنا بنفس الطريقة
    // const amiriPath = path.join(fontsDir, "Amiri-Regular.ttf");
    // if (fs.existsSync(amiriPath)) {
    //   registerFont(amiriPath, { family: "Amiri" });
    //   console.log("✅ Amiri font registered successfully");
    // }
  } catch (error) {
    console.error("❌ Error registering fonts:", error);
  }
}

/**
 * دالة محسنة لإنشاء نص عربي كصورة (Buffer) باستخدام Canvas.
 * هذه هي الدالة الأساسية التي ستقوم بتصيير النص بشكل صحيح.
 */
export async function createArabicTextWithCanvas(
  text: string,
  options: {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    width?: number;
    height?: number;
    textAlign?: "left" | "center" | "right";
    backgroundColor?: string;
    lineHeight?: number; // إضافة ارتفاع السطر لعدة أسطر
  } = {},
): Promise<Buffer> {
  const {
    fontSize = 24,
    fontFamily = ARABIC_FONTS.arial, // الخط الافتراضي
    color = "#000000",
    width = 800, // عرض افتراضي أكبر ليتناسب مع الشهادة
    height = 100, // ارتفاع افتراضي
    textAlign = "center",
    backgroundColor = "transparent",
    lineHeight = fontSize * 1.2, // ارتفاع السطر الافتراضي
  } = options;

  try {
    // تسجيل الخطوط (يمكن استدعاؤها عدة مرات بأمان)
    registerArabicFonts();

    // إنشاء canvas
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // تعيين الخلفية
    if (backgroundColor !== "transparent") {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);
    }

    ctx.font = `${fontSize}px "${fontFamily}", "Noto Sans Arabic", Arial, sans-serif`; // ترتيب الخطوط الاحتياطية
    ctx.fillStyle = color;
    ctx.textBaseline = "middle"; // لكي يكون النص في منتصف الارتفاع

    let x: number;
    switch (textAlign) {
      case "left":
        ctx.textAlign = "left";
        x = 20; // هامش من اليسار
        break;
      case "right":
        ctx.textAlign = "right";
        x = width - 20; // هامش من اليمين
        break;
      default: // center
        ctx.textAlign = "center";
        x = width / 2;
    }

    // تقسيم النص إلى أسطر (تبسيط، يمكن تحسينه ليلائم العرض)
    const lines = text.split("\n"); // افترض أن الأسطر مفصولة بـ \n
    const startY = (height - (lines.length - 1) * lineHeight) / 2; // لحساب الموضع الرأسي المركزي لعدة أسطر

    lines.forEach((line, index) => {
      ctx.fillText(line, x, startY + index * lineHeight);
    });

    // تحويل إلى buffer (صورة PNG)
    return canvas.toBuffer("image/png");
  } catch (error) {
    console.error("❌ Error creating Arabic text with Canvas:", error);
    throw new Error(`Failed to create Arabic text: ${error.message}`);
  }
}

/**
 * هذه الدالة لم تعد تستخدم للرسم الفعلي للنص في هذا الحل،
 * ولكنها يمكن أن تستخدم لإنشاء SVGs لأغراض أخرى إذا لزم الأمر.
 * احتفظنا بها كما أرسلها المطورون، ولكن النص الفعلي سيتم رسمه بواسطة createArabicTextWithCanvas.
 */
export function createArabicTextSVG(
  text: string,
  options: {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    x?: number;
    y?: number;
    textAnchor?: "start" | "middle" | "end";
    direction?: "rtl" | "ltr";
  } = {},
): string {
  const {
    fontSize = 24,
    fontFamily = ARABIC_FONTS.arial,
    color = "#000000",
    x = 0,
    y = 0,
    textAnchor = "middle",
    direction = "rtl",
  } = options;

  const cleanText = text.replace(/[<>&"']/g, (match) => {
    const entities: { [key: string]: string } = {
      "<": "&lt;",
      ">": "&gt;",
      "&": "&amp;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[match];
  });

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="100">
      <defs>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700&amp;display=swap');
          .arabic-text {
            font-family: "${fontFamily}", "Noto Sans Arabic", Arial, sans-serif;
            font-size: ${fontSize}px;
            fill: ${color};
            text-anchor: ${textAnchor};
            direction: ${direction};
            unicode-bidi: bidi-override;
          }
        </style>
      </defs>
      <text x="${x}" y="${y}" class="arabic-text" dominant-baseline="middle">
        ${cleanText}
      </text>
    </svg>
  `.trim();
}

/**
 * دالة لتركيب صورة نص (Buffer) على الصورة الأساسية باستخدام Sharp.js.
 * هذا الجزء لا يتغير كثيرًا لأنه يتعامل معbuffers جاهزة.
 */
export async function compositeTextOnImage(
  baseImageBuffer: Buffer,
  textBuffer: Buffer,
  position: { left: number; top: number },
): Promise<Buffer> {
  try {
    console.log("🔄 Starting image composition...");

    const result = await sharp(baseImageBuffer)
      .composite([
        {
          input: textBuffer,
          left: position.left,
          top: position.top,
          blend: "over",
        },
      ])
      .jpeg({ quality: 90 })
      .toBuffer();

    console.log("✅ Image composition completed successfully");
    return result;
  } catch (error) {
    console.error("❌ Error in image composition:", error);
    throw new Error(`Image composition failed: ${error.message}`);
  }
}

/**
 * دالة شاملة لإنشاء شهادة مع نص عربي، تجمع بين تحميل الصورة الأصلية
 * وإنشاء النص باستخدام Canvas، ثم تركيب النص على الصورة.
 */
export async function generateCertificateWithArabicText(
  baseImagePath: string,
  arabicText: string,
  options: {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    position?: { left: number; top: number };
    textWidth?: number;
    textHeight?: number;
  } = {},
): Promise<Buffer> {
  const {
    fontSize = 32,
    fontFamily = ARABIC_FONTS.arial,
    color = "#000000",
    position = { left: 100, top: 200 },
    textWidth = 600,
    textHeight = 80,
  } = options;

  try {
    console.log("🔄 Generating certificate with Arabic text...");

    // قراءة الصورة الأساسية
    const baseImageBuffer = await sharp(baseImagePath).toBuffer();
    console.log("✅ Base image loaded successfully");

    // إنشاء النص العربي باستخدام Canvas
    const textBuffer = await createArabicTextWithCanvas(arabicText, {
      fontSize,
      fontFamily,
      color,
      width: textWidth,
      height: textHeight,
      textAlign: "center",
      // يمكنك إضافة lineHeight هنا إذا كان النص متعدد الأسطر
    });
    console.log("✅ Arabic text created successfully");

    // تركيب النص على الصورة
    const finalImage = await compositeTextOnImage(baseImageBuffer, textBuffer, position);
    console.log("✅ Certificate generated successfully");

    return finalImage;
  } catch (error) {
    console.error("❌ Error generating certificate:", error);
    throw new Error(`Certificate generation failed: ${error.message}`);
  }
}