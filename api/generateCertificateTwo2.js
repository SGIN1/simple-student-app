// api/generateCertificateTwo2.js

// ... (بقية الكود كما هو)

export default async function handler(event) {
    // استخدم URL object لتحليل المسار
    const url = new URL(event.url);
    // إذا كنت تستخدم rewrite مثل "/certificate/:id" -> "/api/generateCertificateTwo2"
    // فإن الـ ID سيكون آخر جزء في الـ pathname الأصلي
    // يجب أن تكون إعادة التوجيه في vercel.json كالتالي:
    // "source": "/certificate/:id",
    // "destination": "/api/generateCertificateTwo2"
    // وهنا يجب أن تستخرج الـ ID من الـ `pathname` الأصلي للطلب

    // الطريقة الأكثر موثوقية: استخراج الـ ID من الـ `pathname` بعد الـ `rewrite`
    // في هذا السيناريو، `event.url` سيكون المسار الذي وصلته الوظيفة بعد إعادة التوجيه،
    // وهو "/api/generateCertificateTwo2" فقط. الـ `:id` لن يكون جزءًا منه.

    // الحل الصحيح هو تعديل قاعدة الـ `rewrite` في `vercel.json` ليمرر الـ ID للوظيفة
    // كـ `query parameter` أو كجزء من مسار الوظيفة نفسها.

    // سنفترض أن الـ ID يتم تمريره كجزء من المسار الديناميكي لوظيفة Vercel
    // أي أن الطلب الأصلي يكون /api/generateCertificateTwo2/[id]
    // وإذا كنت تستخدم /certificate/:id، فـ Vercel تمرر الـ ID كـ query parameter
    // أو كجزء من المسار المحول إلى الوظيفة نفسها.

    // دعنا نعتمد على أن Vercel تمرر الـ ID كـ parameter في كائن الطلب:
    // في Vercel Functions، الطلبات الواردة التي تتضمن مسار ديناميكي مثل `api/your-function/[id]`
    // ستضع الـ ID في `event.query.id` أو `event.params.id`.

    let studentId;
    // أولاً، حاول استخراج الـ ID من query parameters (إذا تم تمريره هكذا)
    if (url.searchParams.has('id')) {
        studentId = url.searchParams.get('id');
    } else {
        // إذا لم يكن في query params، حاول استخراجه من المسار مباشرة
        // هذا يعتمد على أن الطلب الوارد للوظيفة هو /api/generateCertificateTwo2/[id]
        // وليس /certificate/[id] (حيث يتم إعادة توجيهه).
        // بما أنك تستخدم rewrite: "/certificate/:id" -> "/api/generateCertificateTwo2"
        // فإن ID الطالب لن يكون جزءًا من `event.url` الخاص بوظيفتك `/api/generateCertificateTwo2`.
        // نحتاج لجعل Vercel تمرر الـ ID كـ parameter.

        // الحل الأفضل مع rewrite:
        // يجب أن نعدل الـ `rewrite` في `vercel.json` ليمرر الـ ID كـ `query parameter`
        // أو أن نستخدم `destination: "/api/generateCertificateTwo2/:id"`
        // الأخير أفضل.

        // **تعديل مقترح لـ vercel.json:**
        // {
        //   "source": "/certificate/:id",
        //   "destination": "/api/generateCertificateTwo2/:id" // <--- هذا هو التعديل الهام
        // },

        // إذا كان الـ `destination` هكذا، فإن `event.url` سيحتوي على الـ ID.
        // مثال: /api/generateCertificateTwo2/68393763032069b932690469
        const pathParts = url.pathname.split('/');
        // تأكد من أن الـ ID هو العنصر الأخير في المسار بعد تقسيم المسار
        // index -1 هو العنصر الأخير، index -2 قد يكون اسم الوظيفة
        studentId = pathParts[pathParts.length - 1];
        if (studentId === 'generateCertificateTwo2' || studentId === '') {
            // هذا يعني أن الـ ID لم يتم تمريره في المسار كما هو متوقع
            // وقد يكون موجودًا في `event.query.id` إذا كان الـ rewrite يمرره كـ query.
            // أو أن المشكلة هي أن الـ ID لم يتم استخراجه بشكل صحيح على الإطلاق.
            // لكي نكون آمنين، يمكننا التحقق من `url.searchParams.get('id')`
            studentId = url.searchParams.get('id'); // محاولة أخيرة إذا لم يكن في المسار
        }
    }


    console.log('ID المستلم في وظيفة generateCertificateTwo2:', studentId);

    // ... (بقية الكود كما هو)
}
