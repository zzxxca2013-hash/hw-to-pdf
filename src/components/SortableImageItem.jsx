import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X, RotateCw } from 'lucide-react';

const SortableImageItem = ({ id, url, index, onRemove, onRotate, rotation, enhanced }) => {
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
      <button 
        className="delete-btn" 
        onClick={(e) => {
          e.stopPropagation(); // prevent drag start
          onRemove();
        }}
        onPointerDown={(e) => e.stopPropagation()} // prevent drag start on click for touch devices
      >
        <X size={16} />
      </button>
      <button 
        className="rotate-btn" 
        onClick={(e) => {
          e.stopPropagation();
          onRotate();
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <RotateCw size={16} />
      </button>
      <span className="badge">{index}</span>
      <img src={url} alt={`Homework page ${index}`} draggable={false} style={{ transform: `rotate(${rotation || 0}deg)` }} />
    </div>
  );
};

export default SortableImageItem;
