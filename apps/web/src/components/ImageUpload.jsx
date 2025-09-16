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
  existingImages = [],
  className = '',
  compact = false
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
    <div className={`w-full ${compact ? 'space-y-2' : 'space-y-4'} ${className}`}>
      {/* Upload Area */}
      <div className="space-y-3">
        {/* File Upload */}
        {showFileUpload && (
          <div
            className={`relative border-2 border-dashed rounded-xl transition-all duration-200 ${
              compact ? 'p-4' : 'p-6'
            } ${
              dragActive
                ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 scale-[1.02] shadow-lg'
                : uploading
                ? 'border-purple-300 bg-purple-50'
                : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
            } ${
              images.length >= maxImages ? 'opacity-50 pointer-events-none' : ''
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
              disabled={uploading || images.length >= maxImages}
            />

            <div className={`text-center ${compact ? 'space-y-1' : 'space-y-3'}`}>
              {uploading ? (
                <>
                  <div className="animate-spin w-8 h-8 mx-auto border-4 border-purple-200 border-t-purple-600 rounded-full"></div>
                  <p className="text-purple-600 font-medium">Subiendo imágenes...</p>
                </>
              ) : (
                <>
                  <div className="relative">
                    <Upload className={`${compact ? 'w-6 h-6' : 'w-10 h-10'} mx-auto text-blue-500 transition-transform group-hover:scale-110`} />
                    {dragActive && (
                      <div className="absolute inset-0 animate-ping w-8 h-8 mx-auto bg-blue-400 rounded-full opacity-30"></div>
                    )}
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading || images.length >= maxImages}
                      className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 ${
                        compact ? 'text-sm px-3 py-1.5' : ''
                      }`}
                    >
                      <ImageIcon className="w-4 h-4" />
                      Seleccionar imágenes
                    </button>
                    {!compact && (
                      <p className="text-gray-500 mt-2">
                        o arrastrar y soltar aquí
                      </p>
                    )}
                  </div>
                  <div className={`flex items-center justify-center gap-4 ${compact ? 'text-xs' : 'text-sm'} text-gray-500`}>
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      PNG, JPG, WEBP, GIF
                    </span>
                    <span className="flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-orange-500" />
                      Máx. 10MB
                    </span>
                    <span className={`px-2 py-1 rounded-full ${
                      images.length >= maxImages ? 'bg-red-100 text-red-700' :
                      images.length > maxImages * 0.7 ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {images.length}/{maxImages}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* URL Input */}
        {showUrlInput && images.length < maxImages && (
          <div className="space-y-3">
            {!showUrlForm ? (
              <button
                type="button"
                onClick={() => setShowUrlForm(true)}
                disabled={uploading}
                className={`w-full flex items-center justify-center gap-2 ${
                  compact ? 'py-2 px-3 text-sm' : 'py-3 px-4'
                } border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all disabled:opacity-50 group`}
              >
                <Link2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                <span className="font-medium">Agregar desde URL</span>
              </button>
            ) : (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-blue-700 font-medium">
                    <Link2 className="w-4 h-4" />
                    <span>Agregar imagen desde URL</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input
                        type="url"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="https://ejemplo.com/imagen.jpg"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        disabled={uploading}
                      />
                      {urlInput && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          {uploading ? (
                            <div className="animate-spin w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full"></div>
                          ) : (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleUrlSubmit}
                      disabled={uploading || !urlInput.trim()}
                      className="px-4 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span className="hidden sm:inline">Agregar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowUrlForm(false);
                        setUrlInput('');
                      }}
                      disabled={uploading}
                      className="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-all flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      <span className="hidden sm:inline">Cancelar</span>
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Asegúrate de que la URL termine en .jpg, .png, .gif, .webp o sea de un servicio de imágenes conocido
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload Status */}
      {uploadStatus && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium shadow-sm border-l-4 ${
          uploadStatus.includes('Error') || uploadStatus.includes('❌')
            ? 'bg-red-50 text-red-800 border-red-400'
            : uploadStatus.includes('⚠️')
            ? 'bg-orange-50 text-orange-800 border-orange-400'
            : 'bg-green-50 text-green-800 border-green-400'
        }`}>
          <div className="flex-shrink-0">
            {uploadStatus.includes('Error') || uploadStatus.includes('❌') ? (
              <AlertCircle className="w-5 h-5 text-red-600" />
            ) : uploadStatus.includes('⚠️') ? (
              <AlertCircle className="w-5 h-5 text-orange-600" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-600" />
            )}
          </div>
          <div className="flex-1">
            {uploadStatus}
          </div>
          <button
            onClick={() => setUploadStatus('')}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
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
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-blue-600" />
              Imágenes subidas ({images.length})
            </h4>
            {images.length > 1 && (
              <button
                onClick={() => setImages([])}
                className="text-xs text-red-600 hover:text-red-800 font-medium flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded transition-all"
              >
                <X className="w-3 h-3" />
                Eliminar todas
              </button>
            )}
          </div>
          <div className={`grid gap-4 ${
            compact
              ? 'grid-cols-3 sm:grid-cols-4'
              : images.length === 1
              ? 'grid-cols-1 max-w-sm'
              : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
          }`}>
            {images.map((image, index) => (
              <div key={image.id || index} className="relative group">
                <div className={`${compact ? 'aspect-square' : 'aspect-[4/3]'} rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-200 shadow-sm group-hover:shadow-lg transition-all duration-200`}>
                  <img
                    src={image.url}
                    alt={`Imagen ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=Error&background=f3f4f6&color=6b7280&size=200`;
                    }}
                  />

                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200"></div>
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 hover:scale-110 shadow-lg"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Image info badge */}
                <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                  <div className="bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    {image.source === 'url' ? (
                      <>
                        <Link2 className="w-3 h-3" />
                        <span>URL</span>
                      </>
                    ) : image.source === 'supabase' ? (
                      <>
                        <CheckCircle className="w-3 h-3 text-green-400" />
                        <span>Cloud</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3 text-orange-400" />
                        <span>Local</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Size info */}
                {!compact && image.size && (
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <div className="bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full">
                      {(image.size / 1024 / 1024 > 1)
                        ? `${(image.size / 1024 / 1024).toFixed(1)}MB`
                        : `${(image.size / 1024).toFixed(0)}KB`
                      }
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;