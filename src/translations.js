const CONTACT_EMAIL = "zzxxca2047@gmail.com";

export const translations = {
  en: {
    common: {
      title: "Image to PDF Converter",
      subtitle: "Quickly convert your images to a clean PDF",
      processing: "Processing...",
      cancel: "Cancel",
      welcome: "Welcome to Homework to PDF! Start converting your images.",
      draftRestored: "Draft restored! You can continue from where you left off.",
    },
    tools: {
      merge: {
        title: "Merge PDF Files",
        subtitle: "Combine multiple PDFs into a single file securely",
        seoTitle: "Free PDF Merger Tool",
        seoText: "Easily combine multiple PDF files into one single document. Our free PDF merger tool runs entirely offline in your browser, guaranteeing absolute privacy.",
        faq: [
          { q: "How do I merge PDF files offline?", a: "Upload your PDFs, drag to reorder them, and click 'Merge PDFs'. It runs directly in your browser without uploading to any server." },
          { q: "Is the PDF merging tool free?", a: "Yes, it is 100% free with no limits." }
        ]
      },
      split: {
        title: "Split PDF Files",
        subtitle: "Extract pages from your PDF quickly and offline",
        pages: "Split PDF Pages",
        desc: "Upload a PDF to extract each page as a separate file, downloaded as a ZIP.",
        seoTitle: "Split PDF Files Instantly",
        seoText: "Extract specific pages or separate a large PDF document into smaller pieces. A secure, fast, and local PDF splitting tool.",
        faq: [
          { q: "How to extract pages from a PDF?", a: "Upload your PDF, enter the page numbers you want to keep (e.g., 1-5, 8), and click 'Extract Pages'." },
          { q: "Are my files safe?", a: "Absolutely. We do not upload your PDF. All splitting is done locally on your device." }
        ]
      },
      pdf2img: {
        title: "PDF to Images",
        subtitle: "Convert PDF pages to high-quality JPG images offline",
        seoTitle: "Convert PDF to JPG Images",
        seoText: "Turn all pages of your PDF document into high-quality JPG images. Perfect for sharing homework or presentations as pictures.",
        faq: [
          { q: "How to convert PDF to Images?", a: "Upload the PDF file, and we will automatically extract all pages as high-quality JPG images which you can download as a ZIP." },
          { q: "Do I need internet to convert?", a: "No, the conversion process works completely offline using your browser's processing power." }
        ]
      },
      organize: {
        title: "Organize PDF Pages",
        subtitle: "Reorder and delete PDF pages easily",
        seoTitle: "Reorder and Delete PDF Pages",
        seoText: "Sort, rearrange, and remove pages from your PDF files easily. Just drag and drop pages into your desired order.",
        faq: [
          { q: "How can I delete pages from a PDF?", a: "Upload the PDF in the Organize tool, click the trash icon on the pages you want to delete, and save the new PDF." },
          { q: "How do I rearrange pages?", a: "Simply drag the page thumbnails and drop them in the correct order, then save." }
        ]
      },
      compress: {
        title: "Compress PDF",
        subtitle: "Reduce PDF file size for easy sharing",
        seoTitle: "Compress PDF File Size",
        seoText: "Reduce the file size of your PDF documents instantly without losing quality. Ideal for email attachments and fast sharing.",
        faq: [
          { q: "How to reduce PDF file size?", a: "Upload your PDF to our compressor, select the compression level, and we will reduce the file size securely within your browser." },
          { q: "Does compressing a PDF affect its quality?", a: "We use smart compression that reduces size while maintaining readable quality, though text may become flattened images." }
        ]
      }
    },
    upload: {
      placeholder: "Drag & drop images here, or click to select files",
      help: "Supports JPG, PNG",
      addMore: "Add More",
      maxError: "Sorry, the maximum limit is 100 images per PDF.",
      dragPdf: "Drag PDF file here",
      selectFile: "Select File",
    },
    editor: {
      enhance: "Enhance images (Brightness & Contrast)",
      bw: "Black & White (Grayscale)",
      scanner: "Scanner Mode (Clear Text)",
      rotate: "Rotate Image",
      crop: "Crop Image",
      applyCrop: "Apply Crop",
      preview: "Image Preview",
      dragHint: "Tip: Drag images to reorder them",
      autoSort: "Sort A-Z",
    },
    settings: {
      title: "PDF Settings",
      fileNameLabel: "File Name:",
      fileNamePlaceholder: "e.g., Math_Homework",
      watermarkLabel: "Add Name/Watermark:",
      watermarkPlaceholder: "e.g., John Doe",
      quality: "Quality",
      high: "High",
      medium: "Medium",
      low: "Low",
      pageNumbers: "Page Numbers",
      margins: "Page Margins",
    },
    actions: {
      convert: "Convert to PDF",
      download: "Download PDF",
      downloadZip: "Download as ZIP",
      print: "Print PDF",
      share: "Share PDF",
      shareApp: "Share App",
      install: "Install App",
      clearAll: "Clear All",
      takePhoto: "Take Photo",
      removeFile: "Remove File",
      splitNow: "Split Pages Now",
      close: "Close",
    },
    messages: {
      noImages: "No images uploaded yet. Start by adding some!",
      errorNoImages: "Please upload at least one image.",
      errorProcessing: "An error occurred while creating the PDF.",
      success: "PDF created successfully!",
      splitSuccess: "Pages extracted successfully!",
      confirmClearTitle: "Clear All Images?",
      confirmClearDesc: "Are you sure you want to remove all uploaded images? This action cannot be undone.",
      errorMaxPages: "Sorry, maximum limit is 150 pages to prevent browser crash.",
      errorSplit: "An error occurred while splitting the file.",
      processingImage: "Processing image {current} of {total}...",
      finalizingPdf: "Finalizing PDF...",
      shareNotSupported: "Sharing is not supported on this browser. Please download the PDF.",
      copyLinkToShare: "Copy this link to share: ",
    },
    ui: {
      offline: "Offline Mode",
      fileSize: "Size:",
      toggleLang: "Switch to Arabic",
      toggleTheme: "Toggle Light/Dark Theme",
      imageCount: (count) => `${count} image${count !== 1 ? 's' : ''}`,
      previewPdf: "Preview PDF", // Added for consistency
    },
    nav: {
      privacyPolicy: "Privacy Policy",
      termsOfUse: "Terms of Use",
      contactUs: "Contact Us",
      home: "Home",
    },
    seoTitle: "About PDF Tools (Image to PDF, Merge, Split)",
    seoText: "Homework to PDF is a free, fast, and secure toolkit designed for students and professionals to easily convert images to PDF, merge multiple PDF files, and split large PDFs into smaller parts. All processing happens locally in your browser, ensuring your privacy is strictly protected. We do not store or upload your files to our servers.",
    privacyText: "Your privacy is our priority. All image processing (resizing, cropping, and PDF conversion) happens entirely within your web browser. We do not upload, store, or share your files with any third-party servers. We use Google AdSense to display ads, which may use cookies to serve personalized ads based on your visit.",
    termsText: "By using this tool, you agree to use it for lawful educational purposes. The tool is provided 'as is' without any warranties. We are not responsible for any lost data or errors in the generated PDF files.",
    contactText: "For any inquiries or support, please contact us at:",
    contactEmail: CONTACT_EMAIL,
    faqTitle: "Frequently Asked Questions",
    faq: [
      { q: "How to convert an image to PDF for free?", a: "Simply drag and drop your JPG or PNG images into the upload area above. Rearrange them if needed, and click 'Convert to PDF'. Your file will download instantly without any cost." },
      { q: "How can I merge multiple PDF files?", a: "Select the 'Merge PDF' tool from the top menu, upload the PDF files you want to combine, arrange them in your preferred order, and click merge. It's completely free and offline." },
      { q: "Can I split a large PDF into separate pages?", a: "Yes, use the 'Split PDF' tool. Upload your large PDF, select the specific pages or ranges you want to extract, and download the new file securely." },
      { q: "Is this Image to PDF converter safe to use?", a: "Yes, 100% safe. Unlike other tools, we do not upload your images or PDF documents to any server. The conversion happens entirely offline inside your web browser, ensuring maximum privacy." },
      { q: "Can I use this tool on my mobile phone?", a: "Absolutely! The website is fully optimized for mobile devices. You can even install it as an app directly from your browser to use it offline." },
      { q: "Does this tool support cropping and rotating images?", a: "Yes, once you upload an image, you can use the built-in tools to crop out unwanted parts, rotate the image, or even apply a 'Scanner Mode' filter to make text clearer." }
    ],
  },
  ar: {
    common: {
      title: "تحويل الصور إلى PDF",
      subtitle: "حوّل صورك إلى ملف PDF نظيف ومنسق بسهولة",
      processing: "جاري المعالجة...",
      cancel: "إلغاء",
      welcome: "أهلاً بك في محول الواجبات لـ PDF! ابدأ بتحويل صورك.",
      draftRestored: "تم استعادة المسودة! يمكنك المتابعة من حيث توقفت.",
    },
    tools: {
      merge: {
        title: "دمج ملفات PDF",
        subtitle: "ادمج عدة ملفات PDF في ملف واحد بسهولة وأمان",
        seoTitle: "أداة دمج ملفات PDF مجاناً",
        seoText: "قم بدمج عدة ملفات PDF في مستند واحد بسهولة. أداة دمج الـ PDF الخاصة بنا تعمل بالكامل بدون إنترنت داخل متصفحك، مما يضمن خصوصيتك المطلقة.",
        faq: [
          { q: "كيف أقوم بدمج ملفات PDF بدون إنترنت؟", a: "قم برفع ملفاتك، رتبها بالسحب والإفلات، واضغط 'دمج'. العملية تتم بالكامل على جهازك دون رفعها لأي سيرفر." },
          { q: "هل الأداة مجانية بالكامل؟", a: "نعم، الأداة مجانية 100% وبدون أي قيود أو علامات مائية." }
        ]
      },
      split: {
        title: "تقسيم وفصل PDF",
        subtitle: "استخرج صفحات محددة من ملف الـ PDF الخاص بك بسرعة",
        pages: "فصل صفحات PDF",
        desc: "قم برفع ملف PDF لاستخراج كل صفحة كملف مستقل وتحميلها جميعاً في ملف مضغوط (ZIP).",
        seoTitle: "تقسيم وفصل ملفات PDF بسرعة",
        seoText: "استخرج صفحات معينة أو قم بتجزئة ملف PDF كبير إلى أجزاء أصغر. أداة آمنة وسريعة وتعمل محلياً.",
        faq: [
          { q: "كيف أستخرج صفحات معينة من PDF؟", a: "ارفع الملف، واكتب أرقام الصفحات التي تريدها (مثال: 1-5, 8)، ثم اضغط 'استخراج الصفحات'." },
          { q: "هل ملفاتي في أمان؟", a: "بالتأكيد. لا يتم رفع ملفاتك أبداً، وتتم عملية التقسيم محلياً على جهازك." }
        ]
      },
      pdf2img: {
        title: "PDF إلى صور",
        subtitle: "استخرج جميع صفحات الـ PDF كصور عالية الجودة (JPG) بدون إنترنت",
        seoTitle: "تحويل ملفات PDF إلى صور JPG",
        seoText: "قم بتحويل جميع صفحات ملف الـ PDF إلى صور عالية الجودة بصيغة JPG. مثالية لمشاركة الواجبات أو العروض التقديمية كصور.",
        faq: [
          { q: "كيف أحول الـ PDF إلى صور؟", a: "ارفع ملف الـ PDF، وسنقوم تلقائياً باستخراج جميع الصفحات كصور عالية الدقة لتتمكن من تحميلها كملف مضغوط (ZIP)." },
          { q: "هل أحتاج للإنترنت للتحويل؟", a: "لا، تعمل الأداة بالكامل بدون إنترنت بمجرد تحميل الصفحة." }
        ]
      },
      organize: {
        title: "ترتيب وتنظيم PDF",
        subtitle: "أعد ترتيب وحذف صفحات ملف الـ PDF الخاص بك بسهولة",
        seoTitle: "إعادة ترتيب وحذف صفحات PDF",
        seoText: "قم بفرز وتغيير ترتيب صفحات ملفاتك، أو احذف الصفحات غير المرغوب فيها بسهولة تامة عن طريق السحب والإفلات.",
        faq: [
          { q: "كيف يمكنني حذف صفحة من ملف PDF؟", a: "ارفع الملف في أداة الترتيب، واضغط على أيقونة سلة المهملات الموجودة على الصفحة التي تريد حذفها، ثم احفظ الملف الجديد." },
          { q: "كيف أعيد ترتيب الصفحات؟", a: "بكل بساطة، اسحب الصور المصغرة للصفحات وضعها في الترتيب الصحيح، ثم اضغط حفظ." }
        ]
      },
      compress: {
        title: "ضغط وتصغير PDF",
        subtitle: "قم بتقليل حجم ملف الـ PDF للتمكن من إرساله ومشاركته بسهولة",
        seoTitle: "تصغير وضغط حجم ملف PDF مجاناً",
        seoText: "قم بتقليل حجم ملفات الـ PDF لتسهيل إرسالها عبر الواتساب أو البريد الإلكتروني. عملية ضغط سريعة وآمنة ومجانية بالكامل.",
        faq: [
          { q: "كيف أقوم بتصغير حجم ملف PDF؟", a: "اسحب الملف وضعه في أداة الضغط، اختر مستوى الضغط المناسب، وسيتم تقليص حجم الملف فوراً داخل متصفحك." },
          { q: "هل يؤثر الضغط على جودة الملف؟", a: "نستخدم خوارزمية ضغط ذكية تحافظ على الدقة، ولكن قد يتم تحويل النصوص إلى صور مسطحة مما يقلل الحجم بشكل كبير." }
        ]
      }
    },
    upload: {
      placeholder: "اسحب وأفلت الصور هنا، أو انقر لاختيار الملفات",
      help: "يدعم JPG, PNG",
      addMore: "إضافة صور",
      maxError: "عذراً، الحد الأقصى هو 100 صورة للملف الواحد.",
      dragPdf: "اسحب ملف PDF هنا",
      selectFile: "اختيار ملف",
    },
    editor: {
      enhance: "تحسين الصور (السطوع والتباين)",
      bw: "أبيض وأسود (للطباعة)",
      scanner: "وضع الماسح الضوئي (نص واضح)",
      rotate: "تدوير الصورة",
      crop: "قص الصورة",
      applyCrop: "تطبيق القص",
      preview: "معاينة الصور",
      dragHint: "تلميح: اسحب الصور لإعادة ترتيبها",
      autoSort: "ترتيب ذكي",
    },
    settings: {
      title: "إعدادات الـ PDF",
      fileNameLabel: "اسم الملف:",
      fileNamePlaceholder: "مثال: واجب_الرياضيات",
      watermarkLabel: "إضافة اسم الطالب (علامة مائية):",
      watermarkPlaceholder: "مثال: أحمد محمد",
      quality: "الجودة",
      high: "عالية",
      medium: "متوسطة",
      low: "منخفضة",
      pageNumbers: "أرقام الصفحات",
      margins: "هوامش للصفحة",
    },
    actions: {
      convert: "تحويل إلى PDF",
      download: "تحميل PDF",
      downloadZip: "تحميل كملف ZIP",
      print: "طباعة الـ PDF",
      share: "مشاركة (WhatsApp/Email)",
      shareApp: "مشاركة التطبيق",
      install: "تثبيت التطبيق",
      clearAll: "مسح الكل",
      takePhoto: "التقاط صورة",
      removeFile: "إزالة الملف",
      splitNow: "فصل الصفحات الآن",
      close: "إغلاق",
    },
    messages: {
      noImages: "لم يتم رفع أي صور بعد. ابدأ بإضافة بعض الصور!",
      errorNoImages: "يرجى رفع صورة واحدة على الأقل.",
      errorProcessing: "حدث خطأ أثناء إنشاء ملف PDF.",
      success: "تم إنشاء ملف PDF بنجاح!",
      splitSuccess: "تم استخراج الصفحات بنجاح!",
      confirmClearTitle: "مسح جميع الصور؟",
      confirmClearDesc: "هل أنت متأكد من مسح جميع الصور المرفوعة؟ لا يمكن التراجع عن هذا الإجراء.",
      errorMaxPages: "عذراً، لا يمكن فصل ملف يحتوي على أكثر من 150 صفحة لحماية متصفحك.",
      errorSplit: "حدث خطأ أثناء فصل الملف.",
      processingImage: "جاري معالجة الصورة {current} من {total}...",
      finalizingPdf: "جاري إنهاء ملف PDF...",
      shareNotSupported: "المشاركة غير مدعومة في هذا المتصفح. يرجى تحميل ملف PDF.",
      copyLinkToShare: "انسخ هذا الرابط للمشاركة: ",
    },
    ui: {
      offline: "يعمل بدون إنترنت",
      fileSize: "الحجم:",
      toggleLang: "التبديل للإنجليزية",
      toggleTheme: "تغيير المظهر (فاتح/داكن)",
    imageCount: (count) => {
      if (count === 1) return "صورة واحدة";
      if (count === 2) return "صورتان";
      if (count >= 3 && count <= 10) return `${count} صور`;
      return `${count} صورة`;
    },
      previewPdf: "معاينة PDF", // Added for consistency
    },
    nav: {
      privacyPolicy: "سياسة الخصوصية",
      termsOfUse: "شروط الاستخدام",
      contactUs: "اتصل بنا",
      home: "الرئيسية",
    },
    seoTitle: "عن أدوات PDF (تحويل الصور، دمج، وتقسيم)",
    seoText: "منصتنا هي مجموعة أدوات مجانية وسريعة وآمنة صُممت خصيصاً للطلاب والمحترفين لـ تحويل الصور إلى PDF، بالإضافة إلى أدوات دمج ملفات PDF و تقسيم وفصل صفحات الـ PDF بكل سهولة. تتم جميع عمليات المعالجة محلياً داخل متصفحك، مما يضمن حماية خصوصيتك بالكامل. نحن لا نقوم برفع أو تخزين ملفاتك على أي خوادم خارجية.",
    privacyText: "خصوصيتك هي أولويتنا. جميع عمليات معالجة الصور (تغيير الحجم، القص، وتحويل PDF) تحدث بالكامل داخل متصفحك. نحن لا نقوم برفع أو تخزين أو مشاركة ملفاتك مع أي خوادم خارجية. نحن نستخدم Google AdSense لعرض الإعلانات، والتي قد تستخدم ملفات تعريف الارتباط (الكوكيز) لعرض إعلانات مخصصة.",
    termsText: "باستخدامك لهذه الأداة، فإنك توافق على استخدامها للأغراض التعليمية المشروعة. يتم تقديم الأداة 'كما هي' دون أي ضمانات. نحن غير مسؤولين عن أي فقدان للبيانات أو أخطاء في ملفات الـ PDF الناتجة.",
    contactText: "لأي استفسارات أو طلبات دعم، يرجى التواصل معنا عبر البريد الإلكتروني:",
    contactEmail: CONTACT_EMAIL,
    faqTitle: "الأسئلة الشائعة",
    faq: [
      { q: "كيف أقوم بتحويل الصور إلى PDF مجاناً؟", a: "الأمر بسيط جداً! قم برفع صورك (سواء كانت بصيغة JPG أو PNG) في منطقة الرفع بالأعلى، قم بترتيبها بالسحب والإفلات، ثم اضغط على زر 'تحويل إلى PDF'. سيتم تحميل الملف مباشرة مجاناً." },
      { q: "كيف يمكنني دمج ملفات PDF في ملف واحد؟", a: "اختر أداة 'دمج PDF' من القائمة العلوية، ثم قم برفع ملفات الـ PDF التي تريد دمجها، رتبها بالسحب والإفلات، واضغط على دمج. العملية مجانية وتتم بالكامل بدون إنترنت." },
      { q: "هل يمكنني تقسيم ملف PDF أو استخراج صفحات معينة؟", a: "نعم! استخدم أداة 'فصل PDF' بالأعلى، ارفع الملف الكبير الخاص بك، حدد الصفحات التي تريد استخراجها، وسيتم إنشاء ملف PDF جديد يحتوي فقط على الصفحات المختارة." },
      { q: "هل تحويل الواجبات ودمج الملفات آمن هنا؟", a: "نعم، آمن بنسبة 100%. على عكس المواقع الأخرى، نحن لا نقوم برفع صورك أو ملفاتك لأي خوادم (سيرفرات) خارجية. تتم العملية بالكامل داخل متصفحك (محلياً)، مما يضمن خصوصيتك المطلقة." },
      { q: "هل يمكنني استخدام هذه الأدوات من الجوال؟", a: "بالتأكيد! الموقع مصمم خصيصاً ليتوافق مع جميع الهواتف الذكية. ويمكنك أيضاً تثبيته كتطبيق على شاشتك الرئيسية ليعمل بدون إنترنت." },
      { q: "هل يمكنني قص وتدوير الصور قبل تحويلها؟", a: "نعم، بعد رفع الصورة في أداة تحويل الصور، ستجد أزراراً فوقها لقص الأجزاء غير المرغوب فيها، تدوير الصورة، وحتى تفعيل 'وضع الماسح الضوئي' لتوضيح النصوص قبل التحويل." }
    ],
  }
};

