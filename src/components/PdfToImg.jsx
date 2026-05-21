import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import { UploadCloud, FileImage, Trash2, Check, DownloadCloud } from 'lucide-react';
import { translations } from '../translations';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { bytesToMb, getPdfErrorMessage, getRuntimeLimits, getSafeCanvasScale, isPdfFile } from '../utils/fileLimits';

import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const MAX_PREVIEW_IMAGES = 24;

export default function PdfToImg({ setError, setGlobalProcessing = () => {} }) {
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
    setGlobalProcessing(isProcessing);
    return () => setGlobalProcessing(false);
  }, [isProcessing, setGlobalProcessing]);

  useEffect(() => {
    return () => {
      images.forEach(img => URL.revokeObjectURL(img.url));
    };
  }, [images]);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const limits = getRuntimeLimits();

      if (!isPdfFile(file)) {
        setError(t.errorUnsupportedFile);
        return;
      }

      if (file.size > limits.maxPdfFileSize) {
        setError(t.errorFileTooLarge.replace('{max}', bytesToMb(limits.maxPdfFileSize)));
        return;
      }

      setPdfFile(file);
      setImages([]);
      setResultZipUrl(null);
    }
  }, [setError, t.errorFileTooLarge, t.errorUnsupportedFile]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    onDropRejected: () => setError(t.errorUnsupportedFile),
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
    let loadingTask = null;
    let pdf = null;

    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      pdf = await loadingTask.promise;
      const numPages = pdf.numPages;
      const limits = getRuntimeLimits();

      if (numPages > limits.maxPdfToImagePages) {
        setError(t.errorMaxPages);
        setIsProcessing(false);
        return;
      }

      const renderScale = numPages > limits.pdfToImageLargeFilePages ? 1.15 : 1.75;
      const zip = new JSZip();

      for (let i = 1; i <= numPages; i++) {
        setProgress(5 + Math.round(((i - 1) / numPages) * 75));
        const page = await pdf.getPage(i);
        let canvas = null;

        try {
          const requestedViewport = page.getViewport({ scale: renderScale });
          const safeScale = renderScale * getSafeCanvasScale(requestedViewport.width, requestedViewport.height, limits.maxCanvasPixels);
          const viewport = page.getViewport({ scale: safeScale });

          canvas = document.createElement('canvas');
          const context = canvas.getContext('2d', { alpha: false });
          canvas.height = Math.floor(viewport.height);
          canvas.width = Math.floor(viewport.width);

          await page.render({ canvasContext: context, viewport }).promise;

          const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', safeScale < 1.5 ? 0.86 : 0.92));
          if (!blob) throw new Error('Canvas export failed');

          if (extractedImages.length < MAX_PREVIEW_IMAGES) {
            const url = URL.createObjectURL(blob);
            extractedImages.push({ id: i, url });
          }
          zip.file(`page-${i}.jpg`, blob);
        } finally {
          if (canvas) {
            canvas.width = 1;
            canvas.height = 1;
          }
          page.cleanup();
        }
      }

      setProgress(85);

      const zipBlob = await zip.generateAsync({ type: 'blob', streamFiles: true });
      const zipUrl = URL.createObjectURL(zipBlob);
      setResultZipUrl(prev => {
        if (prev) URL.revokeObjectURL(prev);
        return zipUrl;
      });
      setImages(extractedImages);
      extractedImages = [];
      setProgress(100);

      const toast = document.getElementById('success-toast');
      if (toast) { toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 3000); }

    } catch (error) {
      console.error(error);
      extractedImages.forEach(img => URL.revokeObjectURL(img.url));
      setError(getPdfErrorMessage(error, t) || t.errorExtractingImages);
    } finally {
      await pdf?.destroy?.();
      if (!pdf) await loadingTask?.destroy?.();
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

        <div className={`dropzone ${isDragActive ? 'drag-active' : ''}`} {...getRootProps({ 'aria-label': t.dragPdfHere })} style={{ minHeight: pdfFile ? 'auto' : '200px' }}>
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
          {pdfFile && images.length === MAX_PREVIEW_IMAGES && (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '1rem', fontSize: '0.9rem' }}>
              {t.pdfSafetyNote}
            </p>
          )}
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
