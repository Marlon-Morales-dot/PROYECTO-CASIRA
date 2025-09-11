// Supabase configuration and storage utilities
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wlliqmcpiiktcdzwzhdn.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsbGlxbWNwaWlrdGNkend6aGRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NTQ4NjYsImV4cCI6MjA3MTIzMDg2Nn0.of83kjXRw4ZFCi22vTosULBEVEhS6ESX3z2HuTljRjo'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Storage utilities for images
export const storageAPI = {
  // Create bucket if it doesn't exist
  async initializeBucket() {
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets()
      
      if (error) {
        console.error('Error listing buckets:', error)
        return false
      }

      const imagesBucket = buckets.find(bucket => bucket.name === 'images')
      
      if (!imagesBucket) {
        const { data, error: createError } = await supabase.storage.createBucket('images', {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
          fileSizeLimit: 5242880 // 5MB
        })
        
        if (createError) {
          console.error('Error creating bucket:', createError)
          return false
        }
        
        console.log('Images bucket created successfully')
      }
      
      return true
    } catch (error) {
      console.error('Error initializing bucket:', error)
      return false
    }
  },

  // Upload image to storage
  async uploadImage(file, userId, activityId, customFilename = null) {
    try {
      // Skip bucket initialization since bucket already exists
      // await this.initializeBucket()
      
      const fileExt = file.name.split('.').pop()
      // Generate proper activity ID for folder structure
      const finalActivityId = activityId || `temp_${Date.now()}`
      
      // Use custom filename or generate one
      let fileName
      if (customFilename) {
        fileName = `${userId}/${finalActivityId}/${customFilename}`
      } else {
        fileName = `${userId}/${finalActivityId}/${Date.now()}.${fileExt}`
      }
      
      const { data, error } = await supabase.storage
        .from('project-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })
      
      if (error) {
        throw error
      }
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('project-images')
        .getPublicUrl(fileName)
      
      return {
        path: data.path,
        url: publicUrl,
        fileName: fileName
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      throw new Error('Error al subir la imagen: ' + error.message)
    }
  },

  // Delete image from storage
  async deleteImage(fileName) {
    try {
      const { error } = await supabase.storage
        .from('project-images')
        .remove([fileName])
      
      if (error) {
        throw error
      }
      
      return true
    } catch (error) {
      console.error('Error deleting image:', error)
      throw new Error('Error al eliminar la imagen: ' + error.message)
    }
  },

  // Get public URL for image
  getPublicUrl(fileName) {
    const { data } = supabase.storage
      .from('project-images')
      .getPublicUrl(fileName)
    
    return data.publicUrl
  },

  // Validate if image URL is accessible using Image object
  async validateImageUrl(url) {
    return new Promise((resolve) => {
      if (!url || !url.startsWith('http')) {
        resolve(false)
        return
      }

      const img = new Image()
      img.onload = () => {
        console.log('✅ Image URL validated successfully:', url)
        resolve(true)
      }
      img.onerror = () => {
        console.warn('❌ Image URL validation failed:', url)
        resolve(false)
      }
      
      // Set timeout for validation
      setTimeout(() => {
        console.warn('⏰ Image URL validation timeout:', url)
        resolve(false)
      }, 5000)
      
      img.src = url
    })
  },

  // Test and get working image URL
  async getWorkingImageUrl(url, fallbackUrl = '/grupo-canadienses.jpg') {
    try {
      console.log('🔍 Testing image URL:', url)
      const isValid = await this.validateImageUrl(url)
      const finalUrl = isValid ? url : fallbackUrl
      console.log(`📸 Image URL result: ${isValid ? 'VALID' : 'INVALID'} -> Using: ${finalUrl}`)
      return finalUrl
    } catch (error) {
      console.error('Error testing image URL:', error)
      return fallbackUrl
    }
  }
}