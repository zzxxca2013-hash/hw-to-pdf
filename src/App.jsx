import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { useDropzone } from 'react-dropzone';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable';
import { Moon, Sun, Languages, Download, Trash2, ImagePlus, FileDown, X, Plus, DownloadCloud, Share2, Printer, Camera, WifiOff, ArrowDownAZ, Layers, Scissors, FileImage, ListOrdered, Minimize2 } from 'lucide-react';
import { translations } from './translations';
import { saveDraft, loadDraft, clearDraft } from './utils/db';
import { bytesToMb, getRuntimeLimits, isAcceptedImageFile, isHeicFile, pixelsToMegapixels } from './utils/fileLimits';
import SortableImageItem from './components/SortableImageItem';
const ImageCropper = lazy(() => import('./components/ImageCropper'));
const MergePdf = lazy(() => import('./components/MergePdf'));
const SplitPdf = lazy(() => import('./components/SplitPdf'));
const PdfToImg = lazy(() => import('./components/PdfToImg'));
const OrganizePdf = lazy(() => import('./components/OrganizePdf'));
const CompressPdf = lazy(() => import('./components/CompressPdf'));
import { useLocalStorage } from './hooks/useLocalStorage';
import { useModalFocus } from './hooks/useModalFocus';
import './index.css';

const SITE_URL = 'https://zzxxca2013-hash.github.io/hw-to-pdf/';
const TOOL_PATHS = {
  img2pdf: '',
  merge: 'merge/',
  split: 'split/',
  pdf2img: 'pdf2img/',
  organize: 'organize/',
  compress: 'compress/',
};
const SUPPORT_PAGE_PATHS = {
  privacy: 'privacy/',
  terms: 'terms/',
  contact: 'contact/',
};
const FAQ_SCHEMA_SCRIPT_ID = 'faq-schema-jsonld';

const normalizeFaqText = (value) => (
  typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : ''
);

const getValidFaqItems = (faqItems) => {
  if (!Array.isArray(faqItems)) return [];

  const seen = new Set();

  return faqItems.reduce((items, item) => {
    const question = normalizeFaqText(item?.q ?? item?.name);
    const answer = normalizeFaqText(item?.a ?? item?.acceptedAnswer?.text);

    if (!question || !answer) return items;

    const key = question;
    if (seen.has(key)) return items;

    seen.add(key);
    items.push({ q: question, a: answer });
    return items;
  }, []);
};

const buildFaqSchema = (faqItems) => {
  const mainEntity = getValidFaqItems(faqItems).map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: a,
    },
  }));

  if (mainEntity.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity,
  };
};

const hasFaqSchemaType = (type) => (
  Array.isArray(type) ? type.includes('FAQPage') : type === 'FAQPage'
);

const isFaqSchemaScript = (script) => {
  const content = script.textContent?.trim();
  if (!content) return false;

  try {
    const parsed = JSON.parse(content);
    const nodes = Array.isArray(parsed) ? parsed : [parsed, ...(Array.isArray(parsed?.['@graph']) ? parsed['@graph'] : [])];
    return nodes.some(node => hasFaqSchemaType(node?.['@type']));
  } catch {
    return content.includes('"FAQPage"') || content.includes("'FAQPage'");
  }
};