const compatibilityLabels = {
  en: {
    selectFiles: "Select Files",
    errorMinTwoPdfs: "Please upload at least two PDF files.",
    mergeNow: "Merge PDFs",
    mergeSuccess: "PDF files merged successfully!",
    downloadMergedPdf: "Download Merged PDF",
    pdf2imgConvertNow: "Convert to Images",
    pdf2imgSuccess: "Images extracted successfully!",
    downloadAllImagesZip: "Download All Images as ZIP",
    extractedImagesPreview: "Extracted Images Preview",
    errorExtractingImages: "An error occurred while extracting images.",
    organizeDragHint: "Drag pages to reorder them, or delete unwanted pages.",
    changeFile: "Change File",
    saveOrderAsNewPdf: "Save as New PDF",
    organizeSuccess: "PDF organized successfully!",
    downloadNewPdf: "Download New PDF",
    errorMaxPagesOrganize: "Sorry, maximum limit is 150 pages to prevent browser crash.",
    errorReadingFile: "An error occurred while reading the file.",
    errorMinOnePage: "Please keep at least one page.",
    errorGeneratingNewPdf: "An error occurred while generating the new PDF.",
    compressionLevel: "Compression Level",
    compressionLow: "Low",
    compressionMedium: "Medium",
    compressionHigh: "High",
    compressionNote: "Higher compression creates smaller files, but may reduce visual quality.",
    compressNow: "Compress PDF",
    compressSuccess: "PDF compressed successfully!",
    originalSize: "Original Size",
    newSize: "New Size",
    savedPercentage: "Saved",
    downloadCompressedPdf: "Download Compressed PDF",
    errorMaxPagesCompress: "Sorry, maximum limit is 150 pages to prevent browser crash.",
    errorCompressingFile: "An error occurred while compressing the file.",
  },
  ar: {
    selectFiles: "اختيار الملفات",
    errorMinTwoPdfs: "يرجى رفع ملفي PDF على الأقل.",
    mergeNow: "دمج ملفات PDF",
    mergeSuccess: "تم دمج ملفات PDF بنجاح!",
    downloadMergedPdf: "تحميل ملف PDF المدمج",
    pdf2imgConvertNow: "تحويل إلى صور",
    pdf2imgSuccess: "تم استخراج الصور بنجاح!",
    downloadAllImagesZip: "تحميل كل الصور كملف ZIP",
    extractedImagesPreview: "معاينة الصور المستخرجة",
    errorExtractingImages: "حدث خطأ أثناء استخراج الصور.",
    organizeDragHint: "اسحب الصفحات لإعادة ترتيبها، أو احذف الصفحات غير المرغوبة.",
    changeFile: "تغيير الملف",
    saveOrderAsNewPdf: "حفظ كملف PDF جديد",
    organizeSuccess: "تم تنظيم ملف PDF بنجاح!",
    downloadNewPdf: "تحميل ملف PDF الجديد",
    errorMaxPagesOrganize: "عذراً، الحد الأقصى هو 150 صفحة لحماية المتصفح.",
    errorReadingFile: "حدث خطأ أثناء قراءة الملف.",
    errorMinOnePage: "يرجى إبقاء صفحة واحدة على الأقل.",
    errorGeneratingNewPdf: "حدث خطأ أثناء إنشاء ملف PDF الجديد.",
    compressionLevel: "مستوى الضغط",
    compressionLow: "منخفض",
    compressionMedium: "متوسط",
    compressionHigh: "عالٍ",
    compressionNote: "الضغط الأعلى ينتج ملفاً أصغر، لكنه قد يقلل الجودة البصرية.",
    compressNow: "ضغط PDF",
    compressSuccess: "تم ضغط ملف PDF بنجاح!",
    originalSize: "الحجم الأصلي",
    newSize: "الحجم الجديد",
    savedPercentage: "نسبة التوفير",
    downloadCompressedPdf: "تحميل ملف PDF المضغوط",
    errorMaxPagesCompress: "عذراً، الحد الأقصى هو 150 صفحة لحماية المتصفح.",
    errorCompressingFile: "حدث خطأ أثناء ضغط الملف.",
  },
};

