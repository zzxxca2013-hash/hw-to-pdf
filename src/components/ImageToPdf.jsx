import { useState, useEffect, useCallback, useRef, Suspense, lazy } from 'react';
import { useDropzone } from 'react-dropzone';
import { jsPDF } from 'jspdf';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable';
import { Trash2, ImagePlus, FileDown, X, Plus, Share2, Printer, Camera, ArrowDownAZ, Download } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import confetti from 'canvas-confetti';
import { saveDraft, loadDraft, clearDraft } from '../utils/db';
import SortableImageItem from './SortableImageItem';
import SeoContent from './SeoContent';
import { useLocalStorage } from '../hooks/useLocalStorage';

const ImageCropper = lazy(() => import('./ImageCropper'));

export default function ImageToPdf({ setError, setSuccess, t, lang }) {
  const [images, setImages] = useState([]);
  const [enhance, setEnhance] = useLocalStorage('hw-pdf-enhance', false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingText, setProcessingText] = useState('');
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfBlob, setPdfBlob] = useState(null);
  const [addPageNumbers, setAddPageNumbers] = useLocalStorage('hw-pdf-page-num', false);
  const [addMargins, setAddMargins] = useLocalStorage('hw-pdf-margins', false);
  const [quality, setQuality] = useLocalStorage('hw-pdf-quality', 0.9);
  const [blackAndWhite, setBlackAndWhite] = useLocalStorage('hw-pdf-bw', false);
  const [scannerMode, setScannerMode] = useLocalStorage('hw-pdf-scanner', false);
  
  const getSmartFilename = () => {
    const d = new Date();
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return lang === 'ar' ? `واجب_${dateStr}` : `Homework_${dateStr}`;
  };

  const [fileName, setFileName] = useState(getSmartFilename());
  const [watermark, setWatermark] = useLocalStorage('hw-pdf-watermark', '');
  const [croppingImageId, setCroppingImageId] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const iframeRef = useRef(null);

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
        setSuccess(lang === 'ar' ? 'تم استعادة ملفاتك غير المحفوظة بنجاح!' : 'Unsaved files restored successfully!');
      }
    };
    recoverDraft();
    return () => { isMounted = false; };
  }, [lang, setSuccess]);

  // Save Draft
  useEffect(() => {
    if (images.length > 0) {
      saveDraft(images);
    } else {
      clearDraft();
    }
  }, [images]);

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

  const onDrop = useCallback(async (acceptedFiles) => {
    if (images.length + acceptedFiles.length > 100) {
      setError(t.maxImagesError);
      return;
    }

    setError(null);
    setPdfUrl(null);
    setIsProcessing(true);

    try {
      for (const file of acceptedFiles) {
        if (file.size > 20 * 1024 * 1024) {
          setError(lang === 'ar' ? 'عذراً، حجم الصورة يتجاوز الحد الأقصى (20 ميجابايت)' : 'Sorry, image size exceeds maximum limit (20 MB)');
          setIsProcessing(false);
          return;
        }
      }

      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };

      const compressedFiles = await Promise.all(
        acceptedFiles.map(async (file) => {
          try {
            return await imageCompression(file, options);
          } catch (error) {
            console.error('Error compressing image:', error);
            return file;
          }
        })
      );

      const newImages = compressedFiles.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        previewUrl: URL.createObjectURL(file),
        rotation: 0
      }));
      
      setImages(prev => [...prev, ...newImages]);
      
      if (acceptedFiles.length > 0) {
        setFileName(prev => prev ? prev : acceptedFiles[0].name.replace(/\.[^/.]+$/, ""));
      }
    } catch {
      setError(t.errorProcessing);
    } finally {
      setIsProcessing(false);
    }
  }, [images, t.maxImagesError, t.errorProcessing, setError]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
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
    setPdfUrl(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  };

  const rotateImage = (id) => {
    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, rotation: (img.rotation + 90) % 360 } : img
    ));
    setPdfUrl(null);
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
    setPdfUrl(null);
  };

  const confirmClearAll = () => {
    images.forEach(img => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    setError(null);
    setPdfUrl(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setCroppingImageId(null);
    setShowClearConfirm(false);
  };

  const handleCropComplete = async (base64Image) => {
    try {
      const res = await fetch(base64Image);
      const blob = await res.blob();
      const file = new File([blob], 'cropped.jpg', { type: 'image/jpeg' });
      const newPreviewUrl = URL.createObjectURL(file);
      
      setImages(prev => prev.map(img => {
        if (img.id === croppingImageId) {
          URL.revokeObjectURL(img.previewUrl);
          return { ...img, file, previewUrl: newPreviewUrl, rotation: 0 };
        }
        return img;
      }));
      setPdfUrl(prev => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setCroppingImageId(null);
    } catch (err) {
      console.error('Error applying crop:', err);
      setError(t.errorProcessing);
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
    
    if (!over) return;

    if (active.id !== over.id) {
      setImages((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
      setPdfUrl(null);
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
      setError(t.errorNoImages);
      return;
    }
    
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    setSuccess(null);
    setPdfUrl(null);
    setPdfBlob(null);

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        setProcessingText(lang === 'ar' ? `جاري معالجة الصورة ${i + 1} من ${images.length}...` : `Processing image ${i + 1} of ${images.length}...`);
        
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
        await new Promise(r => setTimeout(r, 10));
      }

      setProcessingText(lang === 'ar' ? 'جاري إنشاء ملف الـ PDF النهائي...' : 'Finalizing PDF file...');
      
      const generatedBlob = pdf.output('blob');
      const url = URL.createObjectURL(generatedBlob);
      setPdfUrl(url);
      setPdfBlob(generatedBlob);
      setSuccess(t.pdfSuccess);

      if (window.gtag) {
        window.gtag('event', 'convert_success', { images_count: images.length });
      }
      
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
      setError(t.errorProcessing);
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
          text: t.subtitle,
          files: [file]
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      alert(lang === 'ar' ? 'عذراً، متصفحك أو جهازك لا يدعم مشاركة الملفات المباشرة.' : 'Sorry, your browser does not support direct file sharing.');
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

  return (
    <div className="tool-container">
      <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-main)' }}>
          {t.title}
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          {t.subtitle}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem', flexDirection: 'column' }}>
        <div {...getRootProps()} className={`dropzone glass-panel ${isDragActive ? 'active' : ''} ${images.length === 0 ? 'empty-state' : ''}`} style={{ marginBottom: 0 }}>
          <input {...getInputProps()} />
          <ImagePlus className="dropzone-icon" />
          <p>{t.uploadPlaceholder}</p>
          <span className="help-text">{t.uploadHelp}</span>
        </div>
        
        {images.length === 0 && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <input type="file" accept="image/*" capture="environment" id="cameraInput" style={{ display: 'none' }} onChange={handleCameraChange} multiple />
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
              <div className="toggle-container" onClick={() => { setScannerMode(!scannerMode); if (!scannerMode) { setEnhance(false); setBlackAndWhite(false); } }}>
                <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>{t.scannerMode}</span>
                <div className={`toggle-switch ${scannerMode ? 'active' : ''}`}>
                  <div className="toggle-knob"></div>
                </div>
              </div>
              
              <div className="toggle-container" onClick={() => { setEnhance(!enhance); if (!enhance) setScannerMode(false); }}>
                <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>{t.enhanceToggle}</span>
                <div className={`toggle-switch ${enhance ? 'active' : ''}`}>
                  <div className="toggle-knob"></div>
                </div>
              </div>
              
              <div className="toggle-container" onClick={() => { setBlackAndWhite(!blackAndWhite); if (!blackAndWhite) setScannerMode(false); }}>
                <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>{t.bwToggle}</span>
                <div className={`toggle-switch ${blackAndWhite ? 'active' : ''}`}>
                  <div className="toggle-knob"></div>
                </div>
              </div>
            </div>

            <div className="toolbar-actions" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <span className="image-count-text hide-on-mobile">
                {t.imageCount(images.length)}
              </span>
              
              <button className="btn" style={{ background: 'var(--primary-color)', color: 'white', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={open}>
                <ImagePlus size={16} />
                {t.addMore}
              </button>

              <button className="icon-button" style={{ width: '32px', height: '32px', padding: 0 }} onClick={() => document.getElementById('cameraInput').click()}>
                <Camera size={16} />
              </button>

              {images.length > 1 && (
                <button className="btn" style={{ background: 'var(--border-color)', color: 'var(--text-main)', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={autoSortImages}>
                  <ArrowDownAZ size={16} />
                  <span className="hide-on-mobile">{t.autoSort}</span>
                </button>
              )}
              <button className="btn btn-danger clear-btn" onClick={() => setShowClearConfirm(true)}>
                <Trash2 size={16} />
                <span className="hide-on-mobile">{t.clearAll}</span>
              </button>
            </div>
          </div>

          {images.length > 1 && (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem', fontStyle: 'italic' }}>
              {t.dragHint}
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
                  <div className="add-more-card" onClick={open}>
                    <Plus size={40} className="add-more-icon" />
                    <span>{t.addMoreImages}</span>
                  </div>
              </div>
            </SortableContext>
          </DndContext>

          <div className="action-buttons-container">
            {!pdfUrl ? (
              <button className="btn btn-primary" onClick={() => setShowSettingsModal(true)} disabled={isProcessing}>
                <FileDown size={22} />
                {t.convertToPdf}
              </button>
            ) : (
              <>
                <a href={pdfUrl} download={`${fileName || getSmartFilename()}.pdf`} className="btn btn-success">
                  <Download size={22} />
                  {t.downloadPdf}
                </a>
                
                {typeof navigator !== 'undefined' && navigator.canShare && (
                  <button className="btn" style={{ background: '#3b82f6', color: 'white' }} onClick={handleShare}>
                    <Share2 size={22} />
                    {t.sharePdf || 'Share PDF'}
                  </button>
                )}

                <button className="btn" style={{ background: 'var(--secondary-color)', color: 'white' }} onClick={() => setShowPreviewModal(true)}>
                  {t.previewPdf || (lang === 'ar' ? 'معاينة الـ PDF' : 'Preview PDF')}
                </button>
                <button className="btn btn-primary" onClick={() => setShowSettingsModal(true)}>
                  {lang === 'ar' ? 'تعديل الخيارات' : 'Edit Options'}
                </button>
              </>
            )}
          </div>
        </>
      )}

      {images.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <p>{t.noImages}</p>
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
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t.settingsTitle}</h3>
              <button className="icon-button" onClick={() => setShowSettingsModal(false)}><X size={20} /></button>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              <div className="setting-card glass-panel" style={{ padding: '1rem' }}>
                <div className="setting-row" onClick={() => { setAddPageNumbers(!addPageNumbers); setPdfUrl(null); }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>{t.addPageNumbers}</span>
                  <div className={`toggle-switch ${addPageNumbers ? 'active' : ''}`}><div className="toggle-knob"></div></div>
                </div>
                <div className="setting-row" onClick={() => { setAddMargins(!addMargins); setPdfUrl(null); }} style={{ marginTop: '1rem' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>{t.addMargins}</span>
                  <div className={`toggle-switch ${addMargins ? 'active' : ''}`}><div className="toggle-knob"></div></div>
                </div>
                <div className="setting-row" style={{ marginTop: '1rem', cursor: 'default' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>{t.pdfQuality}</span>
                  <select value={quality} onChange={(e) => { setQuality(Number(e.target.value)); setPdfUrl(null); }} className="input-field" style={{ minWidth: '120px', padding: '0.4rem 0.8rem' }}>
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
                  <input type="text" value={watermark} onChange={(e) => { setWatermark(e.target.value); setPdfUrl(null); }} placeholder={t.watermarkPlaceholder} className="input-field" maxLength={40} />
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
          <div className="modal-content" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ color: 'var(--error-color)' }}>{t.clearAllConfirmTitle}</h3>
              <button className="icon-button" onClick={() => setShowClearConfirm(false)}><X size={20} /></button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: '1.6' }}>{t.clearAllConfirmDesc}</p>
            </div>
            <div className="modal-actions">
              <button className="btn" style={{ background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border-color)' }} onClick={() => setShowClearConfirm(false)}>
                {t.noCancel}
              </button>
              <button className="btn btn-danger" onClick={confirmClearAll}>
                <Trash2 size={20} />
                {t.yesClear}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPreviewModal && pdfUrl && (
        <div className="modal-overlay" onClick={() => setShowPreviewModal(false)}>
          <div className="modal-content" style={{ width: '95vw', maxWidth: '1000px', height: '90vh' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                {fileName || getSmartFilename()}.pdf
                {pdfBlob && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 'normal', background: 'rgba(0,0,0,0.05)', padding: '0.2rem 0.6rem', borderRadius: '12px' }}>{t.fileSize} {(pdfBlob.size / (1024 * 1024)).toFixed(2)} MB</span>}
              </h3>
              <button className="icon-button" onClick={() => setShowPreviewModal(false)}><X size={20} /></button>
            </div>
            <div style={{ flex: 1, backgroundColor: '#525659' }}>
              <iframe ref={iframeRef} src={`${pdfUrl}#toolbar=0`} width="100%" height="100%" style={{ border: 'none' }} title="PDF Preview" />
            </div>
            <div className="modal-actions" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn" style={{ background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border-color)' }} onClick={() => setShowPreviewModal(false)}>
                {t.closePreview}
              </button>
              <button className="btn" style={{ background: '#0ea5e9', color: 'white' }} onClick={handlePrint}>
                <Printer size={20} />
                {t.printPdf || 'Print PDF'}
              </button>
              <a href={pdfUrl} download={`${fileName || getSmartFilename()}.pdf`} className="btn btn-success">
                <Download size={20} />
                {t.downloadPdf}
              </a>
            </div>
          </div>
        </div>
      )}

      <SeoContent lang={lang} t={t} type="img2pdf" />
    </div>
  );
}
