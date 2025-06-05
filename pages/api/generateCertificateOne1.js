import { MongoClient, ObjectId } from "mongodb"
import QRCode from "qrcode"

const uri = process.env.MONGODB_URI
const dbName = "Cluster0"
const collectionName = "enrolled_students_tbl"

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" })
  }

  const studentId = req.query.id

  if (!studentId) {
    return res.status(400).json({ error: "معرف الطالب مطلوب." })
  }

  let client

  try {
    if (!uri) {
      return res.status(500).json({
        error: "لم يتم العثور على رابط اتصال MongoDB في متغيرات البيئة.",
      })
    }

    // التحقق من صحة ObjectId
    let objectId
    try {
      objectId = new ObjectId(studentId)
    } catch (error) {
      return res.status(400).send(`
                <html dir="rtl">
                    <head><meta charset="UTF-8"><title>خطأ</title></head>
                    <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                        <h1>معرف الطالب غير صالح</h1>
                        <p>المعرف المرسل: ${studentId}</p>
                        <a href="/" style="color: #007bff;">العودة للصفحة الرئيسية</a>
                    </body>
                </html>
            `)
    }

    client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })

    await client.connect()
    const database = client.db(dbName)
    const studentsCollection = database.collection(collectionName)

    const student = await studentsCollection.findOne({ _id: objectId })

    if (!student) {
      return res.status(404).send(`
                <html dir="rtl">
                    <head><meta charset="UTF-8"><title>غير موجود</title></head>
                    <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                        <h1>لم يتم العثور على الطالب</h1>
                        <p>المعرف: ${studentId}</p>
                        <a href="/" style="color: #007bff;">العودة للصفحة الرئيسية</a>
                    </body>
                </html>
            `)
    }

    // إنشاء رابط الشهادة الثانية
    const baseUrl = req.headers.host?.includes("localhost")
      ? `http://${req.headers.host}`
      : `https://${req.headers.host}`
    const certificateTwoUrl = `${baseUrl}/api/generateCertificateTwo2?id=${student._id}`

    // إنشاء QR Code
    let qrCodeDataUri = ""
    try {
      qrCodeDataUri = await QRCode.toDataURL(certificateTwoUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      })
    } catch (err) {
      console.error("Error generating QR code:", err)
    }

    // إنشاء HTML للشهادة
    const htmlCertificate = `
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>شهادة الطالب - ${student.arabic_name || student.serial_number}</title>
                <style>
                    @media print {
                        @page {
                            size: A4;
                            margin: 0;
                        }
                        body {
                            margin: 0;
                            padding: 0;
                        }
                        .no-print {
                            display: none !important;
                        }
                    }
                    
                    body { 
                        font-family: 'Arial', sans-serif; 
                        direction: rtl; 
                        text-align: center; 
                        margin: 0;
                        padding: 20px;
                        background-color: #f5f5f5;
                    }
                    
                    .certificate-container { 
                        max-width: 800px; 
                        margin: 0 auto; 
                        background: white;
                        border: 2px solid #333; 
                        padding: 30px; 
                        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                        border-radius: 10px;
                    }
                    
                    .header {
                        border-bottom: 3px solid #007bff;
                        padding-bottom: 20px;
                        margin-bottom: 30px;
                    }
                    
                    .title {
                        font-size: 2.5em;
                        font-weight: bold;
                        color: #007bff;
                        margin-bottom: 10px;
                    }
                    
                    .subtitle {
                        font-size: 1.2em;
                        color: #666;
                        margin-bottom: 30px;
                    }
                    
                    .template { 
                        max-width: 100%; 
                        height: auto;
                        margin: 20px 0;
                    }
                    
                    .data { 
                        margin-top: 30px; 
                        text-align: right;
                        padding: 20px;
                        background-color: #f8f9fa;
                        border-radius: 8px;
                    }
                    
                    .data-row {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 10px 0;
                        border-bottom: 1px solid #eee;
                    }
                    
                    .data-label {
                        font-weight: bold;
                        color: #333;
                        min-width: 200px;
                    }
                    
                    .data-value {
                        color: #007bff;
                        font-weight: 500;
                    }
                    
                    .serial, .residency { 
                        font-size: 1.5em; 
                        font-weight: bold; 
                        color: #007bff;
                        background-color: #e3f2fd;
                        padding: 15px;
                        border-radius: 8px;
                        margin: 10px 0;
                    }
                    
                    .other-data { 
                        margin: 8px 0; 
                        font-size: 1.1em; 
                        padding: 8px;
                        background-color: white;
                        border-radius: 5px;
                    }
                    
                    .qrcode-container { 
                        margin-top: 30px; 
                        padding: 20px;
                        background-color: white;
                        border-radius: 10px;
                        border: 2px dashed #007bff;
                    }
                    
                    .qrcode-container img { 
                        max-width: 150px; 
                        height: auto;
                        border: 1px solid #ddd;
                        border-radius: 5px;
                    }
                    
                    .qrcode-text { 
                        font-size: 0.9em; 
                        color: #666; 
                        margin-top: 10px;
                    }
                    
                    .footer {
                        margin-top: 40px;
                        padding-top: 20px;
                        border-top: 2px solid #007bff;
                        font-size: 0.9em;
                        color: #666;
                    }
                    
                    .print-button {
                        background-color: #007bff;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 16px;
                        margin: 10px;
                    }
                    
                    .print-button:hover {
                        background-color: #0056b3;
                    }
                </style>
            </head>
            <body>
                <div class="certificate-container">
                    <div class="header">
                        <h1 class="title">شهادة فحص المركبة</h1>
                        <p class="subtitle">البوابة الوطنية الداعمة للمجتمع البلدي</p>
                    </div>
                    
                    <div class="data">
                        <div class="serial">
                            <strong>الرقم التسلسلي: </strong>${student.serial_number || "غير محدد"}
                        </div>
                        
                        <div class="residency">
                            <strong>رقم الإقامة: </strong>${student.residency_number || "غير محدد"}
                        </div>
                        
                        ${
                          student.arabic_name
                            ? `
                            <div class="data-row">
                                <span class="data-label">الاسم:</span>
                                <span class="data-value">${student.arabic_name}</span>
                            </div>
                        `
                            : ""
                        }
                        
                        <div class="data-row">
                            <span class="data-label">الرقم التسلسلي للوثيقة:</span>
                            <span class="data-value">${student.document_serial_number || "غير محدد"}</span>
                        </div>
                        
                        <div class="data-row">
                            <span class="data-label">رقم اللوحة:</span>
                            <span class="data-value">${student.plate_number || "غير محدد"}</span>
                        </div>
                        
                        <div class="data-row">
                            <span class="data-label">تاريخ الفحص:</span>
                            <span class="data-value">${student.inspection_date || "غير محدد"}</span>
                        </div>
                        
                        <div class="data-row">
                            <span class="data-label">الشركة الصانعة:</span>
                            <span class="data-value">${student.manufacturer || "غير محدد"}</span>
                        </div>
                        
                        <div class="data-row">
                            <span class="data-label">تاريخ انتهاء الفحص:</span>
                            <span class="data-value">${student.inspection_expiry_date || "غير محدد"}</span>
                        </div>
                        
                        <div class="data-row">
                            <span class="data-label">نوع السيارة:</span>
                            <span class="data-value">${student.car_type || "غير محدد"}</span>
                        </div>
                        
                        <div class="data-row">
                            <span class="data-label">قراءة العداد:</span>
                            <span class="data-value">${student.counter_reading || "غير محدد"}</span>
                        </div>
                        
                        <div class="data-row">
                            <span class="data-label">رقم الهيكل:</span>
                            <span class="data-value">${student.chassis_number || "غير محدد"}</span>
                        </div>
                        
                        <div class="data-row">
                            <span class="data-label">طراز المركبة:</span>
                            <span class="data-value">${student.vehicle_model || "غير محدد"}</span>
                        </div>
                        
                        <div class="data-row">
                            <span class="data-label">اللون:</span>
                            <span class="data-value">${student.color || "غير محدد"}</span>
                        </div>
                        
                        <div class="data-row">
                            <span class="data-label">الرقم التسلسلي (مكرر):</span>
                            <span class="data-value">${student.serial_number_duplicate || "غير محدد"}</span>
                        </div>
                    </div>
                    
                    ${
                      qrCodeDataUri
                        ? `
                        <div class="qrcode-container">
                            <h3>الشهادة الثانية</h3>
                            <img src="${qrCodeDataUri}" alt="QR Code للشهادة الثانية">
                            <p class="qrcode-text">امسح هذا الرمز لفتح الشهادة الثانية</p>
                        </div>
                    `
                        : ""
                    }
                    
                    <div class="footer">
                        <p>تاريخ الإصدار: ${new Date().toLocaleDateString("ar-EG")}</p>
                        <p>جميع الحقوق محفوظة - البوابة الوطنية الداعمة للمجتمع البلدي © 2023</p>
                    </div>
                </div>
                
                <div class="no-print" style="text-align: center; margin: 20px;">
                    <button class="print-button" onclick="window.print()">طباعة الشهادة</button>
                    <button class="print-button" onclick="window.close()">إغلاق</button>
                </div>
                
                <script>
                    // طباعة تلقائية عند التحميل (اختيارية)
                    window.onload = function() {
                        // إزالة التعليق من السطر التالي للطباعة التلقائية
                        // setTimeout(function() { window.print(); }, 1000);
                    };
                </script>
            </body>
            </html>
        `

    res.setHeader("Content-Type", "text/html; charset=utf-8")
    return res.status(200).send(htmlCertificate)
  } catch (error) {
    console.error("Error in generateCertificateOne1 function:", error)
    return res.status(500).send(`
            <html dir="rtl">
                <head><meta charset="UTF-8"><title>خطأ</title></head>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h1>حدث خطأ أثناء إنشاء الشهادة</h1>
                    <p>${error.message || "حدث خطأ غير متوقع في الخادم."}</p>
                    <a href="/" style="color: #007bff;">العودة للصفحة الرئيسية</a>
                </body>
            </html>
        `)
  } finally {
    if (client) {
      try {
        await client.close()
      } catch (closeError) {
        console.error("خطأ في إغلاق اتصال قاعدة البيانات:", closeError)
      }
    }
  }
}
