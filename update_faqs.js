import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tools = [
  { dir: 'merge', faqKey: 'mergeFaq' },
  { dir: 'split', faqKey: 'splitFaq' },
  { dir: 'pdf2img', faqKey: 'pdf2imgFaq' },
  { dir: 'organize', faqKey: 'organizeFaq' },
  { dir: 'compress', faqKey: 'compressFaq' },
];

const translations = {
  mergeFaq: [
    { q: "كيف أقوم بدمج ملفات PDF بدون إنترنت؟", a: "قم برفع ملفاتك، رتبها بالسحب والإفلات، واضغط 'دمج'. العملية تتم بالكامل على جهازك دون رفعها لأي سيرفر." },
    { q: "هل الأداة مجانية بالكامل؟", a: "نعم، الأداة مجانية 100% وبدون أي قيود أو علامات مائية." }
  ],
  splitFaq: [
    { q: "كيف أستخرج صفحات معينة من PDF؟", a: "ارفع الملف، واكتب أرقام الصفحات التي تريدها (مثال: 1-5, 8)، ثم اضغط 'استخراج الصفحات'." },
    { q: "هل ملفاتي في أمان؟", a: "بالتأكيد. لا يتم رفع ملفاتك أبداً، وتتم عملية التقسيم محلياً على جهازك." }
  ],
  pdf2imgFaq: [
    { q: "كيف أحول الـ PDF إلى صور؟", a: "ارفع ملف الـ PDF، وسنقوم تلقائياً باستخراج جميع الصفحات كصور عالية الدقة لتتمكن من تحميلها كملف مضغوط (ZIP)." },
    { q: "هل أحتاج للإنترنت للتحويل؟", a: "لا، تعمل الأداة بالكامل بدون إنترنت بمجرد تحميل الصفحة." }
  ],
  organizeFaq: [
    { q: "كيف يمكنني حذف صفحة من ملف PDF؟", a: "ارفع الملف في أداة الترتيب، واضغط على أيقونة سلة المهملات الموجودة على الصفحة التي تريد حذفها، ثم احفظ الملف الجديد." },
    { q: "كيف أعيد ترتيب الصفحات؟", a: "بكل بساطة، اسحب الصور المصغرة للصفحات وضعها في الترتيب الصحيح، ثم اضغط حفظ." }
  ],
  compressFaq: [
    { q: "كيف أقوم بتصغير حجم ملف PDF؟", a: "اسحب الملف وضعه في أداة الضغط، اختر مستوى الضغط المناسب، وسيتم تقليص حجم الملف فوراً داخل متصفحك." },
    { q: "هل يؤثر الضغط على جودة الملف؟", a: "نستخدم خوارزمية ضغط ذكية تحافظ على الدقة، ولكن قد يتم تحويل النصوص إلى صور مسطحة مما يقلل الحجم بشكل كبير." }
  ]
};

tools.forEach(tool => {
  const filePath = path.join(__dirname, tool.dir, 'index.html');
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Generate the specific FAQ schema
    const mainEntity = translations[tool.faqKey].map(faq => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.a
      }
    }));

    // Find the current FAQPage schema
    const schemaRegex = /\{[\s\n]*"@context":\s*"https:\/\/schema\.org",[\s\n]*"@type":\s*"FAQPage",[\s\n]*"mainEntity":\s*\[(.*?)\]\s*\}/s;
    
    const newSchemaStr = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": mainEntity
    }, null, 2).replace(/^/gm, '    ');

    content = content.replace(schemaRegex, newSchemaStr.trim());
    
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated FAQ schema for ${tool.dir}`);
  }
});
