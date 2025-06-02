// public/js/main.js

const searchInput = document.getElementById('search_residency');
const studentsTable = document.getElementById('students_table');
const studentsTbody = document.getElementById('students_tbody');
const noResultsMessage = document.getElementById('no_results');

let allStudents = []; // لتخزين جميع بيانات الطلاب التي تم جلبها

// تعريف عناصر الـ Modal
const certificateModal = document.getElementById('certificateModal');
const closeButton = document.querySelector('.close-button'); // تأكد من أن هذا يختار الزر الصحيح داخل الـ Modal
const modalCertificateImage = document.getElementById('modalCertificateImage');
const modalLoadingContainer = document.getElementById('modalLoadingContainer');
const modalErrorMessage = document.getElementById('modalErrorMessage');

/**
 * دالة لجلب بيانات الطلاب من Vercel API Function.
 * تتضمن معالجة مرنة لشكل البيانات القادمة من الخادم.
 */
async function fetchStudents() {
    try {
        const response = await fetch('/api/getStudent'); // تأكد أن هذا المسار صحيح
        const data = await response.json();

        console.log('Fetched data from /api/getStudent:', data);

        if (response.ok) {
            if (Array.isArray(data)) {
                allStudents = data;
                renderStudentsTable(allStudents);
            }
            else if (data && (Array.isArray(data.students) || Array.isArray(data.data))) {
                allStudents = data.students || data.data;
                renderStudentsTable(allStudents);
            }
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
            row.insertCell().textContent = student.serial_number || '';
            row.insertCell().textContent = student.residency_number || '';
            row.insertCell().textContent = student.document_serial_number || '';
            row.insertCell().textContent = student.plate_number || '';
            row.insertCell().textContent = student.inspection_date ? new Date(student.inspection_date).toLocaleDateString('ar-SA') : '';
            row.insertCell().textContent = student.manufacturer || '';
            row.insertCell().textContent = student.inspection_expiry_date ? new Date(student.inspection_expiry_date).toLocaleDateString('ar-SA') : '';
            row.insertCell().textContent = student.car_type || '';
            row.insertCell().textContent = student.counter_reading || '';
            row.insertCell().textContent = student.chassis_number || '';
            row.insertCell().textContent = student.vehicle_model || '';
            row.insertCell().textContent = student.color || '';
            row.insertCell().textContent = student.serial_number_duplicate || '';
            row.insertCell().textContent = student.created_at ? new Date(student.created_at).toLocaleString('ar-SA') : '';

            const editCell = row.insertCell();
            editCell.classList.add('actions');
            editCell.innerHTML = `<a href="/edit-student?id=${student.id}" class="edit-btn">تعديل</a>`;

            const deleteCell = row.insertCell();
            deleteCell.classList.add('actions');
            deleteCell.innerHTML = `<button class="delete-btn" onclick="deleteStudent('${student.id}')">حذف</button>`;

            // **الزر الخاص بالشهادة الثانية فقط - تم حذف زر الشهادة الأولى**
            const printCellTwo = row.insertCell();
            printCellTwo.innerHTML = `<button class="print-btn" onclick="showCertificateInNewWindow('/api/generateCertificateTwo2?id=${student.id}')">عرض الشهادة</button>`;
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
    );
    renderStudentsTable(filteredStudents);
    noResultsMessage.style.display = filteredStudents.length === 0 && searchTerm !== '' ? 'block' : 'none';
});

/**
 * دالة لفتح الشهادة في نافذة Modal على نفس الصفحة.
 * @param {string} url - رابط API الذي يولد الشهادة (مثال: '/api/generateCertificateTwo2?id=...')
 */
async function showCertificateInNewWindow(url) {
    // 1. إظهار الـ Modal وإعداد حالة التحميل
    certificateModal.style.display = 'flex'; // استخدم flex لإظهار وتوسيط المحتوى
    modalLoadingContainer.style.display = 'flex'; // إظهار السبينر
    modalCertificateImage.style.display = 'none'; // إخفاء الصورة
    modalErrorMessage.style.display = 'none'; // إخفاء رسالة الخطأ
    modalCertificateImage.src = ''; // مسح src السابق لضمان إعادة تحميل جديدة

    try {
        // 2. جلب الصورة كـ Blob (Binary Large Object)
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // 3. قراءة الاستجابة كـ Blob وإنشاء Object URL
        const imageBlob = await response.blob();
        const imageUrl = URL.createObjectURL(imageBlob);

        // 4. تعيين مصدر الصورة في الـ Modal وتحميلها
        modalCertificateImage.src = imageUrl;

        // استخدام Promise لانتظار تحميل الصورة بالكامل
        await new Promise((resolve, reject) => {
            modalCertificateImage.onload = () => {
                URL.revokeObjectURL(imageUrl); // تحرير الـ Object URL بعد التحميل
                resolve();
            };
            modalCertificateImage.onerror = () => {
                URL.revokeObjectURL(imageUrl); // تحرير حتى في حالة الخطأ
                reject(new Error('Failed to load image into modal.'));
            };
        });

        // 5. إخفاء السبينر وعرض الصورة بعد اكتمال التحميل
        modalLoadingContainer.style.display = 'none';
        modalCertificateImage.style.display = 'block';

    } catch (error) {
        console.error('Error loading certificate:', error);
        modalLoadingContainer.style.display = 'none';
        modalErrorMessage.style.display = 'block';
        modalErrorMessage.textContent = 'عذراً، حدث خطأ في تحميل الشهادة. يرجى المحاولة مرة أخرى لاحقاً.';
    }
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

// إغلاق الـ Modal عند النقر على زر الإغلاق (X)
closeButton.addEventListener('click', () => {
    certificateModal.style.display = 'none';
    modalCertificateImage.src = ''; // مسح مصدر الصورة لتجنب تسرب الذاكرة
});

// إغلاق الـ Modal عند النقر خارج المحتوى
window.addEventListener('click', (event) => {
    if (event.target == certificateModal) {
        certificateModal.style.display = 'none';
        modalCertificateImage.src = '';
    }
});

// استدعاء الدالة لجلب وعرض الطلاب عند تحميل الصفحة
fetchStudents();

// لجعل الدوال متاحة عالمياً (مثل deleteStudent و showCertificateInNewWindow)
// بحيث يمكن استدعاؤها من خلال onclick في HTML
window.deleteStudent = deleteStudent;
window.showCertificateInNewWindow = showCertificateInNewWindow;