const MB = 1024 * 1024;

export const isLikelyMobileDevice = () => (
  typeof window !== 'undefined' &&
  (window.matchMedia('(max-width: 768px)').matches || navigator.hardwareConcurrency <= 4)
);

export const getRuntimeLimits = () => {
  const isMobile = isLikelyMobileDevice();

  return {
    maxImages: isMobile ? 60 : 100,
    maxImageFileSize: (isMobile ? 12 : 25) * MB,
    maxImageSide: isMobile ? 4096 : 6000,
    maxImagePixels: isMobile ? 16_000_000 : 32_000_000,
    maxCanvasPixels: isMobile ? 12_000_000 : 24_000_000,
    maxPdfFileSize: (isMobile ? 40 : 90) * MB,
    maxPdfPages: isMobile ? 80 : 150,
    maxPdfToImagePages: isMobile ? 30 : 80,
    pdfToImageLargeFilePages: isMobile ? 12 : 35,
  };
};

export const bytesToMb = (bytes) => (bytes / MB).toFixed(0);

export const pixelsToMegapixels = (pixels) => (pixels / 1_000_000).toFixed(0);

export const getSafeCanvasScale = (width, height, maxPixels) => {
  const pixels = width * height;
  return pixels > maxPixels ? Math.sqrt(maxPixels / pixels) : 1;
};

export const isPdfFile = (file) => (
  file?.type === 'application/pdf' || /\.pdf$/i.test(file?.name || '')
);

export const isAcceptedImageFile = (file) => (
  ['image/jpeg', 'image/png', 'image/webp'].includes(file?.type)
);

export const isHeicFile = (file) => {
  const name = file?.name || '';
  const type = file?.type || '';
  return /image\/hei[cf]/i.test(type) || /\.(hei[cf])$/i.test(name);
};

export const getPdfErrorMessage = (error, t) => {
  const message = `${error?.name || ''} ${error?.message || ''}`.toLowerCase();

  if (message.includes('password') || message.includes('encrypted')) {
    return t.errorEncryptedPdf;
  }

  if (
    message.includes('invalid') ||
    message.includes('corrupt') ||
    message.includes('malformed') ||
    message.includes('failed to parse') ||
    message.includes('bad xref')
  ) {
    return t.errorCorruptFile;
  }

  return null;
};
