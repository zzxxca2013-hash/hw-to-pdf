import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { translations } from '../translations';
import { X, RotateCw, Crop } from 'lucide-react';

const SortableImageItem = ({ id, url, index, onRemove, onRotate, onCrop, rotation, enhanced, scanner }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 'auto',
  };
  const t = translations.en;

  return (
    <div ref={setNodeRef} style={style} className={`image-card ${enhanced ? 'enhanced' : ''} ${scanner ? 'scanner' : ''}`} {...attributes} {...listeners}>
      <div className="card-actions">
        <button 
          className="action-btn crop" 
          onClick={(e) => { e.stopPropagation(); onCrop(); }}
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          title={t.cropImage}
        >
          <Crop size={18} />
        </button>
        <button 
          className="action-btn rotate" 
          onClick={(e) => { e.stopPropagation(); onRotate(); }}
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          title={t.rotateImage}
        >
          <RotateCw size={18} />
        </button>
        <button 
          className="action-btn delete" 
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          title={t.removeFile}
        >
          <X size={18} />
        </button>
      </div>
      <span className="badge">{index}</span>
      <img src={url} alt={`Homework page ${index}`} draggable={false} style={{ transform: `rotate(${rotation || 0}deg)` }} />
    </div>
  );
};

export default SortableImageItem;
