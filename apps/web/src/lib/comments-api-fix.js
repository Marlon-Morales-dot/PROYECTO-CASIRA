// ============= CASIRA Connect - Comments API Fix =============
// Quick fix for js.addComment is not a function error

// Import the correct APIs
import { supabaseComments } from './supabase-client.js';

// Fallback comments API for localStorage
const localStorageComments = {
  addComment: async (postId, userId, content) => {
    console.log('📝 CASIRA: Adding comment to localStorage');
    
    try {
      // Get existing comments
      const comments = JSON.parse(localStorage.getItem('casira-comments') || '[]');
      
      // Create new comment
      const newComment = {
        id: `comment_${Date.now()}_${Math.random()}`,
        post_id: postId,
        author_id: userId,
        content: content,
        created_at: new Date().toISOString(),
        likes_count: 0,
        author: {
          id: userId,
          full_name: 'Usuario',
          first_name: 'Usuario',
          last_name: '',
          avatar_url: null
        }
      };
      
      // Add to comments array
      comments.push(newComment);
      
      // Save back to localStorage
      localStorage.setItem('casira-comments', JSON.stringify(comments));
      
      console.log('✅ CASIRA: Comment added to localStorage');
      return newComment;
      
    } catch (error) {
      console.error('❌ CASIRA: Error adding comment to localStorage:', error);
      throw error;
    }
  },

  getPostComments: async (postId) => {
    try {
      const comments = JSON.parse(localStorage.getItem('casira-comments') || '[]');
      return comments.filter(comment => comment.post_id === postId);
    } catch (error) {
      console.error('❌ CASIRA: Error getting comments from localStorage:', error);
      return [];
    }
  }
};

// Unified Comments API with fallback
export const commentsAPI = {
  addComment: async (postId, userId, content, parentId = null) => {
    console.log('💬 CASIRA: Adding comment with unified API');
    
    try {
      // Try Supabase first
      return await supabaseComments.addComment(postId, userId, content, parentId);
    } catch (supabaseError) {
      console.warn('⚠️ CASIRA: Supabase comment failed, using localStorage:', supabaseError.message);
      
      // Fallback to localStorage
      try {
        return await localStorageComments.addComment(postId, userId, content);
      } catch (localError) {
        console.error('❌ CASIRA: Both Supabase and localStorage failed:', localError);
        throw new Error('Failed to add comment to both Supabase and localStorage');
      }
    }
  },

  getPostComments: async (postId) => {
    try {
      // Try Supabase first
      const supabaseComments = await supabaseComments.getPostComments(postId);
      if (supabaseComments && supabaseComments.length > 0) {
        return supabaseComments;
      }
    } catch (error) {
      console.warn('⚠️ CASIRA: Supabase comments fetch failed, using localStorage');
    }
    
    // Fallback to localStorage
    return await localStorageComments.getPostComments(postId);
  }
};

// Global fallback - attach to window for emergency access
if (typeof window !== 'undefined') {
  window.CASIRA_COMMENTS_API = commentsAPI;
  
  // Emergency patch for existing code
  if (!window.js) {
    window.js = {};
  }
  
  window.js.addComment = commentsAPI.addComment;
  
  console.log('🩹 CASIRA: Emergency comments API patch applied to window.js');
}

export default commentsAPI;