// ============= CASIRA Enhanced Login - Con Google Auth y Storage Avanzado =============

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, Loader2, User } from 'lucide-react';
import { enhancedAPI } from '../lib/api-enhanced.js';

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
      
      // Buscar usuario por email en el storage
      const user = await enhancedAPI.usersAPI.getUserByEmail(formData.email);
      
      if (!user) {
        setError('Usuario no encontrado. ¿Deseas registrarte con Google?');
        setIsLoading(false);
        return;
      }

      // Para demo, aceptar cualquier password para usuarios existentes
      // En producción, aquí verificarías el hash de la contraseña
      console.log('✅ Usuario encontrado, iniciando sesión:', user.email);
      
      // Actualizar último login
      await enhancedAPI.usersAPI.updateUserProfile(user.id, {
        last_login: new Date().toISOString()
      });

      handleSuccessfulAuth(user);
      
    } catch (error) {
      console.error('❌ Error en login interno:', error);
      setError('Error al iniciar sesión. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!googleAuthReady) {
      setError('Google Auth no está disponible en este momento');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('🔐 Iniciando login con Google...');
      
      const googleUser = await enhancedAPI.usersAPI.authenticateWithGoogle();
      
      if (googleUser) {
        console.log('✅ Login Google exitoso:', googleUser.email);
        setSuccess('Autenticación exitosa con Google');
        handleSuccessfulAuth(googleUser);
      }
      
    } catch (error) {
      console.error('❌ Error en login Google:', error);
      
      // Manejar errores específicos
      if (error.message.includes('cerró la ventana')) {
        setError('Autenticación cancelada');
      } else if (error.message.includes('denegado')) {
        setError('Acceso denegado. Revisa los permisos de tu cuenta.');
      } else {
        setError('Error conectando con Google. Intenta nuevamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignOut = async () => {
    try {
      setIsLoading(true);
      await enhancedAPI.usersAPI.signOutGoogle();
      
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
      provider: user.provider
    });

    let processedUser = user;
    
    // Si es un usuario de Google, usar el endpoint del backend
    if (user.id && (user.id.includes('google') || user.google_id)) {
      try {
        console.log('🔐 Autenticando usuario de Google via backend...');
        processedUser = await enhancedAPI.usersAPI.authenticateWithGoogle(user);
        console.log('✅ Usuario de Google procesado:', processedUser);
      } catch (error) {
        console.error('❌ Error autenticando con backend:', error);
        setError('Error conectando con el servidor. Inténtalo de nuevo.');
        return;
      }
    }

    // Guardar datos de sesión
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('casira-current-user', JSON.stringify(processedUser));
    }

    // Redirigir basado en el rol del usuario procesado
    switch (processedUser.role) {
      case 'admin':
        navigate('/admin');
        break;
      case 'volunteer':
        navigate('/dashboard');
        break;
      case 'donor':
        navigate('/dashboard');
        break;
      case 'visitor':
      default:
        navigate('/visitor');
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <User className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">CASIRA Connect</h1>
          <p className="text-gray-600">Inicia sesión en tu cuenta</p>
        </div>

        {/* Alertas */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
            <span className="text-green-700 text-sm">{success}</span>
          </div>
        )}

        {/* Usuario Google actual */}
        {isGoogleSignedIn && googleUser && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {googleUser.avatar_url && (
                  <img 
                    src={googleUser.avatar_url} 
                    alt="Avatar" 
                    className="w-8 h-8 rounded-full mr-3"
                  />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {googleUser.full_name || `${googleUser.first_name} ${googleUser.last_name}`}
                  </p>
                  <p className="text-xs text-gray-600">{googleUser.email}</p>
                  <p className="text-xs text-blue-600 font-medium">
                    Rol: {googleUser.role || 'visitor'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleGoogleSignOut}
                disabled={isLoading}
                className="text-xs text-red-600 hover:text-red-800 font-medium"
              >
                Cerrar sesión
              </button>
            </div>
            <button
              onClick={() => handleSuccessfulAuth(googleUser)}
              className="mt-3 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Continuar como {googleUser.full_name}
            </button>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-xl p-8">
          {/* Pestañas de autenticación */}
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setAuthMode('internal')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                authMode === 'internal' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Login Tradicional
            </button>
            <button
              onClick={() => setAuthMode('google')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                authMode === 'google' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Google Auth
            </button>
          </div>

          {/* Formulario de login tradicional */}
          {authMode === 'internal' && (
            <form onSubmit={handleInternalLogin} className="space-y-6">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="tu@email.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="Tu contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
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
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-gray-600 mb-6">
                  Usa tu cuenta de Google para acceder de forma rápida y segura
                </p>
                
                {!isGoogleSignedIn ? (
                  <button
                    onClick={handleGoogleLogin}
                    disabled={isLoading || !googleAuthReady}
                    className="w-full bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Conectando con Google...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
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

        {/* Cuentas demo */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">🎮 Cuentas Demo:</h3>
          <div className="space-y-2">
            {getDemoCredentials().map((account, index) => (
              <button
                key={index}
                onClick={() => {
                  setFormData({ email: account.email, password: 'demo' });
                  setAuthMode('internal');
                }}
                className="w-full text-left p-3 bg-white rounded border hover:border-green-300 transition-colors"
              >
                <div className="font-medium text-sm text-gray-900">{account.email}</div>
                <div className="text-xs text-gray-600">{account.role} - {account.desc}</div>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            💡 Click en cualquier cuenta para usar credenciales demo
          </p>
        </div>

        {/* Info adicional */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Sistema con almacenamiento persistente y Google Auth integrado
          </p>
          <div className="mt-2 flex justify-center items-center space-x-4 text-xs text-gray-500">
            <span>🔒 Sesión segura</span>
            <span>💾 Datos persistentes</span>
            <span>🔄 Sync automático</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedLogin;