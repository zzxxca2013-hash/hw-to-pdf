import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import { UploadCloud, FileImage, Trash2, Check, DownloadCloud } from 'lucide-react';
import { translations } from '../translations';
import { useLocalStorage } from '../hooks/useLocalStorage';

import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export default function PdfToImg({ setError }) {
  const [lang] = useLocalStorage('hw-pdf-lang', 'ar');
  const t = translations[lang] || translations.en;
  const [pdfFile, setPdfFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [images, setImages] = useState([]);
  const [resultZipUrl, setResultZipUrl] = useState(null);

  useEffect(() => {
    return () => {
      if (resultZipUrl) URL.revokeObjectURL(resultZipUrl);
    };
  }, [resultZipUrl]);

  useEffect(() => {
    return () => {
      images.forEach(img => URL.revokeObjectURL(img.url));
    };
  }, [images]);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setPdfFile(acceptedFiles[0]);
      setImages([]);
      setResultZipUrl(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
    noClick: !!pdfFile
  });

  const handleExtractImages = async () => {
    if (!pdfFile) return;
    setIsProcessing(true);
    setProgress(5);
    setImages([]);
    let extractedImages = [];
    
    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;
      const zip = new JSZip();

      for (let i = 1; i <= numPages; i++) {
        setProgress(5 + Math.round(((i - 1) / numPages) * 75));
        
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better quality
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };
        
        await page.render(renderContext).promise;
        
        // Convert canvas to blob
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));
        const url = URL.createObjectURL(blob);
        
        extractedImages.push({ id: i, url });
        zip.file(`page-${i}.jpg`, blob);
      }

      setImages(extractedImages);
      extractedImages = [];
      setProgress(85);
      
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipUrl = URL.createObjectURL(zipBlob);
      setResultZipUrl(prev => {
        if (prev) URL.revokeObjectURL(prev);
        return zipUrl;
      });
      setProgress(100);
      
      const toast = document.getElementById('success-toast');
      if (toast) { toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 3000); }

    } catch (error) {
      console.error(error);
      extractedImages.forEach(img => URL.revokeObjectURL(img.url));
      setError(t.errorExtractingImages);
    } finally {
      setTimeout(() => setIsProcessing(false), 500);
    }
  };

  return (
    <div className="tool-container">
      <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-main)' }}>
          {t.pdf2imgTitle}
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          {t.pdf2imgSubtitle}
        </p>

        <div className={`dropzone ${isDragActive ? 'drag-active' : ''}`} {...getRootProps()} style={{ minHeight: pdfFile ? 'auto' : '200px' }}>
          <input {...getInputProps()} />
          {!pdfFile ? (
            <div className="dropzone-content">
              <UploadCloud size={48} className="upload-icon" />
              <h3>{t.dragPdfHere}</h3>
              <button className="btn btn-primary" onClick={open}>
                {t.selectFile}
              </button>
            </div>
          ) : (
            <div className="image-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 auto', maxWidth: '300px' }}>
              <FileImage size={64} style={{ color: 'var(--primary-color)', marginBottom: '1rem' }} />
              <span style={{ fontSize: '1rem', textAlign: 'center', wordBreak: 'break-all', marginBottom: '1rem' }}>
                {pdfFile.name}
              </span>
              <button className="btn btn-danger" onClick={(e) => { e.stopPropagation(); setPdfFile(null); setResultZipUrl(null); setImages([]); }}>
                <Trash2 size={16} /> {t.removeFile}
              </button>
            </div>
          )}
        </div>
      </div>

      {pdfFile && !resultZipUrl && (
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <button className="btn btn-primary generate-btn" onClick={handleExtractImages} disabled={isProcessing}>
             {t.pdf2imgConvertNow}
          </button>
        </div>
      )}

      {resultZipUrl && (
        <div className="glass-panel result-panel" style={{ padding: '2rem', textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ color: 'var(--success-color)', marginBottom: '1.5rem' }}>
            <Check size={24} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
            {t.pdf2imgSuccess}
          </h2>
          <a href={resultZipUrl} download={`${pdfFile.name.replace('.pdf','')}-images.zip`} className="btn btn-success" style={{ fontSize: '1.2rem', padding: '1rem 2rem' }}>
            <DownloadCloud size={20} />
            {t.downloadAllImagesZip}
          </a>
        </div>
      )}

      {images.length > 0 && (
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', textAlign: 'center' }}>{t.extractedImagesPreview}</h3>
          <div className="images-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
            {images.map((img) => (
              <div key={img.id} className="image-card" style={{ position: 'relative' }}>
                <img src={img.url} alt={`Page ${img.id}`} style={{ width: '100%', borderRadius: 'var(--radius)', display: 'block' }} />
                <div style={{ position: 'absolute', top: '5px', left: '5px', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '0.8rem' }}>
                  {img.id}
                </div>
              </div>
            ))}
          </div>
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
