// ============= CASIRA Enhanced Login - Con Google Auth y Storage Avanzado =============

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, Loader2, User } from 'lucide-react';
import { enhancedAPI } from '../lib/api-enhanced.js';
import unifiedGoogleAuth from '../lib/services/unified-google-auth.service.js';

const EnhancedLogin = () => {
  const navigate = useNavigate();
  
  // Estados del componente
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState('internal'); // 'internal' o 'google'
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [googleAuthReady, setGoogleAuthReady] = useState(false);

  // Estado de Google Auth
  const [googleUser, setGoogleUser] = useState(null);
  const [isGoogleSignedIn, setIsGoogleSignedIn] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);

  useEffect(() => {
    checkGoogleAuthStatus();
    setupGoogleAuthListener();
  }, []);

  const checkGoogleAuthStatus = () => {
    try {
      const isSignedIn = enhancedAPI.usersAPI.isGoogleSignedIn();
      const currentUser = enhancedAPI.usersAPI.getCurrentGoogleUser();
      
      setIsGoogleSignedIn(isSignedIn);
      setGoogleUser(currentUser);
      setGoogleAuthReady(true);

      // Si ya está autenticado, redirigir automáticamente
      if (isSignedIn && currentUser) {
        console.log('🔄 Usuario ya autenticado con Google, redirigiendo...', currentUser.email);
        handleSuccessfulAuth(currentUser);
      }

      console.log('🔍 Estado de Google Auth:', { isSignedIn, hasUser: !!currentUser });
    } catch (error) {
      console.warn('⚠️ Error verificando estado de Google Auth:', error);
      setGoogleAuthReady(true); // Continuar sin Google Auth
    }
  };

  const setupGoogleAuthListener = () => {
    // Escuchar cambios en la autenticación de Google
    const unsubscribe = enhancedAPI.googleAuth.addAuthListener((event, userData) => {
      console.log('🔐 Evento de autenticación Google:', event, userData?.email);
      
      if (event === 'signin' && userData) {
        setGoogleUser(userData);
        setIsGoogleSignedIn(true);
        handleSuccessfulAuth(userData);
      } else if (event === 'signout') {
        setGoogleUser(null);
        setIsGoogleSignedIn(false);
        setSuccess('Sesión cerrada exitosamente');
      }
    });

    return unsubscribe;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar errores mientras el usuario escribe
    if (error) setError('');
  };

  const handleInternalLogin = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('Por favor completa todos los campos');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('🔐 Iniciando login interno para:', formData.email);
      
      // Usar la API simple del authAPI
      const user = await enhancedAPI.authAPI.login(formData.email, formData.password);
      
      if (user) {
        console.log('✅ Login exitoso:', user.email);
        setSuccess('Iniciando sesión...');
        
        // Guardar usuario en la sesión
        enhancedAPI.authAPI.setCurrentUser(user);
        
        handleSuccessfulAuth(user);
      }
      
    } catch (error) {
      console.error('❌ Error en login interno:', error);
      setError(error.message || 'Error al iniciar sesión. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async (event) => {
    // Prevenir doble clic con multiple validaciones
    const now = Date.now();
    if (isLoading || (now - lastClickTime < 1000)) {
      console.log('🔄 Login ya en proceso o clic muy rápido, ignorando');
      return;
    }
    
    setLastClickTime(now);
    
    // Prevenir propagación del evento
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    // Establecer loading inmediatamente para prevenir clics rápidos
    setIsLoading(true);
    setError('');
    
    // Pequeño delay para evitar race conditions
    await new Promise(resolve => setTimeout(resolve, 150));

    try {
      console.log('🔐 Iniciando login con Google (Unified)...');
      
      // Usar el nuevo servicio unificado que maneja COOP y CSP automáticamente
      const googleUser = await unifiedGoogleAuth.signIn();
      
      if (googleUser) {
        console.log('✅ Login Google exitoso:', googleUser.email);
        
        // Guardar en API local también
        enhancedAPI.authAPI.setCurrentUser(googleUser);
        
        setSuccess(`Autenticación exitosa con Google - Bienvenido como ${googleUser.role}`);
        handleSuccessfulAuth(googleUser);
      }
      
    } catch (error) {
      console.error('❌ Error en login Google:', error);
      setError(error.message || 'Error conectando con Google. Intenta el formulario local.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignOut = async () => {
    try {
      setIsLoading(true);
      await unifiedGoogleAuth.signOut();
      
      setGoogleUser(null);
      setIsGoogleSignedIn(false);
      setSuccess('Sesión cerrada exitosamente');
      
    } catch (error) {
      console.error('❌ Error cerrando sesión Google:', error);
      setError('Error cerrando sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccessfulAuth = async (user) => {
    console.log('🎉 Autenticación exitosa, redirigiendo usuario:', {
      email: user.email,
      role: user.role,
      provider: user.provider || 'local'
    });

    // Guardar datos de sesión en múltiples lugares para asegurar persistencia
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('casira-current-user', JSON.stringify(user));
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('casira-current-user', JSON.stringify(user));
      }
      
      console.log('💾 Usuario guardado en sesión:', user.email);
      
      // Agregar un pequeño delay para asegurar que el estado se guarde
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error('❌ Error guardando sesión:', error);
    }

    // Redirigir basado en el rol del usuario
    console.log('🚀 Redirigiendo a:', user.role);
    
    switch (user.role) {
      case 'admin':
        navigate('/admin', { replace: true });
        break;
      case 'volunteer':
        navigate('/dashboard', { replace: true });
        break;
      case 'donor':
        navigate('/dashboard', { replace: true });
        break;
      case 'visitor':
      default:
        navigate('/visitor', { replace: true });
        break;
    }
  };

  const getDemoCredentials = () => {
    return [
      { email: 'admin@casira.org', role: 'Administrador', desc: 'Acceso completo al sistema' },
      { email: 'ana.lopez@email.com', role: 'Visitante', desc: 'Portal renovado tipo red social' },
      { email: 'carlos.martinez@email.com', role: 'Voluntario', desc: 'Dashboard de voluntarios' },
      { email: 'donante@ejemplo.com', role: 'Donante', desc: 'Portal de donaciones' }
    ];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-100 to-blue-100 rounded-full mb-4 shadow-sm">
            <User className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
            CASIRA Connect
          </h1>
          <p className="text-gray-600 text-base sm:text-lg leading-relaxed px-2">
            Inicia sesión en tu cuenta
          </p>
        </div>

        {/* Alertas */}
        {error && (
          <div className="mb-6 p-4 sm:p-5 bg-red-50 border-2 border-red-200 rounded-xl sm:rounded-2xl flex items-center animate-fade-in shadow-sm">
            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 mr-3 flex-shrink-0" />
            <span className="text-red-700 text-sm sm:text-base font-medium">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 sm:p-5 bg-green-50 border-2 border-green-200 rounded-xl sm:rounded-2xl flex items-center animate-fade-in shadow-sm">
            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 mr-3 flex-shrink-0" />
            <span className="text-green-700 text-sm sm:text-base font-medium">{success}</span>
          </div>
        )}

        {/* Usuario Google actual */}
        {isGoogleSignedIn && googleUser && (
          <div className="mb-6 p-5 sm:p-6 bg-blue-50 border-2 border-blue-200 rounded-xl sm:rounded-2xl shadow-sm animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="flex items-center">
                {googleUser.avatar_url && (
                  <img 
                    src={googleUser.avatar_url} 
                    alt="Avatar" 
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full mr-4 border-2 border-white shadow-sm"
                  />
                )}
                <div>
                  <p className="text-sm sm:text-base font-semibold text-gray-900">
                    {googleUser.full_name || `${googleUser.first_name} ${googleUser.last_name}`}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">{googleUser.email}</p>
                  <p className="text-xs sm:text-sm text-blue-600 font-medium">
                    Rol: {googleUser.role || 'visitor'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleGoogleSignOut}
                disabled={isLoading}
                className="text-xs sm:text-sm text-red-600 hover:text-red-800 font-medium px-3 py-1 rounded-lg hover:bg-red-100 transition-colors btn-touch"
              >
                Cerrar sesión
              </button>
            </div>
            <button
              onClick={() => handleSuccessfulAuth(googleUser)}
              className="mt-4 w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 sm:py-4 px-4 rounded-xl sm:rounded-2xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] btn-touch"
            >
              Continuar como {googleUser.full_name || googleUser.first_name}
            </button>
          </div>
        )}

        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 overflow-hidden transform transition-all duration-300 hover:shadow-2xl">
          <div className="p-6 sm:p-8 lg:p-10 space-y-6">
            {/* Pestañas de autenticación */}
            <div className="flex mb-6 sm:mb-8 bg-gray-50 rounded-xl p-1.5">
              <button
                onClick={() => setAuthMode('internal')}
                className={`flex-1 py-3 sm:py-4 px-4 sm:px-6 rounded-lg text-sm sm:text-base font-semibold transition-all duration-200 btn-touch ${
                  authMode === 'internal' 
                    ? 'bg-white text-gray-900 shadow-sm border border-gray-200 transform scale-105' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Login Tradicional
              </button>
              <button
                onClick={() => setAuthMode('google')}
                className={`flex-1 py-3 sm:py-4 px-4 sm:px-6 rounded-lg text-sm sm:text-base font-semibold transition-all duration-200 btn-touch ${
                  authMode === 'google' 
                    ? 'bg-white text-gray-900 shadow-sm border border-gray-200 transform scale-105' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Google Auth
              </button>
            </div>

            {/* Formulario de login tradicional */}
            {authMode === 'internal' && (
              <form onSubmit={handleInternalLogin} className="space-y-6 sm:space-y-8">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm sm:text-base font-semibold text-gray-700 mb-3">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 sm:w-6 sm:h-6" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-12 sm:pl-14 pr-4 py-4 sm:py-5 text-base border-2 border-gray-200 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="tu@email.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm sm:text-base font-semibold text-gray-700 mb-3">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 sm:w-6 sm:h-6" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-12 sm:pl-14 pr-14 py-4 sm:py-5 text-base border-2 border-gray-200 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="Tu contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 btn-touch"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Eye className="w-5 h-5 sm:w-6 sm:h-6" />}
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 sm:py-5 px-6 rounded-xl sm:rounded-2xl hover:from-green-700 hover:to-green-800 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] btn-touch"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin mr-3" />
                    Iniciando sesión...
                  </div>
                ) : (
                  'Iniciar Sesión'
                )}
              </button>
              </form>
            )}

            {/* Google Auth */}
            {authMode === 'google' && (
              <div className="space-y-6 sm:space-y-8">
              <div className="text-center">
                <p className="text-gray-600 mb-6">
                  Usa tu cuenta de Google para acceder de forma rápida y segura
                </p>
                
                {!isGoogleSignedIn ? (
                  <button
                    onClick={handleGoogleLogin}
                    disabled={isLoading || !googleAuthReady}
                    style={{ pointerEvents: isLoading ? 'none' : 'auto' }}
                    className={`w-full py-4 sm:py-5 px-6 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-semibold text-base sm:text-lg flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] btn-touch ${
                      isLoading 
                        ? 'bg-blue-100 border-2 border-blue-300 text-blue-700 cursor-not-allowed' 
                        : 'bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Conectando con Google...
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Continuar con Google
                      </>
                    )}
                  </button>
                ) : (
                  <p className="text-green-600 font-medium">
                    ✅ Autenticado con Google como {googleUser?.email}
                  </p>
                )}
              </div>

              {!googleAuthReady && (
                <div className="text-center text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg">
                  ⏳ Cargando Google Auth...
                </div>
              )}
              </div>
            )}
          </div>
        </div>

        {/* Cuentas demo */}
        <div className="mt-8 bg-gray-50 rounded-xl sm:rounded-2xl p-5 sm:p-6 border border-gray-200">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-4">🎮 Cuentas Demo:</h3>
          <div className="space-y-3">
            {getDemoCredentials().map((account, index) => (
              <button
                key={index}
                onClick={() => {
                  setFormData({ email: account.email, password: 'demo' });
                  setAuthMode('internal');
                }}
                className="w-full text-left p-3 sm:p-4 bg-white rounded-lg sm:rounded-xl border-2 border-gray-100 hover:border-green-300 hover:shadow-md transition-all duration-200 transform hover:scale-[1.02] btn-touch"
              >
                <div className="font-semibold text-sm sm:text-base text-gray-900">{account.email}</div>
                <div className="text-xs sm:text-sm text-gray-600 mt-1">{account.role} - {account.desc}</div>
              </button>
            ))}
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-4">
            💡 Click en cualquier cuenta para usar credenciales demo
          </p>
        </div>

        {/* Info adicional */}
        <div className="mt-6 text-center">
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed px-2">
            Sistema con almacenamiento persistente y Google Auth integrado
          </p>
          <div className="mt-3 flex flex-wrap justify-center items-center gap-4 sm:gap-6 text-xs sm:text-sm text-gray-500">
            <span className="flex items-center">🔒 Sesión segura</span>
            <span className="flex items-center">💾 Datos persistentes</span>
            <span className="flex items-center">🔄 Sync automático</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedLogin;