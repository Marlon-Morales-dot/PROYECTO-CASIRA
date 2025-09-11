// ============= CASIRA Connect - Force Migration Tool =============
// Quick script to force migration and debug issues

console.log('🚀 CASIRA: Force Migration Tool Loading...');

// Create a migration button on the page for easy access
function createMigrationButton() {
  // Check if button already exists
  if (document.getElementById('casira-migration-btn')) return;

  const button = document.createElement('button');
  button.id = 'casira-migration-btn';
  button.innerHTML = '🔄 FORCE MIGRATE';
  button.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    z-index: 9999;
    background: #ff4444;
    color: white;
    border: none;
    padding: 10px 15px;
    border-radius: 5px;
    cursor: pointer;
    font-weight: bold;
    font-size: 12px;
  `;
  
  button.addEventListener('click', async () => {
    button.innerHTML = '⏳ MIGRATING...';
    button.disabled = true;
    
    try {
      // Import and run migration
      const api = await import('./api.js');
      console.log('🔄 CASIRA: Running forced migration via button...');
      
      // Try clean migration first
      if (api.migrationAPI && api.migrationAPI.cleanMigration) {
        await api.migrationAPI.cleanMigration();
      } else if (window.CASIRA_CLEAN_MIGRATE) {
        await window.CASIRA_CLEAN_MIGRATE();
      } else if (window.CASIRA_MIGRATE) {
        await window.CASIRA_MIGRATE();
      } else {
        console.error('❌ CASIRA: No migration functions available');
        alert('Migration functions not available');
      }
      
      button.innerHTML = '✅ DONE';
      button.style.background = '#44ff44';
      
      setTimeout(() => {
        button.innerHTML = '🔄 FORCE MIGRATE';
        button.style.background = '#ff4444';
        button.disabled = false;
      }, 3000);
      
    } catch (error) {
      console.error('❌ CASIRA: Button migration failed:', error);
      button.innerHTML = '❌ ERROR';
      button.style.background = '#ff0000';
      
      setTimeout(() => {
        button.innerHTML = '🔄 FORCE MIGRATE';
        button.style.background = '#ff4444';
        button.disabled = false;
      }, 3000);
    }
  });
  
  document.body.appendChild(button);
  console.log('🔘 CASIRA: Migration button created');
}

// Add button when DOM loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createMigrationButton);
} else {
  createMigrationButton();
}

// Also create button after a delay in case DOM changes
setTimeout(createMigrationButton, 1000);

console.log('✅ CASIRA: Force Migration Tool Ready');