import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import { UploadCloud, Trash2, Check, Download, GripVertical, FileStack } from 'lucide-react';
import { translations } from '../translations';
import { useLocalStorage } from '../hooks/useLocalStorage';

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

// Draggable Page Item Component
const SortablePageItem = ({ id, url, index, onRemove }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 'auto',
    position: 'relative',
    cursor: 'grab',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: 'white',
    padding: '0.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div style={{ position: 'absolute', top: '-10px', right: '-10px', zIndex: 10 }}>
        <button 
          className="icon-button danger" 
          style={{ width: '30px', height: '30px', padding: '0', background: 'var(--error-color)', color: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Trash2 size={16} />
        </button>
      </div>
      <div style={{ position: 'absolute', top: '5px', left: '5px', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '0.8rem', zIndex: 5 }}>
        {index}
      </div>
      <img src={url} alt={`Page ${index}`} draggable={false} style={{ width: '100%', height: 'auto', borderRadius: '4px', border: '1px solid #eee' }} />
      <div style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>
        <GripVertical size={20} />
      </div>
    </div>
  );
};

export default function OrganizePdf({ setError }) {
  const [lang] = useLocalStorage('hw-pdf-lang', 'ar');
  const t = translations[lang] || translations.en;
  const [pdfFile, setPdfFile] = useState(null);
  const [originalPdfBytes, setOriginalPdfBytes] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pages, setPages] = useState([]);
  const [resultPdfUrl, setResultPdfUrl] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setPdfFile(file);
      setResultPdfUrl(null);
      setIsProcessing(true);
      setProgress(10);
      
      try {
        const arrayBuffer = await file.arrayBuffer();
        setOriginalPdfBytes(arrayBuffer);
        
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const numPages = pdf.numPages;
        
        if (numPages > 150) {
          setError(lang === 'ar' ? 'عذراً، لا يمكن معالجة أكثر من 150 صفحة في المرة الواحدة' : 'Sorry, maximum limit is 150 pages at once');
          setIsProcessing(false);
          return;
        }

        const extractedPages = [];

        for (let i = 1; i <= numPages; i++) {
          setProgress(10 + Math.round(((i - 1) / numPages) * 80));
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 0.5 }); // Low scale for faster thumbnails
          
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          await page.render({ canvasContext: context, viewport: viewport }).promise;
          
          const url = canvas.toDataURL('image/jpeg', 0.8);
          extractedPages.push({ id: `page-${i}-${Date.now()}`, originalIndex: i - 1, url });
        }

        setPages(extractedPages);
        setProgress(100);
      } catch (err) {
        console.error(err);
        setError(lang === 'ar' ? 'فشل قراءة الملف.' : 'Failed to read file.');
        setPdfFile(null);
      } finally {
        setTimeout(() => setIsProcessing(false), 500);
      }
    }
  }, [lang, setError]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
    noClick: !!pdfFile
  });

  const handleDragEnd = (event) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(40);
    const { active, over } = event;
    if (!over) return;

    if (active.id !== over.id) {
      setPages((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
      setResultPdfUrl(null);
    }
  };

  const removePage = (id) => {
    setPages(prev => prev.filter(p => p.id !== id));
    setResultPdfUrl(null);
  };

  const handleGeneratePdf = async () => {
    if (pages.length === 0) {
      setError(lang === 'ar' ? 'يجب أن يحتوي الملف على صفحة واحدة على الأقل' : 'File must contain at least one page');
      return;
    }
    
    setIsProcessing(true);
    setProgress(20);
    
    try {
      const sourcePdf = await PDFDocument.load(originalPdfBytes);
      const newPdf = await PDFDocument.create();
      
      const pageIndicesToCopy = pages.map(p => p.originalIndex);
      const copiedPages = await newPdf.copyPages(sourcePdf, pageIndicesToCopy);
      
      copiedPages.forEach(page => newPdf.addPage(page));
      
      setProgress(80);
      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      setResultPdfUrl(url);
      setProgress(100);
      
      const toast = document.getElementById('success-toast');
      if (toast) { toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 3000); }
      
    } catch (err) {
      console.error(err);
      setError(lang === 'ar' ? 'فشل إنشاء الملف الجديد.' : 'Failed to generate new PDF.');
    } finally {
      setTimeout(() => setIsProcessing(false), 500);
    }
  };

  return (
    <div className="tool-container">
      <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-main)' }}>
          {lang === 'ar' ? 'إعادة ترتيب صفحات PDF' : 'Organize PDF Pages'}
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          {lang === 'ar' ? 'ارفع ملف PDF، اسحب الصفحات لإعادة ترتيبها، واحذف الصفحات غير المرغوب فيها بسهولة.' : 'Upload a PDF, drag pages to reorder them, and delete unwanted pages easily.'}
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
                <FileStack size={20} className="text-primary" />
                <span style={{ fontWeight: '500' }}>{pdfFile.name}</span>
              </div>
              <button className="btn btn-danger" onClick={(e) => { e.stopPropagation(); setPdfFile(null); setPages([]); setResultPdfUrl(null); setOriginalPdfBytes(null); }}>
                <Trash2 size={16} /> {lang === 'ar' ? 'تغيير الملف' : 'Change File'}
              </button>
            </div>
          )}
        </div>
      </div>

      {pages.length > 0 && !resultPdfUrl && (
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
              {lang === 'ar' ? 'اسحب الصفحات للترتيب، أو اضغط سلة المهملات للحذف' : 'Drag pages to reorder, or click trash icon to delete'}
            </p>
            <span className="badge" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
              {pages.length} {lang === 'ar' ? 'صفحة' : 'Pages'}
            </span>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={pages.map(p => p.id)} strategy={rectSortingStrategy}>
              <div className="images-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '1.5rem' }}>
                {pages.map((page, index) => (
                  <SortablePageItem 
                    key={page.id} 
                    id={page.id} 
                    url={page.url} 
                    index={index + 1} 
                    onRemove={() => removePage(page.id)} 
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <button className="btn btn-primary generate-btn" onClick={handleGeneratePdf} disabled={isProcessing}>
               {lang === 'ar' ? 'حفظ الترتيب كملف PDF جديد' : 'Save Order as New PDF'}
            </button>
          </div>
        </div>
      )}

      {resultPdfUrl && (
        <div className="glass-panel result-panel" style={{ padding: '2rem', textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ color: 'var(--success-color)', marginBottom: '1.5rem' }}>
            <Check size={24} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
            {lang === 'ar' ? 'تم إنشاء الملف الجديد بنجاح!' : 'New PDF generated successfully!'}
          </h2>
          <a href={resultPdfUrl} download={`organized-${pdfFile.name}`} className="btn btn-success" style={{ fontSize: '1.2rem', padding: '1rem 2rem' }}>
            <Download size={20} />
            {lang === 'ar' ? 'تحميل الملف الجديد' : 'Download New PDF'}
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
