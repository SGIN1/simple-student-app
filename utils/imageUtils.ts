// C:\wamp64\www\simple-student-app\utils\imageUtils.ts

import { createCanvas, registerFont } from "canvas";
import path from "path";
import fs from "fs";
import sharp from "sharp";

// تصدير الثابت ARABIC_FONTS
export const ARABIC_FONTS = {
    arial: "Arial",
    notoSansArabic: "Noto Sans Arabic",
    amiri: "Amiri",
    cairo: "Cairo",
};

// متغير لتتبع ما إذا كانت الخطوط قد تم تسجيلها بالفعل
let fontsRegistered = false;

// تصدير الدالة registerArabicFonts
export function registerArabicFonts() {
    if (fontsRegistered) {
        console.log("الخطوط العربية مسجلة بالفعل.");
        return;
    }

    try {
        const fontsDir = path.join(process.cwd(), "public", "fonts");

        // تحقق من وجود ملفات الخطوط وسجلها
        const fontFiles = [
            { name: "Arial", path: path.join(fontsDir, "arial.ttf") },
            { name: "Noto Sans Arabic", path: path.join(fontsDir, "NotoSansArabic-Regular.ttf") },
            // أضف أي خطوط أخرى تستخدمها هنا
        ];

        fontFiles.forEach(font => {
            if (fs.existsSync(font.path)) {
                registerFont(font.path, { family: font.name });
                console.log(`✅ تم تسجيل خط ${font.name} بنجاح من: ${font.path}`);
            } else {
                console.warn(`⚠️ لم يتم العثور على ملف خط ${font.name} في: ${font.path}. يرجى التأكد من وجوده في public/fonts.`);
            }
        });

        fontsRegistered = true; // تعيين العلامة بعد التسجيل الناجح
    } catch (error) {
        console.error("❌ خطأ أثناء تسجيل الخطوط:", error);
    }
}

// تصدير الدالة createArabicTextWithCanvas
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
        lineHeight?: number;
    } = {},
): Promise<Buffer> {
    const {
        fontSize = 24,
        fontFamily = ARABIC_FONTS.arial,
        color = "#000000",
        width = 800,
        height = 100,
        textAlign = "center",
        backgroundColor = "transparent",
        lineHeight = fontSize * 1.2,
    } = options;

    try {
        // لا تستدعي registerArabicFonts هنا داخل هذه الدالة.
        // يجب أن يتم استدعاؤها مرة واحدة في بداية التطبيق أو في الدالة الأم.
        // registerArabicFonts(); // تم إزالة هذا السطر

        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext("2d");

        if (backgroundColor !== "transparent") {
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, width, height);
        }

        ctx.font = `${fontSize}px "${fontFamily}", "Noto Sans Arabic", Arial, sans-serif`;
        ctx.fillStyle = color;
        ctx.textBaseline = "middle";

        let x: number;
        switch (textAlign) {
            case "left":
                ctx.textAlign = "left";
                x = 20;
                break;
            case "right":
                ctx.textAlign = "right";
                x = width - 20;
                break;
            default:
                ctx.textAlign = "center";
                x = width / 2;
        }

        const lines = text.split("\n");
        const startY = (height - (lines.length - 1) * lineHeight) / 2;

        lines.forEach((line, index) => {
            ctx.fillText(line, x, startY + index * lineHeight);
        });

        return canvas.toBuffer("image/png");
    } catch (error) {
        console.error("❌ خطأ أثناء إنشاء النص العربي باستخدام Canvas:", error);
        throw new Error(`فشل إنشاء النص العربي: ${error.message}`);
    }
}

// الدالة createArabicTextSVG هي نفسها، لا تحتاج إلى تغيير
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

// الدالة compositeTextOnImage هي نفسها، لا تحتاج إلى تغيير
export async function compositeTextOnImage(
    baseImageBuffer: Buffer,
    textBuffer: Buffer,
    position: { left: number; top: number },
): Promise<Buffer> {
    try {
        console.log("🔄 جارٍ بدء دمج الصورة...");

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

        console.log("✅ تم دمج الصورة بنجاح.");
        return result;
    } catch (error) {
        console.error("❌ خطأ في دمج الصورة:", error);
        throw new Error(`فشل دمج الصورة: ${error.message}`);
    }
}

// الدالة generateCertificateWithArabicText هي نفسها، لا تحتاج إلى تغيير
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
        console.log("🔄 جارٍ إنشاء الشهادة بالنص العربي...");

        const baseImageBuffer = await sharp(baseImagePath).toBuffer();
        console.log("✅ تم تحميل الصورة الأساسية بنجاح.");

        const textBuffer = await createArabicTextWithCanvas(arabicText, {
            fontSize,
            fontFamily,
            color,
            width: textWidth,
            height: textHeight,
            textAlign: "center",
        });
        console.log("✅ تم إنشاء النص العربي بنجاح.");

        const finalImage = await compositeTextOnImage(baseImageBuffer, textBuffer, position);
        console.log("✅ تم إنشاء الشهادة بنجاح.");

        return finalImage;
    } catch (error) {
        console.error("❌ خطأ أثناء إنشاء الشهادة:", error);
        throw new Error(`فشل إنشاء الشهادة: ${error.message}`);
    }
}