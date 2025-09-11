// ============= CASIRA Connect - Comments API Fix =============
// Quick fix for js.addComment is not a function error

console.log('🔧 CASIRA: Loading Comments API Fix');

// Emergency function for comments - ensure it exists  
window.js = window.js || {};
window.js.addComment = async function(postId, userId, content) {
  console.log('💬 CASIRA Emergency: Adding comment', { postId, userId, content });
  
  try {
    // Try to import the API directly
    const { commentsAPI } = await import('./api.js');
    
    if (commentsAPI && commentsAPI.createComment) {
      const result = await commentsAPI.createComment({
        post_id: postId,
        author_id: userId,
        content: content
      });
      console.log('✅ CASIRA Emergency: Comment added via commentsAPI');
      return result;
    }
    
    // Fallback to direct localStorage manipulation using CASIRA data format
    const casiraData = JSON.parse(localStorage.getItem('casira-data') || '{}');
    if (!casiraData.comments) casiraData.comments = [];
    
    const newComment = {
      id: Date.now(),
      post_id: Number(postId),
      author_id: Number(userId),
      content: content,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    casiraData.comments.push(newComment);
    localStorage.setItem('casira-data', JSON.stringify(casiraData));
    
    // Dispatch update event
    window.dispatchEvent(new CustomEvent('casira-data-updated', {
      detail: { type: 'comment', action: 'create', data: newComment }
    }));
    
    console.log('✅ CASIRA Emergency: Comment added via localStorage');
    return newComment;
    
  } catch (error) {
    console.error('❌ CASIRA Emergency: Error adding comment:', error);
    throw error;
  }
};

// Also create a simpler version for direct use
window.addComment = window.js.addComment;

console.log('🩹 CASIRA: Emergency comments API patch applied to window.js');