// public/js/main.js

// ... (بقية الكود كما هي) ...

// دالة لفتح الشهادة في نافذة جديدة
function showCertificateInNewWindow(url) {
    // 1. نفتح نافذة جديدة لصفحة HTML بسيطة كـ "placeholder"
    const newWindow = window.open('about:blank', '_blank'); // فتح نافذة فارغة
    if (!newWindow) {
        alert('المتصفح منع فتح النافذة المنبثقة. يرجى السماح بها.');
        return;
    }

    // 2. بناء محتوى HTML للنافذة الجديدة (يتضمن مؤشر تحميل ووسم الصورة)
    const pageContent = `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>عرض الشهادة</title>
            <style>
                body {
                    margin: 0;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    background-color: #f0f0f0; /* لون خلفية خفيف */
                    flex-direction: column;
                    overflow: auto; /* للسماح بالتمرير إذا كانت الصورة كبيرة */
                }
                .loading-spinner {
                    border: 4px solid rgba(0, 0, 0, 0.1);
                    border-top: 4px solid #3498db;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    animation: spin 1s linear infinite;
                    margin-bottom: 20px;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                #certificateImage {
                    max-width: 100%; /* اجعل الصورة تتكيف مع عرض النافذة */
                    height: auto;
                    display: none; /* إخفاء الصورة مبدئيًا */
                    box-shadow: 0 4px 8px rgba(0,0,0,0.2); /* ظل خفيف لتحسين المظهر */
                }
            </style>
        </head>
        <body>
            <div class="loading-spinner"></div>
            <img id="certificateImage" src="${url}" alt="Certificate Image">
            <script>
                document.getElementById('certificateImage').onload = function() {
                    document.querySelector('.loading-spinner').style.display = 'none';
                    this.style.display = 'block'; // إظهار الصورة عند اكتمال التحميل
                    // يمكنك هنا تغيير حجم النافذة لتناسب الصورة إذا أردت
                    // window.resizeTo(this.naturalWidth, this.naturalHeight); // قد لا يعمل في كل المتصفحات
                };
                document.getElementById('certificateImage').onerror = function() {
                    document.querySelector('.loading-spinner').style.display = 'none';
                    this.style.display = 'none';
                    document.body.innerHTML = '<h1>عذراً، حدث خطأ في تحميل الشهادة.</h1>';
                };
            </script>
        </body>
        </html>
    `;

    // 3. كتابة المحتوى في النافذة الجديدة
    newWindow.document.write(pageContent);
    newWindow.document.close(); // مهم جداً لإعلام المتصفح بانتهاء كتابة المحتوى
}

// ... (بقية الكود كما هي) ...

// لا تنسى استدعاء الدوال لجعلها متاحة عالمياً
window.deleteStudent = deleteStudent;
window.showCertificateInNewWindow = showCertificateInNewWindow;