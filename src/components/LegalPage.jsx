import { useLocalStorage } from '../hooks/useLocalStorage';
import { translations } from '../translations';
import { X } from 'lucide-react';

export default function LegalPage({ type, onClose }) {
  const [lang] = useLocalStorage('hw-pdf-lang', 'ar');
  const t = translations[lang] || translations.en;

  let title = '';
  let content = '';

  switch (type) {
    case 'privacy':
      title = t.privacyPolicy;
      content = t.privacyText;
      break;
    case 'terms':
      title = t.termsOfUse;
      content = t.termsText;
      break;
    case 'contact':
      title = t.contactUs;
      content = `${t.contactText} ${t.contactEmail}`;
      break;
    default:
      return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div className="modal-content" style={{ width: '90vw', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', textAlign: lang === 'ar' ? 'right' : 'left' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ marginBottom: '1.5rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--text-main)', margin: 0 }}>
            {title}
          </h2>
          <button className="icon-button" onClick={onClose}><X size={24} /></button>
        </div>
        <div style={{ color: 'var(--text-secondary)', lineHeight: '1.8', fontSize: '1.05rem', whiteSpace: 'pre-wrap' }}>
          {content}
        </div>
      </div>
    </div>
  );
}
