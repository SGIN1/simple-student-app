import { MongoClient, ObjectId } from "mongodb"

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

    // إنشاء HTML للشهادة الثانية مع تحسينات للنصوص العربية
    const htmlCertificate = `
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>الشهادة الثانية - ${student.arabic_name || student.serial_number}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700&display=swap');
                    
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
                    
                    * {
                        box-sizing: border-box;
                    }
                    
                    body { 
                        font-family: 'Noto Sans Arabic', 'Arial', sans-serif; 
                        direction: rtl; 
                        text-align: center; 
                        margin: 0;
                        padding: 20px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        min-height: 100vh;
                        line-height: 1.6;
                    }
                    
                    .certificate-container { 
                        max-width: 900px; 
                        margin: 0 auto; 
                        background: white;
                        border: 3px solid #gold; 
                        padding: 40px; 
                        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                        border-radius: 15px;
                        position: relative;
                        overflow: hidden;
                    }
                    
                    .certificate-container::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        height: 10px;
                        background: linear-gradient(90deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #ffeaa7);
                    }
                    
                    .header {
                        border-bottom: 3px solid #2c3e50;
                        padding-bottom: 25px;
                        margin-bottom: 35px;
                        position: relative;
                    }
                    
                    .title {
                        font-size: 3em;
                        font-weight: 700;
                        color: #2c3e50;
                        margin-bottom: 15px;
                        text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
                        font-family: 'Noto Sans Arabic', serif;
                    }
                    
                    .subtitle {
                        font-size: 1.4em;
                        color: #34495e;
                        margin-bottom: 20px;
                        font-weight: 400;
                    }
                    
                    .certificate-number {
                        position: absolute;
                        top: 10px;
                        left: 10px;
                        background: #3498db;
                        color: white;
                        padding: 5px 15px;
                        border-radius: 20px;
                        font-size: 0.9em;
                        font-weight: bold;
                    }
                    
                    .main-content {
                        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                        border-radius: 15px;
                        padding: 30px;
                        margin: 20px 0;
                        border: 2px solid #dee2e6;
                    }
                    
                    .student-name {
                        font-size: 2.5em;
                        font-weight: 700;
                        color: #e74c3c;
                        margin: 20px 0;
                        padding: 20px;
                        background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%);
                        border-radius: 10px;
                        border: 2px dashed #e74c3c;
                        text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
                        font-family: 'Noto Sans Arabic', serif;
                    }
                    
                    .data-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 20px;
                        margin: 30px 0;
                    }
                    
                    .data-card {
                        background: white;
                        padding: 20px;
                        border-radius: 10px;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                        border-left: 5px solid #3498db;
                        transition: transform 0.3s ease;
                    }
                    
                    .data-card:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 6px 12px rgba(0,0,0,0.15);
                    }
                    
                    .data-label {
                        font-weight: 700;
                        color: #2c3e50;
                        font-size: 1.1em;
                        margin-bottom: 8px;
                        display: block;
                    }
                    
                    .data-value {
                        color: #3498db;
                        font-weight: 600;
                        font-size: 1.2em;
                        word-break: break-word;
                    }
                    
                    .highlight-data {
                        background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%);
                        border: 2px solid #4caf50;
                        border-radius: 15px;
                        padding: 25px;
                        margin: 25px 0;
                        text-align: center;
                    }
                    
                    .highlight-data .data-value {
                        font-size: 1.8em;
                        color: #2e7d32;
                        font-weight: 700;
                    }
                    
                    .verification-section {
                        background: linear-gradient(135deg, #fff3e0 0%, #ffcc02 100%);
                        border-radius: 15px;
                        padding: 25px;
                        margin: 30px 0;
                        border: 2px solid #ff9800;
                    }
                    
                    .verification-title {
                        font-size: 1.5em;
                        font-weight: 700;
                        color: #e65100;
                        margin-bottom: 15px;
                    }
                    
                    .verification-code {
                        font-size: 2em;
                        font-weight: 700;
                        color: #bf360c;
                        background: white;
                        padding: 15px;
                        border-radius: 10px;
                        border: 2px dashed #ff9800;
                        letter-spacing: 3px;
                        font-family: 'Courier New', monospace;
                    }
                    
                    .footer {
                        margin-top: 40px;
                        padding-top: 25px;
                        border-top: 3px solid #2c3e50;
                        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                        border-radius: 10px;
                        padding: 25px;
                    }
                    
                    .footer-content {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        flex-wrap: wrap;
                        gap: 20px;
                    }
                    
                    .issue-date {
                        font-size: 1.1em;
                        color: #2c3e50;
                        font-weight: 600;
                    }
                    
                    .copyright {
                        font-size: 0.9em;
                        color: #6c757d;
                    }
                    
                    .print-button {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border: none;
                        padding: 12px 25px;
                        border-radius: 25px;
                        cursor: pointer;
                        font-size: 16px;
                        margin: 10px;
                        transition: all 0.3s ease;
                        font-weight: 600;
                    }
                    
                    .print-button:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                    }
                    
                    .watermark {
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%) rotate(-45deg);
                        font-size: 6em;
                        color: rgba(52, 152, 219, 0.05);
                        font-weight: 900;
                        z-index: 0;
                        pointer-events: none;
                    }
                    
                    .content {
                        position: relative;
                        z-index: 1;
                    }
                    
                    @media (max-width: 768px) {
                        .data-grid {
                            grid-template-columns: 1fr;
                        }
                        
                        .title {
                            font-size: 2em;
                        }
                        
                        .student-name {
                            font-size: 1.8em;
                        }
                        
                        .footer-content {
                            flex-direction: column;
                            text-align: center;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="certificate-container">
                    <div class="watermark">معتمد</div>
                    
                    <div class="content">
                        <div class="certificate-number">
                            رقم الشهادة: ${student._id.toString().slice(-8).toUpperCase()}
                        </div>
                        
                        <div class="header">
                            <h1 class="title">شهادة فحص المركبة المتقدمة</h1>
                            <p class="subtitle">البوابة الوطنية الداعمة للمجتمع البلدي</p>
                            <p class="subtitle">إدارة المرور والنقل</p>
                        </div>
                        
                        <div class="main-content">
                            ${
                              student.arabic_name
                                ? `
                                <div class="student-name">
                                    ${student.arabic_name}
                                </div>
                            `
                                : ""
                            }
                            
                            <div class="highlight-data">
                                <div class="data-label">الرقم التسلسلي الرئيسي</div>
                                <div class="data-value">${student.serial_number || "غير محدد"}</div>
                            </div>
                            
                            <div class="highlight-data">
                                <div class="data-label">رقم الإقامة</div>
                                <div class="data-value">${student.residency_number || "غير محدد"}</div>
                            </div>
                            
                            <div class="data-grid">
                                <div class="data-card">
                                    <span class="data-label">الرقم التسلسلي للوثيقة:</span>
                                    <div class="data-value">${student.document_serial_number || "غير محدد"}</div>
                                </div>
                                
                                <div class="data-card">
                                    <span class="data-label">رقم اللوحة:</span>
                                    <div class="data-value">${student.plate_number || "غير محدد"}</div>
                                </div>
                                
                                <div class="data-card">
                                    <span class="data-label">تاريخ الفحص:</span>
                                    <div class="data-value">${student.inspection_date ? new Date(student.inspection_date).toLocaleDateString("ar-EG") : "غير محدد"}</div>
                                </div>
                                
                                <div class="data-card">
                                    <span class="data-label">الشركة الصانعة:</span>
                                    <div class="data-value">${student.manufacturer || "غير محدد"}</div>
                                </div>
                                
                                <div class="data-card">
                                    <span class="data-label">تاريخ انتهاء الفحص:</span>
                                    <div class="data-value">${student.inspection_expiry_date ? new Date(student.inspection_expiry_date).toLocaleDateString("ar-EG") : "غير محدد"}</div>
                                </div>
                                
                                <div class="data-card">
                                    <span class="data-label">نوع السيارة:</span>
                                    <div class="data-value">${student.car_type || "غير محدد"}</div>
                                </div>
                                
                                <div class="data-card">
                                    <span class="data-label">قراءة العداد:</span>
                                    <div class="data-value">${student.counter_reading ? Number(student.counter_reading).toLocaleString("ar-EG") + " كم" : "غير محدد"}</div>
                                </div>
                                
                                <div class="data-card">
                                    <span class="data-label">رقم الهيكل:</span>
                                    <div class="data-value">${student.chassis_number || "غير محدد"}</div>
                                </div>
                                
                                <div class="data-card">
                                    <span class="data-label">طراز المركبة:</span>
                                    <div class="data-value">${student.vehicle_model || "غير محدد"}</div>
                                </div>
                                
                                <div class="data-card">
                                    <span class="data-label">اللون:</span>
                                    <div class="data-value">${student.color || "غير محدد"}</div>
                                </div>
                            </div>
                            
                            <div class="verification-section">
                                <div class="verification-title">رمز التحقق الرقمي</div>
                                <div class="verification-code">${student._id.toString().slice(-12).toUpperCase()}</div>
                                <p style="margin-top: 15px; color: #e65100; font-weight: 600;">
                                    يمكن استخدام هذا الرمز للتحقق من صحة الشهادة
                                </p>
                            </div>
                        </div>
                        
                        <div class="footer">
                            <div class="footer-content">
                                <div class="issue-date">
                                    <strong>تاريخ الإصدار:</strong> ${new Date().toLocaleDateString("ar-EG", {
                                      weekday: "long",
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })}
                                </div>
                                <div class="copyright">
                                    جميع الحقوق محفوظة - البوابة الوطنية الداعمة للمجتمع البلدي © 2023
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="no-print" style="text-align: center; margin: 20px;">
                    <button class="print-button" onclick="window.print()">
                        🖨️ طباعة الشهادة
                    </button>
                    <button class="print-button" onclick="window.close()">
                        ❌ إغلاق النافذة
                    </button>
                    <button class="print-button" onclick="window.history.back()">
                        ↩️ العودة
                    </button>
                </div>
                
                <script>
                    // تحسين تجربة المستخدم
                    document.addEventListener('DOMContentLoaded', function() {
                        // إضافة تأثيرات بصرية
                        const cards = document.querySelectorAll('.data-card');
                        cards.forEach((card, index) => {
                            card.style.animationDelay = (index * 0.1) + 's';
                            card.style.animation = 'fadeInUp 0.6s ease forwards';
                        });
                        
                        // إضافة CSS للأنيميشن
                        const style = document.createElement('style');
                        style.textContent = \`
                            @keyframes fadeInUp {
                                from {
                                    opacity: 0;
                                    transform: translateY(20px);
                                }
                                to {
                                    opacity: 1;
                                    transform: translateY(0);
                                }
                            }
                        \`;
                        document.head.appendChild(style);
                    });
                    
                    // منع النقر بالزر الأيمن (اختياري)
                    document.addEventListener('contextmenu', function(e) {
                        e.preventDefault();
                    });
                </script>
            </body>
            </html>
        `

    res.setHeader("Content-Type", "text/html; charset=utf-8")
    return res.status(200).send(htmlCertificate)
  } catch (error) {
    console.error("Error in generateCertificateTwo2 function:", error)
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
