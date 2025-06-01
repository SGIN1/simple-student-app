// public/js/main.js

const searchInput = document.getElementById('search_residency');
const studentsTable = document.getElementById('students_table');
const studentsTbody = document.getElementById('students_tbody');
const noResultsMessage = document.getElementById('no_results');

let allStudents = []; // لتخزين جميع بيانات الطلاب التي تم جلبها

/**
 * دالة لجلب بيانات الطلاب من Vercel API Function.
 * تتضمن معالجة مرنة لشكل البيانات القادمة من الخادم.
 */
async function fetchStudents() {
    try {
        const response = await fetch('/api/getStudent'); // تأكد أن هذا المسار صحيح
        const data = await response.json();

        // **هام لـ Debugging:** اطبع البيانات في Console المتصفح لتتأكد من شكلها
        console.log('Fetched data from /api/getStudent:', data);

        if (response.ok) {
            // تحقق من أن البيانات هي مصفوفة مباشرة
            if (Array.isArray(data)) {
                allStudents = data;
                renderStudentsTable(allStudents);
            } 
            // أو إذا كانت البيانات ملفوفة داخل كائن (مثال: { students: [...] } أو { data: [...] })
            else if (data && (Array.isArray(data.students) || Array.isArray(data.data))) {
                allStudents = data.students || data.data; // استخدم الاسم الصحيح للعنصر الذي يحتوي على المصفوفة
                renderStudentsTable(allStudents);
            } 
            // إذا لم تكن البيانات مصفوفة بأي شكل متوقع
            else {
                console.error('صيغة بيانات الطلاب المستلمة غير صحيحة:', data);
                studentsTbody.innerHTML = '<tr><td colspan="19">صيغة بيانات الطلاب غير صحيحة. يرجى مراجعة سجلات الخادم أو المتصفح.</td></tr>';
            }
        } else {
            console.error('فشل في جلب بيانات الطلاب:', data.error || 'حدث خطأ غير معروف');
            studentsTbody.innerHTML = `<tr><td colspan="19">فشل في تحميل بيانات الطلاب: ${data.error || 'خطأ غير معروف'}.</td></tr>`;
        }
    } catch (error) {
        console.error('خطأ في جلب بيانات الطلاب:', error);
        studentsTbody.innerHTML = '<tr><td colspan="19">حدث خطأ أثناء محاولة تحميل بيانات الطلاب. يرجى التحقق من اتصال الشبكة.</td></tr>';
    }
}

/**
 * دالة لتحديث جدول الطلاب في المتصفح.
 */
function renderStudentsTable(students) {
    studentsTbody.innerHTML = ''; // مسح الجدول الحالي

    if (students.length > 0) {
        noResultsMessage.style.display = 'none';
        const reversedStudents = [...students].reverse(); // لعرض الأحدث أولا

        reversedStudents.forEach(student => {
            const row = studentsTbody.insertRow();
            // تأكد أن أسماء الحقول هنا (student.id, student.serial_number, إلخ) تطابق تمامًا أسماء الحقول في قاعدة بياناتك والبيانات التي يعيدها getStudent.js
            row.insertCell().textContent = student.id;
            row.insertCell().textContent = student.serial_number || ''; // إضافة || '' لتجنب ظهور 'null' أو 'undefined'
            row.insertCell().textContent = student.residency_number || '';
            row.insertCell().textContent = student.document_serial_number || '';
            row.insertCell().textContent = student.plate_number || '';
            row.insertCell().textContent = student.inspection_date ? new Date(student.inspection_date).toLocaleDateString('ar-SA') : ''; // تنسيق التاريخ
            row.insertCell().textContent = student.manufacturer || '';
            row.insertCell().textContent = student.inspection_expiry_date ? new Date(student.inspection_expiry_date).toLocaleDateString('ar-SA') : ''; // تنسيق التاريخ
            row.insertCell().textContent = student.car_type || '';
            row.insertCell().textContent = student.counter_reading || '';
            row.insertCell().textContent = student.chassis_number || '';
            row.insertCell().textContent = student.vehicle_model || '';
            row.insertCell().textContent = student.color || '';
            row.insertCell().textContent = student.serial_number_duplicate || '';
            row.insertCell().textContent = student.created_at ? new Date(student.created_at).toLocaleString('ar-SA') : ''; // تنسيق التاريخ والوقت

            const editCell = row.insertCell();
            editCell.classList.add('actions');
            editCell.innerHTML = `<a href="/edit-student?id=${student.id}" class="edit-btn">تعديل</a>`;

            const deleteCell = row.insertCell();
            deleteCell.classList.add('actions');
            deleteCell.innerHTML = `<button class="delete-btn" onclick="deleteStudent('${student.id}')">حذف</button>`;

            const printCellOne = row.insertCell();
            printCellOne.innerHTML = `<button class="print-btn" onclick="showCertificateInNewWindow('/api/generateCertificateOne1?id=${student.id}')">عرض الأولى</button>`;

            const printCellTwo = row.insertCell();
            printCellTwo.innerHTML = `<button class="print-btn" onclick="showCertificateInNewWindow('/api/generateCertificateTwo2?id=${student.id}')">عرض الثانية</button>`;
        });
    } else {
        studentsTbody.innerHTML = '<tr><td colspan="19">لا يوجد أي طلاب مسجلين.</td></tr>';
    }
}

