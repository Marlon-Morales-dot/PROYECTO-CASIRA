// ============= CASIRA Connect - Social Feed Interactivo =============
import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, MessageCircle, Share2, Send, Camera, Image, 
  MoreVertical, Flag, Trash2, Edit, MapPin, Clock,
  User, Star, ThumbsUp, Eye, EyeOff, Calendar 
} from 'lucide-react';
import { postsAPI as supabasePosts, commentsAPI as supabaseComments, storageAPI as supabaseStorage } from '../lib/supabase-singleton.js';

const SocialFeed = ({ user }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  
  // Estados para nuevo post
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    images: [],
    activity_id: null,
    visibility: 'public'
  });
  
  // Estados para comentarios
  const [comments, setComments] = useState({});
  const [showComments, setShowComments] = useState(new Set());
  const [newComment, setNewComment] = useState({});
  
  // Estados para likes
  const [likes, setLikes] = useState({});
  const [userLikes, setUserLikes] = useState(new Set());
  
  // Referencias
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadPosts();
  }, []);

  // ============= CARGAR POSTS =============
  const loadPosts = async () => {
    try {
      setLoading(true);
      console.log('📱 SOCIAL: Loading posts feed...');
      
      const postsData = await supabasePosts.getAllPosts(20);
      setPosts(postsData);
      
      // Cargar likes para cada post
      const likesData = {};
      const userLikesSet = new Set();
      
      for (const post of postsData) {
        try {
          const postLikes = await supabasePosts.getPostLikes(post.id);
          likesData[post.id] = postLikes.length;
          
          // Verificar si el usuario actual ya dio like
          if (user && postLikes.some(like => like.user?.id === user.id)) {
            userLikesSet.add(post.id);
          }
        } catch (error) {
          console.warn(`Warning: Could not load likes for post ${post.id}:`, error);
          likesData[post.id] = post.likes_count || 0;
        }
      }
      
      setLikes(likesData);
      setUserLikes(userLikesSet);
      
      console.log(`✅ SOCIAL: Loaded ${postsData.length} posts`);
    } catch (error) {
      console.error('❌ SOCIAL: Error loading posts:', error);
      // Fallback: mostrar mensaje de error user-friendly
    } finally {
      setLoading(false);
    }
  };

  // ============= CREAR POST =============
  const handleCreatePost = async () => {
    if (!newPost.content.trim()) return;
    
    try {
      setCreating(true);
      console.log('📝 SOCIAL: Creating new post...');
      
      const postData = {
        author_id: user.id,
        title: newPost.title.trim(),
        content: newPost.content.trim(),
        images: newPost.images.length > 0 ? newPost.images : null,
        activity_id: newPost.activity_id,
        visibility: newPost.visibility,
        post_type: 'update'
      };
      
      const createdPost = await supabasePosts.createPost(postData);
      
      // Agregar el post al inicio de la lista
      setPosts(prevPosts => [createdPost, ...prevPosts]);
      setLikes(prevLikes => ({ ...prevLikes, [createdPost.id]: 0 }));
      
      // Resetear formulario
      setNewPost({
        title: '',
        content: '',
        images: [],
        activity_id: null,
        visibility: 'public'
      });
      setShowCreatePost(false);
      
      console.log('✅ SOCIAL: Post created successfully');
    } catch (error) {
      console.error('❌ SOCIAL: Error creating post:', error);
      alert('Error al crear el post: ' + error.message);
    } finally {
      setCreating(false);
    }
  };

  // ============= MANEJAR LIKES =============
  const handleLike = async (postId) => {
    if (!user) {
      alert('Debes iniciar sesión para dar like');
      return;
    }
    
    try {
      console.log(`👍 SOCIAL: Toggling like for post ${postId}`);
      
      const wasLiked = userLikes.has(postId);
      
      // Optimistic update
      setUserLikes(prevLikes => {
        const newLikes = new Set(prevLikes);
        if (wasLiked) {
          newLikes.delete(postId);
        } else {
          newLikes.add(postId);
        }
        return newLikes;
      });
      
      setLikes(prevLikes => ({
        ...prevLikes,
        [postId]: wasLiked ? Math.max(0, (prevLikes[postId] || 0) - 1) : (prevLikes[postId] || 0) + 1
      }));
      
      // Hacer la llamada real
      const result = await supabasePosts.toggleLike(postId, user.id);
      
      // Actualizar con el resultado real
      const realLikesCount = await supabasePosts.getPostLikes(postId);
      setLikes(prevLikes => ({
        ...prevLikes,
        [postId]: realLikesCount.length
      }));
      
      console.log(`${result.liked ? '👍' : '👎'} SOCIAL: Like toggled successfully`);
    } catch (error) {
      console.error('❌ SOCIAL: Error toggling like:', error);
      
      // Revertir optimistic update
      setUserLikes(prevLikes => {
        const newLikes = new Set(prevLikes);
        if (userLikes.has(postId)) {
          newLikes.add(postId);
        } else {
          newLikes.delete(postId);
        }
        return newLikes;
      });
    }
  };

  // ============= MANEJAR COMENTARIOS =============
  const loadComments = async (postId) => {
    try {
      console.log(`💬 SOCIAL: Loading comments for post ${postId}`);
      const postComments = await supabaseComments.getPostComments(postId);
      setComments(prev => ({ ...prev, [postId]: postComments }));
      console.log(`✅ SOCIAL: Loaded ${postComments.length} comments`);
    } catch (error) {
      console.error('❌ SOCIAL: Error loading comments:', error);
    }
  };

  const toggleComments = async (postId) => {
    if (showComments.has(postId)) {
      setShowComments(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    } else {
      setShowComments(prev => new Set([...prev, postId]));
      if (!comments[postId]) {
        await loadComments(postId);
      }
    }
  };

  const handleAddComment = async (postId) => {
    const content = newComment[postId]?.trim();
    if (!content || !user) return;
    
    try {
      console.log(`💬 SOCIAL: Adding comment to post ${postId}`);
      
      const comment = await supabaseComments.addComment(postId, user.id, content);
      
      // Actualizar comentarios localmente
      setComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), comment]
      }));
      
      // Limpiar input
      setNewComment(prev => ({ ...prev, [postId]: '' }));
      
      console.log('✅ SOCIAL: Comment added successfully');
    } catch (error) {
      console.error('❌ SOCIAL: Error adding comment:', error);
      alert('Error al añadir comentario: ' + error.message);
    }
  };

  // ============= SUBIR IMÁGENES =============
  const handleImageUpload = async (file) => {
    if (!file || !user) return;
    
    try {
      console.log('📷 SOCIAL: Uploading image...');
      const uploadResult = await supabaseStorage.uploadImage(file, user.id, 'posts');
      
      setNewPost(prev => ({
        ...prev,
        images: [...prev.images, uploadResult.url]
      }));
      
      console.log('✅ SOCIAL: Image uploaded successfully');
    } catch (error) {
      console.error('❌ SOCIAL: Error uploading image:', error);
      alert('Error al subir imagen: ' + error.message);
    }
  };

  // ============= COMPONENTES DE UI =============
  const PostCard = ({ post }) => (
    <div className="bg-white rounded-lg shadow-sm border mb-4">
      {/* Header del post */}
      <div className="p-4 border-b">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {post.author?.avatar_url ? (
              <img 
                src={post.author.avatar_url} 
                alt={post.author.full_name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-medium">
                  {(post.author?.first_name?.[0] || post.author?.email?.[0] || '?').toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h4 className="font-semibold text-gray-900">
                {post.author?.full_name || 
                 `${post.author?.first_name || ''} ${post.author?.last_name || ''}`.trim() || 
                 'Usuario desconocido'}
              </h4>
              <div className="flex items-center text-sm text-gray-500 space-x-2">
                <span>{new Date(post.created_at).toLocaleDateString('es-ES')}</span>
                {post.activity && (
                  <>
                    <span>•</span>
                    <span className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {post.activity.title}
                    </span>
                  </>
                )}
                {post.featured && <Star className="w-4 h-4 text-yellow-500" />}
              </div>
            </div>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Contenido del post */}
      <div className="p-4">
        {post.title && (
          <h3 className="text-lg font-semibold mb-2 text-gray-900">{post.title}</h3>
        )}
        <p className="text-gray-700 mb-3 whitespace-pre-wrap">{post.content}</p>
        
        {/* Imágenes del post */}
        {post.images && post.images.length > 0 && (
          <div className="mb-3">
            {post.images.map((imageUrl, index) => (
              <img 
                key={index}
                src={imageUrl} 
                alt={`Imagen ${index + 1}`}
                className="w-full max-h-96 object-cover rounded-lg mb-2"
              />
            ))}
          </div>
        )}
        
        {/* Estadísticas de interacción */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <Heart className="w-4 h-4 mr-1" />
              {likes[post.id] || 0} likes
            </span>
            <span className="flex items-center">
              <MessageCircle className="w-4 h-4 mr-1" />
              {post.comments_count || 0} comentarios
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs ${
              post.visibility === 'public' ? 'bg-green-100 text-green-800' : 
              'bg-yellow-100 text-yellow-800'
            }`}>
              {post.visibility === 'public' ? 'Público' : 'Privado'}
            </span>
          </div>
        </div>
      </div>

      {/* Acciones del post */}
      <div className="px-4 py-2 border-t bg-gray-50">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => handleLike(post.id)}
            disabled={!user}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              userLikes.has(post.id) 
                ? 'text-red-600 bg-red-50 hover:bg-red-100' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            } disabled:opacity-50`}
          >
            <Heart className={`w-4 h-4 ${userLikes.has(post.id) ? 'fill-current' : ''}`} />
            <span>Me gusta</span>
          </button>
          <button
            onClick={() => toggleComments(post.id)}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Comentar</span>
          </button>
          <button className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors">
            <Share2 className="w-4 h-4" />
            <span>Compartir</span>
          </button>
        </div>
      </div>

      {/* Sección de comentarios */}
      {showComments.has(post.id) && (
        <div className="border-t bg-gray-50">
          {/* Input para nuevo comentario */}
          {user && (
            <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-start space-x-3">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <div className="relative">
                    <textarea
                      placeholder="Escribe un comentario..."
                      value={newComment[post.id] || ''}
                      onChange={(e) => setNewComment(prev => ({
                        ...prev,
                        [post.id]: e.target.value
                      }))}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAddComment(post.id);
                        }
                      }}
                      rows="2"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all placeholder-gray-500"
                    />
                    {newComment[post.id]?.length > 0 && (
                      <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                        {newComment[post.id].length}/500
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        Presiona Enter para enviar
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {newComment[post.id]?.trim() && (
                        <button
                          onClick={() => setNewComment(prev => ({ ...prev, [post.id]: '' }))}
                          className="px-3 py-1.5 text-gray-500 hover:text-gray-700 text-sm rounded-lg hover:bg-white/50 transition-all"
                        >
                          Cancelar
                        </button>
                      )}
                      <button
                        onClick={() => handleAddComment(post.id)}
                        disabled={!newComment[post.id]?.trim()}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-sm hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 flex items-center gap-2 shadow-md"
                      >
                        <Send className="w-4 h-4" />
                        <span>Comentar</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Lista de comentarios */}
          <div className="max-h-80 overflow-y-auto">
            {comments[post.id]?.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No hay comentarios aún</p>
                <p className="text-gray-400 text-xs mt-1">¡Sé el primero en comentar!</p>
              </div>
            ) : (
              comments[post.id]?.map((comment) => (
                <div key={comment.id} className="p-4 hover:bg-gray-50 transition-colors group">
                  <div className="flex items-start space-x-3">
                    {comment.author?.avatar_url ? (
                      <img
                        src={comment.author.avatar_url}
                        alt={comment.author.full_name}
                        className="w-8 h-8 rounded-full object-cover border border-gray-200 shadow-sm"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center shadow-sm">
                        <span className="text-white text-xs font-semibold">
                          {(comment.author?.first_name?.[0] || '?').toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="bg-gray-100 rounded-2xl px-4 py-3 group-hover:bg-gray-200 transition-colors">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-semibold text-sm text-gray-900 truncate">
                            {comment.author?.full_name ||
                             `${comment.author?.first_name || ''} ${comment.author?.last_name || ''}`.trim() ||
                             'Usuario desconocido'}
                          </span>
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {(() => {
                              const now = new Date();
                              const commentDate = new Date(comment.created_at);
                              const diffInMinutes = Math.floor((now - commentDate) / (1000 * 60));

                              if (diffInMinutes < 1) return 'Ahora';
                              if (diffInMinutes < 60) return `${diffInMinutes}m`;
                              if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
                              return commentDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
                            })()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                      </div>
                      <div className="flex items-center space-x-4 mt-2 px-2">
                        <button className="flex items-center space-x-1 text-xs text-gray-500 hover:text-blue-600 transition-colors group">
                          <ThumbsUp className="w-3 h-3 group-hover:scale-110 transition-transform" />
                          <span>{comment.likes_count || 0}</span>
                        </button>
                        <button className="text-xs text-gray-500 hover:text-blue-600 transition-colors">
                          Responder
                        </button>
                        <span className="text-xs text-gray-400">
                          {(() => {
                            const now = new Date();
                            const commentDate = new Date(comment.created_at);
                            const diffInHours = Math.floor((now - commentDate) / (1000 * 60 * 60));

                            if (diffInHours < 24) {
                              return commentDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                            }
                            return commentDate.toLocaleDateString('es-ES');
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );

  // ============= RENDER PRINCIPAL =============
  return (
    <div className="max-w-2xl mx-auto py-6">
      {/* Crear nuevo post */}
      {user && (
        <div className="bg-white rounded-lg shadow-sm border mb-6 p-4">
          <div className="flex items-center space-x-3 mb-4">
            {user.avatar_url ? (
              <img 
                src={user.avatar_url} 
                alt={user.full_name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
            )}
            <button
              onClick={() => setShowCreatePost(true)}
              className="flex-1 text-left px-4 py-3 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"
            >
              ¿Qué está pasando en tu actividad?
            </button>
          </div>

          {showCreatePost && (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Título (opcional)"
                value={newPost.title}
                onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="relative">
                <textarea
                  placeholder="¿Qué quieres compartir?"
                  value={newPost.content}
                  onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                  rows="4"
                  maxLength="1000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all placeholder-gray-500"
                />
                <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                  {newPost.content.length}/1000
                </div>
              </div>
              
              {/* Preview de imágenes */}
              {newPost.images.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {newPost.images.map((image, index) => (
                    <div key={index} className="relative">
                      <img 
                        src={image} 
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => setNewPost(prev => ({
                          ...prev,
                          images: prev.images.filter((_, i) => i !== index)
                        }))}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files[0] && handleImageUpload(e.target.files[0])}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all border border-gray-200 hover:border-blue-300"
                  >
                    <Camera className="w-4 h-4" />
                    <span className="font-medium">Añadir foto</span>
                  </button>
                  <select
                    value={newPost.visibility}
                    onChange={(e) => setNewPost(prev => ({ ...prev, visibility: e.target.value }))}
                    className="text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="public">Público</option>
                    <option value="volunteers_only">Solo voluntarios</option>
                    <option value="private">Privado</option>
                  </select>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setShowCreatePost(false);
                      setNewPost({ title: '', content: '', images: [], activity_id: null, visibility: 'public' });
                    }}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreatePost}
                    disabled={!newPost.content.trim() || creating}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {creating ? 'Publicando...' : 'Publicar'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Feed de posts */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Cargando posts...</span>
        </div>
      ) : (
        <div>
          {posts.length > 0 ? (
            posts.map((post) => <PostCard key={post.id} post={post} />)
          ) : (
            <div className="text-center py-12">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay posts aún</h3>
              <p className="text-gray-500 mb-4">¡Sé el primero en compartir algo!</p>
              {user && (
                <button
                  onClick={() => setShowCreatePost(true)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Crear primer post
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SocialFeed;