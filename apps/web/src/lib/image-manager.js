// ============= CASIRA Connect - Image Manager =============
// Complete image handling system for all formats

import { supabase } from './supabase-singleton.js';

class ImageManager {
  constructor() {
    this.supportedFormats = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'image/gif',
      'image/svg+xml',
      'image/bmp',
      'image/tiff'
    ];
    
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.compressionQuality = 0.8;
  }

  // Check if file is a valid image
  isValidImage(file) {
    if (!file || !file.type) {
      return { valid: false, error: 'No file provided' };
    }

    if (!this.supportedFormats.includes(file.type.toLowerCase())) {
      return { 
        valid: false, 
        error: `Formato no soportado. Use: ${this.supportedFormats.join(', ')}` 
      };
    }

    if (file.size > this.maxFileSize) {
      return { 
        valid: false, 
        error: `Archivo muy grande. Máximo: ${this.maxFileSize / 1024 / 1024}MB` 
      };
    }

    return { valid: true };
  }

  // Compress image if needed
  async compressImage(file, quality = this.compressionQuality) {
    return new Promise((resolve) => {
      // If file is already small or not compressible, return as is
      if (file.size < 1024 * 1024 || file.type === 'image/svg+xml') {
        resolve(file);
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions (max 1920x1080)
        let { width, height } = img;
        const maxWidth = 1920;
        const maxHeight = 1080;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (compressedBlob) => {
            const compressedFile = new File(
              [compressedBlob], 
              file.name, 
              { type: file.type }
            );
            resolve(compressedFile);
          },
          file.type,
          quality
        );
      };

      img.onerror = () => resolve(file);
      img.src = URL.createObjectURL(file);
    });
  }

  // Convert file to base64 for localStorage
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Convert base64 back to file
  base64ToFile(base64String, filename, mimeType) {
    const byteString = atob(base64String.split(',')[1]);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const uint8Array = new Uint8Array(arrayBuffer);
    
    for (let i = 0; i < byteString.length; i++) {
      uint8Array[i] = byteString.charCodeAt(i);
    }
    
    return new File([arrayBuffer], filename, { type: mimeType });
  }

  // Upload to Supabase Storage
  async uploadToSupabase(file, userId, folder = 'posts') {
    try {
      console.log(`📤 CASIRA: Uploading ${file.name} to Supabase storage`);

      // Validate image
      const validation = this.isValidImage(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Compress if needed
      const compressedFile = await this.compressImage(file);
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop().toLowerCase();
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2);
      const fileName = `${userId}_${timestamp}_${random}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      // Upload to Supabase - try 'activity-images' bucket first, fallback to 'images'
      let data, error;
      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('activity-images')
          .upload(filePath, compressedFile, {
            cacheControl: '3600',
            upsert: false
          });
        data = uploadData;
        error = uploadError;
      } catch (bucketError) {
        console.warn('⚠️ CASIRA: activity-images bucket not found, trying images bucket');
        const { data: fallbackData, error: fallbackError } = await supabase.storage
          .from('images')
          .upload(filePath, compressedFile, {
            cacheControl: '3600',
            upsert: false
          });
        data = fallbackData;
        error = fallbackError;
      }

      if (error) {
        console.error('❌ CASIRA: Supabase upload error:', error);
        throw error;
      }

      // Get public URL from the correct bucket
      let urlData;
      if (data && data.path) {
        // Use the bucket that successfully uploaded
        const bucketName = data.path.includes('activity-images') ? 'activity-images' : 'images';
        urlData = supabase.storage
          .from(bucketName)
          .getPublicUrl(data.path).data;
      } else {
        // Fallback - try to construct URL
        urlData = supabase.storage
          .from('activity-images')
          .getPublicUrl(filePath).data;
      }

      const result = {
        success: true,
        url: urlData.publicUrl,
        path: data.path,
        size: compressedFile.size,
        type: file.type,
        originalSize: file.size,
        compressed: compressedFile.size < file.size
      };

      console.log('✅ CASIRA: Image uploaded successfully:', result);
      return result;

    } catch (error) {
      console.error('❌ CASIRA: Upload to Supabase failed:', error);
      throw error;
    }
  }

  // Save to localStorage as fallback
  async saveToLocalStorage(file, userId, postId) {
    try {
      console.log(`💾 CASIRA: Saving ${file.name} to localStorage`);

      // Validate and compress
      const validation = this.isValidImage(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const compressedFile = await this.compressImage(file);
      const base64 = await this.fileToBase64(compressedFile);

      // Store in localStorage
      const storageKey = `casira-image-${postId || userId}-${Date.now()}`;
      const imageData = {
        id: storageKey,
        base64: base64,
        filename: file.name,
        type: file.type,
        size: compressedFile.size,
        originalSize: file.size,
        userId: userId,
        postId: postId,
        timestamp: new Date().toISOString(),
        compressed: compressedFile.size < file.size
      };

      localStorage.setItem(storageKey, JSON.stringify(imageData));

      // Also save reference in images index
      const imagesIndex = JSON.parse(localStorage.getItem('casira-images-index') || '[]');
      imagesIndex.push({
        id: storageKey,
        userId: userId,
        postId: postId,
        filename: file.name,
        type: file.type,
        size: compressedFile.size,
        timestamp: imageData.timestamp
      });
      localStorage.setItem('casira-images-index', JSON.stringify(imagesIndex));

      const result = {
        success: true,
        url: base64, // For localStorage, the base64 IS the URL
        id: storageKey,
        size: compressedFile.size,
        type: file.type,
        originalSize: file.size,
        compressed: compressedFile.size < file.size
      };

      console.log('✅ CASIRA: Image saved to localStorage:', result);
      return result;

    } catch (error) {
      console.error('❌ CASIRA: Save to localStorage failed:', error);
      throw error;
    }
  }

  // Validate URL format
  isValidImageUrl(url) {
    if (!url || typeof url !== 'string') {
      return { valid: false, error: 'URL no válida' };
    }

    try {
      new URL(url);
    } catch {
      return { valid: false, error: 'Formato de URL inválido' };
    }

    // Check for common image extensions in URL
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)(\?.*)?$/i;
    const hasImageExtension = imageExtensions.test(url);
    
    // Check for common image hosting domains
    const imageHosts = [
      'imgur.com', 'i.imgur.com',
      'unsplash.com', 'images.unsplash.com',
      'pixabay.com', 'cdn.pixabay.com',
      'pexels.com', 'images.pexels.com',
      'googleusercontent.com',
      'githubusercontent.com',
      'vercel.sh', 'vercel.app',
      'supabase.co',
      'cloudinary.com',
      'amazonaws.com',
      'ui-avatars.com',
      'dicebear.com'
    ];
    
    const isFromImageHost = imageHosts.some(host => url.includes(host));
    
    if (!hasImageExtension && !isFromImageHost) {
      return { 
        valid: false, 
        error: 'URL debe ser de una imagen válida o de un host de imágenes conocido' 
      };
    }

    return { valid: true };
  }

  // Process URL image (validate and optionally proxy)
  async processImageUrl(url, userId, postId = null) {
    console.log(`🔗 CASIRA: Processing image URL: ${url}`);

    try {
      // Validate URL
      const validation = this.isValidImageUrl(url);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Test if image loads
      const imageExists = await this.testImageUrl(url);
      if (!imageExists) {
        throw new Error('La imagen en la URL no se puede cargar');
      }

      // Save URL reference in localStorage for tracking
      const urlData = {
        id: `url-image-${Date.now()}-${Math.random().toString(36).substring(2)}`,
        url: url,
        type: 'url',
        userId: userId,
        postId: postId,
        timestamp: new Date().toISOString(),
        validated: true
      };

      // Add to images index
      const imagesIndex = JSON.parse(localStorage.getItem('casira-images-index') || '[]');
      imagesIndex.push(urlData);
      localStorage.setItem('casira-images-index', JSON.stringify(imagesIndex));

      const result = {
        success: true,
        url: url,
        id: urlData.id,
        type: 'url',
        source: 'external',
        validated: true
      };

      console.log('✅ CASIRA: URL image processed successfully:', result);
      return result;

    } catch (error) {
      console.error('❌ CASIRA: URL processing failed:', error);
      throw error;
    }
  }

  // Test if image URL is accessible
  testImageUrl(url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
      
      // Timeout after 10 seconds
      setTimeout(() => resolve(false), 10000);
    });
  }

  // Universal image handler (files OR URLs)
  async handleImage(input, userId, postId = null, folder = 'posts') {
    console.log('🖼️ CASIRA: Starting universal image handling');

    // If input is a string, treat as URL
    if (typeof input === 'string') {
      return await this.processImageUrl(input, userId, postId);
    }

    // If input is a File object, upload it
    if (input instanceof File) {
      return await this.uploadImage(input, userId, postId, folder);
    }

    throw new Error('Input debe ser un archivo (File) o una URL (string)');
  }

  // Hybrid upload (try Supabase first, fallback to localStorage)
  async uploadImage(file, userId, postId = null, folder = 'posts') {
    console.log(`🖼️ CASIRA: Starting hybrid image upload for ${file.name}`);

    try {
      // Try Supabase first
      const supabaseResult = await this.uploadToSupabase(file, userId, folder);
      console.log('✅ CASIRA: Image uploaded to Supabase successfully');
      return { ...supabaseResult, source: 'supabase' };

    } catch (supabaseError) {
      console.warn('⚠️ CASIRA: Supabase upload failed, trying localStorage:', supabaseError.message);
      
      try {
        // Fallback to localStorage
        const localResult = await this.saveToLocalStorage(file, userId, postId);
        console.log('✅ CASIRA: Image saved to localStorage successfully');
        return { ...localResult, source: 'localStorage' };

      } catch (localError) {
        console.error('❌ CASIRA: Both Supabase and localStorage failed');
        throw new Error(`Upload failed: Supabase (${supabaseError.message}), localStorage (${localError.message})`);
      }
    }
  }

  // Get image from localStorage
  getImageFromLocalStorage(imageId) {
    try {
      const imageData = localStorage.getItem(imageId);
      if (!imageData) return null;
      
      const parsed = JSON.parse(imageData);
      return parsed.base64;
    } catch (error) {
      console.error('❌ CASIRA: Error getting image from localStorage:', error);
      return null;
    }
  }

  // Delete image
  async deleteImage(imageUrl, imagePath = null) {
    try {
      // If it's a Supabase URL, delete from Supabase
      if (imageUrl.includes('supabase.co') && imagePath) {
        const { error } = await supabase.storage
          .from('images')
          .remove([imagePath]);
          
        if (error) {
          console.error('❌ CASIRA: Error deleting from Supabase:', error);
        } else {
          console.log('✅ CASIRA: Image deleted from Supabase');
        }
      }
      
      // If it's a localStorage reference, delete from localStorage
      if (imageUrl.startsWith('casira-image-')) {
        localStorage.removeItem(imageUrl);
        
        // Remove from index
        const imagesIndex = JSON.parse(localStorage.getItem('casira-images-index') || '[]');
        const updatedIndex = imagesIndex.filter(img => img.id !== imageUrl);
        localStorage.setItem('casira-images-index', JSON.stringify(updatedIndex));
        
        console.log('✅ CASIRA: Image deleted from localStorage');
      }
      
      return true;
    } catch (error) {
      console.error('❌ CASIRA: Error deleting image:', error);
      return false;
    }
  }

  // Get all user images
  getUserImages(userId) {
    try {
      const imagesIndex = JSON.parse(localStorage.getItem('casira-images-index') || '[]');
      return imagesIndex.filter(img => img.userId === userId);
    } catch (error) {
      console.error('❌ CASIRA: Error getting user images:', error);
      return [];
    }
  }

  // Clean up old images (older than 30 days)
  cleanupOldImages() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const imagesIndex = JSON.parse(localStorage.getItem('casira-images-index') || '[]');
      const validImages = [];
      let deletedCount = 0;
      
      imagesIndex.forEach(img => {
        const imageDate = new Date(img.timestamp);
        if (imageDate > thirtyDaysAgo) {
          validImages.push(img);
        } else {
          // Delete old image
          localStorage.removeItem(img.id);
          deletedCount++;
        }
      });
      
      localStorage.setItem('casira-images-index', JSON.stringify(validImages));
      
      if (deletedCount > 0) {
        console.log(`🧹 CASIRA: Cleaned up ${deletedCount} old images`);
      }
      
      return deletedCount;
    } catch (error) {
      console.error('❌ CASIRA: Error during cleanup:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const imageManager = new ImageManager();

// Convenience functions
export const handleImage = (input, userId, postId, folder) => 
  imageManager.handleImage(input, userId, postId, folder);

export const uploadImage = (file, userId, postId, folder) => 
  imageManager.uploadImage(file, userId, postId, folder);

export const processImageUrl = (url, userId, postId) =>
  imageManager.processImageUrl(url, userId, postId);
  
export const isValidImage = (file) => imageManager.isValidImage(file);
export const isValidImageUrl = (url) => imageManager.isValidImageUrl(url);
export const testImageUrl = (url) => imageManager.testImageUrl(url);
export const deleteImage = (url, path) => imageManager.deleteImage(url, path);
export const getUserImages = (userId) => imageManager.getUserImages(userId);
export const cleanupOldImages = () => imageManager.cleanupOldImages();

// Auto cleanup on load
if (typeof window !== 'undefined') {
  // Clean up old images when the module loads
  setTimeout(() => {
    imageManager.cleanupOldImages();
  }, 5000);
}

export default imageManager;