/**
 * دالة البحث.
 */
searchInput.addEventListener('keyup', function() {
    const searchTerm = this.value.trim().toLowerCase();
    const filteredStudents = allStudents.filter(student =>
        (student.residency_number && student.residency_number.toLowerCase().includes(searchTerm)) ||
        (student.serial_number && student.serial_number.toLowerCase().includes(searchTerm))
        // أضف المزيد من الحقول للبحث فيها إذا أردت
    );
    renderStudentsTable(filteredStudents);
    noResultsMessage.style.display = filteredStudents.length === 0 && searchTerm !== '' ? 'block' : 'none';
});

/**
 * دالة لفتح الشهادة في نافذة جديدة مع مؤشر تحميل.
 */
function showCertificateInNewWindow(url) {
    const newWindow = window.open('about:blank', '_blank'); 
    if (!newWindow) {
        alert('المتصفح منع فتح النافذة المنبثقة. يرجى السماح بها.');
        return;
    }

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
                    max-width: 100%;
                    height: auto;
                    display: none;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
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
                };
                document.getElementById('certificateImage').onerror = function() {
                    document.querySelector('.loading-spinner').style.display = 'none';
                    this.style.display = 'none';
                    document.body.innerHTML = '<h1>عذراً، حدث خطأ في تحميل الشهادة. يرجى المحاولة مرة أخرى لاحقاً.</h1>';
                    console.error('Failed to load certificate image from:', this.src);
                };
            </script>
        </body>
        </html>
    `;

    newWindow.document.write(pageContent);
    newWindow.document.close();
}

/**
 * دالة لحذف الطالب.
 */
async function deleteStudent(studentId) {
    if (!confirm('هل أنت متأكد أنك تريد حذف هذا الطالب؟')) {
        return;
    }
    try {
        const response = await fetch('/api/deleteStudent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: studentId }),
        });
        const data = await response.json();

        if (response.ok) {
            alert(data.message || 'تم حذف الطالب بنجاح!');
            fetchStudents(); // إعادة جلب وعرض البيانات بعد الحذف
        } else {
            alert(data.error || 'حدث خطأ أثناء محاولة حذف الطالب.');
            console.error('فشل الحذف:', data.error);
        }
    } catch (error) {
        console.error('خطأ في عملية الحذف:', error);
        alert('حدث خطأ غير متوقع أثناء الحذف.');
    }
}

// استدعاء الدالة لجلب وعرض الطلاب عند تحميل الصفحة
fetchStudents();

// لجعل الدوال متاحة عالمياً (مثل deleteStudent و showCertificateInNewWindow) 
// بحيث يمكن استدعاؤها من خلال onclick في HTML
window.deleteStudent = deleteStudent;
window.showCertificateInNewWindow = showCertificateInNewWindow;