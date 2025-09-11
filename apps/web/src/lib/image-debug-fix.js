// ============= CASIRA Connect - Image Debug & Fix =============
// Fix image loading issues and provide fallbacks

console.log('🖼️ CASIRA: Loading Image Debug & Fix');

// List of fallback avatar generators
const avatarFallbacks = [
  (name, email) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name || email)}&background=random`,
  (name, email) => `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || email)}`,
  (name, email) => `https://avatar.vercel.sh/${encodeURIComponent(email)}`,
  () => '/default-avatar.png'
];

// Function to test if an image URL loads
function testImageUrl(url, timeout = 5000) {
  return new Promise((resolve) => {
    const img = new Image();
    
    const timer = setTimeout(() => {
      resolve(false);
    }, timeout);
    
    img.onload = () => {
      clearTimeout(timer);
      resolve(true);
    };
    
    img.onerror = () => {
      clearTimeout(timer);
      resolve(false);
    };
    
    img.src = url;
  });
}

// Function to get working avatar URL
async function getWorkingAvatarUrl(originalUrl, userName, userEmail) {
  // If no original URL, go straight to fallbacks
  if (!originalUrl) {
    console.log('🖼️ CASIRA: No original avatar URL, using fallbacks');
    return await getFirstWorkingFallback(userName, userEmail);
  }
  
  // Test original URL
  console.log('🔍 CASIRA: Testing original avatar URL:', originalUrl);
  const works = await testImageUrl(originalUrl);
  
  if (works) {
    console.log('✅ CASIRA: Original avatar URL works');
    return originalUrl;
  }
  
  console.log('❌ CASIRA: Original avatar URL failed, trying fallbacks');
  return await getFirstWorkingFallback(userName, userEmail);
}

// Get first working fallback
async function getFirstWorkingFallback(userName, userEmail) {
  for (let i = 0; i < avatarFallbacks.length; i++) {
    const fallbackUrl = avatarFallbacks[i](userName, userEmail);
    console.log(`🔄 CASIRA: Testing fallback ${i + 1}:`, fallbackUrl);
    
    const works = await testImageUrl(fallbackUrl);
    if (works) {
      console.log(`✅ CASIRA: Fallback ${i + 1} works:`, fallbackUrl);
      return fallbackUrl;
    }
  }
  
  // If all fail, return the last one (default avatar)
  console.log('⚠️ CASIRA: All fallbacks failed, using default');
  return avatarFallbacks[avatarFallbacks.length - 1]();
}

// Function to fix all images on page
async function fixImagesOnPage() {
  console.log('🔧 CASIRA: Fixing all images on page');
  
  const images = document.querySelectorAll('img');
  let fixedCount = 0;
  
  for (const img of images) {
    // Skip if already processed
    if (img.dataset.casiraFixed) continue;
    
    const originalSrc = img.src;
    const alt = img.alt || '';
    
    // Extract name/email from alt text or data attributes
    const userName = img.dataset.userName || alt;
    const userEmail = img.dataset.userEmail || '';
    
    // Test current src
    const works = await testImageUrl(originalSrc);
    
    if (!works) {
      console.log('🔧 CASIRA: Fixing broken image:', originalSrc);
      
      // Get working URL
      const workingUrl = await getWorkingAvatarUrl(null, userName, userEmail);
      
      // Update image
      img.src = workingUrl;
      img.dataset.casiraFixed = 'true';
      fixedCount++;
      
      console.log('✅ CASIRA: Fixed image with:', workingUrl);
    } else {
      img.dataset.casiraFixed = 'true';
    }
  }
  
  console.log(`🎉 CASIRA: Fixed ${fixedCount} images on page`);
}

// Function to create better error handling for images
function enhanceImageErrorHandling() {
  // Add global error handler for images
  document.addEventListener('error', async (event) => {
    if (event.target.tagName === 'IMG') {
      const img = event.target;
      
      // Skip if already trying to fix
      if (img.dataset.casiraFixing) return;
      img.dataset.casiraFixing = 'true';
      
      console.log('🖼️ CASIRA: Image failed to load:', img.src);
      
      const userName = img.dataset.userName || img.alt || '';
      const userEmail = img.dataset.userEmail || '';
      
      // Get working fallback
      const workingUrl = await getWorkingAvatarUrl(null, userName, userEmail);
      
      // Update image
      img.src = workingUrl;
      img.dataset.casiraFixed = 'true';
      delete img.dataset.casiraFixing;
      
      console.log('✅ CASIRA: Replaced failed image with:', workingUrl);
    }
  }, true);
  
  console.log('✅ CASIRA: Enhanced image error handling enabled');
}

// Auto-fix images when DOM loads
function initImageFixes() {
  console.log('🚀 CASIRA: Initializing image fixes');
  
  enhanceImageErrorHandling();
  
  // Fix images after DOM loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(fixImagesOnPage, 1000);
    });
  } else {
    setTimeout(fixImagesOnPage, 1000);
  }
  
  // Periodically check for new images
  setInterval(fixImagesOnPage, 10000); // Every 10 seconds
  
  console.log('✅ CASIRA: Image fixes initialized');
}

// Apply fixes immediately
initImageFixes();

// Export functions for manual use
window.CASIRA_IMAGE_FIX = {
  testImageUrl,
  getWorkingAvatarUrl,
  fixImagesOnPage,
  enhanceImageErrorHandling
};

console.log('🖼️ CASIRA: Image Debug & Fix loaded successfully');