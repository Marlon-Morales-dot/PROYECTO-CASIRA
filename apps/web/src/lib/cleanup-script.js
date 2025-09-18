// ============= CASIRA Connect - Cleanup Script =============
// Script para limpiar datos problemáticos de Supabase

import { supabase } from './supabase-singleton.js';

class SupabaseCleanup {

  // Ver todas las actividades actuales
  async inspectActivities() {
    console.log('🔍 CASIRA Cleanup: Inspecting activities in Supabase...');

    try {
      const { data: activities, error } = await supabase
        .from('activities')
        .select(`
          id,
          title,
          description,
          created_at,
          creator:users!activities_created_by_fkey(id, first_name, last_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching activities:', error);
        return [];
      }

      console.log(`📊 Found ${activities.length} activities in Supabase:`);
      activities.forEach((activity, index) => {
        console.log(`${index + 1}. ${activity.title}`);
        console.log(`   ID: ${activity.id}`);
        console.log(`   Created: ${activity.created_at}`);
        console.log(`   Creator: ${activity.creator?.first_name} ${activity.creator?.last_name} (${activity.creator?.email})`);
        console.log(`   Description: ${activity.description?.substring(0, 50)}...`);
        console.log('');
      });

      return activities;
    } catch (error) {
      console.error('❌ CASIRA Cleanup: Error inspecting activities:', error);
      return [];
    }
  }

  // Ver posts asociados a actividades
  async inspectPostsForActivities() {
    console.log('🔍 CASIRA Cleanup: Inspecting posts linked to activities...');

    try {
      const { data: posts, error } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          content,
          activity_id,
          created_at,
          author:users!posts_author_id_fkey(first_name, last_name, email),
          activity:activities!posts_activity_id_fkey(id, title)
        `)
        .not('activity_id', 'is', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching posts:', error);
        return [];
      }

      console.log(`📊 Found ${posts.length} posts linked to activities:`);
      posts.forEach((post, index) => {
        console.log(`${index + 1}. Post: ${post.title || 'No title'}`);
        console.log(`   Post ID: ${post.id}`);
        console.log(`   Activity ID: ${post.activity_id}`);
        console.log(`   Activity: ${post.activity?.title || 'Unknown'}`);
        console.log(`   Author: ${post.author?.first_name} ${post.author?.last_name}`);
        console.log(`   Content: ${post.content?.substring(0, 50)}...`);
        console.log('');
      });

      return posts;
    } catch (error) {
      console.error('❌ CASIRA Cleanup: Error inspecting posts:', error);
      return [];
    }
  }

  // Eliminar posts asociados a una actividad específica
  async deletePostsForActivity(activityId) {
    console.log(`🗑️ CASIRA Cleanup: Deleting posts for activity ${activityId}...`);

    try {
      const { data: deletedPosts, error } = await supabase
        .from('posts')
        .delete()
        .eq('activity_id', activityId)
        .select();

      if (error) {
        console.error('❌ Error deleting posts:', error);
        return false;
      }

      console.log(`✅ Deleted ${deletedPosts.length} posts for activity ${activityId}`);
      return true;
    } catch (error) {
      console.error('❌ CASIRA Cleanup: Error deleting posts:', error);
      return false;
    }
  }

  // Eliminar todos los registros asociados a una actividad
  async deleteAllAssociatedRecords(activityId) {
    console.log(`🧹 CASIRA Cleanup: Cleaning all records for activity ${activityId}...`);

    const results = {};

    // 1. Eliminar posts asociados
    try {
      const { data: posts, error } = await supabase
        .from('posts')
        .delete()
        .eq('activity_id', activityId)
        .select();

      results.posts = posts?.length || 0;
      console.log(`✅ Deleted ${results.posts} posts`);
    } catch (error) {
      console.warn('⚠️ Error deleting posts:', error);
      results.posts = 'error';
    }

    // 2. Eliminar user_activities
    try {
      const { data: userActivities, error } = await supabase
        .from('user_activities')
        .delete()
        .eq('activity_id', activityId)
        .select();

      results.userActivities = userActivities?.length || 0;
      console.log(`✅ Deleted ${results.userActivities} user activities`);
    } catch (error) {
      console.warn('⚠️ Error deleting user activities:', error);
      results.userActivities = 'error';
    }

    // 3. Eliminar comentarios asociados
    try {
      const { data: comments, error } = await supabase
        .from('comments')
        .delete()
        .eq('post_id', activityId)
        .select();

      results.comments = comments?.length || 0;
      console.log(`✅ Deleted ${results.comments} comments`);
    } catch (error) {
      console.warn('⚠️ Error deleting comments:', error);
      results.comments = 'error';
    }

    // 4. Eliminar likes asociados
    try {
      const { data: likes, error } = await supabase
        .from('likes')
        .delete()
        .eq('post_id', activityId)
        .select();

      results.likes = likes?.length || 0;
      console.log(`✅ Deleted ${results.likes} likes`);
    } catch (error) {
      console.warn('⚠️ Error deleting likes:', error);
      results.likes = 'error';
    }

    return results;
  }

