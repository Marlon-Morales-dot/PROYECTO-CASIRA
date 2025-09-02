// ============= CASIRA Simple Login - Solo Local Auth =============
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, Loader2, User, UserPlus } from 'lucide-react';
import { authAPI } from '@/lib/api.js';

const SimpleLogin = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (error) setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('Por favor completa email y contraseña');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('🔐 Iniciando login para:', formData.email);
      
      const user = await authAPI.login(formData.email, formData.password);
      
      if (user) {
        console.log('✅ Login exitoso:', user.email, 'Rol:', user.role);
        setSuccess('¡Login exitoso! Redirigiendo...');
        
        // Guardar usuario en la sesión
        authAPI.setCurrentUser(user);
        
        // Esperar un momento para mostrar el mensaje
        setTimeout(() => {
          // Redirigir basado en rol
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
        }, 1000);
      }
      
    } catch (error) {
      console.error('❌ Error en login:', error);
      setError(error.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password || !formData.firstName) {
      setError('Por favor completa todos los campos requeridos');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('📝 Registrando usuario:', formData.email);
      
      const newUser = await authAPI.register({
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName || 'Usuario'
      });
      
      if (newUser) {
        console.log('✅ Registro exitoso:', newUser.email, 'Rol:', newUser.role);
        setSuccess('¡Registro exitoso! Iniciando sesión...');
        
        // Guardar usuario en la sesión
        authAPI.setCurrentUser(newUser);
        
        // Esperar un momento y redirigir
        setTimeout(() => {
          navigate('/visitor', { replace: true }); // Todos los nuevos usuarios van a visitor
        }, 1000);
      }
      
    } catch (error) {
      console.error('❌ Error en registro:', error);
      setError(error.message || 'Error al registrar usuario');
    } finally {
      setIsLoading(false);
    }
  };

  const getDemoCredentials = () => {
    return [
      { email: 'admin@casira.org', password: 'admin123', role: 'Administrador', desc: 'Acceso completo' },
      { email: 'test@visitor.com', password: 'demo123', role: 'Visitante', desc: 'Usuario regular' },
      { email: 'volunteer@test.com', password: 'demo123', role: 'Visitante', desc: 'Nuevo usuario (visitor)' }
    ];
  };

  const handleDemoLogin = (email, password) => {
    setFormData(prev => ({ ...prev, email, password }));
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
          <p className="text-gray-600">
            {isRegistering ? 'Crear cuenta nueva' : 'Inicia sesión en tu cuenta'}
          </p>
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

        {/* Main Form */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
            
            {/* Registro - Nombre */}
            {isRegistering && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Tu nombre"
                    required={isRegistering}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apellido
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Tu apellido"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="tu@email.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isRegistering ? <UserPlus className="w-5 h-5 mr-2" /> : <User className="w-5 h-5 mr-2" />}
                  {isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}
                </>
              )}
            </button>
          </form>

          {/* Toggle Mode */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError('');
                setSuccess('');
                setFormData({ email: '', password: '', firstName: '', lastName: '' });
              }}
              className="text-green-600 hover:text-green-700 text-sm font-medium"
            >
              {isRegistering 
                ? '¿Ya tienes cuenta? Inicia sesión' 
                : '¿No tienes cuenta? Regístrate'
              }
            </button>
          </div>
        </div>

        {/* Demo Credentials */}
        {!isRegistering && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              🧪 Credenciales Demo
            </h3>
            <div className="space-y-2">
              {getDemoCredentials().map((cred, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                  onClick={() => handleDemoLogin(cred.email, cred.password)}
                >
                  <div>
                    <div className="text-sm font-medium text-gray-800">{cred.email}</div>
                    <div className="text-xs text-gray-500">{cred.desc}</div>
                  </div>
                  <div className="text-xs font-medium text-green-600">{cred.role}</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3">
              💡 Haz clic en cualquier credencial para probar
            </p>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>Sistema de autenticación local - Sin Google Auth</p>
          <p>Todos los nuevos usuarios inician como "visitante"</p>
        </div>
      </div>
    </div>
  );
};

export default SimpleLogin;