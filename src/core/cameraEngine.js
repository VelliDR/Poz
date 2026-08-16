// src/core/cameraEngine.js

let currentStream = null;
let useFrontCamera = false;

export async function initCamera(videoElement) {
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
  }

  const constraints = {
    video: {
      facingMode: useFrontCamera ? 'user' : 'environment',
      width: { ideal: 1920 },
      height: { ideal: 1080 }
    }
  };

  try {
    currentStream = await navigator.mediaDevices.getUserMedia(constraints);
    videoElement.srcObject = currentStream;
  } catch (err) {
    console.error("Kamera erişim hatası:", err);
    alert("Kameraya erişilemedi. Lütfen izinleri kontrol edin.");
  }
}

export function toggleCameraFacing(videoElement) {
  useFrontCamera = !useFrontCamera;
  initCamera(videoElement);
}
// src/core/cameraEngine.js dosyasının en altına eklenecek:
export function isFrontCameraActive() { return useFrontCamera; }