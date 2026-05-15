import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import * as pdfjsLib from 'pdfjs-dist';
import { jsPDF } from 'jspdf';
import { UploadCloud, Check, Download, FileArchive, Settings } from 'lucide-react';
import { translations } from '../translations';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { bytesToMb, getPdfErrorMessage, getRuntimeLimits, getSafeCanvasScale, isPdfFile } from '../utils/fileLimits';

import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export default function CompressPdf({ setError, setGlobalProcessing = () => {} }) {
  const [lang] = useLocalStorage('hw-pdf-lang', 'ar');
  const t = translations[lang] || translations.en;
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

  useEffect(() => {
    setGlobalProcessing(isProcessing);
    return () => setGlobalProcessing(false);
  }, [isProcessing, setGlobalProcessing]);

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
      setResultPdfUrl(null);
      setStats(null);
    }
  }, [setError, t.errorFileTooLarge, t.errorUnsupportedFile]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    onDropRejected: () => setError(t.errorUnsupportedFile),
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
    noClick: !!pdfFile
  });

  const handleCompress = async () => {
    if (!pdfFile) return;
    setIsProcessing(true);
    setProgress(5);
    let loadingTask = null;
    let pdf = null;
    
    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      pdf = await loadingTask.promise;
      const numPages = pdf.numPages;
      const limits = getRuntimeLimits();

      if (numPages > limits.maxPdfPages) {
        setError(t.errorMaxPagesCompress);
        setIsProcessing(false);
        return;
      }

      const qualityMap = { low: 0.9, medium: 0.6, high: 0.3 };
      const scaleMap = { low: 2.0, medium: 1.5, high: 1.0 };
      const quality = qualityMap[compressionLevel];
      const scale = scaleMap[compressionLevel];

      const pdfDoc = new jsPDF({ orientation: 'portrait', unit: 'mm' });
      pdfDoc.deletePage(1); // Remove default blank page

      for (let i = 1; i <= numPages; i++) {
        setProgress(5 + Math.round(((i - 1) / numPages) * 85));
        
        const page = await pdf.getPage(i);
        let canvas = null;

        try {
          const requestedViewport = page.getViewport({ scale });
          const safeScale = scale * getSafeCanvasScale(requestedViewport.width, requestedViewport.height, limits.maxCanvasPixels);
          const viewport = page.getViewport({ scale: safeScale });

          canvas = document.createElement('canvas');
          const context = canvas.getContext('2d', { alpha: false });
          canvas.height = Math.floor(viewport.height);
          canvas.width = Math.floor(viewport.width);

          await page.render({ canvasContext: context, viewport }).promise;

          const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
          if (!blob) throw new Error('Canvas export failed');
          const imageBytes = new Uint8Array(await blob.arrayBuffer());

          const pdfWidth = pdfDoc.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

          pdfDoc.addPage([pdfWidth, Math.max(pdfHeight, pdfDoc.internal.pageSize.getHeight())]);
          pdfDoc.addImage(imageBytes, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
        } finally {
          if (canvas) {
            canvas.width = 1;
            canvas.height = 1;
          }
          page.cleanup();
        }
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
      setError(getPdfErrorMessage(error, t) || t.errorCompressingFile);
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
          {t.compressTitle}
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          {t.compressSubtitle}
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
          <div style={{ textAlign: 'start', color: 'var(--text-muted)', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem', lineHeight: 1.7 }}>
            {t.compressRasterWarning}
          </div>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Settings size={20} /> {t.compressionLevel}
          </h3>
          <div role="radiogroup" aria-label={t.compressionLevel} style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2rem' }}>
            <label className={`btn ${compressionLevel === 'low' ? 'btn-primary' : ''}`} style={{ flex: 1, minWidth: '120px', cursor: 'pointer', background: compressionLevel === 'low' ? '' : 'var(--glass-bg)' }}>
              <input className="visually-hidden" type="radio" name="compression" value="low" checked={compressionLevel === 'low'} onChange={(e) => setCompressionLevel(e.target.value)} />
              {t.compressionLow}
            </label>
            <label className={`btn ${compressionLevel === 'medium' ? 'btn-primary' : ''}`} style={{ flex: 1, minWidth: '120px', cursor: 'pointer', background: compressionLevel === 'medium' ? '' : 'var(--glass-bg)' }}>
              <input className="visually-hidden" type="radio" name="compression" value="medium" checked={compressionLevel === 'medium'} onChange={(e) => setCompressionLevel(e.target.value)} />
              {t.compressionMedium}
            </label>
            <label className={`btn ${compressionLevel === 'high' ? 'btn-primary' : ''}`} style={{ flex: 1, minWidth: '120px', cursor: 'pointer', background: compressionLevel === 'high' ? '' : 'var(--glass-bg)' }}>
              <input className="visually-hidden" type="radio" name="compression" value="high" checked={compressionLevel === 'high'} onChange={(e) => setCompressionLevel(e.target.value)} />
              {t.compressionHigh}
            </label>
          </div>
          
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            {t.compressionNote}
          </p>

          <button className="btn btn-primary generate-btn" onClick={handleCompress} disabled={isProcessing}>
             {t.compressNow}
          </button>
        </div>
      )}

      {resultPdfUrl && stats && (
        <div className="glass-panel result-panel" style={{ padding: '2rem', textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ color: 'var(--success-color)', marginBottom: '1rem' }}>
            <Check size={24} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
            {t.compressSuccess}
          </h2>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
            <div style={{ background: 'var(--glass-bg)', padding: '1rem', borderRadius: '12px', minWidth: '120px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t.originalSize}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.original} MB</div>
            </div>
            <div style={{ background: 'rgba(56, 161, 105, 0.1)', padding: '1rem', borderRadius: '12px', minWidth: '120px', border: '1px solid var(--success-color)' }}>
              <div style={{ color: 'var(--success-color)', fontSize: '0.9rem' }}>{t.newSize}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success-color)' }}>{stats.compressed} MB</div>
            </div>
            <div style={{ background: 'var(--primary-color)', color: 'white', padding: '1rem', borderRadius: '12px', minWidth: '120px' }}>
              <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>{t.savedPercentage}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.saved > 0 ? stats.saved : 0}%</div>
            </div>
          </div>

          <a href={resultPdfUrl} download={`compressed-${pdfFile.name}`} className="btn btn-success" style={{ fontSize: '1.2rem', padding: '1rem 2rem' }}>
            <Download size={20} />
            {t.downloadCompressedPdf}
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
