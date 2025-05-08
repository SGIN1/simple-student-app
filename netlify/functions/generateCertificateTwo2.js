[build]
  base = "/"

[functions]
  directory = "netlify/functions"

[functions.generateCertificateTwo2]
  included_files = ["fonts/arial.ttf"]

[[redirects]]
  from = "/certificate/:certificate_id" # رابط جديد "نظيف" مع بارامتر
  to = "/.netlify/functions/generateCertificateTwo2?id=:certificate_id" # توجيه داخلي للوظيفة مع تمرير البارامتر
  status = 200

[[redirects]]
  from = "/verify/:certificate_id" # رابط بديل "نظيف" إذا حبيت
  to = "/.netlify/functions/generateCertificateTwo2?id=:certificate_id"
  status = 200

[[redirects]]
  from = "/get-certificate/:id" # مثال آخر لرابط نظيف
  to = "/.netlify/functions/generateCertificateTwo2?id=:id"
  status = 200

[[redirects]]
  from = "/VaccineVerify.php" # إذا كنت تستخدم هذا الرابط في مكان ما وتبغى تحافظ عليه
  to = "/certificate/:certificate_id" # وجهه إلى الرابط الجديد "النظيف" (تحتاج تعديل الكود اللي يرسل لهذا الرابط)
  status = 301 # أو 200 حسب حاجتك

[[redirects]]
  from = "/VaccineVerify.php?CPRNumber=:certificate_id" # نفس الشي هنا
  to = "/certificate/:certificate_id"
  status = 301 # أو 200

[[redirects]]
  from = "/ui/inquiries/generateCertificateTwo2" # إذا كان هذا الرابط مستخدم داخليًا
  to = "/certificate/:certificate_id" # وجهه إلى الرابط الجديد (تحتاج تعديل الكود اللي يرسل لهذا الرابط)
  status = 301 # أو 200

[[redirects]]
  from = "/ui/inquiries/generateCertificateTwo2?id=:id" # نفس الشي هنا
  to = "/certificate/:id"
  status = 301 # أو 200

[[redirects]]
  from = "/images/full/:file"
  to = "/.netlify/images?url=/public/images_temp/:file"
  status = 200