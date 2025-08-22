import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Heart, Users, Building, Star, ArrowRight, Menu, X } from 'lucide-react';
import './App.css';

// Componente de Landing Page
function LandingPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar proyectos destacados
        const projectsResponse = await fetch('https://j6h5i7cpjd18.manus.space/api/projects/featured');
        const projectsData = await projectsResponse.json();
        setProjects(projectsData.projects || []);

        // Cargar estadísticas
        const statsResponse = await fetch('https://j6h5i7cpjd18.manus.space/api/projects/stats');
        const statsData = await statsResponse.json();
        setStats(statsData.stats || {});

        // Cargar posts
        const postsResponse = await fetch('https://j6h5i7cpjd18.manus.space/api/posts');
        const postsData = await postsResponse.json();
        setPosts(postsData.posts || []);

        setIsLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const impactStories = [
    {
      title: "Nueva Biblioteca en San Juan",
      description: "Gracias a nuestros donantes, 300 niños ahora tienen acceso a libros y tecnología",
      image: "https://www.eccastillayleon.org/wp-content/uploads/2016/12/Colegio-Santa-Clara-de-Asis-Palencia-03.jpg",
      donorCount: 12,
      impact: "300 niños beneficiados",
      beforeAfter: "De aula vacía a biblioteca completa"
    },
    {
      title: "Laboratorio de Ciencias Renovado",
      description: "El Liceo San Francisco ahora cuenta con equipamiento moderno para experimentos",
      image: "https://www.colegiosanfranciscodeasis.cl/csfda/wp-content/uploads/2016/10/CSFDA_infraestructura_lab_ciencias_2-1051x750.jpg",
      donorCount: 8,
      impact: "200 estudiantes beneficiados",
      beforeAfter: "De laboratorio básico a centro de innovación"
    },
    {
      title: "Centro Comunitario Construido",
      description: "Un espacio de encuentro que fortalece los lazos de toda la comunidad",
      image: "https://www.feyalegria.org.do/wp-content/uploads/2021/03/09.jpg",
      donorCount: 15,
      impact: "500 familias beneficiadas",
      beforeAfter: "De terreno baldío a centro comunitario"
    }
  ];

  const donorSpotlight = [
    {
      name: "Hermanos Franciscanos",
      type: "Organización Religiosa",
      contribution: "Infraestructura educativa",
      worksSupported: ["Liceo San Francisco", "Biblioteca Comunitaria", "Centro de Capacitación"],
      recognition: "Transformadores de Educación",
      avatar: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQyq5FXnebK1KS9Ld_fLAcHIX3gOT4vdHZIqkJLesTfrGSqz0mrIVAEGuyexBxDy1H2kCY&usqp=CAU"
    },
    {
      name: "Grupo Voluntarios Canadienses",
      type: "Grupo Internacional",
      contribution: "Trabajo especializado y capacitación",
      worksSupported: ["Laboratorio de Ciencias", "Programa Digital", "Capacitación Docente"],
      recognition: "Embajadores del Conocimiento",
      avatar: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRLRPJHsxku2OofJOiMa-aMJD29121Pxqotzw&s"
    },
    {
      name: "Constructora Solidaria",
      type: "Empresa Local",
      contribution: "Materiales y construcción",
      worksSupported: ["Centro Comunitario", "Aulas Nuevas", "Biblioteca"],
      recognition: "Constructores de Sueños",
      avatar: "https://hficprovinciadivinosalvador.com/wp-content/uploads/2023/05/2-3.jpg"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">CASIRA Connect</h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link to="/" className="text-gray-700 hover:text-blue-600">Inicio</Link>
              <Link to="/login" className="text-gray-700 hover:text-blue-600">Iniciar Sesión</Link>
              <Link to="/dashboard" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                Dashboard
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                🏗️ Red de Transformación Social
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Transforma comunidades a través de{' '}
                <span className="text-blue-600">obras que perduran</span>
              </h1>
              <p className="text-xl text-gray-600 max-w-lg">
                Únete a nuestra red de constructores de sueños que están 
                creando obras tangibles para las comunidades de Guatemala.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Ser Parte del Cambio
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
                <button className="inline-flex items-center px-6 py-3 border border-blue-600 text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50">
                  Ver Obras Realizadas
                  <Users className="ml-2 h-5 w-5" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-8 pt-4">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{stats.active_projects || 0}</div>
                  <div className="text-sm text-gray-600">Obras en Progreso</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{stats.completed_projects || 0}</div>
                  <div className="text-sm text-gray-600">Obras Completadas</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">1,200+</div>
                  <div className="text-sm text-gray-600">Vidas Transformadas</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS0ApgZmOJjv6vQHFt8vyUuVXgOTFiQrN8Umg&s" 
                alt="Comunidad transformada" 
                className="rounded-lg shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Donor Spotlight */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Nuestros Héroes: Constructores de Sueños
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Conoce a quienes hacen posible cada obra que transforma vidas
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {donorSpotlight.map((donor, index) => (
              <div key={index} className="bg-blue-50 border-2 border-blue-100 rounded-lg p-6 text-center">
                <img 
                  src={donor.avatar} 
                  alt={donor.name}
                  className="w-16 h-16 rounded-full mx-auto mb-4"
                />
                <h3 className="text-lg font-semibold text-blue-700 mb-1">{donor.name}</h3>
                <div className="inline-block px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded mb-2">
                  {donor.type}
                </div>
                <div className="inline-block px-2 py-1 border border-yellow-400 text-yellow-700 text-xs rounded mb-3">
                  {donor.recognition}
                </div>
                <p className="text-gray-600 text-sm italic mb-3">
                  "{donor.contribution}"
                </p>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-gray-700">Obras Apoyadas:</p>
                  {donor.worksSupported.slice(0, 2).map((work, i) => (
                    <p key={i} className="text-xs text-gray-600">• {work}</p>
                  ))}
                  {donor.worksSupported.length > 2 && (
                    <p className="text-xs text-blue-600">
                      +{donor.worksSupported.length - 2} obras más
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Stories */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Obras que Transforman: Antes y Después
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Cada obra cuenta una historia de transformación real y tangible
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {impactStories.map((story, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <img 
                  src={story.image} 
                  alt={story.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{story.title}</h3>
                  <p className="text-gray-600 mb-3">{story.description}</p>
                  <div className="inline-block px-3 py-1 bg-green-100 text-green-800 text-sm rounded mb-3">
                    {story.beforeAfter}
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="flex -space-x-2">
                        {Array.from({ length: Math.min(story.donorCount, 3) }).map((_, i) => (
                          <div key={i} className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white"></div>
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-600">
                        +{story.donorCount} constructores
                      </span>
                    </div>
                    <div className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                      {story.impact}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            ¿Listo para Construir el Futuro?
          </h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            Únete a nuestra red de constructores de sueños. 
            Tu participación, sin importar la forma, puede crear obras que perduren.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigate('/login')}
              className="px-6 py-3 bg-white text-blue-600 rounded-md font-medium hover:bg-gray-100"
            >
              Ser Constructor de Sueños
            </button>
            <button className="px-6 py-3 border border-white text-white rounded-md font-medium hover:bg-blue-700">
              Ver Obras Realizadas
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Building className="h-6 w-6 text-blue-400 mr-2" />
                <span className="text-lg font-semibold">CASIRA Connect</span>
              </div>
              <p className="text-gray-400">
                Transformando comunidades a través de obras que perduran.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Obras</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Proyectos Activos</li>
                <li>Obras Completadas</li>
                <li>Galería de Impacto</li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Comunidad</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Constructores</li>
                <li>Voluntarios</li>
                <li>Beneficiarios</li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Contacto</h3>
              <ul className="space-y-2 text-gray-400">
                <li>info@casira.org</li>
                <li>+502 1234-5678</li>
                <li>Guatemala, Guatemala</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 CASIRA Connect. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Componente de Login
function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch('https://j6h5i7cpjd18.manus.space/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/dashboard');
      } else {
        alert(data.error || 'Error en el inicio de sesión');
      }
    } catch (error) {
      alert('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const demoAccounts = [
    { email: 'admin@casira.org', password: 'admin123', role: 'Administrador' },
    { email: 'donante@ejemplo.com', password: 'donante123', role: 'Donante' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <Building className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Inicia sesión en CASIRA Connect
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Únete a la red de transformación social
          </p>
        </div>
        
        {/* Cuentas Demo */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Cuentas Demo:</h3>
          {demoAccounts.map((account, index) => (
            <div key={index} className="text-xs text-blue-700 mb-1">
              <strong>{account.role}:</strong> {account.email} / {account.password}
            </div>
          ))}
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Tu contraseña"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </div>

          <div className="text-center">
            <Link to="/" className="text-blue-600 hover:text-blue-500">
              ← Volver al inicio
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

// Componente de Dashboard
function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      navigate('/login');
      return;
    }
    
    setUser(JSON.parse(userData));
    
    // Cargar datos del dashboard
    const loadDashboardData = async () => {
      try {
        const [postsResponse, projectsResponse] = await Promise.all([
          fetch('https://j6h5i7cpjd18.manus.space/api/posts'),
          fetch('https://j6h5i7cpjd18.manus.space/api/projects')
        ]);
        
        const postsData = await postsResponse.json();
        const projectsData = await projectsResponse.json();
        
        setPosts(postsData.posts || []);
        setProjects(projectsData.projects || []);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };
    
    loadDashboardData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">CASIRA Connect</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Hola, {user.first_name}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Feed Principal */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Feed de la Comunidad
              </h2>
              
              {posts.length > 0 ? (
                <div className="space-y-6">
                  {posts.map((post) => (
                    <div key={post.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                      <div className="flex items-center mb-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {post.author?.first_name?.[0] || 'U'}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {post.author?.first_name} {post.author?.last_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(post.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <p className="text-gray-800 mb-3">{post.content}</p>
                      
                      {post.image_url && (
                        <img 
                          src={post.image_url} 
                          alt="Post image"
                          className="w-full h-64 object-cover rounded-lg mb-3"
                        />
                      )}
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <button className="flex items-center space-x-1 hover:text-red-500">
                          <Heart className="h-4 w-4" />
                          <span>{post.likes_count}</span>
                        </button>
                        <span>{post.comments_count} comentarios</span>
                        <span>{post.shares_count} compartidos</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No hay publicaciones disponibles
                </p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Perfil del Usuario */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Mi Perfil</h3>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-semibold mx-auto mb-3">
                  {user.first_name[0]}{user.last_name[0]}
                </div>
                <h4 className="font-medium text-gray-900">{user.first_name} {user.last_name}</h4>
                <p className="text-sm text-gray-500 capitalize">{user.role}</p>
                {user.bio && (
                  <p className="text-sm text-gray-600 mt-2">{user.bio}</p>
                )}
              </div>
            </div>

            {/* Proyectos Destacados */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Obras Destacadas</h3>
              {projects.slice(0, 3).map((project) => (
                <div key={project.id} className="mb-4 last:mb-0">
                  <h4 className="font-medium text-gray-900 text-sm">{project.title}</h4>
                  <div className="mt-1">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${project.progress_percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {project.progress_percentage}% completado
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Estadísticas Rápidas */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Impacto Total</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Obras Activas</span>
                  <span className="font-semibold text-blue-600">{projects.filter(p => p.status === 'active').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Obras Completadas</span>
                  <span className="font-semibold text-green-600">{projects.filter(p => p.status === 'completed').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Publicaciones</span>
                  <span className="font-semibold text-gray-900">{posts.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente principal de la App
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </Router>
  );
}

export default App;
