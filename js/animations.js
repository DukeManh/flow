// Page load animations for the Flow State app

// Initialize animations
export function initAnimations() {
  // Check if we're in standalone mode
  const isInStandaloneMode = 
    (window.matchMedia('(display-mode: standalone)').matches) || 
    (window.navigator.standalone) || 
    document.referrer.includes('android-app://');
  
  // Check if splash has been shown in this session
  const hasShownSplash = sessionStorage.getItem('flowSplashShown');
  
  // Track if we should skip staggered animations
  const skipStaggered = isInStandaloneMode && !hasShownSplash;
  
  // Set a flag for other parts of the app to check
  window.flowAppHasShownSplash = skipStaggered;
  
  // For cases with a splash screen, we need to wait for it to disappear
  // For cases without a splash screen, we need to wait for the theme to load
  if (!skipStaggered) {
    setTimeout(() => applyEntranceAnimations(false), 100);
  }
}

// Function to apply entrance animations
function applyEntranceAnimations(skipStaggered) {
  // Get all cards to animate
  const cards = document.querySelectorAll('.card');
  
  // Apply animations to cards
  cards.forEach((card, index) => {
    // Apply the same animation to all cards
    card.classList.add('animate-slide-up');
    
    // Only add staggered delays if we're not skipping them
    if (!skipStaggered) {
      // Add progressive delays
      const delayIndex = Math.min(index, 7);
      card.classList.add(`delay-${delayIndex}`);
    }
  });
  
  // Initialize wave animation for Flow logo
  initLogoWaveAnimation();
}

// Remove animations after they've completed
export function cleanupAnimations() {
  // Wait for animations to complete
  setTimeout(() => {
    const animatedElements = document.querySelectorAll(
      '.animate-fade-in-down, .animate-fade-in-up, .animate-scale-in, .animate-slide-up'
    );
    
    // Remove animation classes to prevent issues with other transitions
    animatedElements.forEach(element => {
      element.style.opacity = '1';
      element.style.transform = 'none';
      
      // For performance reasons, remove the animation classes
      element.classList.remove(
        'animate-fade-in-down', 
        'animate-fade-in-up', 
        'animate-scale-in',
        'animate-slide-up',
        'delay-100', 'delay-200', 'delay-300', 
        'delay-400', 'delay-500', 'delay-600',
        'delay-700', 'delay-800'
      );
    });
  }, 2000); // Wait 2 seconds for all animations to complete
}

// Default wave parameters
const DEFAULT_WAVES = [
  { color: '#4fb8ff', amplitude: 3, frequency: 0.05, speed: 0.075, phase: 0, opacity: 0.7, yOffset: 15 },
  { color: '#36d1dc', amplitude: 2, frequency: 0.03, speed: 0.06, phase: Math.PI/2, opacity: 0.6, yOffset: 20 },
  { color: '#f5515f', amplitude: 2.5, frequency: 0.06, speed: 0.045, phase: Math.PI, opacity: 0.5, yOffset: 25 },
  { color: '#a8e063', amplitude: 2, frequency: 0.04, speed: 0.09, phase: 3*Math.PI/2, opacity: 0.6, yOffset: 30 },
  { color: '#9966CC', amplitude: 2.8, frequency: 0.07, speed: 0.065, phase: Math.PI/4, opacity: 0.7, yOffset: 35 }
];

// Reusable function to draw a single wave
function drawWave(ctx, wave, time, canvasWidth) {
  const { color, amplitude, frequency, speed, phase, opacity, yOffset } = wave;
  
  ctx.beginPath();
  ctx.moveTo(0, yOffset);
  
  // Use sine waves to create natural wave pattern
  for (let x = 0; x < canvasWidth; x++) {
    // Create wave pattern with time-based animation
    const y = amplitude * Math.sin((x * frequency) + (time * speed) + phase);
    ctx.lineTo(x, yOffset + y);
  }
  
  // Make waves fade out at the ends
  const gradient = ctx.createLinearGradient(0, 0, canvasWidth, 0);
  gradient.addColorStop(0, color + '00'); // Transparent at start
  gradient.addColorStop(0.2, color + 'CC'); // Semi-transparent 
  gradient.addColorStop(0.5, color); // Full color in middle
  gradient.addColorStop(0.8, color + 'CC'); // Semi-transparent
  gradient.addColorStop(1, color + '00'); // Transparent at end
  
  // Set wave style
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 2;
  ctx.globalAlpha = opacity;
  ctx.stroke();
}

// Create a flowing wave animation for the logo
function initLogoWaveAnimation() {
  const logoElement = document.querySelector('.flow-logo');
  if (!logoElement) return;
  
  const canvas = logoElement.querySelector('.wave-canvas');
  if (!canvas) return;
  
  // Get context and set up canvas
  const ctx = canvas.getContext('2d');
  let animationFrame = null;
  let isHovering = false;
  
  // Handle events
  logoElement.addEventListener('mouseenter', () => {
    isHovering = true;
    startAnimation();
  });
  
  logoElement.addEventListener('mouseleave', () => {
    isHovering = false;
    // Let the animation continue for a short while before stopping
    setTimeout(() => {
      if (!isHovering) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }, 800);
  });
  
  // Animation function
  function startAnimation() {
    if (animationFrame) return; // Already running
    
    // Set canvas dimensions based on logo size plus padding
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // Animation loop
    let startTime = null;
    
    function animate(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      
      // Clear canvas for next frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw each wave with time-based animation
      // Apply 1.5x speed increase by using elapsed * 1.5
      DEFAULT_WAVES.forEach(wave => {
        drawWave(ctx, wave, elapsed * 1.5 / 100, canvas.width);
      });
      
      // Continue animation
      animationFrame = requestAnimationFrame(animate);
    }
    
    // Start animation loop
    animationFrame = requestAnimationFrame(animate);
  }
}

// Expose a function to trigger the flow animation programmatically
export function triggerFlowAnimation(duration = 3000) {
  const logoElement = document.querySelector('.flow-logo');
  if (!logoElement) return;
  
  // Manually trigger the hover animation
  const canvas = logoElement.querySelector('.wave-canvas');
  if (!canvas) return;
  
  // Make the canvas visible
  canvas.style.opacity = '1';
  
  // Create a temporary context for animation if needed
  const ctx = canvas.getContext('2d');
  let animationFrame = null;
  
  // Set canvas dimensions
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  
  // Animation loop
  let startTime = null;
  
  function animate(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    
    // Clear canvas for next frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw each wave with time-based animation
    DEFAULT_WAVES.forEach(wave => {
      drawWave(ctx, wave, elapsed * 1.5 / 100, canvas.width);
    });
    
    // Continue animation if we haven't reached the duration
    if (elapsed < duration) {
      animationFrame = requestAnimationFrame(animate);
    } else {
      // End animation after duration
      canvas.style.opacity = '0';
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
  }
  
  // Start animation loop
  if (canvas.style.opacity === '1') {
    animationFrame = requestAnimationFrame(animate);
  }
}