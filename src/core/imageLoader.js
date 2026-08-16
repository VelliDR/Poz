// src/core/imageLoader.js
import heic2any from 'heic2any'; // Artık hata vermeyecek çünkü Vite çözecek

export async function processImageFile(file, onProgress) {
  if (!file) throw new Error('Dosya seçilmedi.');

  const fileName = (file.name || '').toLowerCase();
  const isHeic = fileName.endsWith('.heic') || fileName.endsWith('.heif') || file.type === 'image/heic';

  let targetBlob = file;

  if (isHeic) {
    if (onProgress) onProgress("HEIC dönüştürülüyor...");
    try {
      const result = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.9 // Kaliteyi koru ama çok ağırlaştırma
      });
      targetBlob = Array.isArray(result) ? result[0] : result;
    } catch (err) {
      console.error("HEIC Dönüştürme hatası:", err);
      throw new Error("HEIC formatı dönüştürülemedi.");
    }
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(targetBlob);
  });
}