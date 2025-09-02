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
  async uploadImage(file, userId, activityId) {
    try {
      // Initialize bucket first
      await this.initializeBucket()
      
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/${activityId}/${Date.now()}.${fileExt}`
      
      const { data, error } = await supabase.storage
        .from('images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })
      
      if (error) {
        throw error
      }
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
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
        .from('images')
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
      .from('images')
      .getPublicUrl(fileName)
    
    return data.publicUrl
  }
}