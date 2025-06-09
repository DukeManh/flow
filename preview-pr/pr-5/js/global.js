// Add touch-friendly enhancements
document.addEventListener('DOMContentLoaded', function () {
  // Add active state for touch feedback
  const buttons = document.querySelectorAll('button');
  buttons.forEach(button => {
    button.addEventListener('touchstart', function () {
      this.style.opacity = '0.7';
    });
    button.addEventListener('touchend', function () {
      this.style.opacity = '1';
    });
  });

  // Prevent zoom on double-tap for iOS
  let lastTouchEnd = 0;
  document.addEventListener('touchend', function (event) {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  }, false);
});