import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X, RotateCw, Crop } from 'lucide-react';

const SortableImageItem = ({ id, url, index, onRemove, onRotate, onCrop, rotation, enhanced }) => {
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

  return (
    <div ref={setNodeRef} style={style} className={`image-card ${enhanced ? 'enhanced' : ''}`} {...attributes} {...listeners}>
      <div className="card-actions">
        <button 
          className="action-btn crop" 
          onClick={(e) => {
            e.stopPropagation();
            onCrop();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          title="Crop"
        >
          <Crop size={18} />
        </button>
        <button 
          className="action-btn rotate" 
          onClick={(e) => {
            e.stopPropagation();
            onRotate();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          title="Rotate"
        >
          <RotateCw size={18} />
        </button>
        <button 
          className="action-btn delete" 
          onClick={(e) => {
            e.stopPropagation(); // prevent drag start
            onRemove();
          }}
          onPointerDown={(e) => e.stopPropagation()} // prevent drag start on click for touch devices
          title="Delete"
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
