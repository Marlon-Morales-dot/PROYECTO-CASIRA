// ============= CASIRA Connect - Universal Image Upload Component =============
import React, { useState, useRef } from 'react';
import { Upload, Link2, X, Image as ImageIcon, AlertCircle, CheckCircle } from 'lucide-react';
import { handleImage, isValidImage, isValidImageUrl } from '../lib/image-manager.js';

const ImageUpload = ({ 
  onImageUploaded, 
  userId, 
  postId = null, 
  folder = 'posts',
  maxImages = 5,
  showUrlInput = true,
  showFileUpload = true,
  existingImages = []
}) => {
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState(existingImages);
  const [dragActive, setDragActive] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlForm, setShowUrlForm] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileSelect = async (files) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadStatus('Subiendo imágenes...');
    
    try {
      const newImages = [];
      
      for (const file of files) {
        if (images.length + newImages.length >= maxImages) {
          setUploadStatus(`Máximo ${maxImages} imágenes permitidas`);
          break;
        }

        // Validate file
        const validation = isValidImage(file);
        if (!validation.valid) {
          setUploadStatus(`Error: ${validation.error}`);
          continue;
        }

        try {
          const result = await handleImage(file, userId, postId, folder);
          newImages.push(result);
          setUploadStatus(`✅ ${file.name} subida exitosamente`);
        } catch (error) {
          console.error('Error uploading file:', error);
          setUploadStatus(`❌ Error subiendo ${file.name}: ${error.message}`);
        }
      }

      if (newImages.length > 0) {
        const updatedImages = [...images, ...newImages];
        setImages(updatedImages);
        if (onImageUploaded) {
          onImageUploaded(updatedImages);
        }
        setUploadStatus(`✅ ${newImages.length} imagen(es) subida(s) exitosamente`);
      }

    } catch (error) {
      console.error('Error in file upload:', error);
      setUploadStatus(`❌ Error: ${error.message}`);
    } finally {
      setUploading(false);
      setTimeout(() => setUploadStatus(''), 3000);
    }
  };

  // Handle URL submission
  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return;

    setUploading(true);
    setUploadStatus('Procesando URL...');

    try {
      // Validate URL
      const validation = isValidImageUrl(urlInput);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      if (images.length >= maxImages) {
        throw new Error(`Máximo ${maxImages} imágenes permitidas`);
      }

      const result = await handleImage(urlInput, userId, postId, folder);
      const updatedImages = [...images, result];
      setImages(updatedImages);
      
      if (onImageUploaded) {
        onImageUploaded(updatedImages);
      }

      setUrlInput('');
      setShowUrlForm(false);
      setUploadStatus('✅ URL procesada exitosamente');

    } catch (error) {
      console.error('Error processing URL:', error);
      setUploadStatus(`❌ Error: ${error.message}`);
    } finally {
      setUploading(false);
      setTimeout(() => setUploadStatus(''), 3000);
    }
  };

  // Handle drag and drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(Array.from(e.dataTransfer.files));
    }
  };

  // Remove image
  const removeImage = (index) => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
    if (onImageUploaded) {
      onImageUploaded(updatedImages);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Upload Area */}
      <div className="space-y-3">
        {/* File Upload */}
        {showFileUpload && (
          <div
            className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleFileSelect(Array.from(e.target.files))}
              className="hidden"
            />
            
            <div className="space-y-2">
              <Upload className="w-8 h-8 mx-auto text-gray-400" />
              <div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                >
                  Seleccionar archivos
                </button>
                <span className="text-gray-500"> o arrastrar aquí</span>
              </div>
              <p className="text-xs text-gray-500">
                PNG, JPG, WEBP, GIF hasta 10MB ({images.length}/{maxImages})
              </p>
            </div>
          </div>
        )}

        {/* URL Input */}
        {showUrlInput && (
          <div className="space-y-2">
            {!showUrlForm ? (
              <button
                type="button"
                onClick={() => setShowUrlForm(true)}
                disabled={uploading}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <Link2 className="w-4 h-4" />
                Agregar imagen desde URL
              </button>
            ) : (
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={uploading}
                />
                <button
                  type="button"
                  onClick={handleUrlSubmit}
                  disabled={uploading || !urlInput.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  ✅
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUrlForm(false);
                    setUrlInput('');
                  }}
                  disabled={uploading}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50"
                >
                  ❌
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload Status */}
      {uploadStatus && (
        <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
          uploadStatus.includes('Error') || uploadStatus.includes('❌')
            ? 'bg-red-50 text-red-700 border border-red-200'
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {uploadStatus.includes('Error') || uploadStatus.includes('❌') ? (
            <AlertCircle className="w-4 h-4" />
          ) : (
            <CheckCircle className="w-4 h-4" />
          )}
          {uploadStatus}
        </div>
      )}

      {/* Loading State */}
      {uploading && (
        <div className="flex items-center justify-center gap-2 py-4">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-gray-600">Procesando...</span>
        </div>
      )}

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            Imágenes ({images.length})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {images.map((image, index) => (
              <div key={image.id || index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border">
                  <img
                    src={image.url}
                    alt={`Imagen ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=Error&background=f3f4f6&color=6b7280&size=200`;
                    }}
                  />
                </div>
                
                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
                
                {/* Image info */}
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-1">
                    <ImageIcon className="w-3 h-3" />
                    <span className="truncate">
                      {image.source === 'url' ? 'URL' : 
                       image.source === 'supabase' ? 'Supabase' : 'Local'}
                    </span>
                    {image.size && (
                      <span className="ml-auto">
                        {(image.size / 1024).toFixed(0)}KB
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;