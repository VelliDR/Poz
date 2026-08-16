// src/core/captureEngine.js

/**
 * Kamera sensöründen gelen orijinal çözünürlükteki kareyi yakalar.
 * @param {HTMLVideoElement} videoEl - Kamera akışının olduğu video etiketi
 * @param {boolean} isFrontCamera - Ön kamera açıksa görüntüyü aynadan (ters) kurtarır
 * @returns {string} - Yüksek çözünürlüklü JPEG formatında Data URL
 */
export function takeHighResPhoto(videoEl, isFrontCamera) {
  // Kameranın sensöründen gelen gerçek çözünürlüğü al (Ekrandaki CSS boyutunu değil!)
  const width = videoEl.videoWidth;
  const height = videoEl.videoHeight;
  
  if (!width || !height) {
    console.error("Kamera akışı henüz hazır değil.");
    return null;
  }

  // Geçici bir arka plan tuvali (canvas) oluştur
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Ön kamera (Selfie) düzeltmesi: 
  // Ekranda ayna gibi görünür ama dosyaya kaydedilirken düzeltilmesi gerekir.
  if (isFrontCamera) {
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
  }

  // Kameradaki o anki kareyi tuvale yüksek kalitede çizdir
  ctx.drawImage(videoEl, 0, 0, width, height);

  // Kalite kaybı olmadan %100 kaliteyle JPEG olarak dışa aktar
  return canvas.toDataURL('image/jpeg', 1.0);
}