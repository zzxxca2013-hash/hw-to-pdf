import React from 'react';

export default function SeoContent({ lang, t, type }) {
  let title = '';
  let text = '';
  let faqs = [];

  switch (type) {
    case 'img2pdf':
      title = t.seoTitle;
      text = t.seoText;
      faqs = t.faq || [];
      break;
    case 'merge':
      title = t.mergeSeoTitle;
      text = t.mergeSeoText;
      faqs = t.mergeFaq || [];
      break;
    case 'split':
      title = t.splitSeoTitle;
      text = t.splitSeoText;
      faqs = t.splitFaq || [];
      break;
    case 'compress':
      title = t.compressSeoTitle;
      text = t.compressSeoText;
      faqs = t.compressFaq || [];
      break;
    case 'organize':
      title = t.organizeSeoTitle;
      text = t.organizeSeoText;
      faqs = t.organizeFaq || [];
      break;
    case 'pdf2img':
      title = t.pdf2imgSeoTitle;
      text = t.pdf2imgSeoText;
      faqs = t.pdf2imgFaq || [];
      break;
    default:
      return null;
  }

  if (!title) return null;

  return (
    <article className="seo-content glass-panel" style={{ padding: '2rem', marginTop: '3rem', textAlign: 'start', borderRadius: '12px' }}>
      <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem', color: 'var(--text-main)', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem' }}>{title}</h2>
      <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8', marginBottom: '2rem', fontSize: '1rem' }}>{text}</p>
      
      {faqs.length > 0 && (
        <>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '1.2rem', color: 'var(--text-main)', marginTop: '2rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            {t.faqTitle || (lang === 'ar' ? 'الأسئلة الشائعة' : 'Frequently Asked Questions')}
          </h2>
          <div className="faq-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {faqs.map((faq, index) => (
              <div key={index} className="faq-item" style={{ background: 'rgba(0,0,0,0.02)', padding: '1.2rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-main)', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--primary-color)' }}>Q:</span> {faq.q}
                </h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0, paddingLeft: lang === 'ar' ? '0' : '1.5rem', paddingRight: lang === 'ar' ? '1.5rem' : '0' }}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </article>
  );
}
