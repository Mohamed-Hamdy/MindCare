# MindCare — منصة إدارة المراكز والعيادات الطبية

منصة ويب متكاملة لإدارة العيادات والمراكز الطبية، تعمل بالكامل من جانب العميل
(Client-Side فقط) بدون أي حاجة لسيرفر خلفي — كل البيانات تُخزَّن محليًا في
متصفح المستخدم عبر **IndexedDB**.

## التقنيات المستخدمة

| الطبقة | التقنية |
|---|---|
| Framework | Angular 21 (Standalone Components، أحدث إصدار متوافق مع بيئة التشغيل) |
| إدارة الحالة | Angular Signals |
| التخزين المحلي | IndexedDB عبر مكتبة `idb` (طبقة Repository عامة، انظر Clean Architecture أدناه) |
| التصميم | Bootstrap 5.3 (RTL) + SCSS + خط Cairo + Dark/Light Mode عبر `data-bs-theme` |
| التحقق عبر البريد (OTP) | `@emailjs/browser` |
| واتساب | جلسة Fetch إلى WhatsApp Business API مع تحويل تلقائي لرابط `wa.me` عند الفشل |
| تصدير PDF | `jsPDF` + `html2canvas` (لضمان عرض العربية RTL بشكل صحيح) + `qrcode` |
| اللغة | TypeScript صارم بالكامل (`strict: true`, `strictTemplates: true`) |

## البنية المعمارية (Clean Architecture)

```
src/app/
  core/
    models/        ← نماذج البيانات (Domain Layer) — لا تعتمد على أي شيء آخر
    data/           ← طبقة البيانات: IndexedDB schema + Repository عام لكل كيان
    services/       ← الخدمات المشتركة: Auth, OTP, WhatsApp, PDF, Theme, Notifications
    guards/         ← حراسة المسارات حسب الدور (Role-based routing)
    config/         ← إعدادات EmailJS / WhatsApp / بيانات العيادة
  shared/           ← مكوّنات UI قابلة لإعادة الاستخدام
  layout/           ← قوالب الصفحات (بوابة المرضى / لوحة الموظفين)
  features/         ← كل وحدة من وحدات النظام في مجلد مستقل
    patient-portal/ ← بوابة حجز المرضى
    reception/      ← الاستقبال وقائمة الانتظار الحية
    doctor/         ← ملف المريض والروشتة الإلكترونية
    pharmacy/       ← الصيدلية والمخزون
    lab/             ← تتبع التحاليل
    billing/        ← الفواتير
    admin/          ← لوحة الإدارة الديناميكية (CRUD كامل)
```

كل شاشة تقرأ حالتها من `repository.items()` (وهو Signal)، لذلك أي تعديل من
لوحة الإدارة (إضافة/تعديل/حذف طبيب، دواء، تخصص...) ينعكس فورًا في كل الشاشات
دون أي عنصر ثابت (hardcoded) في الكود.

## تشغيل المشروع محليًا

```bash
npm install
npm start        # يفتح على http://localhost:4200
```

عند أول تشغيل، يقوم التطبيق تلقائيًا بزرع (Seed) بيانات تجريبية: 6 تخصصات،
6 أطباء، 10 أدوية، 6 تحاليل معملية، ومريضين تجريبيين — بالإضافة إلى حسابات
دخول للموظفين.

### حسابات الدخول التجريبية

| الدور | اسم المستخدم | كلمة المرور |
|---|---|---|
| مدير النظام | `admin` | `admin123` |
| الاستقبال | `reception` | `reception123` |
| طبيب (أي من الـ6) | `doctor1` ... `doctor6` | `doctor123` |
| الصيدلية | `pharmacy` | `pharmacy123` |
| المعمل | `lab` | `lab123` |

## تفعيل التكاملات الحقيقية (اختياري)

المشروع يعمل بالكامل في "وضع تجريبي" بدون أي إعداد إضافي:
- رمز التحقق OTP يظهر مباشرة في إشعار على الشاشة بدلًا من البريد الإلكتروني.
- إشعارات واتساب تُفتح تلقائيًا كرابط `wa.me` جاهز للإرسال اليدوي.

لتفعيل الإرسال الحقيقي، عدّل الملف `src/app/core/config/app-config.ts`:

