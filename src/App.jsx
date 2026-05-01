import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { jsPDF } from 'jspdf';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, rectSortingStrategy } from '@dnd-kit/sortable';
import { Moon, Sun, Languages, Download, Trash2, ImagePlus, FileDown } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { translations } from './translations';
import SortableImageItem from './components/SortableImageItem';
import './index.css';

function App() {
  const [images, setImages] = useState([]);
  const [lang, setLang] = useState('en');
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
    setImages(prev => prev.filter(img => img.id !== id));
    setPdfUrl(null);
  };

  const rotateImage = (id) => {
    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, rotation: (img.rotation + 90) % 360 } : img
    ));
    setPdfUrl(null);
  };

  const clearAll = () => {
    setImages([]);
    setError(null);
    setPdfUrl(null);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
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
      setPdfUrl(blobUrl);
    } catch (err) {
      console.error(err);
      setError(t.errorProcessing);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container">
      <header className="header">
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

      {error && (
        <div style={{ backgroundColor: 'rgba(230,57,70,0.1)', color: 'var(--error-color)', padding: '1rem', borderRadius: 'var(--radius)', marginBottom: '1rem', border: '1px solid var(--error-color)' }}>
          {error}
        </div>
      )}

      <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
        <input {...getInputProps()} />
        <ImagePlus className="dropzone-icon" />
        <p>{t.uploadPlaceholder}</p>
        <span className="help-text">{t.uploadHelp}</span>
      </div>

      {images.length > 0 && (
        <>
          <div className="actions-bar" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div className="toggle-container" onClick={() => setEnhance(!enhance)}>
                  <div className={`toggle-switch ${enhance ? 'active' : ''}`}>
                    <div className="toggle-knob"></div>
                  </div>
                  <span>{t.enhanceToggle}</span>
                </div>
                
                <div className="toggle-container" onClick={() => setBlackAndWhite(!blackAndWhite)}>
                  <div className={`toggle-switch ${blackAndWhite ? 'active' : ''}`}>
                    <div className="toggle-knob"></div>
                  </div>
                  <span>{t.bwToggle}</span>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>{t.imageCount(images.length)}</span>
                <button className="btn btn-danger" onClick={clearAll}>
                  <Trash2 size={18} />
                  {t.clearAll}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', alignItems: 'center' }}>
              <strong style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{t.settingsTitle}:</strong>
              
              <div className="toggle-container" onClick={() => { setAddPageNumbers(!addPageNumbers); setPdfUrl(null); }}>
                <div className={`toggle-switch ${addPageNumbers ? 'active' : ''}`} style={{ transform: 'scale(0.8)' }}>
                  <div className="toggle-knob"></div>
                </div>
                <span style={{ fontSize: '0.875rem' }}>{t.addPageNumbers}</span>
              </div>

              <div className="toggle-container" onClick={() => { setAddMargins(!addMargins); setPdfUrl(null); }}>
                <div className={`toggle-switch ${addMargins ? 'active' : ''}`} style={{ transform: 'scale(0.8)' }}>
                  <div className="toggle-knob"></div>
                </div>
                <span style={{ fontSize: '0.875rem' }}>{t.addMargins}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                <span>{t.pdfQuality}:</span>
                <select 
                  value={quality} 
                  onChange={(e) => { setQuality(Number(e.target.value)); setPdfUrl(null); }}
                  style={{ padding: '0.25rem', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)', color: 'var(--text-main)' }}
                >
                  <option value={1.0}>{t.qualityHigh}</option>
                  <option value={0.8}>{t.qualityMedium}</option>
                  <option value={0.5}>{t.qualityLow}</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', width: '100%', marginTop: '0.5rem' }}>
                <span style={{ whiteSpace: 'nowrap' }}>{t.fileNameLabel}</span>
                <input 
                  type="text" 
                  value={fileName} 
                  onChange={(e) => setFileName(e.target.value)} 
                  placeholder={t.fileNamePlaceholder}
                  style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)', color: 'var(--text-main)', flex: 1, maxWidth: '250px' }}
                />
              </div>
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
                    rotation={img.rotation}
                    enhanced={enhance}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={generatePDF} disabled={isProcessing}>
              <FileDown size={20} />
              {t.convertToPdf}
            </button>
            {pdfUrl && (
              <a href={pdfUrl} download={`${fileName || 'homework'}.pdf`} className="btn btn-primary" style={{ backgroundColor: 'var(--success-color)' }}>
                <Download size={20} />
                {t.downloadPdf}
              </a>
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
          <h2>{t.processing}</h2>
        </div>
      )}
    </div>
  );
}

export default App;
