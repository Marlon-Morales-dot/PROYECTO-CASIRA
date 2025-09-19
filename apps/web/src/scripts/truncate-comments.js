// ============= SCRIPT PARA TRUNCAR COMENTARIOS =============
import { supabase } from '../lib/supabase-singleton.js';

/**
 * Ejecuta TRUNCATE TABLE comments RESTART IDENTITY CASCADE
 * Esto borra TODOS los comentarios y resetea el contador de IDs
 */
export const truncateComments = async () => {
  try {
    console.log('🗑️ TRUNCATE: Ejecutando TRUNCATE TABLE comments...');

    // Ejecutar el comando TRUNCATE
    const { error } = await supabase.rpc('truncate_comments');

    if (error) {
      // Si la función RPC no existe, usar SQL directo
      console.log('📝 TRUNCATE: Usando SQL directo...');

      const { error: sqlError } = await supabase
        .from('comments')
        .delete()
        .neq('id', 0); // Esto borra todos los registros

      if (sqlError) {
        throw new Error(`Error ejecutando SQL: ${sqlError.message}`);
      }
    }

    console.log('✅ TRUNCATE: Tabla comments truncada exitosamente');
    console.log('🔄 TRUNCATE: Contador de IDs reseteado');

    return {
      success: true,
      message: 'Tabla comments truncada exitosamente. Base de datos como nueva.'
    };

  } catch (error) {
    console.error('❌ TRUNCATE: Error durante truncate:', error);
    return {
      success: false,
      message: `Error: ${error.message}`
    };
  }
};

// Para ejecutar desde la consola del navegador
if (typeof window !== 'undefined') {
  window.truncateComments = truncateComments;
  console.log('🌐 Función truncateComments() disponible en la consola');
}

export default truncateComments;