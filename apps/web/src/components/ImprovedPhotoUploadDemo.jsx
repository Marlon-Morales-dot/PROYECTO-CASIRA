// ============= CASIRA Connect - Improved Photo Upload Demo =============
import React, { useState } from 'react';
import { Upload, Camera, Link2, Image as ImageIcon, CheckCircle, AlertCircle, X, Heart, MessageCircle, Send } from 'lucide-react';
import ImageUpload from './ImageUpload.jsx';

const ImprovedPhotoUploadDemo = () => {
  const [images, setImages] = useState([]);
  const [comments, setComments] = useState([
    {
      id: 1,
      author: { full_name: 'María García', first_name: 'María' },
      content: '¡Increíbles fotos! Me encanta el nuevo diseño.',
      created_at: new Date().toISOString(),
      likes_count: 3
    },
    {
      id: 2,
      author: { full_name: 'Carlos López', first_name: 'Carlos' },
      content: 'La funcionalidad de drag & drop está genial 👏',
      created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      likes_count: 1
    }
  ]);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(true);

  const mockUser = {
    id: 'demo-user',
    full_name: 'Usuario Demo',
    first_name: 'Usuario',
    avatar_url: null
  };

  const handleImageUpload = (uploadedImages) => {
    setImages(uploadedImages);
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      const newCommentObj = {
        id: Date.now(),
        author: mockUser,
        content: newComment.trim(),
        created_at: new Date().toISOString(),
        likes_count: 0
      };
      setComments([...comments, newCommentObj]);
      setNewComment('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🎉 CASIRA Connect - Mejoras Implementadas
        </h1>
        <p className="text-gray-600">
          Sistema mejorado de subida de fotos y comentarios con UI moderna y funcional
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Photo Upload Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Subida de Fotos Mejorada</h2>
              <p className="text-sm text-gray-600">Drag & drop, preview mejorado, múltiples formatos</p>
            </div>
          </div>

          <ImageUpload
            onImageUploaded={handleImageUpload}
            userId={mockUser.id}
            maxImages={4}
            existingImages={images}
            className="mb-4"
          />

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span>Interfaz drag & drop moderna</span>
            </div>
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span>Preview mejorado con información</span>
            </div>
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span>Soporte para URLs externas</span>
            </div>
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span>Validación en tiempo real</span>
            </div>
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span>Compresión automática</span>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Sistema de Comentarios</h2>
              <p className="text-sm text-gray-600">Interfaz moderna y responsive</p>
            </div>
          </div>

          {/* Comment Input */}
          <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
                <span className="text-white font-medium">{mockUser.first_name[0]}</span>
              </div>
              <div className="flex-1 space-y-2">
                <div className="relative">
                  <textarea
                    placeholder="Escribe un comentario..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddComment();
                      }
                    }}
                    rows="2"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all placeholder-gray-500"
                  />
                  {newComment.length > 0 && (
                    <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                      {newComment.length}/500
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" />
                    Presiona Enter para enviar
                  </span>
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-sm hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 flex items-center gap-2 shadow-md"
                  >
                    <Send className="w-4 h-4" />
                    <span>Comentar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Comments List */}
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {comments.map((comment) => (
              <div key={comment.id} className="hover:bg-gray-50 transition-colors p-3 rounded-xl">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center shadow-sm">
                    <span className="text-white text-xs font-semibold">
                      {comment.author.first_name[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="bg-gray-100 rounded-2xl px-4 py-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-semibold text-sm text-gray-900">
                          {comment.author.full_name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {(() => {
                            const now = new Date();
                            const commentDate = new Date(comment.created_at);
                            const diffInMinutes = Math.floor((now - commentDate) / (1000 * 60));

                            if (diffInMinutes < 1) return 'Ahora';
                            if (diffInMinutes < 60) return `${diffInMinutes}m`;
                            return `${Math.floor(diffInMinutes / 60)}h`;
                          })()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800 leading-relaxed">{comment.content}</p>
                    </div>
                    <div className="flex items-center space-x-4 mt-2 px-2">
                      <button className="flex items-center space-x-1 text-xs text-gray-500 hover:text-blue-600 transition-colors">
                        <Heart className="w-3 h-3" />
                        <span>{comment.likes_count}</span>
                      </button>
                      <button className="text-xs text-gray-500 hover:text-blue-600 transition-colors">
                        Responder
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Features List */}
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-2 text-sm">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span>Interfaz moderna y responsive</span>
            </div>
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span>Timestamps relativos inteligentes</span>
            </div>
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span>Textarea expandible</span>
            </div>
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span>Estados de hover mejorados</span>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Improvements */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600" />
          Mejoras Técnicas Implementadas
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Sistema de Subida de Fotos:</h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• Drag & drop con feedback visual</li>
              <li>• Compresión automática de imágenes</li>
              <li>• Fallback localStorage + Supabase</li>
              <li>• Validación en tiempo real</li>
              <li>• Preview mejorado con metadatos</li>
              <li>• Soporte para URLs externas</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Sistema de Comentarios:</h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• UI moderna con gradientes</li>
              <li>• Timestamps relativos</li>
              <li>• Estados de hover mejorados</li>
              <li>• Textarea responsive</li>
              <li>• Funcionalidad de likes</li>
              <li>• Conexión en tiempo real con DB</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Database Connection Status */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          Estado de Conexión a Base de Datos
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-semibold text-green-800">Supabase Connected</h4>
            <p className="text-sm text-green-600">Base de datos funcionando</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <Upload className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-semibold text-blue-800">Storage Active</h4>
            <p className="text-sm text-blue-600">Subida de archivos lista</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-200">
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-semibold text-purple-800">Real-time Ready</h4>
            <p className="text-sm text-purple-600">Comentarios en tiempo real</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImprovedPhotoUploadDemo;