# Deployment Instructions

## المشكلة الحالية

الصورة التي أرسلتها تظهر صفحة Cloudflare ضمن `Workers & Pages` على مشروع باسم `pdfhub`.
هذا يعني أن المشروع الموجود في Cloudflare حالياً هو خدمة Workers/Service، وليس مشروع Cloudflare Pages.

المستودع الذي لديك هو تطبيق Vite/React ثابت وينبغي نشره عبر:
- Cloudflare Pages
- أو GitHub Pages

## ماذا تفعل الآن

### 1. افتح GitHub Actions
اذهب إلى مستودع `zzxxca2013-hash/hw-to-pdf` ثم:
- اضغط `Actions`
- ابحث عن workflows التالية:
  - `Deploy to Cloudflare Pages`
  - `Deploy to GitHub Pages`

### 2. تأكد من وجود ملفات workflow
يجب أن يكون لديك في المستودع:
- `.github/workflows/deploy-cloudflare-pages.yml`
- `.github/workflows/deploy-github-pages.yml`

### 3. تأكد من أسرار GitHub
اذهب إلى `Settings` → `Secrets and variables` → `Actions` وتأكد من وجود:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_PROJECT_NAME`

### 4. تأكد أن `CLOUDFLARE_PROJECT_NAME` صحيح
افتح Cloudflare Dashboard ثم:
- اذهب إلى `Pages`
- شوف اسم المشروع بالضبط
- ضع نفس الاسم في `CLOUDFLARE_PROJECT_NAME`

إذا كان النص في Cloudflare يقول `pdfhub` ونجح هذا المشروع كصفحة Pages، فضع `pdfhub`.
إذا لم يكن هناك مشروع Pages، فأنت تحتاج إنشاء مشروع جديد في Pages وليس استخدام Workers.

## إذا استمر الفشل في Cloudflare Pages
استخدم الحل البديل الجديد:
- شغّل workflow `Deploy to GitHub Pages`

هذا الحل يبني الموقع وينشره إلى GitHub Pages بدون الحاجة إلى Cloudflare.

## هل تريد حل سريع الآن؟
إذا أردت، افعل هذا مباشرة:
1. افتح صفحة `Actions` في GitHub.
2. اختر `Deploy to GitHub Pages`.
3. اضغط `Run workflow`.

إذا نجح، ستجد الموقع منشوراً على GitHub Pages.

## اختبار محلي
تأكد أن البناء يعمل محلياً:

```bash
npm install
npm run build
npm run preview
```

إذا هذا يعمل، النشر يعتمد فقط على إعدادات Cloudflare أو GitHub Actions.
