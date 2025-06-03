// C:\wamp64\www\simple-student-app\utils\imageUtils.ts

// الصق سلسلة Base64 للخط هنا بعد تشغيل السكريبت الموضح أعلاه
// يجب أن تبدأ بـ "data:font/ttf;base64,..."
const NOTO_SANS_ARABIC_BASE64 = "YOUR_GENERATED_BASE64_NOTO_FONT_STRING_HERE";

// مساعدات للتعامل مع الخطوط العربية
export const ARABIC_FONTS = {
  noto: "Noto Sans Arabic", // هذا يستخدم كمعرف فقط، وليس لجلب الخط
  amiri: "Amiri",
  cairo: "Cairo",
  tajawal: "Tajawal",
  almarai: "Almarai",
};

export const GOOGLE_FONTS_URLS = {
  noto: "https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700&display=swap",
  amiri: "https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap",
  cairo: "https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap",
  tajawal: "https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap",
  almarai: "https://fonts.googleapis.com/css2?family=Almarai:wght@400;700&display=swap",
};

/**
 * Creates an SVG string with Arabic text.
 * This SVG can then be composited onto another image using Sharp.js.
 * This version embeds the Noto Sans Arabic font directly using base64.
 */
export function createArabicTextSVG(
  text: string,
  options: {
    width?: number;
    height?: number;
    fontSize?: number;
    fontFamily?: string; // هذا الخيار لم يعد يستخدم لجلب الخط، فقط كمعرف
    color?: string;
    backgroundColor?: string;
    textAlign?: "center" | "right" | "left";
  } = {},
): string {
  const {
    width = 800,
    height = 400,
    fontSize = 32,
    // fontFamily = ARABIC_FONTS.noto, // لم نعد نعتمد على هذا لجلب الخط
    color = "#333333",
    backgroundColor = "transparent",
    textAlign = "center",
  } = options;

  const textAnchor = textAlign === "center" ? "middle" : textAlign === "right" ? "end" : "start";
  const x = textAlign === "center" ? width / 2 : textAlign === "right" ? width - 20 : 20;

  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <style>
        /* تعريف الخط العربي باستخدام Base64 لضمان توفره */
        @font-face {
          font-family: 'Noto Sans Arabic Embed'; /* اسم الخط الذي سيتم استخدامه في SVG */
          src: url('${NOTO_SANS_ARABIC_BASE64}') format('truetype');
          font-weight: 400;
          font-style: normal;
        }
      </style>
      ${backgroundColor !== "transparent" ? `<rect width="100%" height="100%" fill="${backgroundColor}"/>` : ''}
      <text x="${x}" y="${height / 2}"
                  font-family="&apos;Noto Sans Arabic Embed&apos;, &apos;Arial Unicode MS&apos;, sans-serif"
                  font-size="${fontSize}px"
                  fill="${color}"
                  text-anchor="${textAnchor}"
                  dominant-baseline="middle"
                  direction="rtl">
        ${text}
      </text>
    </svg>
  `;
}

/**
 * Basic function to wrap Arabic text into multiple lines for SVG.
 * This function estimates character width and breaks lines.
 * For more complex and accurate Arabic text layout (ligatures, kashida, etc.),
 * a dedicated text shaping library might be required.
 */
export function wrapArabicText(text: string, maxWidth: number, fontSize: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  // Approximate character width (needs adjustment based on your chosen font and visual testing)
  const estimatedCharWidth = fontSize * 0.6;

  for (const word of words) {
    const potentialLine = currentLine ? `${currentLine} ${word}` : word;

    if ((potentialLine.length * estimatedCharWidth) > maxWidth && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = potentialLine;
    }
  }

  if (currentLine.length > 0) {
    lines.push(currentLine);
  }
  return lines;
}