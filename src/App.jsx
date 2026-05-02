import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { jsPDF } from 'jspdf';
import { DndContext, closestCenter, KeyboardSensor, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, rectSortingStrategy } from '@dnd-kit/sortable';
import { Moon, Sun, Languages, Download, Trash2, ImagePlus, FileDown, X } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { translations } from './translations';
import SortableImageItem from './components/SortableImageItem';
import ImageCropper from './components/ImageCropper';
import './index.css';

function App() {
  const [images, setImages] = useState([]);
  const [lang, setLang] = useState('ar');
  const [theme, setTheme] = useState('light');
  const [enhance, setEnhance] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [addPageNumbers, setAddPageNumbers] = useState(false);
  const [addMargins, setAddMargins] = useState(false);
  const [quality, setQuality] = useState(0.9);
  const [blackAndWhite, setBlackAndWhite] = useState(false);
  const [fileName, setFileName] = useState('');
  const [watermark, setWatermark] = useState('');
  const [croppingImageId, setCroppingImageId] = useState(null);
  const [activePage, setActivePage] = useState('home');
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const t = translations[lang];

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleLang = () => setLang(prev => prev === 'en' ? 'ar' : 'en');
  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const onDrop = useCallback(async (acceptedFiles) => {
    setError(null);
    setPdfUrl(null);
    setIsProcessing(true);

    try {
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
            return file; // Fallback to original if compression fails
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
    } catch (err) {
      setError(t.errorProcessing);
    } finally {
      setIsProcessing(false);
    }
  }, [t]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png'] }
  });

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

  const clearAll = () => {
    if (window.confirm(t.clearAllConfirm || (lang === 'ar' ? 'هل أنت متأكد من مسح جميع الصور؟' : 'Are you sure you want to clear all images?'))) {
      images.forEach(img => URL.revokeObjectURL(img.previewUrl));
      setImages([]);
      setError(null);
      setPdfUrl(prev => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setCroppingImageId(null);
    }
  };

  const handleCropComplete = async (base64Image) => {
    try {
      // Convert base64 to Blob
      const res = await fetch(base64Image);
      const blob = await res.blob();
      const file = new File([blob], 'cropped.jpg', { type: 'image/jpeg' });
      const newPreviewUrl = URL.createObjectURL(file);
      
      setImages(prev => prev.map(img => {
        if (img.id === croppingImageId) {
          URL.revokeObjectURL(img.previewUrl); // Revoke old URL
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
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (!over) return; // Prevent crash if dropped outside valid area

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
        if (enhance) filterStr += 'brightness(1.1) contrast(1.2) ';
        if (blackAndWhite) filterStr += 'grayscale(100%) ';
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
    setError(null);

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < images.length; i++) {
        if (i > 0) pdf.addPage();
        
        const dataUrl = await processImageForPDF(images[i].previewUrl, images[i].rotation);
        
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
          pdf.setTextColor(100);
          pdf.text(`${i + 1}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
        }
      }

      const pdfBlob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      setPdfUrl(prev => {
        if (prev) URL.revokeObjectURL(prev);
        return blobUrl;
      });
    } catch (err) {
      console.error(err);
      setError(t.errorProcessing);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container">
      <header className="header glass-panel">
        <div className="header-content">
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>
        <div className="controls">
          <button className="icon-button" onClick={toggleLang} aria-label="Toggle Language" title="Toggle Language">
            <Languages size={24} />
          </button>
          <button className="icon-button" onClick={toggleTheme} aria-label="Toggle Theme" title="Toggle Theme">
            {theme === 'light' ? <Moon size={24} /> : <Sun size={24} />}
          </button>
        </div>
      </header>

      {/* Ad Banner - Top */}
      <div className="ad-banner glass-panel">
        <span>Advertisement Space (Top)</span>
        {/* Insert AdSense Script Here */}
      </div>

      {activePage === 'home' ? (
        <>
          {error && (
            <div style={{ backgroundColor: 'rgba(230,57,70,0.1)', color: 'var(--error-color)', padding: '1rem', borderRadius: 'var(--radius)', marginBottom: '1rem', border: '1px solid var(--error-color)' }}>
              {error}
            </div>
          )}

          <div {...getRootProps()} className={`dropzone glass-panel ${isDragActive ? 'active' : ''}`}>
            <input {...getInputProps()} />
            <ImagePlus className="dropzone-icon" />
            <p>{t.uploadPlaceholder}</p>
            <span className="help-text">{t.uploadHelp}</span>
          </div>

          {images.length > 0 && (
            <>
              <div className="toolbar glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', marginBottom: '1.5rem', borderRadius: '12px', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                  <div className="toggle-container" onClick={() => setEnhance(!enhance)}>
                    <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>{t.enhanceToggle}</span>
                    <div className={`toggle-switch ${enhance ? 'active' : ''}`}>
                      <div className="toggle-knob"></div>
                    </div>
                  </div>
                  
                  <div className="toggle-container" onClick={() => setBlackAndWhite(!blackAndWhite)}>
                    <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>{t.bwToggle}</span>
                    <div className={`toggle-switch ${blackAndWhite ? 'active' : ''}`}>
                      <div className="toggle-knob"></div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '600' }}>
                    {t.imageCount(images.length)}
                  </span>
                  <button className="btn btn-danger" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={clearAll}>
                    <Trash2 size={16} />
                    {t.clearAll}
                  </button>
                </div>
              </div>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
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
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem', gap: '1.5rem', flexWrap: 'wrap' }}>
                {!pdfUrl ? (
                  <button className="btn btn-primary" onClick={() => setShowSettingsModal(true)} disabled={isProcessing}>
                    <FileDown size={22} />
                    {t.convertToPdf}
                  </button>
                ) : (
                  <>
                    <a href={pdfUrl} download={`${fileName || (lang === 'ar' ? 'واجب' : 'homework')}.pdf`} className="btn btn-success">
                      <Download size={22} />
                      {t.downloadPdf}
                    </a>
                    <button className="btn" style={{ background: 'var(--secondary-color)', color: 'white' }} onClick={() => window.open(pdfUrl, '_blank')}>
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

          {/* SEO Text Section for AdSense */}
          <div className="seo-section glass-panel" style={{ marginTop: '3rem', padding: '2rem', textAlign: 'start' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>{t.seoTitle}</h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.8' }}>{t.seoText}</p>
          </div>
        </>
      ) : (
        <div className="page-content glass-panel" style={{ padding: '2.5rem', textAlign: 'start', minHeight: '50vh' }}>
          <button className="btn btn-primary" onClick={() => setActivePage('home')} style={{ marginBottom: '2rem' }}>
            {t.home}
          </button>
          <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem', color: 'var(--primary-color)' }}>
            {activePage === 'privacy' ? t.privacyPolicy : activePage === 'terms' ? t.termsOfUse : t.contactUs}
          </h2>
          <p style={{ color: 'var(--text-main)', lineHeight: '2', fontSize: '1.1rem' }}>
            {activePage === 'privacy' ? t.privacyText : activePage === 'terms' ? t.termsText : t.contactText}
          </p>
        </div>
      )}

      {/* Ad Banner - Bottom */}
      <div className="ad-banner glass-panel" style={{ marginTop: '3rem' }}>
        <span>Advertisement Space (Bottom)</span>
        {/* Insert AdSense Script Here */}
      </div>

      {isProcessing && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <h2>{t.processing}</h2>
        </div>
      )}

      {croppingImageId && (
        <ImageCropper 
          imageUrl={images.find(img => img.id === croppingImageId)?.previewUrl}
          onCropComplete={handleCropComplete}
          onCancel={() => setCroppingImageId(null)}
          t={t}
        />
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

      {/* Footer */}
      <footer style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <span style={{ cursor: 'pointer', hover: 'var(--primary-color)' }} onClick={() => setActivePage('privacy')}>{t.privacyPolicy}</span>
          <span style={{ cursor: 'pointer', hover: 'var(--primary-color)' }} onClick={() => setActivePage('terms')}>{t.termsOfUse}</span>
          <span style={{ cursor: 'pointer', hover: 'var(--primary-color)' }} onClick={() => setActivePage('contact')}>{t.contactUs}</span>
        </div>
        <p>© {new Date().getFullYear()} {t.title}. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