  // Eliminar actividad específica (después de limpiar posts)
  async deleteActivity(activityId) {
    console.log(`🗑️ CASIRA Cleanup: Deleting activity ${activityId}...`);

    try {
      // Primero eliminar todos los registros asociados
      const cleanupResults = await this.deleteAllAssociatedRecords(activityId);
      console.log('📊 Cleanup results:', cleanupResults);

      // Luego eliminar la actividad
      const { data: deletedActivity, error } = await supabase
        .from('activities')
        .delete()
        .eq('id', activityId)
        .select();

      if (error) {
        console.error('❌ Error deleting activity:', error);
        return false;
      }

      console.log(`✅ Successfully deleted activity ${activityId}`);
      return true;
    } catch (error) {
      console.error('❌ CASIRA Cleanup: Error deleting activity:', error);
      return false;
    }
  }

  // Limpiar actividades de prueba problemáticas
  async cleanupTestActivities() {
    console.log('🧹 CASIRA Cleanup: Starting cleanup of test activities...');

    try {
      // Obtener todas las actividades
      const activities = await this.inspectActivities();

      // Identificar actividades de prueba (por titulo o descripción)
      const testActivities = activities.filter(activity =>
        activity.title.toLowerCase().includes('test') ||
        activity.title.toLowerCase().includes('prueba') ||
        activity.description?.toLowerCase().includes('test') ||
        activity.description?.toLowerCase().includes('prueba') ||
        activity.title.toLowerCase().includes('nueva') ||
        activity.title.toLowerCase().includes('libreria')
      );

      console.log(`🎯 Found ${testActivities.length} test activities to clean:`);
      testActivities.forEach(activity => {
        console.log(`- ${activity.title} (ID: ${activity.id})`);
      });

      if (testActivities.length === 0) {
        console.log('✅ No test activities found to clean');
        return true;
      }

      // Preguntar confirmación (simulado)
      console.log('⚠️ About to delete these test activities. Proceeding...');

      // Eliminar cada actividad de prueba
      for (const activity of testActivities) {
        console.log(`🗑️ Cleaning activity: ${activity.title}`);
        const success = await this.deleteActivity(activity.id);
        if (!success) {
          console.error(`❌ Failed to delete activity: ${activity.title}`);
        }
      }

      console.log('🎉 CASIRA Cleanup: Test activities cleanup completed');
      return true;

    } catch (error) {
      console.error('❌ CASIRA Cleanup: Error during cleanup:', error);
      return false;
    }
  }

  // Función principal de inspección
  async inspectDatabase() {
    console.log('🔍 CASIRA Cleanup: Starting database inspection...');

    const activities = await this.inspectActivities();
    const posts = await this.inspectPostsForActivities();

    console.log('📊 SUMMARY:');
    console.log(`- Total Activities: ${activities.length}`);
    console.log(`- Total Posts with Activity Links: ${posts.length}`);

    return { activities, posts };
  }

  // Inspeccionar tablas de voluntarios
  async inspectVolunteerTables() {
    console.log('🔍 CASIRA: Inspecting volunteer-related tables...');

    try {
      // 1. Volunteer requests
      const { data: requests, error: requestsError } = await supabase
        .from('volunteer_requests')
        .select('*');

      console.log(`📊 volunteer_requests: ${requests?.length || 0} records`);
      if (requests && requests.length > 0) {
        console.table(requests.slice(0, 5)); // Show first 5
      }

      // 2. Activity participants
      const { data: participants, error: participantsError } = await supabase
        .from('activity_participants')
        .select('*');

      console.log(`📊 activity_participants: ${participants?.length || 0} records`);
      if (participants && participants.length > 0) {
        console.table(participants.slice(0, 5));
      }

      // 3. User activities
      const { data: userActivities, error: userActivitiesError } = await supabase
        .from('user_activities')
        .select('*');

      console.log(`📊 user_activities: ${userActivities?.length || 0} records`);
      if (userActivities && userActivities.length > 0) {
        console.table(userActivities.slice(0, 5));
      }

      // 4. Summary
      console.log('📋 SUMMARY:', {
        volunteer_requests: requests?.length || 0,
        activity_participants: participants?.length || 0,
        user_activities: userActivities?.length || 0
      });

      return {
        volunteer_requests: requests || [],
        activity_participants: participants || [],
        user_activities: userActivities || []
      };

    } catch (error) {
      console.error('❌ Error inspecting volunteer tables:', error);
      return {};
    }
  }
}

// Crear instancia global para el cleanup
export const supabaseCleanup = new SupabaseCleanup();

// Funciones de conveniencia para la consola
window.CASIRA_INSPECT = () => supabaseCleanup.inspectDatabase();
window.CASIRA_INSPECT_ACTIVITIES = () => supabaseCleanup.inspectActivities();
window.CASIRA_INSPECT_POSTS = () => supabaseCleanup.inspectPostsForActivities();
window.CASIRA_INSPECT_VOLUNTEERS = () => supabaseCleanup.inspectVolunteerTables();
window.CASIRA_CLEANUP_TESTS = () => supabaseCleanup.cleanupTestActivities();
window.CASIRA_DELETE_ACTIVITY = (id) => supabaseCleanup.deleteActivity(id);

console.log('🧹 CASIRA Cleanup Script loaded. Available functions:');
console.log('- window.CASIRA_INSPECT() - Inspect all data');
console.log('- window.CASIRA_INSPECT_ACTIVITIES() - Inspect activities');
console.log('- window.CASIRA_INSPECT_POSTS() - Inspect posts');
console.log('- window.CASIRA_INSPECT_VOLUNTEERS() - Inspect volunteer tables');
console.log('- window.CASIRA_CLEANUP_TESTS() - Clean test activities');
console.log('- window.CASIRA_DELETE_ACTIVITY(id) - Delete specific activity');

export default supabaseCleanup;