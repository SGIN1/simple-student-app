import { MongoClient, ObjectId } from 'mongodb';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

const uri = process.env.MONGODB_URI;
const dbName = 'Cluster0';
const collectionName = 'enrolled_students_tbl';

// تأكد أن هذا هو المسار الصحيح لصورتك
const CERTIFICATE_IMAGE_PATH = path.join(process.cwd(), 'public', 'images', 'full', 'wwee.jpg');

// **تم التغيير هنا لاستخدام خط Noto Sans Arabic**
const FONT_FILENAME = 'NotoSansArabic-Regular.ttf'; // يجب أن يكون هذا هو اسم ملف الخط الذي وضعته في public/fonts/
const FONT_PATH = path.join(process.cwd(), 'public', 'fonts', FONT_FILENAME);
const FONT_CSS_FAMILY_NAME = 'Noto Sans Arabic'; // يجب أن يتطابق هذا مع اسم عائلة الخط داخل ملف .ttf

const RED_COLOR_HEX = '#FF0000'; 

// المواقع الجديدة للنصين الترحيبيين بناءً على أبعاد الصورة 978x1280
const CERTIFICATE_TEXT_POSITIONS = {
    WELCOME_TEXT_TOP: {
        text: "أهلاً وسهلاً بكم في هذا الاختبار!", 
        x: 0, 
        y: 100, 
        fontSize: 35, 
        color: RED_COLOR_HEX, 
        gravity: 'center' 
    },
    WELCOME_TEXT_BOTTOM: {
        text: "نأمل أن تظهر النصوص الآن بوضوح.", 
        x: 0, 
        y: 150, 
        fontSize: 30, 
        color: RED_COLOR_HEX, 
        gravity: 'center' 
    }
};

/**
 * دالة مساعدة لإنشاء نص كـ Buffer لـ sharp باستخدام sharp.text().
 */
async function createSharpTextBuffer(text, fontSize, color, svgWidth, svgHeight, gravity, fontCssFamilyName) {
    let align = 'centre';
    if (gravity === 'west') {
        align = 'left';
    } else if (gravity === 'east') {
        align = 'right';
    }

    let estimatedLineHeight = fontSize * 1.5;
    estimatedLineHeight = Math.ceil(estimatedLineHeight); 

    return sharp({
        text: {
            text: `<span foreground="${color}">${text}</span>`,
            font: fontCssFamilyName,
            fontfile: FONT_PATH, // هنا يتم الإشارة إلى ملف الخط الفعلي
            width: svgWidth, 
            height: estimatedLineHeight, 
            align: align,
            rgba: true
        }
    }).png().toBuffer();
}


