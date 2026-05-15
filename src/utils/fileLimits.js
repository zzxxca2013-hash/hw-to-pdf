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
    maxImageSide: isMobile ? 5000 : 7000,
    maxPdfFileSize: (isMobile ? 40 : 90) * MB,
    maxPdfPages: isMobile ? 80 : 150,
    maxPdfToImagePages: isMobile ? 40 : 100,
    pdfToImageLargeFilePages: isMobile ? 20 : 50,
  };
};

export const bytesToMb = (bytes) => (bytes / MB).toFixed(0);

export const isPdfFile = (file) => (
  file?.type === 'application/pdf' || /\.pdf$/i.test(file?.name || '')
);

export const isAcceptedImageFile = (file) => (
  ['image/jpeg', 'image/png', 'image/webp'].includes(file?.type)
);

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
