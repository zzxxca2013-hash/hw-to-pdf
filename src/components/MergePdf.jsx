import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { PDFDocument } from 'pdf-lib';
import { UploadCloud, FileText, Trash2, ArrowDownAZ, Settings, Check, X } from 'lucide-react';
import { translations } from '../translations';
import { useLocalStorage } from '../hooks/useLocalStorage';

export default function MergePdf({ setError }) {
  const [lang] = useLocalStorage('hw-pdf-lang', 'ar');
  const t = translations[lang] || translations.en;
  const [pdfs, setPdfs] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState(null);

  const onDrop = useCallback(async (acceptedFiles) => {
    setIsProcessing(true);
    setProgress(20);
    try {
      const newPdfs = acceptedFiles.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        name: file.name
      }));
      setPdfs(prev => [...prev, ...newPdfs]);
    } catch (err) {
      setError(t.errorProcessing || "Error adding files");
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    noClick: pdfs.length > 0
  });

  const removePdf = (id) => {
    setPdfs(prev => prev.filter(p => p.id !== id));
    setResultUrl(null);
  };

  const handleMerge = async () => {
    if (pdfs.length < 2) {
      setError(lang === 'ar' ? "الرجاء اختيار ملفي PDF على الأقل" : "Please select at least 2 PDF files");
      return;
    }
    setIsProcessing(true);
    setProgress(10);
    try {
      const mergedPdf = await PDFDocument.create();
      
      for (let i = 0; i < pdfs.length; i++) {
        const file = pdfs[i].file;
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
        setProgress(10 + Math.round(((i + 1) / pdfs.length) * 60));
      }

      setProgress(80);
      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setProgress(100);
      
      const toast = document.getElementById('success-toast');
      if (toast) { toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 3000); }

    } catch (error) {
      console.error(error);
      setError(t.errorProcessing || "Error merging files");
    } finally {
      setTimeout(() => setIsProcessing(false), 500);
    }
  };

  return (
    <div className="tool-container">
      <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-main)' }}>
          {lang === 'ar' ? 'دمج ملفات PDF' : 'Merge PDF Files'}
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          {lang === 'ar' ? 'قم برفع ملفات PDF لدمجها في ملف واحد مرتب بسهولة.' : 'Upload PDF files to merge them into one organized file easily.'}
        </p>

        <div className={`dropzone ${isDragActive ? 'drag-active' : ''}`} {...getRootProps()} style={{ minHeight: pdfs.length > 0 ? 'auto' : '200px' }}>
          <input {...getInputProps()} />
          {pdfs.length === 0 ? (
            <div className="dropzone-content">
              <UploadCloud size={48} className="upload-icon" />
              <h3>{lang === 'ar' ? 'اسحب ملفات PDF هنا' : 'Drag PDF files here'}</h3>
              <button className="btn btn-primary" onClick={open}>
                {lang === 'ar' ? 'اختيار الملفات' : 'Select Files'}
              </button>
            </div>
          ) : (
            <div className="image-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', padding: '1rem' }}>
              {pdfs.map((pdf, index) => (
                <div key={pdf.id} className="image-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div className="card-number">{index + 1}</div>
                  <FileText size={40} style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }} />
                  <span style={{ fontSize: '0.8rem', textAlign: 'center', wordBreak: 'break-all', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {pdf.name}
                  </span>
                  <div className="card-actions">
                    <button className="icon-button danger" onClick={(e) => { e.stopPropagation(); removePdf(pdf.id); }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {pdfs.length > 0 && (
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={open}>
              {lang === 'ar' ? 'إضافة المزيد' : 'Add More'}
            </button>
            <button className="btn btn-danger" onClick={() => { setPdfs([]); setResultUrl(null); }}>
              <Trash2 size={16} /> {lang === 'ar' ? 'مسح الكل' : 'Clear All'}
            </button>
          </div>
        )}
      </div>

      {pdfs.length > 1 && !resultUrl && (
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <button className="btn btn-primary generate-btn" onClick={handleMerge} disabled={isProcessing}>
             {lang === 'ar' ? 'دمج الملفات الآن' : 'Merge Files Now'}
          </button>
        </div>
      )}

      {resultUrl && (
        <div className="glass-panel result-panel" style={{ padding: '2rem', textAlign: 'center' }}>
          <h2 style={{ color: 'var(--success-color)', marginBottom: '1.5rem' }}>
            <Check size={24} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
            {lang === 'ar' ? 'تم دمج الملف بنجاح!' : 'File merged successfully!'}
          </h2>
          <a href={resultUrl} download="merged-document.pdf" className="btn btn-success" style={{ fontSize: '1.2rem', padding: '1rem 2rem' }}>
            {lang === 'ar' ? 'تحميل الملف المدمج' : 'Download Merged PDF'}
          </a>
        </div>
      )}

      {isProcessing && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <h2 style={{ marginBottom: progress > 0 ? '1rem' : '0' }}>{t.processing}</h2>
          {progress > 0 && (
            <div style={{ width: '80%', maxWidth: '300px', textAlign: 'center' }}>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: 'var(--primary-color)', transition: 'width 0.3s ease' }}></div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
