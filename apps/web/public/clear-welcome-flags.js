// Script para limpiar las banderas de bienvenida manualmente si es necesario
// Solo para desarrollo/debugging
(function() {
  console.log('🧹 Limpiando banderas de bienvenida...');
  
  let cleared = 0;
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('hasShownWelcome_')) {
      localStorage.removeItem(key);
      cleared++;
    }
  });
  
  console.log(`✅ ${cleared} banderas de bienvenida eliminadas`);
  console.log('🔄 Recarga la página para ver el mensaje de bienvenida nuevamente');
})();