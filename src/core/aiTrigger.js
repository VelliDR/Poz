// src/core/aiTrigger.js
import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

let handLandmarker = null;
let isAiEnabled = false;
let isCountingDown = false;
let animationFrameId = null;
let currentTimer = null;

export async function initAI() {
  if (handLandmarker) return;

  try {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
    
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: import.meta.env.BASE_URL + "models/hand_landmarker.task",
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
    cancelCountdown();
  }
  return isAiEnabled;
}

function isOpenPalm(landmarks) {
  const indexOpen = landmarks[8].y < landmarks[6].y;
  const middleOpen = landmarks[12].y < landmarks[10].y;
  const ringOpen = landmarks[16].y < landmarks[14].y;
  const pinkyOpen = landmarks[20].y < landmarks[18].y;

  return indexOpen && middleOpen && ringOpen && pinkyOpen;
}

export function startAILoop(videoEl, onTrigger) {
  let lastVideoTime = -1;

  async function detectionLoop() {
    if (isAiEnabled && handLandmarker && videoEl.currentTime !== lastVideoTime) {
      lastVideoTime = videoEl.currentTime;
      
      const startTimeMs = performance.now();
      const results = handLandmarker.detectForVideo(videoEl, startTimeMs);

      let hasOpenPalm = false;
      if (results.landmarks && results.landmarks.length > 0) {
        hasOpenPalm = isOpenPalm(results.landmarks[0]);
      }

      // Sadece açık avuç gördüğünde ve şu an sayılmıyorsa başlat
      if (hasOpenPalm && !isCountingDown) {
        startCountdown(onTrigger);
      }
      // DİKKAT: Artık avucu çektiğinde else ile sayacı iptal ETMİYORUZ. 
      // Sayaç bir kez ateşlendiğinde bağımsız olarak 3-2-1 biter ve fotoğrafı çeker.
    }
    animationFrameId = requestAnimationFrame(detectionLoop);
  }

  detectionLoop();
}

function startCountdown(onTrigger) {
  isCountingDown = true;
  const countEl = document.getElementById('aiCountdown');
  if (!countEl) return;

  countEl.classList.add('active');
  
  let count = 3;
  countEl.innerText = count;
  
  countEl.classList.remove('countdown-anim');
  void countEl.offsetWidth; 
  countEl.classList.add('countdown-anim');

  currentTimer = setInterval(() => {
    count--;
    if (count > 0) {
      countEl.innerText = count;
      countEl.classList.remove('countdown-anim');
      void countEl.offsetWidth;
      countEl.classList.add('countdown-anim');
    } else {
      clearInterval(currentTimer);
      currentTimer = null;
      
      countEl.classList.remove('active');
      onTrigger(); // Fotoğrafı çek!
      
      // Çekimden sonra tekrar yeni bir avuç algılamadan önce 2 saniye bekle
      setTimeout(() => { 
        isCountingDown = false; 
      }, 2000);
    }
  }, 1000);
}

function cancelCountdown() {
  if (currentTimer) {
    clearInterval(currentTimer);
    currentTimer = null;
  }
  isCountingDown = false;
  
  const countEl = document.getElementById('aiCountdown');
  if (countEl) {
    countEl.classList.remove('active');
  }
}