// src/main.js
// =========================================================
// MODÜL İÇE AKTARIMLARI
// =========================================================
import { initCamera, toggleCameraFacing, isFrontCameraActive } from './core/cameraEngine.js';
import { initGestures } from './ui/gesture.js';
import { takeHighResPhoto } from './core/captureEngine.js';
import { toggleAI, startAILoop } from './core/aiTrigger.js';
import { processImageFile } from './core/imageLoader.js';

// =========================================================
// DOM ELEMANLARI
// =========================================================
const videoEl = document.getElementById('cameraFeed');
const ghostImg = document.getElementById('ghostImage');
const imageInput = document.getElementById('imageInput');
const btnGrid = document.getElementById('btnGrid');
const gridOverlay = document.getElementById('gridOverlay');
const btnFlip = document.getElementById('btnFlip');
const btnShutter = document.getElementById('btnShutter');
const btnAiToggle = document.getElementById('btnAiToggle');
const viewfinder = document.querySelector('.viewfinder');

const loadingOverlay = document.getElementById('loadingOverlay');
const loadingText = document.getElementById('loadingText');

// Yükleme Ekranı Kontrolcüleri
function showLoading(msg) {
  if (loadingOverlay) loadingOverlay.classList.remove('hidden');
  if (loadingText) loadingText.innerText = msg || 'İşleniyor...';
}
function hideLoading() {
  if (loadingOverlay) loadingOverlay.classList.add('hidden');
}

// =========================================================
// 1. KAMERAYI BAŞLAT
// =========================================================
initCamera(videoEl);

// =========================================================
// 2. REFERANS GÖRSEL YÜKLEME (HEIC DESTEKLİ)
// =========================================================
imageInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    showLoading('Görsel hazırlanıyor...');
    
    // HEIC Dönüştürme Modülünü Çağır
    const dataUrl = await processImageFile(file, (msg) => {
      showLoading(msg); // Süreç mesajını güncelle (Örn: "HEIC dönüştürülüyor...")
    });
    
    ghostImg.src = dataUrl;
    ghostImg.classList.remove('hidden');
    ghostImg.style.transform = 'translate(0px, 0px) scale(1)'; // Önceki pan/zoom pozisyonunu sıfırla
    
  } catch (error) {
    alert(error.message);
  } finally {
    hideLoading();
  }
});

// =========================================================
// 3. KAMERA YÖNÜ ÇEVİRME
// =========================================================
btnFlip.addEventListener('click', () => {
  toggleCameraFacing(videoEl);
});

// =========================================================
// 4. IZGARA (GRID) SİSTEMİ
// =========================================================
const grids = ['grid-none', 'grid-3x3', 'grid-golden'];
let currentGridIndex = 1;

btnGrid.addEventListener('click', () => {
  gridOverlay.classList.remove(grids[currentGridIndex]);
  currentGridIndex = (currentGridIndex + 1) % grids.length;
  gridOverlay.classList.add(grids[currentGridIndex]);
  
  if (currentGridIndex === 0) btnGrid.classList.remove('active');
  else btnGrid.classList.add('active');
});

// =========================================================
// 5. YATAY KADRAN MOTORU (Şeffaflık)
// =========================================================
function setupDial(options) {
  const { id, displayId, min, max, step, initialValue, format = v => v, onChange } = options;
  const track = document.getElementById(id);
  const display = document.getElementById(displayId);
  if (!track) return;

  let currentValue = initialValue;
  let isDragging = false;
  let startX = 0, accumulatedDelta = 0;

  const updateUI = (val) => {
    if (display) display.innerText = format(val);
    const pixelsPerUnit = 10 / step; 
    track.style.backgroundPosition = `calc(50% + ${-val * pixelsPerUnit}px) bottom, calc(50% + ${-val * pixelsPerUnit}px) bottom`;
  };

  updateUI(currentValue);

  track.addEventListener('pointerdown', (e) => {
    isDragging = true; startX = e.clientX; accumulatedDelta = 0;
    track.setPointerCapture(e.pointerId);
  });

  track.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    accumulatedDelta += (e.clientX - startX);
    startX = e.clientX;

    const stepShift = Math.trunc(accumulatedDelta / 3);
    if (stepShift !== 0) {
      let newValue = currentValue + (stepShift * step);
      if (newValue > max) newValue = max;
      if (newValue < min) newValue = min;

      if (newValue !== currentValue) {
        currentValue = newValue;
        requestAnimationFrame(() => updateUI(currentValue));
        onChange(currentValue);
      }
      accumulatedDelta -= stepShift * 3;
    }
  });

  const stopDrag = (e) => { isDragging = false; try { track.releasePointerCapture(e.pointerId); } catch(err) {} };
  track.addEventListener('pointerup', stopDrag);
  track.addEventListener('pointercancel', stopDrag);
}

