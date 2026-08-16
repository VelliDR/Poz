// src/core/aiTrigger.js
import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

let handLandmarker = null;
let isAiEnabled = false;
let isCountingDown = false;
let animationFrameId = null;

export async function initAI() {
  if (handLandmarker) return;

  try {
    // Lokal node_modules içindeki wasm dosyalarını kullanır
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
    
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        // Modele artık internetten değil, cihazımızdaki public/models klasöründen erişiyoruz
        modelAssetPath: "/models/hand_landmarker.task",
        delegate: "GPU"
      },
      runningMode: "VIDEO",
      numHands: 1
    });
    console.log("Offline MediaPipe AI Yüklendi!");
  } catch (error) {
    console.error("AI Yükleme Hatası:", error);
    alert("Yapay Zeka başlatılamadı. Hata: " + error.message);
  }
}

export function toggleAI(btnElement) {
  isAiEnabled = !isAiEnabled;
  if (isAiEnabled) {
    btnElement.classList.add('active');
    initAI();
  } else {
    btnElement.classList.remove('active');
  }
  return isAiEnabled;
}

export function startAILoop(videoEl, onTrigger) {
  let lastVideoTime = -1;

  async function detectionLoop() {
    if (isAiEnabled && handLandmarker && !isCountingDown && videoEl.currentTime !== lastVideoTime) {
      lastVideoTime = videoEl.currentTime;
      
      const startTimeMs = performance.now();
      const results = handLandmarker.detectForVideo(videoEl, startTimeMs);

      if (results.landmarks && results.landmarks.length > 0) {
        triggerCountdown(onTrigger);
      }
    }
    animationFrameId = requestAnimationFrame(detectionLoop);
  }

  detectionLoop();
}

// 3 Saniyelik Geri Sayım
function triggerCountdown(onTrigger) {
  isCountingDown = true;
  const countEl = document.getElementById('aiCountdown');
  
  // Eski .hidden komutlarını çöpe atıp, .active ile ekrana çağırıyoruz
  countEl.classList.add('active');
  
  let count = 3;
  countEl.innerText = count;
  
  // Animasyon sıfırlama
  countEl.classList.remove('countdown-anim');
  void countEl.offsetWidth; 
  countEl.classList.add('countdown-anim');

  const timer = setInterval(() => {
    count--;
    if (count > 0) {
      countEl.innerText = count;
      countEl.classList.remove('countdown-anim');
      void countEl.offsetWidth;
      countEl.classList.add('countdown-anim');
    } else {
      clearInterval(timer);
      
      // Süre bittiğinde sayacı tekrar GİZLE
      countEl.classList.remove('active');
      
      // Fotoğrafı çek
      onTrigger(); 
      
      // Çekim bittikten 2 saniye sonra yeni ellere tepki vermeye hazır ol
      setTimeout(() => { isCountingDown = false; }, 2000);
    }
  }, 1000);
}