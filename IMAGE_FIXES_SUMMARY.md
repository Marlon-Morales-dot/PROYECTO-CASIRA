# CASIRA Connect - Image Upload & Display Fixes v2

## Issues Fixed

### 1. ✅ Null Folder Structure Issue
**Problem**: Images were being uploaded to `/null/` folders in Supabase Storage
**Solution**: 
- Updated `uploadImage()` function to generate proper activity IDs
- Changed from `activityId || 'activities'` to `activityId || `temp_${Date.now()}`
- Added support for custom filenames

### 2. ✅ URL Validation Issues  
**Problem**: External image URLs were not being validated before use
**Solution**:
- **IMPROVED**: Changed from `fetch()` to `Image` object for better validation
- Uses `img.onload` and `img.onerror` to test actual image loading
- Added 5-second timeout for validation
- Better console logging with validation results

### 3. ✅ Function Parameter Mismatch
**Problem**: `uploadImage()` was called with 4 parameters but only expected 3
**Solution**:
- Updated function signature to accept optional `customFilename` parameter
- Now supports: `uploadImage(file, userId, activityId, customFilename = null)`

### 4. ✅ **NEW** - Activity Update Not Working
**Problem**: Editing existing activities didn't update images or save to Supabase
**Solution**:
- Added complete image handling to `handleUpdateActivity()` function
- Includes same URL validation and file upload logic as create
- Added category UUID mapping for updates (was missing)
- Uses existing activity ID for proper folder structure in updates

## Code Changes Made

### `/apps/web/src/lib/supabase.js`
- Updated `uploadImage()` function with proper folder structure
- **IMPROVED** `validateImageUrl()` using Image object instead of fetch
- **IMPROVED** `getWorkingImageUrl()` with detailed logging
- Added timeout handling for URL validation

### `/apps/web/src/components/AdminDashboard.jsx`
- Integrated URL validation in activity creation
- **NEW**: Added complete image handling to activity updates
- **NEW**: Added category UUID mapping to updates
- Improved error handling for image uploads
- Added detailed console logging for debugging

## Testing

The fixes ensure:
1. ✅ Images upload to proper user/activity folders (not null folders)
2. ✅ External URLs are validated using actual image loading
3. ✅ Fallback images are used when URLs fail
4. ✅ **NEW**: Activity updates work with images and save to Supabase
5. ✅ **NEW**: Category mapping works for both create and update
6. ✅ Console logging shows detailed upload/validation process

## How It Works Now

### Creating Activities:
- File uploads go to `/userId/temp_timestamp/filename.ext` 
- URLs are validated by loading them as images
- Fallbacks work when validation fails

### Updating Activities:
- File uploads go to `/userId/activityId/filename.ext` (proper folders)
- URLs are validated the same way as create
- Category IDs are properly mapped to UUIDs
- Changes save correctly to Supabase

### URL Validation:
- Uses `new Image()` to test actual image loading
- 5-second timeout prevents hanging
- Detailed console feedback shows what's happening

The complete image system now works for both creating AND updating activities!