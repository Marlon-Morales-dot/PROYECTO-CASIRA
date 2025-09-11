// ============= CASIRA Connect - UUID Helper =============
// Helps manage UUID vs numeric ID conflicts between Supabase and localStorage

console.log('🔧 CASIRA: Loading UUID Helper');

// Simple UUID v4 generator
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Check if string is a valid UUID
function isUUID(str) {
  if (!str || typeof str !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// Check if string is a numeric ID
function isNumericId(id) {
  return !isNaN(id) && !isUUID(String(id));
}

// Normalize ID for consistent comparison
function normalizeId(id) {
  if (!id) return null;
  return String(id);
}

// Generate appropriate ID for environment
function generateId(preferUUID = false) {
  if (preferUUID) {
    return generateUUID();
  }
  return Date.now(); // Numeric timestamp for localStorage
}

// Convert data for Supabase (ensure UUIDs where needed)
function prepareForSupabase(data, idFields = ['id', 'user_id', 'author_id', 'created_by', 'activity_id', 'post_id']) {
  const prepared = { ...data };
  
  idFields.forEach(field => {
    if (prepared[field] && isNumericId(prepared[field])) {
      // Convert numeric ID to UUID for Supabase
      // For now, we'll generate a new UUID - later we can implement ID mapping
      console.log(`🔄 CASIRA: Converting ${field} from numeric ${prepared[field]} to UUID`);
      prepared[field] = generateUUID();
    }
  });
  
  return prepared;
}

// Convert data from Supabase (keep UUIDs but ensure compatibility)
function prepareFromSupabase(data) {
  // Supabase data usually comes with UUIDs, just return as-is
  return { ...data, source: 'supabase' };
}

// Smart ID comparison that works with both UUIDs and numeric IDs
function idsMatch(id1, id2) {
  if (!id1 || !id2) return false;
  
  const norm1 = normalizeId(id1);
  const norm2 = normalizeId(id2);
  
  return norm1 === norm2;
}

// Get user ID in the correct format for the current operation
function getUserIdForOperation(user, forSupabase = false) {
  if (!user) return null;
  
  if (forSupabase) {
    // For Supabase, prefer UUID if available, otherwise generate one
    if (user.supabase_id) return user.supabase_id;
    if (isUUID(user.id)) return user.id;
    return generateUUID();
  } else {
    // For localStorage, prefer numeric ID
    if (isNumericId(user.id)) return user.id;
    return Date.now();
  }
}

// Create a hybrid object that works with both systems
function createHybridRecord(data, type = 'activity') {
  const timestamp = Date.now();
  
  return {
    // Numeric ID for localStorage
    id: timestamp,
    // UUID for Supabase (generated on demand)
    uuid: generateUUID(),
    // Original data
    ...data,
    // Metadata
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    source: 'hybrid'
  };
}

export {
  generateUUID,
  isUUID,
  isNumericId,
  normalizeId,
  generateId,
  prepareForSupabase,
  prepareFromSupabase,
  idsMatch,
  getUserIdForOperation,
  createHybridRecord
};

console.log('✅ CASIRA: UUID Helper loaded successfully');