export default async function handler(req, res) {
    console.log('--- بدأ تنفيذ دالة generateCertificateTwo2 ---');

    if (req.method !== 'GET') {
        console.log('طلب غير مسموح به:', req.method);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { id } = req.query;

    if (!id) {
        console.log('معرف الطالب غير موجود في الطلب.');
        return res.status(400).json({ error: 'معرف الطالب (ID) مطلوب.' });
    }

    let client;
    try {
        console.log('جارٍ الاتصال بقاعدة البيانات...');
        client = new MongoClient(uri);
        await client.connect();
        console.log('تم الاتصال بقاعدة البيانات بنجاح.');

        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        let student;
        try {
            const objectId = new ObjectId(id);
            student = await collection.findOne({ _id: objectId });
            console.log('تم البحث عن الطالب باستخدام _id:', objectId);
        } catch (e) {
            console.error('خطأ في تحويل ID إلى ObjectId:', e.message);
            return res.status(400).json({ error: 'مُعرّف الطالب غير صالح. يجب أن يكون ObjectId صحيحًا.' });
        }

        if (!student) {
            console.log('لم يتم العثور على طالب بالمعرف:', id);
            return res.status(404).json({ error: 'لم يتم العثور على طالب بهذا المعرف.' });
        }
        console.log('تم جلب بيانات الطالب:', JSON.stringify(student, null, 2));


        console.log('جارٍ التحقق من صورة الشهادة...');
        try {
            await fs.access(CERTIFICATE_IMAGE_PATH);
            console.log('صورة الشهادة موجودة.', CERTIFICATE_IMAGE_PATH);
        } catch (fileError) {
            console.error('خطأ: صورة الشهادة غير موجودة أو لا يمكن الوصول إليها:', fileError.message);
            return res.status(500).json({
                error: 'صورة الشهادة غير موجودة أو لا يمكن الوصول إليها. يرجى التحقق من مسار ملف الصورة في النشر.',
                details: fileError.message,
                path: CERTIFICATE_IMAGE_PATH
            });
        }

        console.log('جارٍ معالجة الصورة الأساسية...');
        const baseImage = sharp(CERTIFICATE_IMAGE_PATH);
        const metadata = await baseImage.metadata();
        const imageWidth = metadata.width;
        const imageHeight = metadata.height;
        console.log('أبعاد الصورة الفعلية التي تم تحميلها:', imageWidth, 'x', imageHeight);

        if (imageWidth !== 978 || imageHeight !== 1280) {
             console.warn(`تحذير: أبعاد الصورة الفعلية (${imageWidth}x${imageHeight}) لا تتطابق مع الأبعاد المتوقعة (978x1280). يرجى التأكد من أن الصورة هي wwee.jpg بالأبعاد الصحيحة.`);
        }


        let processedImage = baseImage;

        console.log('جارٍ التحقق من ملف الخط...');
        try {
            await fs.access(FONT_PATH);
            console.log('ملف الخط موجود في المسار المحدد:', FONT_PATH);
        } catch (fontError) {
            console.error('خطأ: ملف الخط غير موجود أو لا يمكن الوصول إليه:', fontError.message);
            return res.status(500).json({
                error: 'ملف الخط غير موجود أو لا يمكن الوصول إليه. يرجى التأكد من وضعه في المسار الصحيح وتضمينه في النشر.',
                details: fontError.message,
                path: FONT_PATH
            });
        }

        console.log('جارٍ إضافة النصوص إلى الصورة...');
        const fieldsToDisplay = ['WELCOME_TEXT_TOP', 'WELCOME_TEXT_BOTTOM']; 

        for (const key of fieldsToDisplay) {
            const pos = CERTIFICATE_TEXT_POSITIONS?.[key]; 
            if (pos) {
                let textToDisplay = pos.text; 

                const textRenderHeight = (pos.fontSize || 30) * 1.5;
                const yPosition = pos.y || 0;

                if ((pos.x < 0 || pos.x > imageWidth) || (yPosition < 0 || (yPosition + textRenderHeight) > imageHeight)) { 
                    console.warn(`النص "${textToDisplay}" (المفتاح: ${key}) خارج حدود الصورة أو يتجاوزها (أبعاد الصورة: ${imageWidth}x${imageHeight}). قد لا يظهر بالكامل.`);
                }
                
                console.log(`إنشاء نص لـ: ${key} بـ: "${textToDisplay}" عند X: ${pos.x}, Y: ${yPosition}`);

                const textOverlayBuffer = await createSharpTextBuffer(
                    textToDisplay,
                    pos.fontSize || 30, 
                    pos.color || RED_COLOR_HEX, 
                    imageWidth, 
                    Math.ceil(textRenderHeight),
                    pos.gravity || 'center', 
                    FONT_CSS_FAMILY_NAME
                );
                console.log(`تم إنشاء Buffer للنص ${key}`);

                processedImage = await processedImage.composite([{
                    input: textOverlayBuffer,
                    left: pos.x || 0, 
                    top: yPosition,
                }]);
                console.log(`تم تركيب النص ${key}`);
            }
        }

        console.log('جارٍ إنشاء الصورة النهائية...');
        const finalImageBuffer = await processedImage
            .flatten({ background: { r: 255, g: 255, b: 255, alpha: 1 } })
            .jpeg({
                quality: 85,
                progressive: true
            }).toBuffer();
        console.log('تم إنشاء الصورة النهائية.');

        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');
        console.log('تم إرسال الصورة بنجاح.');
        return res.status(200).send(finalImageBuffer);

    } catch (error) {
        console.error('خطأ عام في وظيفة generateCertificateTwo2 (داخل catch):', error);
        console.error('تتبع الخطأ (داخل catch):', error.stack);

        if (error.message.includes('expected positive integer for text.height')) {
            return res.status(500).json({
                error: 'خطأ في معالجة أبعاد النص. قد يكون بسبب قيمة ارتفاع النص غير الصحيحة (عشري بدلاً من صحيح).',
                details: error.message,
                stack: error.stack
            });
        }
        else if (error.message.includes('fontconfig') || error.message.includes('freetype')) {
            return res.status(500).json({
                error: 'حدث خطأ في معالجة الخطوط (Fontconfig/FreeType). يرجى التأكد من أن الخطوط المستخدمة مدعومة بشكل كامل في بيئة Vercel.',
                details: error.message,
                stack: error.stack
            });
        } else if (error.message.includes('Input file is missing')) {
            return res.status(500).json({
                error: 'ملف الصورة الأساسي غير موجود أو لا يمكن الوصول إليه.',
                details: error.message
            });
        }
        return res.status(500).json({
            error: 'حدث خطأ غير متوقع أثناء معالجة الشهادة.',
            details: error.message,
            stack: error.stack
        });
    } finally {
        if (client) {
            await client.close();
            console.log('تم إغلاق اتصال قاعدة البيانات.');
        }
    }
}