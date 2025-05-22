<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>شهادة</title>
    <link rel="stylesheet" href="styles.css">
    <style>
        /* هنا يمكنك وضع CSS الخاص بالشهادة مباشرة أو في ملف styles.css */
        body {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background-color: #f0f0f0;
        }
        .certificate-container {
            position: relative;
            width: 1000px; /* عرض الشهادة الخاص بك */
            height: 700px; /* ارتفاع الشهادة الخاص بك */
            background-image: url('/images_temp/wwee.jpg'); /* مسار صورة الشهادة */
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            font-family: 'Arial', sans-serif; /* هنا تختار الخط الذي تريده */
            color: black; /* لون النصوص الافتراضي */
        }
        .text-overlay {
            position: absolute;
            text-align: center;
            width: 100%;
            /* يمكنك استخدام top, left, transform لضبط المواقع بدقة */
        }
        #student-name {
            top: 150px; /* مثال لموقع اسم الطالب */
            font-size: 48px;
            color: white;
        }
        #serial-number {
            top: 220px;
            left: 180px; /* مثال لموقع الرقم التسلسلي */
            text-align: left;
            font-size: 28px;
            color: white;
            width: 300px; /* لتحديد عرض المنطقة */
        }
        /* أضف المزيد من الأنماط لكل حقل نصي هنا */
        #document-serial-number {
            top: 280px;
            font-size: 20px;
            color: black;
        }
        #plate-number {
            top: 320px;
            font-size: 20px;
            color: black;
        }
        #car-type {
            top: 360px;
            font-size: 20px;
            color: black;
        }
        #color {
            top: 400px;
            font-size: 20px;
            color: black;
        }

        /* إذا أردت طباعة الشهادة، يمكنك استخدام Media Queries للطباعة */
        @media print {
            body {
                margin: 0;
                padding: 0;
                background: none;
            }
            .certificate-container {
                box-shadow: none;
                background-image: url('/images_temp/wwee.jpg'); /* تأكد من المسار لكي تطبع الخلفية */
                -webkit-print-color-adjust: exact; /* لطباعة الألوان والخلفيات */
                color-adjust: exact;
            }
        }
    </style>
</head>
<body>
    <div class="certificate-container">
        <div id="student-name" class="text-overlay"></div>
        <div id="serial-number" class="text-overlay"></div>
        <div id="document-serial-number" class="text-overlay"></div>
        <div id="plate-number" class="text-overlay"></div>
        <div id="car-type" class="text-overlay"></div>
        <div id="color" class="text-overlay"></div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', async () => {
            const studentId = window.location.pathname.split('/').pop();
            if (!studentId) {
                console.error("معرف الطالب غير موجود في الرابط.");
                return;
            }

            try {
                // ستقوم هذه الـ fetch بطلب البيانات من وظيفة Netlify التي ترجع JSON
                const response = await fetch(`/.netlify/functions/generateCertificateTwo2/${studentId}`);
                const data = await response.json();

                if (response.ok) {
                    document.getElementById('student-name').textContent = data.studentNameArabic;
                    document.getElementById('serial-number').textContent = data.serialNumber;
                    document.getElementById('document-serial-number').textContent = data.documentSerialNumber;
                    document.getElementById('plate-number').textContent = `رقم اللوحة: ${data.plateNumber}`;
                    document.getElementById('car-type').textContent = `نوع السيارة: ${data.carType}`;
                    document.getElementById('color').textContent = `اللون: ${data.color}`;
                } else {
                    console.error("خطأ في جلب البيانات:", data.error);
                    alert(`حدث خطأ: ${data.error}`);
                }
            } catch (error) {
                console.error("خطأ غير متوقع:", error);
                alert("حدث خطأ غير متوقع أثناء جلب البيانات.");
            }
        });
    </script>
</body>
</html>