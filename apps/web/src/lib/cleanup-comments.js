// ============= CLEANUP COMMENTS UTILITY =============
import { supabase } from './supabase-singleton.js';

/**
 * Función para limpiar todos los comentarios de la base de datos
 * ⚠️ ADVERTENCIA: Esta función eliminará TODOS los comentarios
 */
export const cleanupAllComments = async () => {
  try {
    console.log('🗑️ CLEANUP: Iniciando limpieza de comentarios...');

    // Primero, obtener el conteo actual
    const { count: currentCount, error: countError } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw new Error(`Error obteniendo conteo: ${countError.message}`);
    }

    console.log(`📊 CLEANUP: Se encontraron ${currentCount} comentarios para eliminar`);

    if (currentCount === 0) {
      console.log('✅ CLEANUP: No hay comentarios para eliminar');
      return { success: true, deleted: 0, message: 'No hay comentarios para eliminar' };
    }

    // Eliminar todos los comentarios
    const { error: deleteError } = await supabase
      .from('comments')
      .delete()
      .neq('id', 0); // Esto selecciona todos los registros (id != 0)

    if (deleteError) {
      throw new Error(`Error eliminando comentarios: ${deleteError.message}`);
    }

    // Opcional: Resetear contadores de comentarios en posts
    const { error: updateError } = await supabase
      .from('posts')
      .update({ comments_count: 0 })
      .neq('id', 0); // Actualizar todos los posts

    if (updateError) {
      console.warn('⚠️ CLEANUP: Error actualizando contadores de posts:', updateError.message);
    }

    console.log(`✅ CLEANUP: ${currentCount} comentarios eliminados exitosamente`);

    return {
      success: true,
      deleted: currentCount,
      message: `${currentCount} comentarios eliminados exitosamente`
    };

  } catch (error) {
    console.error('❌ CLEANUP: Error durante la limpieza:', error);
    return {
      success: false,
      deleted: 0,
      message: `Error: ${error.message}`
    };
  }
};

/**
 * Función para limpiar comentarios de una actividad específica
 */
export const cleanupActivityComments = async (activityId) => {
  try {
    console.log(`🗑️ CLEANUP: Limpiando comentarios de actividad ${activityId}...`);

    const { count, error: deleteError } = await supabase
      .from('comments')
      .delete()
      .eq('post_id', activityId)
      .select('*', { count: 'exact', head: true });

    if (deleteError) {
      throw new Error(`Error eliminando comentarios: ${deleteError.message}`);
    }

    console.log(`✅ CLEANUP: ${count || 0} comentarios eliminados de la actividad ${activityId}`);

    return {
      success: true,
      deleted: count || 0,
      message: `${count || 0} comentarios eliminados de la actividad`
    };

  } catch (error) {
    console.error('❌ CLEANUP: Error durante la limpieza:', error);
    return {
      success: false,
      deleted: 0,
      message: `Error: ${error.message}`
    };
  }
};

/**
 * Función para obtener estadísticas de comentarios
 */
export const getCommentsStats = async () => {
  try {
    const { count, error } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true });

    if (error) {
      throw new Error(`Error obteniendo estadísticas: ${error.message}`);
    }

    return {
      success: true,
      totalComments: count || 0
    };

  } catch (error) {
    console.error('❌ CLEANUP: Error obteniendo estadísticas:', error);
    return {
      success: false,
      totalComments: 0,
      message: `Error: ${error.message}`
    };
  }
};

// Exportar funciones individuales también
export default {
  cleanupAllComments,
  cleanupActivityComments,
  getCommentsStats
};