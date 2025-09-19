// ============= SCRIPT PARA LIMPIAR BASE DE DATOS =============
import { cleanupAllComments, getCommentsStats } from '../lib/cleanup-comments.js';

/**
 * Script para limpiar todos los comentarios de la base de datos
 * Ejecutar desde la consola del navegador o como script Node.js
 */
const runCleanup = async () => {
  console.log('🚀 Iniciando limpieza de base de datos...');

  // Obtener estadísticas antes
  console.log('\n📊 Obteniendo estadísticas actuales...');
  const statsBefore = await getCommentsStats();

  if (statsBefore.success) {
    console.log(`📈 Comentarios actuales en la base de datos: ${statsBefore.totalComments}`);

    if (statsBefore.totalComments === 0) {
      console.log('✅ La base de datos ya está limpia. No hay comentarios para eliminar.');
      return;
    }

    // Confirmar limpieza
    const confirm = window?.confirm ?
      window.confirm(`¿Estás seguro de que quieres eliminar TODOS los ${statsBefore.totalComments} comentarios?\n\nEsta acción NO se puede deshacer.`) :
      true; // Auto-confirm en Node.js

    if (!confirm) {
      console.log('❌ Limpieza cancelada por el usuario');
      return;
    }

    // Ejecutar limpieza
    console.log('\n🗑️ Ejecutando limpieza...');
    const result = await cleanupAllComments();

    if (result.success) {
      console.log(`✅ ${result.message}`);

      // Verificar estadísticas después
      console.log('\n📊 Verificando limpieza...');
      const statsAfter = await getCommentsStats();

      if (statsAfter.success) {
        console.log(`📈 Comentarios restantes: ${statsAfter.totalComments}`);

        if (statsAfter.totalComments === 0) {
          console.log('🎉 ¡Limpieza completada exitosamente! La base de datos está como nueva.');
        } else {
          console.log('⚠️ Algunos comentarios podrían no haberse eliminado.');
        }
      }
    } else {
      console.error(`❌ Error durante la limpieza: ${result.message}`);
    }
  } else {
    console.error('❌ No se pudieron obtener las estadísticas de la base de datos');
  }
};

// Ejecutar automáticamente si se llama directamente
if (typeof window !== 'undefined') {
  // En el navegador
  console.log('🌐 Script de limpieza cargado. Ejecuta runCleanup() para limpiar los comentarios.');
  window.runCleanup = runCleanup;
} else {
  // En Node.js
  runCleanup().catch(console.error);
}

export default runCleanup;