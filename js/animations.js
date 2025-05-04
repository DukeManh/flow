// Page load animations for the Flow State app

// Initialize animations
export function initAnimations() {
  // Get all cards to animate
  const cards = document.querySelectorAll('.card');
  
  // Apply staggered animations to cards
  cards.forEach((card, index) => {
    // Apply different animation styles to alternate cards for more dynamic effect
    if (index % 2 === 0) {
      card.classList.add('animate-fade-in-down');
    } else {
      card.classList.add('animate-fade-in-up');
    }
    
    // Add staggered delay based on index
    card.classList.add(`delay-${(index + 1) * 100}`);
  });
  
  // Animate header with a different effect
  const header = document.querySelector('.header');
  if (header) {
    header.classList.add('animate-fade-in-down');
    header.classList.add('delay-100');
  }
  
  // Animate specific elements on focus mode page
  const focusContainer = document.querySelector('.focus-container');
  if (focusContainer) {
    focusContainer.classList.add('animate-scale-in');
    focusContainer.classList.add('delay-200');
  }
}

// Remove animations after they've completed
export function cleanupAnimations() {
  // Wait for animations to complete
  setTimeout(() => {
    const animatedElements = document.querySelectorAll(
      '.animate-fade-in-down, .animate-fade-in-up, .animate-scale-in'
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
        'delay-100', 'delay-200', 'delay-300', 
        'delay-400', 'delay-500', 'delay-600',
        'delay-700', 'delay-800'
      );
    });
  }, 2000); // Wait 2 seconds for all animations to complete
}