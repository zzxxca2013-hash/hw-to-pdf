import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import * as pdfjsLib from 'pdfjs-dist';
import { jsPDF } from 'jspdf';
import { UploadCloud, Check, Download, FileArchive, Settings } from 'lucide-react';
import { translations } from '../translations';
import { useLocalStorage } from '../hooks/useLocalStorage';
import SeoContent from './SeoContent';

import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export default function CompressPdf({ setError, t, lang }) {
  const [pdfFile, setPdfFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultPdfUrl, setResultPdfUrl] = useState(null);
  const [compressionLevel, setCompressionLevel] = useState('medium'); // low, medium, high
  const [stats, setStats] = useState(null);

  useEffect(() => {
    return () => {
      if (resultPdfUrl) URL.revokeObjectURL(resultPdfUrl);
    };
  }, [resultPdfUrl]);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      if (acceptedFiles[0].size > 50 * 1024 * 1024) {
        setError(lang === 'ar' ? 'عذراً، حجم الملف يتجاوز الحد الأقصى (50 ميجابايت)' : 'Sorry, file size exceeds maximum limit (50 MB)');
        return;
      }
      setPdfFile(acceptedFiles[0]);
      setResultPdfUrl(null);
      setStats(null);
    }
  }, [lang, setError]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
    noClick: !!pdfFile
  });

  const handleCompress = async () => {
    if (!pdfFile) return;
    setIsProcessing(true);
    setProgress(5);
    
    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;

      if (numPages > 150) {
        setError(lang === 'ar' ? 'عذراً، لا يمكن ضغط ملف يحتوي على أكثر من 150 صفحة لحماية متصفحك.' : 'Sorry, maximum limit is 150 pages to prevent browser crash.');
        setIsProcessing(false);
        return;
      }

      const qualityMap = { low: 0.9, medium: 0.6, high: 0.3 };
      const scaleMap = { low: 2.0, medium: 1.5, high: 1.0 };
      const quality = qualityMap[compressionLevel];
      const scale = scaleMap[compressionLevel];

      const pdfDoc = new jsPDF({ orientation: 'portrait', unit: 'pt' });
      pdfDoc.deletePage(1); // Remove default blank page

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d', { willReadFrequently: true });

      for (let i = 1; i <= numPages; i++) {
        setProgress(5 + Math.round(((i - 1) / numPages) * 85));
        
        const page = await pdf.getPage(i);
        const originalViewport = page.getViewport({ scale: 1.0 });
        const viewport = page.getViewport({ scale });
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport: viewport }).promise;
        
        const imgData = canvas.toDataURL('image/jpeg', quality);
        
        pdfDoc.addPage([originalViewport.width, originalViewport.height], originalViewport.width > originalViewport.height ? 'landscape' : 'portrait');
        pdfDoc.addImage(imgData, 'JPEG', 0, 0, originalViewport.width, originalViewport.height, undefined, 'FAST');
        
        page.cleanup(); // Free memory
        context.clearRect(0, 0, canvas.width, canvas.height);
      }

      setProgress(95);
      const blob = pdfDoc.output('blob');
      const url = URL.createObjectURL(blob);
      setResultPdfUrl(url);
      
      setStats({
        original: (pdfFile.size / (1024 * 1024)).toFixed(2),
        compressed: (blob.size / (1024 * 1024)).toFixed(2),
        saved: Math.round((1 - blob.size / pdfFile.size) * 100)
      });

      setProgress(100);
      const toast = document.getElementById('success-toast');
      if (toast) { toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 3000); }

    } catch (error) {
      console.error(error);
      setError(lang === 'ar' ? 'حدث خطأ أثناء ضغط الملف.' : 'Error compressing file.');
    } finally {
      setTimeout(() => setIsProcessing(false), 500);
    }
  };

  return (
    <div className="tool-container">
      <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-main)' }}>
          {t.compressTitle}
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          {t.compressSubtitle}
        </p>

        <div className={`dropzone ${isDragActive ? 'drag-active' : ''}`} {...getRootProps()} style={{ minHeight: pdfFile ? 'auto' : '200px' }}>
          <input {...getInputProps()} />
          {!pdfFile ? (
            <div className="dropzone-content">
              <UploadCloud size={48} className="upload-icon" />
              <h3>{lang === 'ar' ? 'اسحب ملف PDF هنا' : 'Drag PDF file here'}</h3>
              <button className="btn btn-primary" onClick={open}>
                {lang === 'ar' ? 'اختيار ملف' : 'Select File'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(0,0,0,0.05)', borderRadius: '20px' }}>
                <FileArchive size={20} className="text-primary" />
                <span style={{ fontWeight: '500' }}>{pdfFile.name} ({(pdfFile.size / (1024*1024)).toFixed(2)} MB)</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {pdfFile && !resultPdfUrl && (
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Settings size={20} /> {lang === 'ar' ? 'مستوى الضغط' : 'Compression Level'}
          </h3>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2rem' }}>
            <label className={`btn ${compressionLevel === 'low' ? 'btn-primary' : ''}`} style={{ flex: 1, minWidth: '120px', cursor: 'pointer', background: compressionLevel === 'low' ? '' : 'var(--glass-bg)' }}>
              <input type="radio" name="compression" value="low" checked={compressionLevel === 'low'} onChange={(e) => setCompressionLevel(e.target.value)} style={{ display: 'none' }} />
              {lang === 'ar' ? 'ضغط خفيف' : 'Low'}
            </label>
            <label className={`btn ${compressionLevel === 'medium' ? 'btn-primary' : ''}`} style={{ flex: 1, minWidth: '120px', cursor: 'pointer', background: compressionLevel === 'medium' ? '' : 'var(--glass-bg)' }}>
              <input type="radio" name="compression" value="medium" checked={compressionLevel === 'medium'} onChange={(e) => setCompressionLevel(e.target.value)} style={{ display: 'none' }} />
              {lang === 'ar' ? 'ضغط متوسط (موصى به)' : 'Medium (Recommended)'}
            </label>
            <label className={`btn ${compressionLevel === 'high' ? 'btn-primary' : ''}`} style={{ flex: 1, minWidth: '120px', cursor: 'pointer', background: compressionLevel === 'high' ? '' : 'var(--glass-bg)' }}>
              <input type="radio" name="compression" value="high" checked={compressionLevel === 'high'} onChange={(e) => setCompressionLevel(e.target.value)} style={{ display: 'none' }} />
              {lang === 'ar' ? 'ضغط قوي' : 'High'}
            </label>
          </div>
          
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            {lang === 'ar' ? 'ملاحظة: عملية الضغط تقوم بتحويل النصوص إلى صور مسطحة، مما قد يؤثر على القدرة على تحديد النصوص.' : 'Note: Compression flattens the PDF into images, which removes text selectability.'}
          </p>

          <button className="btn btn-primary generate-btn" onClick={handleCompress} disabled={isProcessing}>
             {lang === 'ar' ? 'ضغط الملف الآن' : 'Compress PDF Now'}
          </button>
        </div>
      )}

      {resultPdfUrl && stats && (
        <div className="glass-panel result-panel" style={{ padding: '2rem', textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ color: 'var(--success-color)', marginBottom: '1rem' }}>
            <Check size={24} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
            {lang === 'ar' ? 'تم ضغط الملف بنجاح!' : 'PDF Compressed Successfully!'}
          </h2>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
            <div style={{ background: 'var(--glass-bg)', padding: '1rem', borderRadius: '12px', minWidth: '120px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{lang === 'ar' ? 'الحجم الأصلي' : 'Original Size'}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.original} MB</div>
            </div>
            <div style={{ background: 'rgba(56, 161, 105, 0.1)', padding: '1rem', borderRadius: '12px', minWidth: '120px', border: '1px solid var(--success-color)' }}>
              <div style={{ color: 'var(--success-color)', fontSize: '0.9rem' }}>{lang === 'ar' ? 'الحجم الجديد' : 'New Size'}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success-color)' }}>{stats.compressed} MB</div>
            </div>
            <div style={{ background: 'var(--primary-color)', color: 'white', padding: '1rem', borderRadius: '12px', minWidth: '120px' }}>
              <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>{lang === 'ar' ? 'نسبة التوفير' : 'Saved'}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.saved > 0 ? stats.saved : 0}%</div>
            </div>
          </div>

          <a href={resultPdfUrl} download={`compressed-${pdfFile.name}`} className="btn btn-success" style={{ fontSize: '1.2rem', padding: '1rem 2rem' }}>
            <Download size={20} />
            {lang === 'ar' ? 'تحميل الملف المضغوط' : 'Download Compressed PDF'}
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

      <SeoContent lang={lang} t={t} type="compress" />
    </div>
  );
}
