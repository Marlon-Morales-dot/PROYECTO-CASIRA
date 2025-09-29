import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../infrastructure/ui/providers/AppProvider.jsx';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import ParticlesBackground from './ParticlesBackground.jsx';

export default function ProfessionalLogin() {
  const navigate = useNavigate();
  const { loginWithCasira, loginWithGoogle, isLoading, error, isAuthenticated, user } = useAuth();

  // Verificar si ya está autenticado y redirigir
  React.useEffect(() => {
    if (isAuthenticated && user) {
      console.log('🔄 Usuario ya autenticado, redirigiendo...', user);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await loginWithCasira(formData.email, formData.password);
      if (result.success) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleGoogleLogin = async () => {
    try {
      console.log('🔐 ProfessionalLogin: Iniciando Google Auth con context...');

      // Usar directamente el método del contexto que incluye toda la lógica
      const result = await loginWithGoogle();

      if (result && result.success) {
        console.log('✅ ProfessionalLogin: Google Auth exitoso a través del contexto', result.user);

        // El contexto ya actualiza el estado, solo necesitamos redirigir
        setTimeout(() => {
          const redirectPath = result.user.role === 'admin' ? '/admin' : '/dashboard';
          console.log('🔄 Redirigiendo a:', redirectPath);
          navigate(redirectPath, { replace: true });
        }, 1000); // Aumentar delay para asegurar que el estado se actualice
      } else {
        console.error('❌ Google Auth falló:', result?.message);
        alert('❌ Error en la autenticación. Intenta de nuevo.');
      }
    } catch (error) {
      console.error('❌ ProfessionalLogin: Error en Google Auth:', error);

      // Mensaje de error más amigable
      if (error.message.includes('popup')) {
        alert('❌ La ventana de Google se cerró. Por favor intenta de nuevo.');
      } else if (error.message.includes('network')) {
        alert('❌ Error de conexión. Verifica tu internet e intenta de nuevo.');
      } else {
        alert('❌ Error al conectar con Google. Intenta de nuevo o usa el login tradicional.');
      }
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
        {/* Particles Background */}
        <ParticlesBackground
          containerId="login-particles"
          config={{
            particles: {
              number: {
                value: 60,
                density: {
                  enable: true,
                  value_area: 800
                }
              },
              color: {
                value: "#ffffff"
              },
              shape: {
                type: "circle"
              },
              opacity: {
                value: 0.4,
                random: true,
                anim: {
                  enable: true,
                  speed: 0.8,
                  opacity_min: 0.1,
                  sync: false
                }
              },
              size: {
                value: 2,
                random: true,
                anim: {
                  enable: true,
                  speed: 2,
                  size_min: 0.5,
                  sync: false
                }
              },
              line_linked: {
                enable: true,
                distance: 120,
                color: "#ffffff",
                opacity: 0.3,
                width: 1
              },
              move: {
                enable: true,
                speed: 1,
                direction: "none",
                random: true,
                straight: false,
                out_mode: "out",
                bounce: false
              }
            },
            interactivity: {
              detect_on: "canvas",
              events: {
                onhover: {
                  enable: true,
                  mode: "grab"
                },
                onclick: {
                  enable: false
                },
                resize: true
              },
              modes: {
                grab: {
                  distance: 140,
                  line_linked: {
                    opacity: 0.6
                  }
                }
              }
            },
            retina_detect: true
          }}
        />

        {/* Geometric Background Pattern - reduced opacity */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cGF0aCBkPSJNMzYgMzRjMC0yIDItNCA0LTRzNCwyIDQsNHMtMiw0LTQsNHMtNC0yLTQtNHptLTIwIDJjMC0yIDItNCA0LTRzNCwyIDQsNHMtMiw0LTQsNHMtNC0yLTQtNHptMjAgMGMwLTIgMi00IDQtNHM0LDIgNCw0cy0yLDQtNCw0cy00LTItNC00eiIgZmlsbD0iI2ZmZmZmZiIvPgo8L3N2Zz4K')]"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          {/* CASIRA Logo */}
          <div className="mb-8">
            <div className="flex items-center space-x-3">
              {/* Logo Icon */}
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-4xl font-bold">CASIRA</h1>
                <p className="text-blue-200 font-medium">Connect</p>
              </div>
            </div>
          </div>

          {/* Mission Statement */}
          <div className="space-y-6">
            <h2 className="text-3xl font-bold leading-tight">
              Conectando comunidades,<br />
              construyendo futuro
            </h2>
            <p className="text-lg text-blue-100 leading-relaxed max-w-md">
              Plataforma integral para la gestión de proyectos sociales y colaboración comunitaria.
            </p>
          </div>

          {/* Features */}
          <div className="mt-12 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-lg">✨</span>
              </div>
              <span className="text-blue-100">Gestión integral de voluntarios</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-lg">🤝</span>
              </div>
              <span className="text-blue-100">Colaboración comunitaria efectiva</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-lg">📊</span>
              </div>
              <span className="text-blue-100">Análisis de impacto social</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Iniciar Sesión</h2>
            <p className="text-gray-600 mt-2">Accede a tu cuenta profesional CASIRA</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="block w-full pl-12 pr-4 py-4 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="block w-full pl-12 pr-12 py-4 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-4 px-6 border border-transparent text-lg font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform hover:scale-[1.02] transition-all duration-200 disabled:hover:scale-100"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                  Iniciando sesión...
                </>
              ) : (
                <>
                  Iniciar Sesión
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-gray-50 text-gray-500 font-medium">O continúa con</span>
              </div>
            </div>

            {/* Google Login Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="group relative w-full overflow-hidden py-4 px-6 text-lg font-semibold rounded-xl text-gray-800 bg-white border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transform hover:scale-[1.02] transition-all duration-200 disabled:hover:scale-100"
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent transform skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

              <span className="relative flex items-center justify-center">
                {/* Google Logo */}
                <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
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
                <span className="font-semibold text-gray-700">
                  Continuar con Google
                </span>
              </span>
            </button>

            {/* Botón temporal para navegar manualmente si ya autenticado */}
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => navigate(user?.role === 'admin' ? '/admin' : '/dashboard', { replace: true })}
                className="w-full mt-4 py-3 px-6 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors"
              >
                🚀 Ya autenticado - Ir al Dashboard
              </button>
            )}
          </form>

          {/* Footer Links */}
          <div className="text-center space-y-4">
            <div className="text-sm text-gray-500">
              ¿Primera vez en CASIRA Connect?{' '}
              <button
                className="text-blue-600 hover:text-blue-700 font-medium"
                onClick={() => navigate('/register')}
              >
                Crear cuenta CASIRA
              </button>
            </div>
            <div className="text-sm text-gray-500">
              O{' '}
              <button
                className="text-blue-600 hover:text-blue-700 font-medium"
                onClick={() => navigate('/activities')}
              >
                explorar como visitante
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}