const fs = require('fs').promises;
const path = require('path');
const Jimp = require('jimp');

exports.handler = async (event, context) => {
    try {
        // استخدام المسار المطلق بناءً على المثال
        const imagePath = path.join(process.cwd(), "public/images_temp/wwee.jpg");
        console.log('محاولة قراءة الملف من المسار المطلق:', imagePath);
        const buffer = await fs.readFile(imagePath);
        console.log('تم قراءة الملف باستخدام fs.readFile بنجاح.');

        const image = await Jimp.read(buffer);
        console.log('تم قراءة الصورة باستخدام Jimp بنجاح.');

        const processedImageBuffer = await image.getBufferAsync(Jimp.MIME_JPEG);

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "image/jpeg"
            },
            body: processedImageBuffer.toString('base64'),
            isBase64Encoded: true
        };
    } catch (error) {
        console.error("Error processing image:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to process image", details: error.message })
        };
    } finally {
        console.log('انتهاء وظيفة generateCertificateTwo2.');
    }
};