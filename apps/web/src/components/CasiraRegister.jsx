import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../infrastructure/ui/providers/AppProvider.jsx';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, User, Check, X } from 'lucide-react';
import ParticlesBackground from './ParticlesBackground.jsx';

export default function CasiraRegister() {
  const navigate = useNavigate();
  const { registerWithCasira, isLoading, error, isAuthenticated, user } = useAuth();

  // Verificar si ya está autenticado y redirigir
  React.useEffect(() => {
    if (isAuthenticated && user) {
      console.log('🔄 Usuario ya autenticado, redirigiendo...', user);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailValidation, setEmailValidation] = useState({
    isChecking: false,
    exists: false,
    checked: false
  });

  // Función para verificar si el email existe
  const checkEmailExists = async (email) => {
    if (!email || !email.includes('@')) return;

    setEmailValidation(prev => ({ ...prev, isChecking: true }));

    try {
      const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'https://proyecto-casira.onrender.com';
      const response = await fetch(`${BACKEND_URL}/api/auth/check-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      setEmailValidation({
        isChecking: false,
        exists: data.exists,
        checked: true
      });

    } catch (error) {
      console.error('Error checking email:', error);
      setEmailValidation({
        isChecking: false,
        exists: false,
        checked: false
      });
    }
  };

  // Validar email con debounce
  React.useEffect(() => {
    if (formData.email) {
      const timeoutId = setTimeout(() => {
        checkEmailExists(formData.email);
      }, 500); // 500ms de debounce

      return () => clearTimeout(timeoutId);
    } else {
      setEmailValidation({ isChecking: false, exists: false, checked: false });
    }
  }, [formData.email]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar que las contraseñas coincidan
    if (formData.password !== formData.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    // Validar que el email no exista
    if (emailValidation.exists) {
      alert('Este email ya está registrado. Por favor usa otro email.');
      return;
    }

    try {
      console.log('🔐 CasiraRegister: Iniciando registro...');
      const result = await registerWithCasira({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        password: formData.password
      });

      if (result.success) {
        console.log('✅ CasiraRegister: Registro exitoso', result.user);
        // Redirigir según el rol del usuario
        const redirectPath = result.user.role === 'admin' ? '/admin' : '/dashboard';
        navigate(redirectPath, { replace: true });
      } else {
        console.error('❌ CasiraRegister: Registro falló:', result.message);
      }
    } catch (error) {
      console.error('❌ CasiraRegister: Error en registro:', error);
    }
  };

  // Función para generar email automáticamente
  const generateEmail = (firstName, lastName) => {
    if (!firstName || !lastName) return '';

    // Limpiar y obtener inicial del nombre
    const cleanFirstName = firstName.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z]/g, '');

    const firstInitial = cleanFirstName.charAt(0);

    // Limpiar apellido completo
    const cleanLastName = lastName.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z]/g, '');

    // Generar número único simple (2 dígitos)
    const randomNum = Math.floor(Math.random() * 99).toString().padStart(2, '0');

    // Formato simplificado: inicial + apellido + número
    // Ejemplo: eramirez09
    return `${firstInitial}${cleanLastName}${randomNum}@casira.org`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: value
      };

      // Auto-generar email solo si se cambia nombre o apellido Y el email está vacío o ya es un email @casira.org
      if ((name === 'first_name' || name === 'last_name') &&
          (!updated.email || updated.email.endsWith('@casira.org'))) {
        const otherField = name === 'first_name' ? updated.last_name : updated.first_name;
        updated.email = generateEmail(value, otherField);
      }

      return updated;
    });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 relative overflow-hidden">
        {/* Particles Background */}
        <ParticlesBackground
          containerId="register-particles"
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

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          {/* CASIRA Logo */}
          <div className="mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-4xl font-bold">CASIRA</h1>
                <p className="text-green-200 font-medium">Connect</p>
              </div>
            </div>
          </div>

          {/* Mission Statement */}
          <div className="space-y-6">
            <h2 className="text-3xl font-bold leading-tight">
              Únete a nuestra<br />
              comunidad de cambio
            </h2>
            <p className="text-lg text-green-100 leading-relaxed max-w-md">
              Crea tu cuenta CASIRA y forma parte de proyectos que transforman vidas.
            </p>
          </div>

          {/* Features */}
          <div className="mt-12 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-lg">🤝</span>
              </div>
              <span className="text-green-100">Conecta con voluntarios comprometidos</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-lg">🎯</span>
              </div>
              <span className="text-green-100">Participa en proyectos de impacto real</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-lg">📈</span>
              </div>
              <span className="text-green-100">Seguimiento de tu contribución social</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Crear Cuenta CASIRA</h2>
            <p className="text-gray-600 mt-2">Únete a nuestra comunidad de cambio</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre
                </label>
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  className="block w-full px-4 py-4 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                  placeholder="Juan"
                />
              </div>
              <div>
                <label htmlFor="last_name" className="block text-sm font-semibold text-gray-700 mb-2">
                  Apellido
                </label>
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                  className="block w-full px-4 py-4 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                  placeholder="Pérez"
                />
              </div>
            </div>

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
                  className={`block w-full pl-12 pr-12 py-4 text-gray-900 placeholder-gray-500 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm ${
                    emailValidation.checked
                      ? emailValidation.exists
                        ? 'border-red-300 focus:ring-red-600'
                        : 'border-green-300 focus:ring-green-600'
                      : 'border-gray-300 focus:ring-green-600'
                  }`}
                  placeholder="email@casira.org"
                />
                {/* Email validation icon */}
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                  {emailValidation.isChecking && (
                    <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
                  )}
                  {emailValidation.checked && !emailValidation.isChecking && (
                    emailValidation.exists ? (
                      <X className="h-5 w-5 text-red-500" />
                    ) : (
                      <Check className="h-5 w-5 text-green-500" />
                    )
                  )}
                </div>
              </div>
              {/* Email validation message */}
              <div className="mt-1 text-xs">
                {emailValidation.isChecking && (
                  <p className="text-gray-500">Verificando disponibilidad...</p>
                )}
                {emailValidation.checked && !emailValidation.isChecking && (
                  emailValidation.exists ? (
                    <p className="text-red-600 font-medium">❌ Este email ya está registrado</p>
                  ) : (
                    <p className="text-green-600 font-medium">✅ Email disponible</p>
                  )
                )}
                {!emailValidation.checked && !emailValidation.isChecking && (
                  <p className="text-gray-500">Se genera automáticamente con tu nombre, pero puedes editarlo</p>
                )}
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
                  minLength={6}
                  className="block w-full pl-12 pr-12 py-4 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
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

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="block w-full pl-12 pr-12 py-4 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                >
                  {showConfirmPassword ? (
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
              disabled={isLoading || emailValidation.exists || emailValidation.isChecking}
              className="group relative w-full flex justify-center py-4 px-6 border border-transparent text-lg font-semibold rounded-xl text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-4 focus:ring-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform hover:scale-[1.02] transition-all duration-200 disabled:hover:scale-100"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                  Creando cuenta...
                </>
              ) : (
                <>
                  Crear Cuenta CASIRA
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Footer Links */}
          <div className="text-center space-y-4">
            <div className="text-sm text-gray-500">
              ¿Ya tienes cuenta?{' '}
              <button
                className="text-green-600 hover:text-green-700 font-medium"
                onClick={() => navigate('/login')}
              >
                Iniciar sesión
              </button>
            </div>
            <div className="text-sm text-gray-500">
              O{' '}
              <button
                className="text-green-600 hover:text-green-700 font-medium"
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