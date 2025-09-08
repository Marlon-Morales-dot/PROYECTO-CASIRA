// ============= CASIRA Connect - Image Upload Demo =============
import React, { useState } from 'react';
import { Image as ImageIcon, TestTube } from 'lucide-react';
import ImageUpload from './ImageUpload.jsx';
import { testImageUrl } from '../lib/image-manager.js';

const ImageUploadDemo = () => {
  const [uploadedImages, setUploadedImages] = useState([]);
  const [testUrl, setTestUrl] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

  // Test URLs for demonstration
  const testUrls = [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
    'https://images.pexels.com/photos/1142950/pexels-photo-1142950.jpeg?w=400',
    'https://i.imgur.com/placeholder400x300.png',
    'https://picsum.photos/400/300',
    'https://via.placeholder.com/400x300/4285f4/ffffff?text=CASIRA+Connect'
  ];

  const handleImagesUploaded = (images) => {
    console.log('📷 Images uploaded:', images);
    setUploadedImages(images);
  };

  const testImageUrlHandler = async (url) => {
    setTesting(true);
    setTestUrl(url);
    setTestResult(null);
    
    try {
      const isValid = await testImageUrl(url);
      setTestResult({
        url,
        valid: isValid,
        message: isValid ? 'URL válida - imagen se puede cargar' : 'URL inválida - imagen no se puede cargar'
      });
    } catch (error) {
      setTestResult({
        url,
        valid: false,
        message: `Error: ${error.message}`
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <ImageIcon className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Sistema de Imágenes CASIRA</h2>
            <p className="text-gray-600">Sube archivos PNG/JPG/WEBP o usa URLs de imágenes</p>
          </div>
        </div>

        {/* Image Upload Component */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">📤 Subir Imágenes</h3>
          <ImageUpload
            onImageUploaded={handleImagesUploaded}
            userId="demo-user"
            postId="demo-post"
            maxImages={10}
            showUrlInput={true}
            showFileUpload={true}
            existingImages={uploadedImages}
          />
        </div>

        {/* Test URLs Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TestTube className="w-5 h-5" />
            🧪 Probar URLs de Imágenes
          </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {testUrls.map((url, index) => (
                <button
                  key={index}
                  onClick={() => testImageUrlHandler(url)}
                  disabled={testing}
                  className="p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg border text-sm disabled:opacity-50 transition-colors"
                >
                  <div className="font-medium text-blue-600 truncate">
                    Test URL {index + 1}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {url}
                  </div>
                </button>
              ))}
            </div>

            {/* Custom URL Test */}
            <div className="flex gap-2">
              <input
                type="url"
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={testing}
              />
              <button
                onClick={() => testImageUrlHandler(testUrl)}
                disabled={testing || !testUrl.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {testing ? '🔄' : '🧪'}
              </button>
            </div>

            {/* Test Result */}
            {testResult && (
              <div className={`p-4 rounded-lg border ${
                testResult.valid 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{testResult.valid ? '✅' : '❌'}</span>
                  <span className="font-medium">{testResult.message}</span>
                </div>
                <div className="text-sm opacity-75 truncate">
                  URL: {testResult.url}
                </div>
                {testResult.valid && (
                  <div className="mt-3">
                    <img
                      src={testResult.url}
                      alt="Test image"
                      className="max-w-xs h-auto rounded border"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Results Display */}
        {uploadedImages.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">📊 Imágenes Procesadas</h3>
            <div className="space-y-4">
              {uploadedImages.map((image, index) => (
                <div key={image.id || index} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    <img
                      src={image.url}
                      alt={`Uploaded ${index + 1}`}
                      className="w-24 h-24 object-cover rounded border"
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=Error&background=f3f4f6&color=6b7280&size=96`;
                      }}
                    />
                    <div className="flex-1 space-y-2">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Fuente:</span>
                          <span className={`ml-2 px-2 py-1 rounded text-xs ${
                            image.source === 'supabase' ? 'bg-green-100 text-green-800' :
                            image.source === 'localStorage' ? 'bg-blue-100 text-blue-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {image.source}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Tipo:</span>
                          <span className="ml-2 text-gray-600">
                            {image.type || (image.source === 'external' ? 'URL externa' : 'Archivo')}
                          </span>
                        </div>
                        {image.size && (
                          <div>
                            <span className="font-medium text-gray-700">Tamaño:</span>
                            <span className="ml-2 text-gray-600">
                              {(image.size / 1024).toFixed(1)}KB
                            </span>
                          </div>
                        )}
                        {image.compressed && (
                          <div>
                            <span className="font-medium text-gray-700">Compresión:</span>
                            <span className="ml-2 text-green-600">
                              ✅ Optimizada
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 font-mono truncate">
                        ID: {image.id}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        URL: {image.url}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Features List */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-blue-900">
            🚀 Características del Sistema de Imágenes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-green-600">✅</span>
                <span>Formatos: PNG, JPG, WEBP, GIF, SVG, BMP, TIFF</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600">✅</span>
                <span>Subida de archivos con drag & drop</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600">✅</span>
                <span>URLs de imágenes externas</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600">✅</span>
                <span>Compresión automática (max 10MB)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600">✅</span>
                <span>Validación de URLs</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-green-600">✅</span>
                <span>Storage híbrido: Supabase + localStorage</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600">✅</span>
                <span>Fallback automático si Supabase falla</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600">✅</span>
                <span>Limpieza automática de imágenes antiguas</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600">✅</span>
                <span>Preview en tiempo real</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600">✅</span>
                <span>Hosts populares: Unsplash, Imgur, Pexels</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageUploadDemo;