/**
 * GoogleOAuthButton - Molecule Component
 * Botón de Google OAuth con diseño exacto del cliente
 * Extraído de App.jsx manteniendo toda la funcionalidad y estilos
 */

import React, { useState } from 'react';
import { useAuth } from '../providers/AppProvider.jsx';

const GoogleOAuthButton = ({ 
  onSuccess, 
  onError, 
  disabled = false, 
  className = "",
  children 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { loginWithGoogle } = useAuth();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      console.log('🔐 Starting REAL Google Authentication...');

      // Usar el servicio unificado de Google Auth a través del provider
      const result = await loginWithGoogle();

      if (result && result.success) {
        console.log('✅ Google Auth success');

        if (onSuccess) {
          onSuccess(result.user);
        }
      } else {
        const errorMsg = result?.message || 'Error de autenticación';
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('❌ Google OAuth error:', error);
      let errorMessage = 'Error al iniciar sesión con Google. Por favor intenta de nuevo.';
      
      if (error.message?.includes('initialize')) {
        errorMessage = '⏱️ Google Auth está cargando. Por favor espera un momento y vuelve a intentar.';
      } else if (error.message?.includes('popup')) {
        errorMessage = '😫 La ventana de Google se cerró. Por favor intenta de nuevo.';
      } else if (error.message?.includes('network')) {
        errorMessage = '🌐 Error de conexión. Verifica tu internet e intenta de nuevo.';
      }
      
      // Create error with user-friendly message
      const userFriendlyError = new Error(errorMessage);
      userFriendlyError.originalError = error;
      
      if (onError) onError(userFriendlyError);
    } finally {
      setIsLoading(false);
    }
  };

  const isButtonDisabled = disabled || isLoading;

  return (
    <div className={`relative ${className}`}>
      {/* Glow effect background */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 to-blue-500 rounded-2xl opacity-20 group-hover:opacity-40 blur-sm transition-opacity duration-500"></div>
      
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isButtonDisabled}
        className="group relative w-full overflow-hidden py-4 px-6 text-lg font-semibold rounded-2xl text-gray-800 bg-white/95 backdrop-blur-md border-2 border-gray-200/50 hover:border-gray-300 hover:bg-white hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 shadow-lg transform hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 disabled:hover:transform-none disabled:hover:scale-100"
      >
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent transform skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
              <span className="text-blue-600 font-medium">Redirigiendo...</span>
            </div>
          </div>
        )}
        
        <span className="relative flex items-center justify-center">
          {/* Google Logo with enhanced styling */}
          <div className="relative mr-3">
            <div className="absolute -inset-1 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 to-blue-500 rounded-full opacity-20 blur-sm"></div>
            <svg className="relative w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          </div>
          
          <span className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent font-bold">
            {isLoading ? 'Conectando con Google...' : (children || 'Continuar con Google')}
          </span>
        </span>
      </button>
    </div>
  );
};

export default GoogleOAuthButton;