for (const [lang, t] of Object.entries(translations)) {
  const mapped = {
    ...compatibilityLabels[lang],
    title: t.common.title, subtitle: t.common.subtitle,
    processing: t.common.processing, cancel: t.common.cancel,
    uploadPlaceholder: t.upload.placeholder, uploadHelp: t.upload.help,
    addMore: t.upload.addMore, dragPdfHere: t.upload.dragPdf,
    dragPdfFilesHere: t.upload.dragPdf, selectFile: t.upload.selectFile,
    clearAll: t.actions.clearAll, takePhoto: t.actions.takePhoto,
    removeFile: t.actions.removeFile, splitNow: t.actions.splitNow,
    downloadZip: t.actions.downloadZip, convertToPdf: t.actions.convert,
    shareNotSupported: t.messages.shareNotSupported, errorProcessing: t.messages.errorProcessing,
    errorMaxPages: t.messages.errorMaxPages, errorSplit: t.messages.errorSplit,
    processingImage: t.messages.processingImage, splitSuccess: t.messages.splitSuccess,
    settingsTitle: t.settings.title, addPageNumbers: t.settings.pageNumbers,
    addMargins: t.settings.margins, pdfQuality: t.settings.quality,
    qualityHigh: t.settings.high, qualityMedium: t.settings.medium,
    qualityLow: t.settings.low, fileNameLabel: t.settings.fileNameLabel,
    fileNamePlaceholder: t.settings.fileNamePlaceholder, watermarkLabel: t.settings.watermarkLabel,
    watermarkPlaceholder: t.settings.watermarkPlaceholder, cropImage: t.editor.crop,
    rotateImage: t.editor.rotate, applyCrop: t.editor.applyCrop,
    imageCount: t.ui.imageCount, mergeTitle: t.tools.merge.title,
    mergeSubtitle: t.tools.merge.subtitle, splitPdfPages: t.tools.split.pages,
    splitPdfDesc: t.tools.split.desc, pdf2imgTitle: t.tools.pdf2img.title,
    pdf2imgSubtitle: t.tools.pdf2img.subtitle, organizeTitle: t.tools.organize.title,
    organizeSubtitle: t.tools.organize.subtitle, compressTitle: t.tools.compress.title,
    compressSubtitle: t.tools.compress.subtitle,
  };
  Object.assign(t, mapped);
}
