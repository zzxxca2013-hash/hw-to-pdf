import { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Moon, Sun, Languages, Download, WifiOff, Layers, Scissors, FileImage, ListOrdered, Minimize2, ImagePlus } from 'lucide-react';
import { translations } from './translations';
import { useLocalStorage } from './hooks/useLocalStorage';
import './index.css';

const ImageToPdf = lazy(() => import('./components/ImageToPdf'));
const MergePdf = lazy(() => import('./components/MergePdf'));
const SplitPdf = lazy(() => import('./components/SplitPdf'));
const PdfToImg = lazy(() => import('./components/PdfToImg'));
const OrganizePdf = lazy(() => import('./components/OrganizePdf'));
const CompressPdf = lazy(() => import('./components/CompressPdf'));
const LegalPage = lazy(() => import('./components/LegalPage'));

export default function App() {
  const getDefaultLang = () => {
    if (typeof window === 'undefined') return 'ar';
    return window.navigator.language.startsWith('ar') ? 'ar' : 'en';
  };
  const [lang, setLang] = useLocalStorage('hw-pdf-lang', getDefaultLang());
  const [theme, setTheme] = useLocalStorage('hw-pdf-theme', 'light');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [legalModal, setLegalModal] = useState(null);
  
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const t = translations[lang];
  const location = useLocation();

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
    document.documentElement.setAttribute('data-theme', theme);
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#0f172a' : '#ffffff');
    }
  }, [theme]);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

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

  const toggleLang = () => setLang(lang === 'ar' ? 'en' : 'ar');
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const tools = [
    { id: 'img2pdf', icon: ImagePlus, path: '/', label: lang === 'ar' ? 'تحويل للـ PDF' : 'Image to PDF' },
    { id: 'merge', icon: Layers, path: '/merge/', label: lang === 'ar' ? 'دمج' : 'Merge' },
    { id: 'split', icon: Scissors, path: '/split/', label: lang === 'ar' ? 'فصل' : 'Split' },
    { id: 'compress', icon: Minimize2, path: '/compress/', label: lang === 'ar' ? 'ضغط' : 'Compress' },
    { id: 'organize', icon: ListOrdered, path: '/organize/', label: lang === 'ar' ? 'ترتيب' : 'Organize' },
    { id: 'pdf2img', icon: FileImage, path: '/pdf2img/', label: lang === 'ar' ? 'PDF لصور' : 'PDF to IMG' }
  ];

  return (
    <div className="container" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Toast Notifications */}
      <div id="error-toast" className={`toast error-toast ${error ? 'show' : ''}`}>{error}</div>
      <div id="success-toast" className={`toast success-toast ${success ? 'show' : ''}`}>{success}</div>
      {!isOnline && (
        <div className="offline-banner">
          <WifiOff size={16} />
          {lang === 'ar' ? 'أنت في وضع عدم الاتصال. بعض الميزات قد لا تعمل.' : 'You are offline. Some features may not work.'}
        </div>
      )}

      {/* Header */}
      <header className="header glass-panel">
        <Link to="/" className="logo" style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: '1.5rem', margin: 0, fontWeight: 'bold', color: 'var(--text-main)' }}>
            Homework to PDF
          </span>
        </Link>
        <div className="header-actions">
          {deferredPrompt && (
            <button className="btn btn-primary install-btn hide-on-mobile" onClick={handleInstallApp}>
              <Download size={18} />
              {t.installApp}
            </button>
          )}
          <button className="icon-button theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
          </button>
          <button className="btn lang-btn" onClick={toggleLang} aria-label="Toggle language">
            <Languages size={18} />
            <span style={{ fontWeight: 'bold' }}>{lang === 'ar' ? 'EN' : 'عربي'}</span>
          </button>
        </div>
      </header>

      {/* Navigation Tools */}
      <nav className="tools-nav glass-panel" style={{ padding: '0.5rem', marginBottom: '2rem', display: 'flex', gap: '0.5rem', overflowX: 'auto', whiteSpace: 'nowrap', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
        {tools.map(tool => {
          const isActive = location.pathname === tool.path || (tool.path !== '/' && location.pathname.startsWith(tool.path));
          return (
            <Link
              key={tool.id}
              to={tool.path}
              className={`tool-tab ${isActive ? 'active' : ''}`}
              style={{ padding: '0.8rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '12px', color: isActive ? 'white' : 'var(--text-secondary)', background: isActive ? 'var(--primary-color)' : 'transparent', textDecoration: 'none', transition: 'all 0.3s ease' }}
            >
              <tool.icon size={18} />
              <span style={{ fontWeight: '500' }}>{tool.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Main Content Area */}
      <main className="main-content">
        <Suspense fallback={<div className="loading-overlay"><div className="spinner"></div></div>}>
          <Routes>
            <Route path="/" element={<ImageToPdf setError={setError} setSuccess={setSuccess} t={t} lang={lang} />} />
            
            <Route path="/merge" element={<MergePdf setError={setError} t={t} lang={lang} />} />
            <Route path="/merge/*" element={<MergePdf setError={setError} t={t} lang={lang} />} />
            
            <Route path="/split" element={<SplitPdf setError={setError} t={t} lang={lang} />} />
            <Route path="/split/*" element={<SplitPdf setError={setError} t={t} lang={lang} />} />
            
            <Route path="/compress" element={<CompressPdf setError={setError} t={t} lang={lang} />} />
            <Route path="/compress/*" element={<CompressPdf setError={setError} t={t} lang={lang} />} />
            
            <Route path="/organize" element={<OrganizePdf setError={setError} t={t} lang={lang} />} />
            <Route path="/organize/*" element={<OrganizePdf setError={setError} t={t} lang={lang} />} />
            
            <Route path="/pdf2img" element={<PdfToImg setError={setError} t={t} lang={lang} />} />
            <Route path="/pdf2img/*" element={<PdfToImg setError={setError} t={t} lang={lang} />} />
          </Routes>
        </Suspense>

        {/* AdSense Container Placeholder */}
        <div className="adsense-container" style={{ minHeight: '90px', background: 'var(--glass-bg)', border: '1px dashed var(--border-color)', borderRadius: '12px', margin: '3rem 0 1rem 0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          {lang === 'ar' ? 'مساحة إعلانية' : 'Advertisement Space'}
        </div>
      </main>

      {/* Footer */}
      <footer className="footer" style={{ marginTop: '3rem', padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <button onClick={() => setLegalModal('privacy')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.95rem', cursor: 'pointer', padding: 0 }}>{t.privacyPolicy}</button>
          <span style={{ color: 'var(--border-color)' }}>|</span>
          <button onClick={() => setLegalModal('terms')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.95rem', cursor: 'pointer', padding: 0 }}>{t.termsOfUse}</button>
          <span style={{ color: 'var(--border-color)' }}>|</span>
          <button onClick={() => setLegalModal('contact')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.95rem', cursor: 'pointer', padding: 0 }}>{t.contactUs}</button>
        </div>
        <p style={{ marginBottom: '0.5rem' }}>
          {lang === 'ar' ? 'تم التصميم بكل ❤️ لتسهيل دراستك' : 'Designed with ❤️ to make your study easier'}
        </p>
        <p style={{ fontSize: '0.9rem' }}>
          © {new Date().getFullYear()} Homework to PDF. {lang === 'ar' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
        </p>
      </footer>

      {/* Legal Modal */}
      {legalModal && (
        <Suspense fallback={null}>
          <LegalPage type={legalModal} onClose={() => setLegalModal(null)} />
        </Suspense>
      )}
    </div>
  );
}
