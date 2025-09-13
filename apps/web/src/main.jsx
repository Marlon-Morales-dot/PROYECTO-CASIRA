/**
 * main.jsx - NUEVA VERSIÓN CON BOOTSTRAP
 * Inicialización limpia con arquitectura hexagonal
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { appBootstrap } from './shared/utils/AppBootstrap.jsx';
import { configManager } from './shared/utils/ConfigManager.js';
import { eventBus, DomainEvents } from './shared/utils/EventBus.js';
import './index.css';

/**
 * Componente de aplicación con manejo de errores
 */
function AppWithErrorBoundary() {
  const [hasError, setHasError] = React.useState(false);
  const [errorInfo, setErrorInfo] = React.useState(null);

  React.useEffect(() => {
    // Listener para errores de la aplicación
    const unsubscribe = eventBus.on(DomainEvents.ERROR_OCCURRED, (eventData) => {
      setHasError(true);
      setErrorInfo(eventData.data);
    });

    return unsubscribe;
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-red-500">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 19c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Error en la aplicación
          </h1>
          <p className="text-gray-600 mb-6">
            {errorInfo?.error || 'Ha ocurrido un error inesperado'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Recargar aplicación
          </button>
          {configManager.get('app.debug', false) && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-gray-500">
                Detalles técnicos
              </summary>
              <pre className="mt-2 text-xs text-gray-600 overflow-auto">
                {JSON.stringify(errorInfo, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }

  return <App />;
}

/**
 * Inicialización de la aplicación
 */
async function initializeApp() {
  try {
    console.log('🚀 [CASIRA] Initializing application...');
    
    // Pre-inicializar bootstrap para detectar errores tempranos
    await appBootstrap.initialize();
    
    console.log('✅ [CASIRA] Application bootstrap completed');
    
    // Renderizar aplicación
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(
      <React.StrictMode>
        <AppWithErrorBoundary />
      </React.StrictMode>
    );
    
    console.log('✅ [CASIRA] Application rendered successfully');
    
  } catch (error) {
    console.error('❌ [CASIRA] Failed to initialize application:', error);
    
    // Mostrar error de inicialización
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-red-500">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Error de inicialización
          </h1>
          <p className="text-gray-600 mb-6">
            No se pudo inicializar CASIRA Connect. 
            Por favor recarga la página.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
          >
            Recargar página
          </button>
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-sm text-gray-500">
              Error técnico
            </summary>
            <pre className="mt-2 text-xs text-red-600 overflow-auto">
              {error.message}
            </pre>
          </details>
        </div>
      </div>
    );
  }
}

// Inicializar aplicación
initializeApp();