function App() {

  const [images, setImages] = useState([]);
  const [lang, setLang] = useLocalStorage('hw-pdf-lang', 'ar');
  const [theme, setTheme] = useLocalStorage('hw-pdf-theme', 'light');
  const [enhance, setEnhance] = useLocalStorage('hw-pdf-enhance', false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingText, setProcessingText] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfBlob, setPdfBlob] = useState(null);
  const [addPageNumbers, setAddPageNumbers] = useLocalStorage('hw-pdf-page-num', false);
  const [addMargins, setAddMargins] = useLocalStorage('hw-pdf-margins', false);
  const [quality, setQuality] = useLocalStorage('hw-pdf-quality', 0.9);
  const [blackAndWhite, setBlackAndWhite] = useLocalStorage('hw-pdf-bw', false);
  const [scannerMode, setScannerMode] = useLocalStorage('hw-pdf-scanner', false);
  const [toolBusy, setToolBusy] = useState(false);
  
  const getSmartFilename = (targetLang = lang) => {
    const d = new Date();
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return targetLang === 'ar' ? `واجب_${dateStr}` : `Homework_${dateStr}`;
  };

  const [fileName, setFileName] = useState(() => getSmartFilename(lang));
  const [watermark, setWatermark] = useLocalStorage('hw-pdf-watermark', '');
  const getInitialTool = useCallback(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.includes('/merge/')) return 'merge';
      if (path.includes('/split/')) return 'split';
      if (path.includes('/pdf2img/')) return 'pdf2img';
      if (path.includes('/organize/')) return 'organize';
      if (path.includes('/compress/')) return 'compress';
    }
    return 'img2pdf';
  }, []);
  const getInitialPage = useCallback(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const queryPage = params.get('page');
      if (SUPPORT_PAGE_PATHS[queryPage]) return queryPage;

      const path = window.location.pathname;
      if (path.includes('/privacy/')) return 'privacy';
      if (path.includes('/terms/')) return 'terms';
      if (path.includes('/contact/')) return 'contact';
    }
    return 'home';
  }, []);
  const [activeTool, setActiveTool] = useState(getInitialTool());

  const handleToolChange = (tool) => {
    if (isProcessing || toolBusy) {
      setError(t.messages.processingInProgress);
      return;
    }
    setActiveTool(tool);
    setActivePage('home');
    window.history.pushState({}, '', tool === 'img2pdf' ? '/hw-to-pdf/' : `/hw-to-pdf/${tool}/`);
  };
  const handlePageChange = (page) => {
    if ((isProcessing || toolBusy) && page !== activePage) {
      setError(t.messages.processingInProgress);
      return;
    }
    setActivePage(page);
    const path = page === 'home'
      ? (activeTool === 'img2pdf' ? '/hw-to-pdf/' : `/hw-to-pdf/${activeTool}/`)
      : `/hw-to-pdf/${SUPPORT_PAGE_PATHS[page]}`;
    window.history.pushState({}, '', path);
  };
  const [croppingImageId, setCroppingImageId] = useState(null);
  const [activePage, setActivePage] = useState(getInitialPage);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasVisited, setHasVisited] = useLocalStorage('hw-pdf-visited', false);
  const iframeRef = useRef(null);
  const settingsModalRef = useModalFocus(showSettingsModal, () => setShowSettingsModal(false));
  const clearModalRef = useModalFocus(showClearConfirm, () => setShowClearConfirm(false));
  const previewModalRef = useModalFocus(showPreviewModal, () => setShowPreviewModal(false));

  const t = translations[lang];
  const errorHeicUnsupported = t.errorHeicUnsupported;
  const errorImageTooLarge = t.errorImageTooLarge;
  const errorMaxImagesDynamic = t.errorMaxImagesDynamic;
  const errorUnsupportedFile = t.errorUnsupportedFile;
  const errorImageProcessing = t.messages.errorProcessing;
  const draftSuccessMessageRef = useRef(t.messages.success);
  const imagesRef = useRef(images);
  const pdfUrlRef = useRef(pdfUrl);

  const clearPdfResult = useCallback(() => {
    setPdfUrl(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setPdfBlob(null);
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setActiveTool(getInitialTool());
      setActivePage(getInitialPage());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [getInitialPage, getInitialTool]);

  useEffect(() => {
    if (!isProcessing && !toolBusy) return undefined;

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isProcessing, toolBusy]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    const isSupportPage = activePage !== 'home';
    const canonicalUrl = isSupportPage
      ? `${SITE_URL}${SUPPORT_PAGE_PATHS[activePage] || ''}`
      : `${SITE_URL}${TOOL_PATHS[activeTool] || ''}`;
    const title = isSupportPage
      ? t.nav[activePage === 'privacy' ? 'privacyPolicy' : activePage === 'terms' ? 'termsOfUse' : 'contactUs']
      : activeTool === 'img2pdf' ? t.common.title : t.tools[activeTool]?.title;
    const description = isSupportPage
      ? (activePage === 'privacy' ? t.privacyText : activePage === 'terms' ? t.termsText : t.contactText)
      : activeTool === 'img2pdf' ? t.common.subtitle : t.tools[activeTool]?.subtitle;

    document.querySelector('link[rel="canonical"]')?.setAttribute('href', canonicalUrl);
    document.querySelector('meta[property="og:url"]')?.setAttribute('content', canonicalUrl);
    document.querySelector('meta[name="twitter:url"]')?.setAttribute('content', canonicalUrl);
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
    document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', title);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', description);
    document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', description);
  }, [activePage, activeTool, t]);

  useEffect(() => {
    const faqSource = activePage === 'home'
      ? (activeTool === 'img2pdf' ? t.faq : t.tools[activeTool]?.faq)
      : null;
    const schema = buildFaqSchema(faqSource);
    const faqScripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
      .filter(isFaqSchemaScript);
    let schemaScript = document.getElementById(FAQ_SCHEMA_SCRIPT_ID);

    if (!schema) {
      faqScripts.forEach(script => script.remove());
      return;
    }

    if (!schemaScript) {
      schemaScript = document.createElement('script');
      schemaScript.id = FAQ_SCHEMA_SCRIPT_ID;
      schemaScript.type = 'application/ld+json';
      document.head.appendChild(schemaScript);
    }

    faqScripts
      .filter(script => script !== schemaScript)
      .forEach(script => script.remove());

    schemaScript.type = 'application/ld+json';
    schemaScript.textContent = JSON.stringify(schema, null, 2);
  }, [activePage, activeTool, t]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    pdfUrlRef.current = pdfUrl;
  }, [pdfUrl]);

  useEffect(() => {
    return () => {
      imagesRef.current.forEach(img => URL.revokeObjectURL(img.previewUrl));
      if (pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current);
    };
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowSettingsModal(false);
        setShowPreviewModal(false);
        setShowClearConfirm(false);
        setCroppingImageId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Toast auto-hide
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Offline status tracking
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Dynamic Tab Title
  useEffect(() => {
    const currentTitle = activePage !== 'home'
      ? t.nav[activePage === 'privacy' ? 'privacyPolicy' : activePage === 'terms' ? 'termsOfUse' : 'contactUs']
      : activeTool === 'img2pdf' ? t.common.title : t.tools[activeTool]?.title;
    document.title = currentTitle;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        document.title = lang === 'ar' ? 'لا تنسَ تحويل واجبك! 📚' : 'Don\'t forget your homework! 📚';
      } else {
        document.title = currentTitle;
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [lang, t, activeTool, activePage]);

  // Welcome Toast for new users
  useEffect(() => {
    if (!hasVisited) {
      const timer = setTimeout(() => {
        setSuccess(t.messages.welcome);
        setHasVisited(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [hasVisited, lang, setHasVisited, t.messages.welcome]);

  // Draft Recovery
  useEffect(() => {
    let isMounted = true;
    const recoverDraft = async () => {
      const draftImages = await loadDraft();
      if (draftImages && draftImages.length > 0 && isMounted) {
        const recovered = draftImages.map(d => ({
          id: d.id,
          file: d.file,
          previewUrl: URL.createObjectURL(d.file)
        }));
        setImages(recovered);
        setSuccess(draftSuccessMessageRef.current);
      }
    };
    recoverDraft();
    return () => { isMounted = false; };
  }, []);

  // Save Draft
  useEffect(() => {
    if (images.length > 0) {
      saveDraft(images);
    } else {
      clearDraft();
    }
  }, [images]);

  const toggleLang = () => {
    setLang(prev => {
      const nextLang = prev === 'en' ? 'ar' : 'en';
      setFileName(current => (
        !current || current.startsWith('واجب_') || current.startsWith('Homework_')
          ? getSmartFilename(nextLang)
          : current
      ));
      return nextLang;
    });
  };
  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const getImageSize = useCallback((file) => new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Invalid image'));
    };
    img.src = url;
  }), []);

  const onDrop = useCallback(async (acceptedFiles) => {
    const limits = getRuntimeLimits();
    const heicFile = acceptedFiles.find(isHeicFile);
    if (heicFile) {
      setError(errorHeicUnsupported);
      return;
    }

    const files = acceptedFiles.filter(isAcceptedImageFile);

    if (files.length !== acceptedFiles.length) {
      setError(errorUnsupportedFile);
      return;
    }

    if (images.length + files.length > limits.maxImages) {
      setError(errorMaxImagesDynamic.replace('{max}', limits.maxImages));
      return;
    }

    for (const file of files) {
      if (file.size > limits.maxImageFileSize) {
        setError(
          errorImageTooLarge
            .replace('{max}', bytesToMb(limits.maxImageFileSize))
            .replace('{side}', limits.maxImageSide)
            .replace('{pixels}', pixelsToMegapixels(limits.maxImagePixels))
        );
        return;
      }

      try {
        const { width, height } = await getImageSize(file);
        const totalPixels = width * height;
        if (Math.max(width, height) > limits.maxImageSide || totalPixels > limits.maxImagePixels) {
          setError(
            errorImageTooLarge
              .replace('{max}', bytesToMb(limits.maxImageFileSize))
              .replace('{side}', limits.maxImageSide)
              .replace('{pixels}', pixelsToMegapixels(limits.maxImagePixels))
          );
          return;
        }
      } catch {
        setError(errorUnsupportedFile);
        return;
      }
    }

    setError(null);
    clearPdfResult();
    setIsProcessing(true);

    try {
      const { default: imageCompression } = await import('browser-image-compression');
      
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };

      const compressedFiles = await Promise.all(
        files.map(async (file) => {
          try {
            return await imageCompression(file, options);
          } catch (error) {
            console.error('Error compressing image:', error);
            return file; // Fallback to original if compression fails
          }
        })
      );

      const newImages = compressedFiles.map(file => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        rotation: 0
      }));
      
      setImages(prev => [...prev, ...newImages]);
      
      if (files.length > 0) {
        setFileName(prev => prev ? prev : files[0].name.replace(/\.[^/.]+$/, ""));
      }
    } catch {
      setError(errorImageProcessing);
    } finally {
      setIsProcessing(false);
    }
  }, [clearPdfResult, errorHeicUnsupported, errorImageProcessing, errorImageTooLarge, errorMaxImagesDynamic, errorUnsupportedFile, getImageSize, images.length]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    onDropRejected: (fileRejections) => {
      const hasHeic = fileRejections.some(({ file }) => isHeicFile(file));
      setError(hasHeic ? errorHeicUnsupported : errorUnsupportedFile);
    },
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/webp': []
    },
    noClick: images.length > 0
  });

  const handleCameraChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      await onDrop(files);
      e.target.value = null;
    }
  };

  const removeImage = (id) => {
    setImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img) URL.revokeObjectURL(img.previewUrl);
      return prev.filter(i => i.id !== id);
    });
    clearPdfResult();
  };

  const rotateImage = (id) => {
    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, rotation: (img.rotation + 90) % 360 } : img
    ));
    clearPdfResult();
  };

  const autoSortImages = () => {
    setImages(prev => {
      const sorted = [...prev].sort((a, b) => {
        const nameA = a.file.name.toLowerCase();
        const nameB = b.file.name.toLowerCase();
        return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
      });
      return sorted;
    });
    clearPdfResult();
  };

  const confirmClearAll = () => {
    images.forEach(img => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    setError(null);
    clearPdfResult();
    setCroppingImageId(null);
    setShowClearConfirm(false);
  };

  const handleCropComplete = async (base64Image) => {
    try {
      // Convert base64 to Blob
      const res = await fetch(base64Image);
      const blob = await res.blob();
      const file = new File([blob], 'cropped.jpg', { type: 'image/jpeg' });
      const newPreviewUrl = URL.createObjectURL(file);
      
      setImages(prev => prev.map(img => {
        if (img.id === croppingImageId) {
          URL.revokeObjectURL(img.previewUrl); // Revoke old URL
          return { ...img, file, previewUrl: newPreviewUrl, rotation: 0 };
        }
        return img;
      }));
      clearPdfResult();
      setCroppingImageId(null);
    } catch (err) {
      console.error('Error applying crop:', err);
      setError(t.messages.errorProcessing);
      setCroppingImageId(null);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(40);
  };

  const handleDragEnd = (event) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(40);
    const { active, over } = event;
    
    if (!over) return; // Prevent crash if dropped outside valid area

    if (active.id !== over.id) {
      setImages((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
      clearPdfResult();
    }
  };

  const processImageForPDF = (imgUrl, rotation) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (rotation % 180 !== 0) {
          canvas.width = img.height;
          canvas.height = img.width;
        } else {
          canvas.width = img.width;
          canvas.height = img.height;
        }
        
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        
        let filterStr = '';
        if (scannerMode) {
          filterStr += 'grayscale(100%) contrast(1.6) brightness(1.1) ';
        } else {
          if (enhance) filterStr += 'brightness(1.15) contrast(1.25) saturate(1.1) ';
          if (blackAndWhite) filterStr += 'grayscale(100%) ';
        }
        if (filterStr) ctx.filter = filterStr.trim();
        
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        
        if (watermark) {
          ctx.setTransform(1, 0, 0, 1, 0, 0); 
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate(-Math.PI / 4);
          const fontSize = Math.floor(Math.min(canvas.width, canvas.height) / 12);
          ctx.font = `bold ${fontSize}px Cairo, Inter, sans-serif`;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = Math.max(2, fontSize / 25);
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.strokeText(watermark, 0, 0);
          ctx.fillText(watermark, 0, 0);
        }

        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = imgUrl;
    });
  };

  const generatePDF = async () => {
    if (images.length === 0) {
      setError(t.messages.errorNoImages);
      return;
    }
    
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    setSuccess(null);
    clearPdfResult();

    try {
      const [{ jsPDF }, { default: confetti }] = await Promise.all([
        import('jspdf'),
        import('canvas-confetti')
      ]);

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        // setProcessingText(lang === 'ar' ? `جاري معالجة الصورة ${i + 1} من ${images.length}...` : `Processing image ${i + 1} of ${images.length}...`); // Old hardcoded text
        setProcessingText(t.processingImage.replace('{current}', i + 1).replace('{total}', images.length));
        if (i > 0) pdf.addPage();
        
        const dataUrl = await processImageForPDF(img.previewUrl, img.rotation);
        
        const margin = addMargins ? 10 : 0;
        const availableWidth = pageWidth - (margin * 2);
        const availableHeight = pageHeight - (margin * 2);

        const imgProps = pdf.getImageProperties(dataUrl);
        const imgRatio = imgProps.width / imgProps.height;
        const pageRatio = availableWidth / availableHeight;

        let renderWidth = availableWidth;
        let renderHeight = availableHeight;

        if (imgRatio > pageRatio) {
          renderHeight = availableWidth / imgRatio;
        } else {
          renderWidth = availableHeight * imgRatio;
        }

        const x = margin + (availableWidth - renderWidth) / 2;
        const y = margin + (availableHeight - renderHeight) / 2;

        pdf.addImage(dataUrl, 'JPEG', x, y, renderWidth, renderHeight);

        if (addPageNumbers) {
          pdf.setFontSize(10);
          pdf.setTextColor(128, 128, 128);
          pdf.text(`${i + 1}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
        }
        
        setProgress(Math.round(((i + 1) / images.length) * 100));
      }

      setProcessingText(t.messages.finalizingPdf);
      
      const generatedBlob = pdf.output('blob');
      const url = URL.createObjectURL(generatedBlob);
      setPdfUrl(prev => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
      setPdfBlob(generatedBlob);
      setSuccess(t.messages.success);
      
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 3000 };
      const randomInRange = (min, max) => Math.random() * (max - min) + min;

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) { return clearInterval(interval); }
        const particleCount = 50 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
      }, 250);
      
    } catch (err) {
      console.error(err);
      setError(t.messages.errorProcessing);
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setProcessingText('');
    }
  };

  const handleShare = async () => {
    if (!pdfBlob) return;
    
    const file = new File([pdfBlob], `${fileName || getSmartFilename()}.pdf`, { type: 'application/pdf' });
    
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: fileName || getSmartFilename(),
          text: t.common.subtitle,
          files: [file]
        });
      } catch (err) {
        if (err.name !== 'AbortError') console.error('Share failed:', err);
      }
    } else {
      setError(t.shareNotSupported);
    }
  };

  const handlePrint = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow.print();
    } else if (pdfUrl) {
      const printWindow = window.open(pdfUrl);
      if (printWindow) {
        printWindow.onload = () => printWindow.print();
      }
    }
  };

  const handleShareApp = async () => {
    if (navigator.canShare) {
      try {
        await navigator.share({
          title: t.common.title,
          text: t.seoText || t.common.subtitle, // Use t.seoText if available, otherwise common.subtitle
          url: window.location.href
        });
      } catch (err) {
        if (err.name !== 'AbortError') console.error('Share App failed:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setSuccess(t.messages.copyLinkToShare + window.location.href);
    }
  };

  return (
    <>
      <div className="bg-blobs">
        <div className="bg-blob-1"></div>
        <div className="bg-blob-2"></div>
      </div>
      <main className="container">
        <header className="header">
        <div className="header-content">
          <h1>{activeTool === 'img2pdf' ? t.common.title : t.tools[activeTool]?.title}</h1>
          <p>{activeTool === 'img2pdf' ? t.common.subtitle : t.tools[activeTool]?.subtitle}</p>
        </div>
        <div className="controls">
          {deferredPrompt && (
            <button className="btn btn-primary" onClick={handleInstallApp} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', borderRadius: '20px', gap: '0.4rem' }}>
              <DownloadCloud size={18} />
              <span className="hide-on-mobile">{t.actions.install}</span>
            </button>
          )}
          {!isOnline && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '0.4rem 0.8rem', background: 'rgba(0,0,0,0.05)', borderRadius: '20px' }}>
              <WifiOff size={16} />
              <span className="hide-on-mobile">{t.ui.offline}</span>
            </div>
          )}
          <button className="icon-button" onClick={toggleLang} aria-label={t.ui.toggleLang} title={t.ui.toggleLang}>
            <Languages size={20} />
          </button>
          <button className="icon-button" onClick={toggleTheme} aria-label={t.ui.toggleTheme} title={t.ui.toggleTheme}>
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>
      </header>



      {activePage === 'home' ? (
        <>
          <div className={`toast ${error ? 'show error' : success ? 'show success' : ''}`} role={error ? 'alert' : 'status'} aria-live="polite">
            {error || success}
          </div>

          <div className="tool-nav glass-panel" style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem', marginBottom: '2rem', overflowX: 'auto', borderRadius: 'var(--radius)', whiteSpace: 'nowrap' }}>
            {[
              { id: 'img2pdf', icon: ImagePlus, ar: 'صور إلى PDF', en: 'Image to PDF' },
              { id: 'merge', icon: Layers, ar: 'دمج PDF', en: 'Merge PDF' },
              { id: 'split', icon: Scissors, ar: 'فصل PDF', en: 'Split PDF' },
              { id: 'pdf2img', icon: FileImage, ar: 'PDF لصور', en: 'PDF to JPG' },
              { id: 'organize', icon: ListOrdered, ar: 'ترتيب PDF', en: 'Organize' },
              { id: 'compress', icon: Minimize2, ar: 'ضغط PDF', en: 'Compress' },
            ].map((tool) => (
              <a 
                key={tool.id}
                href={`/hw-to-pdf/${tool.id === 'img2pdf' ? '' : tool.id + '/'}`} 
                className={`btn ${activeTool === tool.id ? 'btn-primary' : ''}`} 
                aria-disabled={isProcessing || toolBusy}
                style={{ flex: 1, minWidth: 'fit-content', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: (isProcessing || toolBusy) && activeTool !== tool.id ? 0.6 : 1 }} 
                onClick={(e) => { e.preventDefault(); handleToolChange(tool.id); }}
              >
                <tool.icon size={18} /> {lang === 'ar' ? tool.ar : tool.en}
              </a>
            ))}
          </div>

          {activeTool === 'img2pdf' && (
            <>


          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem', flexDirection: 'column' }}>
            <input type="file" accept="image/*" capture="environment" id="cameraInput" style={{ display: 'none' }} onChange={handleCameraChange} multiple />
            <div {...getRootProps()} className={`dropzone glass-panel ${isDragActive ? 'active' : ''} ${images.length === 0 ? 'empty-state' : ''}`} style={{ marginBottom: 0 }}>
              <input {...getInputProps()} />
              <ImagePlus className="dropzone-icon" />
              <p>{t.uploadPlaceholder}</p>
              <span className="help-text">{t.uploadHelp}</span>
            </div>
            
            {images.length === 0 && (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <label htmlFor="cameraInput" className="btn btn-primary" style={{ cursor: 'pointer', padding: '0.8rem 1.5rem', borderRadius: '20px' }}>
                  <Camera size={20} />
                  {t.takePhoto}
                </label>
              </div>
            )}
          </div>

          {images.length > 0 && (
            <>
              <div className="toolbar glass-panel">
                <div className="toolbar-toggles">
                  <button type="button" className="toggle-container" aria-pressed={scannerMode} onClick={() => { setScannerMode(!scannerMode); if (!scannerMode) { setEnhance(false); setBlackAndWhite(false); } }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>{t.editor.scanner}</span>
                    <span className={`toggle-switch ${scannerMode ? 'active' : ''}`} aria-hidden="true">
                      <span className="toggle-knob"></span>
                    </span>
                  </button>
                  
                  <button type="button" className="toggle-container" aria-pressed={enhance} onClick={() => { setEnhance(!enhance); if (!enhance) setScannerMode(false); }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>{t.editor.enhance}</span>
                    <span className={`toggle-switch ${enhance ? 'active' : ''}`} aria-hidden="true">
                      <span className="toggle-knob"></span>
                    </span>
                  </button>
                  
                  <button type="button" className="toggle-container" aria-pressed={blackAndWhite} onClick={() => { setBlackAndWhite(!blackAndWhite); if (!blackAndWhite) setScannerMode(false); }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>{t.editor.bw}</span>
                    <span className={`toggle-switch ${blackAndWhite ? 'active' : ''}`} aria-hidden="true">
                      <span className="toggle-knob"></span>
                    </span>
                  </button>
                </div>

                <div className="toolbar-actions" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className="image-count-text hide-on-mobile">
                    {t.ui.imageCount(images.length)}
                  </span>
                  
                  <button className="btn" style={{ background: 'var(--primary-color)', color: 'white', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={open}>
                    <ImagePlus size={16} />
                    {t.upload.addMore}
                  </button> {/* This is for adding more images, not generic "Add More" */}

                  <button className="icon-button" style={{ width: '32px', height: '32px', padding: 0 }} onClick={() => document.getElementById('cameraInput')?.click()} aria-label={t.takePhoto} title={t.takePhoto}>
                    <Camera size={16} />
                  </button>

                  {images.length > 1 && (
                    <button className="btn" style={{ background: 'var(--border-color)', color: 'var(--text-main)', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={autoSortImages}>
                      <ArrowDownAZ size={16} />
                      <span className="hide-on-mobile">{t.editor.autoSort}</span>
                    </button>
                  )}
                  <button className="btn btn-danger clear-btn" onClick={() => setShowClearConfirm(true)}>
                    <Trash2 size={16} />
                    <span className="hide-on-mobile">{t.actions.clearAll}</span> {/* Unify with t.actions.clearAll */}
                  </button>
                </div>
              </div>

              {images.length > 1 && (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem', fontStyle: 'italic' }}>
                  {t.editor.dragHint}
                </p>
              )}

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <SortableContext items={images.map(i => i.id)} strategy={rectSortingStrategy}>
                  <div className="images-grid">
                    {images.map((img, index) => (
                      <SortableImageItem 
                        key={img.id} 
                        id={img.id} 
                        url={img.previewUrl} 
                        index={index + 1}
                        onRemove={() => removeImage(img.id)}
                        onRotate={() => rotateImage(img.id)}
                        onCrop={() => setCroppingImageId(img.id)}
                        rotation={img.rotation}
                        enhanced={enhance}
                        scanner={scannerMode}
                      />
                    ))}
                      <button type="button" className="add-more-card" onClick={open}>
                        <Plus size={40} className="add-more-icon" />
                        <span>{t.upload.addMore}</span> {/* Unify with t.upload.addMore */}
                      </button>
                  </div>
                </SortableContext>
              </DndContext>

              <div className="action-buttons-container">
                {!pdfUrl ? (
                  <button className="btn btn-primary" onClick={() => setShowSettingsModal(true)} disabled={isProcessing}>
                    <FileDown size={22} />
                    {t.actions.convert}
                  </button>
                ) : (
                  <>
                    <a href={pdfUrl} download={`${fileName || getSmartFilename()}.pdf`} className="btn btn-success">
                      <Download size={22} />
                      {t.actions.download}
                    </a>
                    
                    {typeof navigator !== 'undefined' && navigator.canShare && (
                      <button className="btn" style={{ background: 'var(--primary-color)', color: 'white' }} onClick={handleShare}>
                        <Share2 size={22} />
                        {t.actions.share}
                      </button>
                    )}

                    <button className="btn" style={{ background: 'var(--secondary-color)', color: 'white' }} onClick={() => setShowPreviewModal(true)}>
                      {t.editor.preview}
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowSettingsModal(true)}>
                      {t.settings.title}
                    </button>
                  </>
                )}
              </div>
            </>
          )}

          {images.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <p>{t.messages.noImages}</p>
            </div>
          )}
            </>
          )}

          <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner"></div></div>}> {/* This Suspense is for lazy-loaded components */}
            {activeTool === 'merge' && <MergePdf setError={setError} setGlobalProcessing={setToolBusy} />}
            {activeTool === 'split' && <SplitPdf setError={setError} setGlobalProcessing={setToolBusy} />}
            {activeTool === 'pdf2img' && <PdfToImg setError={setError} setGlobalProcessing={setToolBusy} />}
            {activeTool === 'organize' && <OrganizePdf setError={setError} setGlobalProcessing={setToolBusy} />}
            {activeTool === 'compress' && <CompressPdf setError={setError} setGlobalProcessing={setToolBusy} />}
          </Suspense>

          {/* SEO and FAQ sections (always rendered if on home page, not dependent on lazy loading) */}
          {activePage === 'home' && (() => {
            const currentTool = activeTool === 'img2pdf' ? null : t.tools[activeTool];
            const currentSeoTitle = activeTool === 'img2pdf' ? t.seoTitle : currentTool?.seoTitle;
            const currentSeoText = activeTool === 'img2pdf' ? t.seoText : currentTool?.seoText;
            const currentFaqTitle = t.faqTitle;
            const currentFaq = getValidFaqItems(activeTool === 'img2pdf' ? t.faq : currentTool?.faq);

            return (
              <>
                {/* SEO Text Section */}
                {currentSeoTitle && currentSeoText && (
                  <div className="seo-section glass-panel" style={{ marginTop: '3rem', padding: '2rem', textAlign: 'start' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>{currentSeoTitle}</h2>
                    <p style={{ color: 'var(--text-muted)', lineHeight: '1.8' }}>{currentSeoText}</p>
                  </div>
                )}

                {/* FAQ Section */}
                {currentFaq.length > 0 && (
                  <div className="faq-section glass-panel" style={{ marginTop: '2rem', padding: '2rem', textAlign: 'start' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--primary-color)' }}>{currentFaqTitle}</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {currentFaq.map((item, idx) => (
                        <div key={idx} className="faq-item" style={{ borderBottom: idx !== currentFaq.length - 1 ? '1px solid var(--border-color)' : 'none', paddingBottom: idx !== currentFaq.length - 1 ? '1.5rem' : '0' }}>
                          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>{item.q}</h3>
                          <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '0.95rem' }}>{item.a}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </>
      ) : (
        <div className="page-content glass-panel" style={{ padding: '2.5rem', textAlign: 'start', minHeight: '50vh' }}>
          <a href={activeTool === 'img2pdf' ? '/hw-to-pdf/' : `/hw-to-pdf/${activeTool}/`} className="btn btn-primary" onClick={(e) => { e.preventDefault(); handlePageChange('home'); }} style={{ marginBottom: '2rem' }}>{t.nav.home}</a>
          <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem', color: 'var(--primary-color)' }}>
            {activePage === 'privacy' ? t.nav.privacyPolicy : activePage === 'terms' ? t.nav.termsOfUse : t.nav.contactUs}
          </h2>
          <p style={{ color: 'var(--text-main)', lineHeight: '2', fontSize: '1.1rem' }}>
            {activePage === 'privacy' ? t.privacyText : activePage === 'terms' ? t.termsText : t.contactText}
          </p>
          {activePage === 'contact' && t.contactEmail && (
            <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'center' }}>
              <a href={`mailto:${t.contactEmail}`} className="btn" style={{ background: 'var(--primary-color)', color: 'white', display: 'inline-flex', alignItems: 'center', gap: '0.8rem', fontSize: '1.2rem', padding: '1rem 2rem', borderRadius: '12px', textDecoration: 'none', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                {t.contactEmail}
              </a>
            </div>
          )}
        </div>
      )}



      {isProcessing && (
        <div className="loading-overlay" role="status" aria-live="polite" aria-busy="true">
          <div className="spinner"></div>
          <h2 style={{ marginBottom: progress > 0 ? '1rem' : '0' }}>{t.common.processing}</h2>
          {progress > 0 && (
            <div style={{ width: '80%', maxWidth: '300px', textAlign: 'center' }}>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: 'var(--primary-color)', transition: 'width 0.3s ease' }}></div>
              </div>
              <p style={{ fontSize: '0.9rem', opacity: 0.9 }}>{processingText}</p>
            </div>
          )}
        </div>
      )}

      {croppingImageId && (
        <Suspense fallback={null}>
          <ImageCropper 
            imageUrl={images.find(img => img.id === croppingImageId)?.previewUrl}
            onCropComplete={handleCropComplete}
            onCancel={() => setCroppingImageId(null)}
            t={t}
          />
        </Suspense>
      )}

      {showSettingsModal && (
        <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div ref={settingsModalRef} className="modal-content" role="dialog" aria-modal="true" aria-labelledby="settings-dialog-title" tabIndex={-1} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 id="settings-dialog-title">{t.settingsTitle}</h3>
              <button className="icon-button" onClick={() => setShowSettingsModal(false)} aria-label={t.actions.close}><X size={20} /></button>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              <div className="setting-card glass-panel" style={{ padding: '1rem' }}>
                <button type="button" className="setting-row" aria-pressed={addPageNumbers} onClick={() => { setAddPageNumbers(!addPageNumbers); clearPdfResult(); }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>{t.addPageNumbers}</span>
                  <span className={`toggle-switch ${addPageNumbers ? 'active' : ''}`} aria-hidden="true"><span className="toggle-knob"></span></span>
                </button>
                <button type="button" className="setting-row" aria-pressed={addMargins} onClick={() => { setAddMargins(!addMargins); clearPdfResult(); }} style={{ marginTop: '1rem' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>{t.addMargins}</span>
                  <span className={`toggle-switch ${addMargins ? 'active' : ''}`} aria-hidden="true"><span className="toggle-knob"></span></span>
                </button>
                <div className="setting-row" style={{ marginTop: '1rem', cursor: 'default' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>{t.pdfQuality}</span>
                  <select value={quality} onChange={(e) => { setQuality(Number(e.target.value)); clearPdfResult(); }} className="input-field" style={{ minWidth: '120px', padding: '0.4rem 0.8rem' }}>
                    <option value={1.0}>{t.qualityHigh}</option>
                    <option value={0.8}>{t.qualityMedium}</option>
                    <option value={0.5}>{t.qualityLow}</option>
                  </select>
                </div>
              </div>

              <div className="setting-card glass-panel" style={{ padding: '1rem' }}>
                <div className="setting-input-group">
                  <label>{t.fileNameLabel}</label>
                  <input type="text" value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder={t.fileNamePlaceholder} className="input-field" />
                </div>
                <div className="setting-input-group" style={{ marginTop: '1rem' }}>
                  <label>{t.watermarkLabel}</label>
                  <input type="text" value={watermark} onChange={(e) => { setWatermark(e.target.value); clearPdfResult(); }} placeholder={t.watermarkPlaceholder} className="input-field" maxLength={40} />
                </div>
              </div>
            </div>
            
            <div className="modal-actions">
              <button className="btn" style={{ background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border-color)' }} onClick={() => setShowSettingsModal(false)}>
                {t.cancel}
              </button>
              <button className="btn btn-primary" onClick={() => { setShowSettingsModal(false); generatePDF(); }} disabled={isProcessing}>
                <FileDown size={20} />
                {t.convertToPdf}
              </button>
            </div>
          </div>
        </div>
      )}

      {showClearConfirm && (
        <div className="modal-overlay" onClick={() => setShowClearConfirm(false)}>
          <div ref={clearModalRef} className="modal-content" role="alertdialog" aria-modal="true" aria-labelledby="clear-dialog-title" aria-describedby="clear-dialog-desc" tabIndex={-1} style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 id="clear-dialog-title" style={{ color: 'var(--error-color)' }}>{t.messages.confirmClearTitle}</h3>
              <button className="icon-button" onClick={() => setShowClearConfirm(false)} aria-label={t.actions.close}><X size={20} /></button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <p id="clear-dialog-desc" style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: '1.6' }}>{t.messages.confirmClearDesc}</p>
            </div>
            <div className="modal-actions">
              <button className="btn" style={{ background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border-color)' }} onClick={() => setShowClearConfirm(false)}>
                {t.common.cancel}
              </button>
              <button className="btn btn-danger" onClick={confirmClearAll}>
                <Trash2 size={20} />
                {t.actions.clearAll}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPreviewModal && pdfUrl && (
        <div className="modal-overlay" onClick={() => setShowPreviewModal(false)}>
          <div ref={previewModalRef} className="modal-content" role="dialog" aria-modal="true" aria-labelledby="preview-dialog-title" tabIndex={-1} style={{ width: '95vw', maxWidth: '1000px', height: '90vh' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 id="preview-dialog-title" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                {fileName || getSmartFilename()}.pdf
                {pdfBlob && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 'normal', background: 'rgba(0,0,0,0.05)', padding: '0.2rem 0.6rem', borderRadius: '12px' }}>{t.ui.fileSize} {(pdfBlob.size / (1024 * 1024)).toFixed(2)} MB</span>}
              </h3>
              <button className="icon-button" onClick={() => setShowPreviewModal(false)} aria-label={t.actions.close}><X size={20} /></button>
            </div>
            <div style={{ flex: 1, backgroundColor: '#525659' }}>
              <iframe ref={iframeRef} src={`${pdfUrl}#toolbar=0`} width="100%" height="100%" style={{ border: 'none' }} title="PDF Preview" />
            </div>
            <div className="modal-actions" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn" style={{ background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border-color)' }} onClick={() => setShowPreviewModal(false)}>
                {t.actions.close}
              </button>
              <button className="btn" style={{ background: 'var(--primary-hover)', color: 'white' }} onClick={handlePrint}>
                <Printer size={20} />
                {t.actions.print}
              </button>
              <a href={pdfUrl} download={`${fileName || getSmartFilename()}.pdf`} className="btn btn-success">
                <Download size={20} />
                {t.actions.download}
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <a className="footer-link" href="/hw-to-pdf/privacy/" onClick={(e) => { e.preventDefault(); handlePageChange('privacy'); }}>{t.nav.privacyPolicy}</a>
          <a className="footer-link" href="/hw-to-pdf/terms/" onClick={(e) => { e.preventDefault(); handlePageChange('terms'); }}>{t.nav.termsOfUse}</a>
          <a className="footer-link" href="/hw-to-pdf/contact/" onClick={(e) => { e.preventDefault(); handlePageChange('contact'); }}>{t.nav.contactUs}</a>
          <button type="button" className="footer-link footer-link-primary" onClick={handleShareApp}>{t.actions.shareApp}</button>
        </div>
        <p>© {new Date().getFullYear()} {t.common.title}. All rights reserved.</p>
      </footer>


    </main>
    </>
  );
}

export default App;
