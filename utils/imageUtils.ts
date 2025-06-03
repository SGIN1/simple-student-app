// C:\wamp64\www\simple-student-app\utils\imageUtils.ts

// مساعدات للتعامل مع الخطوط العربية
export const ARABIC_FONTS = {
  noto: "Noto Sans Arabic",
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
 * Note: Sharp.js does not fetch external CSS/fonts from URLs when processing SVG buffers.
 * It relies on the font being available in the system where Sharp.js runs (Vercel's environment)
 * or the SVG itself explicitly embedding the font (e.g., as base64), which is more complex.
 * For this approach, we rely on 'Noto Sans Arabic' or 'Arial Unicode MS' being available on Vercel.
 */
export function createArabicTextSVG(
  text: string,
  options: {
    width?: number;
    height?: number;
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    backgroundColor?: string;
    textAlign?: "center" | "right" | "left";
  } = {},
): string {
  const {
    width = 800,
    height = 400,
    fontSize = 32,
    fontFamily = ARABIC_FONTS.noto, // Default to Noto Sans Arabic
    color = "#333333",
    backgroundColor = "transparent", // Default to transparent background
    textAlign = "center",
  } = options;

  // Adjust text-anchor and x position based on textAlign for SVG
  const textAnchor = textAlign === "center" ? "middle" : textAlign === "right" ? "end" : "start";
  // For 'start' and 'end', add a small margin/padding
  const x = textAlign === "center" ? width / 2 : textAlign === "right" ? width - 20 : 20;

  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      ${backgroundColor !== "transparent" ? `<rect width="100%" height="100%" fill="${backgroundColor}"/>` : ''}
      <text x="${x}" y="${height / 2}"
            font-family="${fontFamily}, 'Arial Unicode MS', sans-serif"
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
  // Arabic characters can vary significantly in width, so this is a heuristic.
  const estimatedCharWidth = fontSize * 0.6; 

  for (const word of words) {
    const potentialLine = currentLine ? `${currentLine} ${word}` : word;
    
    // Check if adding the word exceeds the estimated max width
    // We check `currentLine.length > 0` to ensure a word isn't immediately moved to a new line
    // if it's the very first word and it's long.
    if ((potentialLine.length * estimatedCharWidth) > maxWidth && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = word; // Start a new line with the current word
    } else {
      currentLine = potentialLine; // Add word to the current line
    }
  }
  
  if (currentLine.length > 0) {
    lines.push(currentLine); // Add any remaining text
  }
  return lines;
}