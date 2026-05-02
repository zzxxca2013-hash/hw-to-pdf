import React, { useState, useRef } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { X, Check } from 'lucide-react';

function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

const ImageCropper = ({ imageUrl, onCropComplete, onCancel, t }) => {
  const [crop, setCrop] = useState();
  const imgRef = useRef(null);

  const onImageLoad = (e) => {
    const { width, height } = e.currentTarget;
    // Default crop taking 90% of the image, centered
    setCrop(centerAspectCrop(width, height, width / height));
  };

  const handleApplyCrop = () => {
    if (!imgRef.current || !crop || !crop.width || !crop.height) {
      onCancel();
      return;
    }

    const canvas = document.createElement('canvas');
    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
    
    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(
      imgRef.current,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY
    );

    const base64Image = canvas.toDataURL('image/jpeg', 1.0);
    onCropComplete(base64Image);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel">
        <div className="modal-header">
          <h3>{t.cropImage}</h3>
          <button className="icon-button" onClick={onCancel}>
            <X size={20} />
          </button>
        </div>
        
        <div className="crop-container">
          <ReactCrop crop={crop} onChange={c => setCrop(c)}>
            <img 
              ref={imgRef}
              src={imageUrl} 
              alt="Crop" 
              onLoad={onImageLoad}
              style={{ maxHeight: '60vh', maxWidth: '100%', objectFit: 'contain' }}
            />
          </ReactCrop>
        </div>
        
        <div className="modal-actions">
          <button className="btn btn-danger" onClick={onCancel} style={{ padding: '0.6rem 1rem' }}>
            <X size={18} />
            {t.cancel}
          </button>
          <button className="btn btn-primary" onClick={handleApplyCrop} style={{ padding: '0.6rem 1rem' }}>
            <Check size={18} />
            {t.applyCrop}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;
