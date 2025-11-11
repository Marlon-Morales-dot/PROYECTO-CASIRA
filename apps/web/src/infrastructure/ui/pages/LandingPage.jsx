/**
 * LandingPage - Page Component
 * Página principal con diseño exacto del cliente
 * Extraída de App.jsx usando nuevos providers y hooks
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Users, Building, Star, ArrowRight, Menu, X, Calendar, Search, Filter, MapPin, Clock, User, RefreshCw } from 'lucide-react';
import { useAuth, useDashboard } from '../providers/AppProvider.jsx';
import GoogleOAuthButton from '../molecules/GoogleOAuthButton.jsx';
import { Link } from 'react-router-dom';
import { useLiveCounters } from '../../../lib/hooks/useLiveCounters.js';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { dashboardData, isLoading: dashboardLoading } = useDashboard();

  // Hook para contadores en tiempo real
  const {
    totalUsers,
    activeProjects,
    completedProjects,
    totalActivities,
    isLoading: countersLoading,
    error: countersError,
    lastUpdated,
    refreshCounters
  } = useLiveCounters({
    enableRealTimeSubscription: true,
    refreshInterval: 20000 // Actualizar cada 20 segundos
  });

  const [projects, setProjects] = useState([]);
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [showObrasRealizadas, setShowObrasRealizadas] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Si tenemos datos del dashboard, usarlos
        if (dashboardData && dashboardData.success) {
          setProjects(dashboardData.featuredActivities || dashboardData.activities || []);
          setPosts(dashboardData.posts || []);
          setStats(dashboardData.stats || {});
        }

        // Usar posts de ejemplo con imágenes actualizadas (preservando diseño exacto)
        setPosts([
          {
            id: 1,
            content: "¡Inauguramos la nueva biblioteca en San Juan! 300 niños ahora tienen acceso a libros y tecnología moderna. Un sueño hecho realidad gracias a todos los constructores que hicieron esto posible.",
            image_url: "https://colegio.agape.edu.sv/wp-content/uploads/2024/08/006.jpg",
            author: {
              first_name: "María",
              last_name: "González"
            },
            created_at: "2024-03-15T10:30:00Z",
            likes_count: 24,
            comments_count: 8,
            shares_count: 5
          },
          {
            id: 2,
            content: "El nuevo laboratorio de ciencias del Liceo San Francisco está transformando la educación. Los estudiantes pueden hacer experimentos que antes solo veían en libros.",
            image_url: "https://colegio.agape.edu.sv/wp-content/uploads/2024/08/L20-1024x752-1.png",
            author: {
              first_name: "Carlos",
              last_name: "Méndez"
            },
            created_at: "2024-03-10T14:20:00Z",
            likes_count: 18,
            comments_count: 12,
            shares_count: 3
          },
          {
            id: 3,
            content: "El centro comunitario ya está sirviendo a más de 1,200 familias. Ayer se realizó el primer taller de capacitación laboral con gran éxito.",
            image_url: "https://www.feyalegria.org.do/wp-content/uploads/2021/03/09.jpg",
            author: {
              first_name: "Ana",
              last_name: "Rodríguez"
            },
            created_at: "2024-03-08T16:45:00Z",
            likes_count: 31,
            comments_count: 15,
            shares_count: 7
          }
        ]);

        setIsLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setIsLoading(false);
      }
    };

    loadData();
  }, [dashboardData]);

  // Datos exactos del diseño original (preservando todo)
  const impactStories = [
    {
      title: "Ampliación Estructural del LISFA",
      description: "Nuevas instalaciones educativas que permiten ampliar la capacidad de estudiantes y mejorar la calidad de la enseñanza",
      image: "/costruccion.PNG",
      donorCount: 12,
      impact: "300 niños beneficiados",
      beforeAfter: "De espacios limitados a instalaciones modernas"
    },
    {
      title: "Contenedores Bazar",
      description: "Contenedor equipado para bazar de productos variados y equipo de computación de segunda mano. Un espacio que promueve la economía circular, el reciclaje y el acceso a tecnología para familias de escasos recursos",
      image: "/CONTENEDORES.jpeg",
      donorCount: 8,
      impact: "200 familias beneficiadas",
      beforeAfter: "De desperdicio a reutilización sostenible"
    },
    {
      title: "Becas Proyecto CASIRA - Los Padrinos",
      description: "Programa de apadrinamiento que garantiza el acceso a educación de calidad para niños y jóvenes de escasos recursos",
      image: "/canada.PNG",
      donorCount: 15,
      impact: "500 estudiantes becados",
      beforeAfter: "De la exclusión a la oportunidad educativa"
    }
  ];

  const donorSpotlight = [
    {
      name: "Hermanas Franciscanas de la Inmaculada Concepción",
      type: "Organización Religiosa",
      contribution: "Reparar la viña del Señor en oración, sacrificio y acción",
      worksSupported: ["Liceo San Francisco", "Biblioteca Comunitaria", "Centro de Capacitación"],
      recognition: "Transformadoras de Vida",
      avatar: "/hermanos.jpeg",
      location: "Mexico City, Mexico",
      followers: "5.9K",
      website: "franciscanashfic.org"
    },
    {
      name: "Proyecto CASIRA",
      type: "Grupo Voluntarios Canadienses",
      contribution: "Centre Amitié de Solidarité Internationale de la Région des Appalaches",
      worksSupported: ["Laboratorio de Ciencias", "Programa Digital", "Capacitación Docente"],
      recognition: "Embajadores del Conocimiento",
      avatar: "/logo.png",
      location: "Thetford Mines, QC, Canadá",
      address: "37 Rue Notre Dame O, Thetford Mines, QC G6G 1J1",
      phone: "+1 418-338-6211",
      website: "www.casira.org"
    },
    {
      name: "Lisfa Palencia",
      type: "Colegio Religioso",
      contribution: "Institución Educativa Católica Franciscana de excelencia que educa integralmente a las presentes y futuras generaciones, mediante los valores y la fuerza dinamizadora del Evangelio",
      worksSupported: ["Centro Comunitario", "Aulas Nuevas", "Biblioteca"],
      recognition: "Forma para construir un mundo fraterno",
      avatar: "/LISFA.PNG",
      location: "Palencia, Guatemala",
      website: "www.facebook.com/profile.php?id=100011275861880"
    }
  ];

  const obrasRealizadas = [
    {
      id: 1,
      title: "Complejo Educativo San Francisco",
      description: "Construcción completa de instalaciones educativas modernas con 12 aulas, laboratorios de ciencias y biblioteca digital.",
      location: "San Francisco, Petén",
      completedDate: "Marzo 2024",
      budget: "Q 450,000",
      beneficiaries: "480 estudiantes",
      category: "Educación",
      images: [
        "https://www.colegiosanfranciscodeasis.cl/csfda/wp-content/uploads/2016/10/CSFDA_infraestructura_lab_ciencias_2-1051x750.jpg",
        "https://www.eccastillayleon.org/wp-content/uploads/2016/12/Colegio-Santa-Clara-de-Asis-Palencia-03.jpg"
      ],
      donors: ["Hermanos Franciscanos", "Comunidad Canadiense", "Alcaldía Local"],
      features: ["12 Aulas equipadas", "Laboratorio de ciencias", "Biblioteca digital", "Área recreativa"],
      impact: "480 estudiantes ahora tienen acceso a educación de calidad con instalaciones modernas"
    },
    {
      id: 2,
      title: "Centro Comunitario Multiusos",
      description: "Espacio multifuncional que sirve como centro de reuniones, capacitaciones y eventos culturales para toda la comunidad.",
      location: "Aldea Los Pinos, Huehuetenango",
      completedDate: "Enero 2024",
      budget: "Q 280,000",
      beneficiaries: "1,200 familias",
      category: "Infraestructura Comunitaria",
      images: [
        "https://www.feyalegria.org.do/wp-content/uploads/2021/03/09.jpg",
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS0ApgZmOJjv6vQHFt8vyUuVXgOTFiQrN8Umg&s"
      ],
      donors: ["Constructora Solidaria", "ONG Internacional", "Gobierno Local"],
      features: ["Salón principal 200 personas", "Cocina industrial", "Área de juegos infantiles", "Cancha deportiva"],
      impact: "1,200 familias cuentan con un espacio digno para actividades comunitarias y desarrollo social"
    },
    {
      id: 3,
      title: "Sistema de Agua Potable",
      description: "Instalación completa de sistema de agua potable con tanques de almacenamiento y red de distribución.",
      location: "Canton El Progreso, Sololá",
      completedDate: "Febrero 2024",
      budget: "Q 180,000",
      beneficiaries: "350 familias",
      category: "Servicios Básicos",
      images: [
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS0ApgZmOJjv6vQHFt8vyUuVXgOTFiQrN8Umg&s",
        "https://www.feyalegria.org.do/wp-content/uploads/2021/03/09.jpg"
      ],
      donors: ["Cooperativa Agua Viva", "Ministerio de Salud", "Alcaldía Municipal"],
      features: ["Pozo profundo 150m", "Tanque 50,000 litros", "Red distribución 8km", "Conexiones domiciliares"],
      impact: "350 familias tienen acceso permanente a agua potable segura"
    },
    {
      id: 4,
      title: "Clínica de Salud Rural",
      description: "Centro de salud equipado con consultorios, farmacia y área de emergencias para atención médica integral.",
      location: "San Miguel Chicaj, Baja Verapaz",
      completedDate: "Diciembre 2023",
      budget: "Q 320,000",
      beneficiaries: "800 personas",
      category: "Salud",
      images: [
        "https://www.eccastillayleon.org/wp-content/uploads/2016/12/Colegio-Santa-Clara-de-Asis-Palencia-03.jpg",
        "https://colegio.agape.edu.sv/wp-content/uploads/2024/08/SL2.png"
      ],
      donors: ["Ministerio de Salud", "ONG Médicos Unidos", "Donantes Internacionales"],
      features: ["4 Consultorios médicos", "Farmacia equipada", "Sala de emergencias", "Laboratorio básico"],
      impact: "800 personas tienen acceso a servicios de salud de calidad en su propia comunidad"
    }
  ];

  // Resto del JSX exactamente igual al original...
  // (Por espacio, continuaré en el siguiente bloque)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center group">
              <div className="p-2 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 overflow-hidden">
                <img src="/logo.png" alt="AMISTAD CASIRA" className="h-10 w-auto object-contain" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-sky-600 to-blue-700 bg-clip-text text-transparent ml-3">
                <span className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 bg-clip-text text-transparent animate-pulse">
                  AMISTAD PALENCIA
                </span>
              </h1>
            </div>
            <nav className="hidden md:flex space-x-6">
              <Link
                to="/activities"
                className="px-4 py-2 text-gray-700 hover:text-sky-600 hover:bg-white/50 rounded-lg transition-all duration-200 font-medium"
              >
                Actividades
              </Link>
              {!user ? (
                <Link
                  to="/login"
                  className="px-4 py-2 text-gray-700 hover:text-sky-600 hover:bg-white/50 rounded-lg transition-all duration-200 font-medium"
                >
                  Iniciar Sesión
                </Link>
              ) : (
                <div className="flex items-center space-x-4">
                  <span className="px-4 py-2 text-gray-700 font-medium">
                    Hola, {user.firstName || user.first_name || 'Usuario'}
                  </span>
                  <button
                    onClick={logout}
                    className="px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 font-medium"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              )}
              {user ? (
                <Link
                  to="/dashboard"
                  className="bg-gradient-to-r from-sky-600 to-blue-700 text-white px-6 py-2 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 font-medium"
                >
                  Mi Dashboard
                </Link>
              ) : (
                <Link
                  to="/dashboard"
                  className="bg-gradient-to-r from-sky-600 to-blue-700 text-white px-6 py-2 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 font-medium"
                >
                  Dashboard
                </Link>
              )}
            </nav>
            
            {/* Navegación móvil simplificada */}
            <div className="md:hidden flex items-center space-x-2">
              <Link
                to="/activities"
                className="px-3 py-2 text-sm text-gray-700 hover:text-sky-600 font-medium"
              >
                Actividades
              </Link>
              {!user ? (
                <Link
                  to="/login"
                  className="px-3 py-2 text-sm text-gray-700 hover:text-sky-600 font-medium"
                >
                  Login
                </Link>
              ) : (
                <button
                  onClick={logout}
                  className="px-3 py-2 text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Salir
                </button>
              )}
              <Link
                to="/dashboard"
                className="bg-gradient-to-r from-sky-600 to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                {user ? 'Mi Panel' : 'Dashboard'}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-4 lg:py-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="space-y-8 animate-fade-in">
              <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Transforma comunidades a través de{' '}
                <span className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 bg-clip-text text-transparent animate-pulse">
                  obras que perduran
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 max-w-lg leading-relaxed">
                Únete a nuestra red de constructores de sueños que están 
                creando obras tangibles para las comunidades de Palencia, Guatemala.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button 
                  onClick={() => navigate('/login')}
                  className="group inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 border border-transparent text-sm sm:text-base font-semibold rounded-xl text-white bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                >
                  Ser Parte del Cambio
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button 
                  onClick={() => setShowObrasRealizadas(!showObrasRealizadas)}
                  className="group inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 border-2 border-sky-600 text-sm sm:text-base font-semibold rounded-xl text-sky-600 bg-white/80 backdrop-blur-sm hover:bg-sky-50 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                >
                  <span className="hidden sm:inline">{showObrasRealizadas ? 'Ocultar Obras' : 'Ver Obras Realizadas'}</span>
                  <span className="sm:hidden">{showObrasRealizadas ? 'Ocultar' : 'Ver Obras'}</span>
                  <Users className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:scale-110 transition-transform" />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-3 sm:gap-6 lg:gap-8 pt-6 sm:pt-8">
                <div className="text-center p-3 sm:p-4 bg-white/60 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-sky-600 to-blue-700 bg-clip-text text-transparent">
                    {countersLoading ? (
                      <div className="animate-pulse bg-gray-300 h-8 w-12 mx-auto rounded"></div>
                    ) : (
                      activeProjects
                    )}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 font-medium">Obras en Progreso</div>
                  {!countersLoading && lastUpdated && (
                    <div className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      ⏱️ {new Date(lastUpdated).toLocaleTimeString()}
                    </div>
                  )}
                </div>
                <div className="text-center p-3 sm:p-4 bg-white/60 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-sky-600 to-blue-700 bg-clip-text text-transparent">
                    {countersLoading ? (
                      <div className="animate-pulse bg-gray-300 h-8 w-12 mx-auto rounded"></div>
                    ) : (
                      completedProjects
                    )}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 font-medium">Obras Completadas</div>
                  {!countersLoading && lastUpdated && (
                    <div className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      ⏱️ {new Date(lastUpdated).toLocaleTimeString()}
                    </div>
                  )}
                </div>
                <div className="text-center p-3 sm:p-4 bg-white/60 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-sky-600 to-blue-700 bg-clip-text text-transparent">
                    {countersLoading ? (
                      <div className="animate-pulse bg-gray-300 h-8 w-12 mx-auto rounded"></div>
                    ) : (
                      totalUsers
                    )}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 font-medium">Usuarios Registrados</div>
                  {!countersLoading && lastUpdated && (
                    <div className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      ⏱️ {new Date(lastUpdated).toLocaleTimeString()}
                    </div>
                  )}
                </div>

                {/* Cuarta tarjeta - Botón de actualización */}
                <div className="flex items-center justify-center p-3 sm:p-4 bg-white/60 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
                  <button
                    onClick={refreshCounters}
                    disabled={countersLoading}
                    className="group relative w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 rounded-full shadow-xl hover:shadow-2xl transform hover:scale-110 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    title="Actualizar estadísticas en tiempo real"
                  >
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-sky-400 to-blue-500 rounded-full blur-lg opacity-30 group-hover:opacity-60 transition-opacity duration-300 scale-125"></div>

                    {/* Contenido del botón */}
                    <div className="relative flex items-center justify-center w-full h-full">
                      <RefreshCw className={`h-4 w-4 sm:h-5 sm:w-5 text-white ${countersLoading ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-500`} />
                    </div>

                    {/* Indicador de estado */}
                    {!countersLoading && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-400 rounded-full border-2 border-white shadow-lg">
                        <div className="w-full h-full bg-green-500 rounded-full animate-pulse"></div>
                      </div>
                    )}

                    {/* Tooltip mejorado */}
                    <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 px-3 py-2 bg-gray-900/90 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap backdrop-blur-sm z-10">
                      <div className="text-center">
                        {countersLoading ? 'Actualizando...' : 'Actualizar datos'}
                        {!countersLoading && lastUpdated && (
                          <div className="text-xs text-gray-300 mt-1">
                            {new Date(lastUpdated).toLocaleTimeString()}
                          </div>
                        )}
                      </div>
                      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900/90 rotate-45"></div>
                    </div>
                  </button>
                </div>
              </div>


              {/* Indicador de error mejorado */}
                {countersError && (
                  <div className="mt-6 mx-4">
                    <div className="relative">
                      {/* Glow de error */}
                      <div className="absolute inset-0 bg-red-400 rounded-2xl blur-lg opacity-20"></div>

                      <div className="relative bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-400 rounded-2xl p-6 shadow-lg">
                        <div className="flex items-center">
                          <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mr-4">
                            <div className="text-red-500 text-xl">⚠️</div>
                          </div>

                          <div className="flex-1">
                            <h4 className="text-red-800 font-bold text-sm mb-1">
                              Error de Conexión
                            </h4>
                            <p className="text-red-700 text-xs leading-relaxed">
                              No se pudieron cargar las estadísticas en tiempo real: {countersError}
                            </p>
                            <button
                              onClick={refreshCounters}
                              className="mt-2 text-red-600 hover:text-red-800 text-xs font-medium underline hover:no-underline transition-colors"
                            >
                              Reintentar conexión
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
            </div>
            <div className="relative">
              {/* Imagen principal profesional */}
              <div className="relative aspect-[4/3] lg:aspect-[3/2] xl:aspect-[5/3] overflow-hidden rounded-2xl shadow-xl">
                <img 
                  src="/grupo-canadienses.jpg" 
                  alt="Grupo de Canadienses transformando comunidades" 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
                {/* Overlay sutil para profesionalismo */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Donor Spotlight */}
      <section className="py-24 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-full text-sm font-semibold mb-4 shadow-lg">
              <span className="mr-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </span>
              Héroes de la Transformación
            </div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-6">
              Nuestros Constructores de Sueños
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Conoce a los visionarios que hacen posible cada obra que transforma vidas y construye futuros
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {donorSpotlight.map((donor, index) => (
              <div
                key={index}
                className="group relative bg-white/80 backdrop-blur-sm border border-white/50 rounded-3xl p-8 text-center shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-500 hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 rounded-3xl"></div>
                <div className="relative">
                  <div className="relative mb-6">
                    <div className="absolute -inset-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full blur-lg group-hover:blur-xl transition-all duration-300"></div>
                    <img
                      src={donor.avatar}
                      alt={donor.name}
                      className="relative w-32 h-32 rounded-full mx-auto object-contain bg-white p-3 border-4 border-white shadow-lg"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{donor.name}</h3>
                  <div className="inline-block px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 text-sm rounded-full mb-3 font-medium">
                    {donor.type}
                  </div>
                  <div className="inline-block px-3 py-1 bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 text-sm rounded-full mb-4 font-medium">
                    🏆 {donor.recognition}
                  </div>
                  <p className="text-gray-600 text-sm italic mb-6 leading-relaxed">
                    "{donor.contribution}"
                  </p>

                  {/* Información adicional */}
                  {donor.location && (
                    <div className="mb-4 space-y-2">
                      <div className="flex items-center justify-center text-xs text-gray-500">
                        <MapPin className="w-3 h-3 mr-1" />
                        <span>{donor.location}</span>
                      </div>
                      {donor.address && (
                        <div className="text-xs text-gray-400 px-2">
                          {donor.address}
                        </div>
                      )}
                      {donor.phone && (
                        <a
                          href={`tel:${donor.phone}`}
                          className="text-xs text-gray-500 hover:text-blue-600 transition-colors"
                        >
                          📞 {donor.phone}
                        </a>
                      )}
                      {donor.followers && (
                        <div className="text-xs font-semibold text-blue-600">
                          {donor.followers} seguidores
                        </div>
                      )}
                      {donor.website && (
                        <a
                          href={`https://${donor.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white text-xs font-medium rounded-full transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                        >
                          <span>🌐</span>
                          <span className="ml-1">Visitar Sitio Web</span>
                        </a>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="text-sm font-bold text-gray-900">Obras Apoyadas:</p>
                    {donor.worksSupported.slice(0, 2).map((work, i) => (
                      <p key={i} className="text-sm text-gray-600 flex items-center justify-center">
                        <span className="w-2 h-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mr-2"></span>
                        {work}
                      </p>
                    ))}
                    {donor.worksSupported.length > 2 && (
                      <p className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        +{donor.worksSupported.length - 2} obras más
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Stories */}
      <section id="obras-realizadas" className="py-24 bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/3 to-purple-600/3"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full text-sm font-semibold mb-4 shadow-lg">
              <span className="mr-2 w-2 h-2 bg-white rounded-full animate-pulse"></span>
              Impacto Real
            </div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-6">
              Obras que Transforman Vidas
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Cada obra cuenta una historia de transformación real y tangible que perdura en el tiempo
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {impactStories.map((story, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300"
              >
                {/* Imagen */}
                <div className="relative h-48 sm:h-56 overflow-hidden">
                  <img
                    src={story.image}
                    alt={story.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                      ✓ Completado
                    </span>
                  </div>
                </div>

                {/* Contenido */}
                <div className="p-5 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">
                    {story.title}
                  </h3>

                  <p className="text-sm sm:text-base text-gray-600 mb-4 leading-relaxed">
                    {story.description}
                  </p>

                  {/* Badge de transformación */}
                  <div className="inline-flex items-center px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    <span className="text-xs sm:text-sm text-blue-800 font-medium">{story.beforeAfter}</span>
                  </div>

                  {/* Estadísticas */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {Array.from({ length: Math.min(story.donorCount, 3) }).map((_, i) => (
                            <div
                              key={i}
                              className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                            >
                              {String.fromCharCode(65 + i)}
                            </div>
                          ))}
                        </div>
                        <span className="text-xs sm:text-sm font-semibold text-gray-700">
                          {story.donorCount} Constructores
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-200">
                      <div className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs sm:text-sm font-bold rounded-lg">
                        {story.impact}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/80 to-purple-700/80"></div>
        <div className="absolute inset-0" style={{backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.1\"%3E%3Ccircle cx=\"30\" cy=\"30\" r=\"2\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"}}></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-medium mb-6">
             Únete al Cambio
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            ¿Listo para Construir el{' '}
            <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
              Futuro?
            </span>
          </h2>
          <p className="text-xl mb-12 max-w-3xl mx-auto leading-relaxed opacity-90">
            Únete a nuestra red de constructores de sueños. 
            Tu participación, sin importar la forma, puede crear obras que perduren para siempre.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button 
              onClick={() => navigate('/login')}
              className="group px-8 py-4 bg-white text-blue-600 rounded-2xl font-semibold hover:bg-gray-100 shadow-2xl hover:shadow-3xl transform hover:-translate-y-2 transition-all duration-300 hover:scale-105"
            >
              <span className="flex items-center justify-center">
                Ser Constructor de Sueños
                <Star className="ml-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
              </span>
            </button>
            <button 
              onClick={() => setShowObrasRealizadas(!showObrasRealizadas)}
              className="group px-8 py-4 border-2 border-white/50 text-white rounded-2xl font-semibold hover:bg-white/20 backdrop-blur-sm shadow-2xl hover:shadow-3xl transform hover:-translate-y-2 transition-all duration-300 hover:scale-105"
            >
              <span className="flex items-center justify-center">
                {showObrasRealizadas ? 'Ocultar Obras' : 'Ver Obras Realizadas'}
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Columna 1: Logo y Descripción */}
            <div>
              <div className="flex items-center mb-4">
                <img src="/logo.png" alt="AMISTAD PALENCIA" className="h-8 w-auto object-contain mr-3 brightness-0 invert" />
                <span className="text-lg font-semibold">AMISTAD PALENCIA</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                Transformando comunidades a través de obras que perduran.
              </p>
              <a
                href="https://www.facebook.com/people/Lisfa-Palencia/pfbid02SnCjvsrPD9Uqw3HCU98VEM2BLdgJdXyWEmLwyB48NGaFnndm7qpAtcofMQuFddAFl/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span>Síguenos en Facebook</span>
              </a>
            </div>

            {/* Columna 2: Obras */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-white">Obras</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                    Proyectos Activos
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                    Obras Completadas
                  </a>
                </li>
                <li>
                  <a href="#obras-realizadas" className="text-gray-400 hover:text-white transition-colors duration-200">
                    Galería de Impacto
                  </a>
                </li>
              </ul>
            </div>

            {/* Columna 3: Comunidad */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-white">Comunidad</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                    Constructores
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                    Voluntarios
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                    Beneficiarios
                  </a>
                </li>
              </ul>
            </div>

            {/* Columna 4: Contacto */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-white">Contacto</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <a
                    href="https://mail.google.com/mail/?view=cm&fs=1&to=marlonmrale@gmail.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    marlonmrale@gmail.com
                  </a>
                </li>
                <li>
                  <a
                    href="tel:+50255249739"
                    className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    +502 5524 9739
                  </a>
                </li>
                <li className="flex items-start">
                  <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-gray-400">Palencia, Guatemala</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-800 mt-10 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              &copy; 2025 AMISTAD PALENCIA. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>

      {/* Obras Realizadas - Sección Profesional */}
      {showObrasRealizadas && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto">
          <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              {/* Header de la sección */}
              <div className="bg-white rounded-3xl shadow-2xl mb-8">
                <div className="px-8 py-6 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Obras Realizadas
                    </h1>
                    <p className="text-gray-600 mt-2">Proyectos completados que han transformado comunidades</p>
                  </div>
                  <button
                    onClick={() => setShowObrasRealizadas(false)}
                    className="p-3 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="h-6 w-6 text-gray-600" />
                  </button>
                </div>
                
                {/* Estadísticas rápidas en tiempo real */}
                <div className="px-8 py-6 bg-gradient-to-r from-blue-50 to-purple-50">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {countersLoading ? (
                          <div className="animate-pulse bg-gray-300 h-6 w-8 mx-auto rounded"></div>
                        ) : (
                          completedProjects
                        )}
                      </div>
                      <div className="text-sm text-gray-600">Obras Completadas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {countersLoading ? (
                          <div className="animate-pulse bg-gray-300 h-6 w-8 mx-auto rounded"></div>
                        ) : (
                          totalActivities
                        )}
                      </div>
                      <div className="text-sm text-gray-600">Total Actividades</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {countersLoading ? (
                          <div className="animate-pulse bg-gray-300 h-6 w-8 mx-auto rounded"></div>
                        ) : (
                          totalUsers
                        )}
                      </div>
                      <div className="text-sm text-gray-600">Usuarios Activos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {countersLoading ? (
                          <div className="animate-pulse bg-gray-300 h-6 w-8 mx-auto rounded"></div>
                        ) : (
                          activeProjects
                        )}
                      </div>
                      <div className="text-sm text-gray-600">En Progreso</div>
                    </div>
                  </div>
                  {!countersLoading && lastUpdated && (
                    <div className="text-center mt-4">
                      <span className="text-xs text-gray-500">
                         Última actualización: {new Date(lastUpdated).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Grid de obras */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {obrasRealizadas.map((obra) => (
                  <div key={obra.id} className="bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500">
                    {/* Imagen principal */}
                    <div className="relative h-64 overflow-hidden">
                      <img 
                        src={obra.images[0]} 
                        alt={obra.title}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      <div className="absolute top-4 left-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium text-white ${
                          obra.category === 'Educación' ? 'bg-blue-500' :
                          obra.category === 'Salud' ? 'bg-green-500' :
                          obra.category === 'Infraestructura Comunitaria' ? 'bg-purple-500' :
                          obra.category === 'Servicios Básicos' ? 'bg-cyan-500' :
                          obra.category === 'Infraestructura' ? 'bg-orange-500' :
                          'bg-indigo-500'
                        }`}>
                          {obra.category}
                        </span>
                      </div>
                      <div className="absolute bottom-4 left-4 text-white">
                        <p className="text-sm font-medium">📍 {obra.location}</p>
                        <p className="text-xs opacity-80">Completado: {obra.completedDate}</p>
                      </div>
                    </div>

                    {/* Contenido */}
                    <div className="p-8">
                      <h3 className="text-xl font-bold text-gray-900 mb-3">{obra.title}</h3>
                      <p className="text-gray-600 mb-6 leading-relaxed">{obra.description}</p>

                      {/* Métricas importantes */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-blue-50 rounded-xl p-4">
                          <div className="text-sm text-blue-600 font-medium">Presupuesto</div>
                          <div className="text-lg font-bold text-blue-700">{obra.budget}</div>
                        </div>
                        <div className="bg-green-50 rounded-xl p-4">
                          <div className="text-sm text-green-600 font-medium">Beneficiarios</div>
                          <div className="text-lg font-bold text-green-700">{obra.beneficiaries}</div>
                        </div>
                      </div>

                      {/* Características */}
                      <div className="mb-6">
                        <h4 className="text-sm font-bold text-gray-900 mb-3">✨ Características:</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {obra.features.map((feature, index) => (
                            <div key={index} className="flex items-center text-sm text-gray-600">
                              <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mr-2"></div>
                              {feature}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Donantes */}
                      <div className="mb-6">
                        <h4 className="text-sm font-bold text-gray-900 mb-3">🤝 Apoyado por:</h4>
                        <div className="flex flex-wrap gap-2">
                          {obra.donors.map((donor, index) => (
                            <span key={index} className="px-3 py-1 bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 text-xs rounded-full font-medium">
                              {donor}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Impacto */}
                      <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                        <h4 className="text-sm font-bold text-green-800 mb-2">🎯 Impacto Logrado:</h4>
                        <p className="text-sm text-green-700">{obra.impact}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Botón para cerrar */}
              <div className="text-center mt-12 pb-8">
                <button
                  onClick={() => setShowObrasRealizadas(false)}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-semibold hover:from-blue-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
                >
                  Cerrar Vista de Obras
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;