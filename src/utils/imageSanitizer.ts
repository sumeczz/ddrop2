/**
 * Sanitizes image by drawing onto an HTML5 Canvas.
 * This completely strips all EXIF metadata (GPS coordinates, camera model, date taken, serial number).
 * Also compresses the image to a lightweight format (< 800 KB typically).
 */
export async function sanitizeAndCompressImage(file: File): Promise<{ dataUrl: string; sizeBytes: number }> {
  // Check 5MB limit
  const MAX_FILE_BYTES = 5 * 1024 * 1024;
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(`Soubor přesahuje maximální povolenou velikost 5 MB (${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
  }

  // Validate mime type
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Podporovány jsou pouze formáty JPG, PNG nebo WEBP.');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Nepodařilo se přečíst soubor.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Chyba při dekódování obrázku.'));
      img.onload = () => {
        try {
          const maxDimension = 1280;
          let width = img.width;
          let height = img.height;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return reject(new Error('Nelze inicializovat Canvas kontext.'));
          }

          // Draw image to canvas - purely pixel data, EXIF is stripped
          ctx.drawImage(img, 0, 0, width, height);

          // Export as JPEG with 0.82 quality
          const sanitizedDataUrl = canvas.toDataURL('image/jpeg', 0.82);

          // Calculate approximate byte size of base64
          const base64Length = sanitizedDataUrl.length - (sanitizedDataUrl.indexOf(',') + 1);
          const sizeBytes = Math.round((base64Length * 3) / 4);

          resolve({
            dataUrl: sanitizedDataUrl,
            sizeBytes,
          });
        } catch (err) {
          reject(err);
        }
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}
