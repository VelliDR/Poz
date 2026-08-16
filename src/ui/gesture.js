// src/ui/gesture.js

export function initGestures(touchArea, targetElement) {
  let pointers = [];
  let initialDist = 0;
  let initialScale = 1;
  let currentScale = 1;

  let startPan = { x: 0, y: 0 };
  let currentPan = { x: 0, y: 0 };
  let lastPan = { x: 0, y: 0 };

  touchArea.addEventListener('pointerdown', (e) => {
    pointers.push(e);
    if (pointers.length === 1) {
      startPan = { x: e.clientX - lastPan.x, y: e.clientY - lastPan.y };
    } else if (pointers.length === 2) {
      initialDist = Math.hypot(
        pointers[0].clientX - pointers[1].clientX, 
        pointers[0].clientY - pointers[1].clientY
      );
      initialScale = currentScale;
    }
  });

  touchArea.addEventListener('pointermove', (e) => {
    if (pointers.length === 0) return;
    
    const index = pointers.findIndex(p => p.pointerId === e.pointerId);
    if (index !== -1) pointers[index] = e;

    if (pointers.length === 1) {
      currentPan.x = e.clientX - startPan.x;
      currentPan.y = e.clientY - startPan.y;
      lastPan = { ...currentPan };
      updateTransform();
    } 
    else if (pointers.length === 2) {
      const currentDist = Math.hypot(
        pointers[0].clientX - pointers[1].clientX, 
        pointers[0].clientY - pointers[1].clientY
      );
      currentScale = initialScale * (currentDist / initialDist);
      currentScale = Math.max(0.2, Math.min(currentScale, 5));
      updateTransform();
    }
  });

  const onPointerUp = (e) => {
    pointers = pointers.filter(p => p.pointerId !== e.pointerId);
    if (pointers.length === 1) {
      startPan = { x: pointers[0].clientX - lastPan.x, y: pointers[0].clientY - lastPan.y };
    }
  };

  touchArea.addEventListener('pointerup', onPointerUp);
  touchArea.addEventListener('pointercancel', onPointerUp);

  function updateTransform() {
    requestAnimationFrame(() => {
      targetElement.style.transform = `translate(${currentPan.x}px, ${currentPan.y}px) scale(${currentScale})`;
    });
  }
}