```ts
emailjs: {
  serviceId: 'YOUR_EMAILJS_SERVICE_ID',
  templateId: 'YOUR_OTP_TEMPLATE_ID',
  notifyTemplateId: 'YOUR_NOTIFY_TEMPLATE_ID', // اختياري
  publicKey: 'YOUR_EMAILJS_PUBLIC_KEY',
},
whatsapp: {
  apiUrl: 'https://graph.facebook.com/vXX.X/PHONE_ID/messages',
  apiToken: 'YOUR_WHATSAPP_CLOUD_API_TOKEN',
},
```

قالب EmailJS الخاص بالـ OTP يحتاج المتغيرات: `{{to_email}}`, `{{otp_code}}`,
`{{ttl_minutes}}`, `{{clinic_name}}`.

## البناء للإنتاج

```bash
npm run build
```

الناتج في `dist/MindCare/browser` — مجلد ثابت بالكامل (Static) جاهز
للرفع على أي استضافة ثابتة: Netlify، Vercel، GitHub Pages، Firebase Hosting،
إلخ. لا حاجة لأي إعداد سيرفر أو قاعدة بيانات.

### النشر السريع

- **Netlify**: اسحب مجلد `dist/MindCare/browser` إلى [app.netlify.com/drop](https://app.netlify.com/drop)
- **Vercel**: `vercel --prod dist/MindCare/browser` (بعد `npm i -g vercel`)
- **GitHub Pages**: ارفع محتوى `dist/MindCare/browser` إلى فرع `gh-pages`

> ملاحظة: بما أن التوجيه (Routing) من نوع Browser History، تأكد أن الاستضافة
> تُعيد توجيه كل المسارات غير الموجودة إلى `index.html` (SPA fallback) —
> هذا مُفعّل تلقائيًا في Netlify وVercel، وعلى GitHub Pages يمكن نسخ
> `index.html` إلى `404.html`.

## الوحدات المنفذة

- ✅ بوابة حجز المرضى: اختيار تخصص/طبيب بالتقييم والسعر، Smart Slot Picker يمنع التعارض تلقائيًا حسب شفتات الطبيب، استمارة تاريخ مرضي مع رفع صور Base64، تأكيد OTP سداسي عبر EmailJS بعدّاد 5 دقائق وحد أقصى للمحاولات.
- ✅ الاستقبال: قائمة انتظار حية (قيد الانتظار / في الكشف / مكتمل / طارئة)، تسجيل حضور، إشعار واتساب تلقائي مع Fallback لرابط wa.me، إضافة حالة طارئة تتخطى الطابور.
- ✅ لوحة الطبيب: EMR كامل (تاريخ مرضي، علامات حيوية)، روشتة إلكترونية بمحرر أدوية/جرعات، تصدير PDF بترويسة العيادة وQR Code، طلب تحاليل معملية مباشرة من ملف المريض.
- ✅ الصيدلية والمعمل: خصم تلقائي من المخزون عند الصرف، تنبيه عند الوصول للحد الأدنى، تتبع حالة التحاليل مع إشعار بريدي عند الجاهزية.
- ✅ الفواتير: تجميع تلقائي لتكلفة الكشف + الأدوية المصروفة + التحاليل، خصم وضريبة قابلين للتعديل، طرق دفع متعددة، تصدير PDF.
- ✅ لوحة الإدارة: CRUD كامل للأطباء، التخصصات، الأدوية والمخزون، الخدمات والتحاليل، ومواعيد/شفتات كل طبيب — بدون أي عنصر ثابت بالكود، وكل تعديل ينعكس فورًا في كل الشاشات.

## القيود المعروفة (Client-Side Only)

- لا يوجد Backend حقيقي، لذلك بيانات كل متصفح منفصلة عن الآخر (لا توجد مزامنة بين الأجهزة).
- كلمات المرور تُخزَّن كنص عادي في IndexedDB — مقبول لتطبيق تجريبي بالكامل من جانب العميل، غير مناسب لبيئة إنتاج حقيقية بدون تعديل.
- إرسال البريد وواتساب الحقيقيين يعتمدان على مفاتيح publishable تُستدعى من المتصفح مباشرة (لا يوجد سيرفر يُخفيها) — هذا هو النمط المتاح الوحيد في تطبيق Client-Side بالكامل.
