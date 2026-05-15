import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { UploadCloud, FileText, Trash2, Check } from 'lucide-react';
import { translations } from '../translations';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { bytesToMb, getPdfErrorMessage, getRuntimeLimits, isPdfFile } from '../utils/fileLimits';

const parsePageRanges = (value, pageCount) => {
  if (!value.trim()) return { pages: Array.from({ length: pageCount }, (_, index) => index) };

  const selected = [];
  const seen = new Set();
  const parts = value.split(',').map(part => part.trim()).filter(Boolean);

  if (parts.length === 0) return { error: 'invalid' };

  for (const part of parts) {
    const match = part.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!match) return { error: 'invalid' };

    const start = Number(match[1]);
    const end = Number(match[2] || match[1]);

    if (start < 1 || end < start) return { error: 'invalid' };
    if (end > pageCount) return { error: 'range' };

    for (let page = start; page <= end; page++) {
      const index = page - 1;
      if (!seen.has(index)) {
        seen.add(index);
        selected.push(index);
      }
    }
  }

  return { pages: selected };
};

export default function SplitPdf({ setError, setGlobalProcessing = () => {} }) {
  const [lang] = useLocalStorage('hw-pdf-lang', 'ar');
  const t = translations[lang] || translations.en;
  const [pdfFile, setPdfFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState(null);
  const [pageRange, setPageRange] = useState('');

  useEffect(() => {
    return () => {
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, [resultUrl]);

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
      setResultUrl(null);
      setPageRange('');
    }
  }, [setError, t.errorFileTooLarge, t.errorUnsupportedFile]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    onDropRejected: () => setError(t.errorUnsupportedFile),
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
    noClick: !!pdfFile
  });

  const handleSplit = async () => {
    if (!pdfFile) return;
    setIsProcessing(true);
    setProgress(10);
    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const pageCount = pdf.getPageCount();
      const limits = getRuntimeLimits();

      if (pageCount > limits.maxPdfPages) {
        setError(t.errorMaxPages);
        setIsProcessing(false);
        return;
      }

      const { pages: selectedPages, error: rangeError } = parsePageRanges(pageRange, pageCount);
      if (rangeError || !selectedPages || selectedPages.length === 0) {
        setError(rangeError === 'range' ? t.errorPageOutOfRange : t.errorInvalidPageRange);
        setIsProcessing(false);
        return;
      }
      
      const zip = new JSZip();
      
      for (let i = 0; i < selectedPages.length; i++) {
        const pageIndex = selectedPages[i];
        const newPdf = await PDFDocument.create();
        const [copiedPage] = await newPdf.copyPages(pdf, [pageIndex]);
        newPdf.addPage(copiedPage);
        const pdfBytes = await newPdf.save();
        zip.file(`page-${pageIndex + 1}.pdf`, pdfBytes);
        setProgress(10 + Math.round(((i + 1) / selectedPages.length) * 70));
      }

      setProgress(85);
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      setResultUrl(prev => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
      setProgress(100);
      
      const toast = document.getElementById('success-toast');
      if (toast) { toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 3000); }

    } catch (error) {
      console.error(error);
      setError(getPdfErrorMessage(error, t) || t.errorSplit);
    } finally {
      setTimeout(() => setIsProcessing(false), 500);
    }
  };

  return (
    <div className="tool-container">
      <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-main)' }}>
          {t.splitPdfPages}
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          {t.splitPdfDesc}
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
              <FileText size={64} style={{ color: 'var(--primary-color)', marginBottom: '1rem' }} />
              <span style={{ fontSize: '1rem', textAlign: 'center', wordBreak: 'break-all', marginBottom: '1rem' }}>
                {pdfFile.name}
              </span>
              <button className="btn btn-danger" onClick={(e) => { e.stopPropagation(); setPdfFile(null); setResultUrl(null); }}>
                <Trash2 size={16} /> {t.removeFile}
              </button>
            </div>
          )}
        </div>
      </div>

      {pdfFile && !resultUrl && (
        <div className="glass-panel" style={{ textAlign: 'center', marginBottom: '2rem', padding: '1.5rem' }}>
          <div className="setting-input-group" style={{ maxWidth: '420px', margin: '0 auto 1.25rem', textAlign: 'start' }}>
            <label htmlFor="splitPageRange">{t.pageRangeLabel}</label>
            <input
              id="splitPageRange"
              className="input-field"
              value={pageRange}
              onChange={(e) => setPageRange(e.target.value)}
              placeholder={t.pageRangePlaceholder}
            />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t.pageRangeHelp}</span>
          </div>
          <button className="btn btn-primary generate-btn" onClick={handleSplit} disabled={isProcessing}>
             {t.splitNow}
          </button>
        </div>
      )}

      {resultUrl && (
        <div className="glass-panel result-panel" style={{ padding: '2rem', textAlign: 'center' }}>
          <h2 style={{ color: 'var(--success-color)', marginBottom: '1.5rem' }}>
            <Check size={24} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
            {t.splitSuccess}
          </h2>
          <a href={resultUrl} download={`${pdfFile.name.replace('.pdf','')}-pages.zip`} className="btn btn-success" style={{ fontSize: '1.2rem', padding: '1rem 2rem' }}>
            {t.downloadZip}
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