setupDial({
  id: 'opacityDial', displayId: 'opacityDisplay',
  min: 0, max: 100, step: 1, initialValue: 50,
  format: (v) => '%' + v,
  onChange: (val) => { ghostImg.style.opacity = val / 100; }
});

// =========================================================
// 6. HARMANLAMA MODLARI (BLEND MODES)
// =========================================================
const blendBtns = document.querySelectorAll('.blend-btn');
blendBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    blendBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    ghostImg.style.mixBlendMode = btn.dataset.mode;
  });
});

// =========================================================
// 7. SÜRÜKLE VE ÇİMDİKLE MOTORU
// =========================================================
initGestures(viewfinder, ghostImg);

// =========================================================
// 8. DEKLANŞÖR (CAPTURE) VE FLAŞ SİSTEMİ
// =========================================================
const flashOverlay = document.createElement('div');
flashOverlay.className = 'flash-overlay';
viewfinder.appendChild(flashOverlay);

const performCapture = () => {
  if (!videoEl.videoWidth) return;

  flashOverlay.classList.remove('flash-active');
  void flashOverlay.offsetWidth; // Animasyon sıfırlama hilesi
  flashOverlay.classList.add('flash-active');

  const isFront = isFrontCameraActive();
  const photoDataUrl = takeHighResPhoto(videoEl, isFront);

  if (photoDataUrl) {
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.download = `Poz-${timestamp}.jpg`;
    link.href = photoDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

btnShutter.addEventListener('click', performCapture);

// =========================================================
// 9. YAPAY ZEKA OTONOM ÇEKİM (ELLER SERBEST)
// =========================================================
btnAiToggle.addEventListener('click', () => {
  const isAiOn = toggleAI(btnAiToggle);
  const statusText = document.querySelector('.top-status');
  
  if (isAiOn) {
    startAILoop(videoEl, performCapture);
    if (statusText) statusText.innerHTML = '<span class="status-dot"></span> AI OTONOM AKTİF';
  } else {
    if (statusText) statusText.innerHTML = '<span class="status-dot" style="background-color: var(--ios-amber);"></span> FAZ 1 : HİZALAMA';
  }
});
// =========================================================
// PWA KURULUM (INSTALL) TETİKLEYİCİSİ
// =========================================================
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  // Tarayıcının varsayılan otomatik mini-bilgi çubuğunu engelle
  e.preventDefault();
  // Olayı daha sonra tetiklemek üzere sakla
  deferredPrompt = e;
  
  console.log('PWA kurulum etkinleştirildi ve yakalandı!');
  
  // İstersen burada ekrandaki gizli bir "Uygulamayı Yükle" butonunu görünür yapabilirsin
  const installBtn = document.getElementById('btnInstallApp');
  if (installBtn) {
    installBtn.classList.remove('hidden');
    installBtn.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`Kullanıcı seçim sonucu: ${outcome}`);
        deferredPrompt = null;
        installBtn.classList.add('hidden');
      }
    });
  }
});

window.addEventListener('appinstalled', () => {
  console.log('Poz başarıyla ana ekrana kuruldu!');
  deferredPrompt = null;
});