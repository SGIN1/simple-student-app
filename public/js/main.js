// public/js/main.js
// ... (بقية الكود الخاص بك هنا، لا تقم بتغييره)

/**
 * دالة لفتح الشهادة في نافذة جديدة مع مؤشر تحميل وعرض سلس.
 */
function showCertificateInNewWindow(url) {
    const newWindow = window.open('about:blank', '_blank'); // نفتح about:blank أولاً للتحكم الكامل
    if (!newWindow) {
        alert('المتصفح منع فتح النافذة المنبثقة. يرجى السماح بها.');
        return;
    }

    // كتابة محتوى HTML الأساسي مع مؤشر التحميل
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
                    background-color: #f0f0f0;
                    flex-direction: column;
                    overflow: auto;
                    font-family: Arial, sans-serif;
                    color: #333;
                }
                .loading-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    position: absolute; /* لجعلها تظهر فوق الصورة حتى تختفي */
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    z-index: 10;
                }
                .loading-spinner {
                    border: 5px solid rgba(0, 0, 0, 0.1);
                    border-top: 5px solid #3498db;
                    border-radius: 50%;
                    width: 50px;
                    height: 50px;
                    animation: spin 1s linear infinite;
                    margin-bottom: 15px;
                }
                .loading-text {
                    font-size: 1.1em;
                    color: #555;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                #certificateImage {
                    max-width: 100%;
                    height: auto;
                    display: none; /* إخفاؤها حتى تكتمل التحميل */
                    box-shadow: 0 6px 12px rgba(0,0,0,0.25);
                    border-radius: 8px;
                    transition: opacity 0.5s ease-in-out; /* إضافة انتقال سلس للظهور */
                }
                .error-message {
                    color: #d9534f;
                    font-size: 1.2em;
                    text-align: center;
                    padding: 20px;
                }
            </style>
        </head>
        <body>
            <div class="loading-container" id="loadingContainer">
                <div class="loading-spinner"></div>
                <div class="loading-text">جاري تحضير الشهادة...</div>
            </div>
            <img id="certificateImage" alt="Certificate Image">
            <script>
                const img = document.getElementById('certificateImage');
                const loadingContainer = document.getElementById('loadingContainer');
                const imageUrl = "${url}"; // الرابط الفعلي للصورة

                img.onload = function() {
                    // عندما تكتمل الصورة بالكامل، أخفِ مؤشر التحميل وأظهِر الصورة
                    loadingContainer.style.display = 'none';
                    img.style.display = 'block';
                    img.style.opacity = 1; // جعلها مرئية تدريجياً
                };

                img.onerror = function() {
                    // في حالة حدوث خطأ في تحميل الصورة
                    loadingContainer.style.display = 'none';
                    img.style.display = 'none';
                    newWindow.document.body.innerHTML = '<h1 class="error-message">عذراً، حدث خطأ في تحميل الشهادة. يرجى المحاولة مرة أخرى لاحقاً.</h1>';
                    console.error('Failed to load certificate image from:', imageUrl);
                };

                // ابدأ بتحميل الصورة
                img.src = imageUrl;
            </script>
        </body>
        </html>
    `;

    newWindow.document.write(pageContent);
    newWindow.document.close(); // مهم جداً لإخبار المتصفح بأن كتابة المحتوى قد انتهت
}

// ... (بقية الكود الخاص بك هنا، لا تقم بتغييره)