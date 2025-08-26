import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Heart, Users, Building, Star, ArrowRight, Menu, X, Calendar } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import AdminDashboard from './components/AdminDashboard.jsx';
import './App.css';

// Supabase configuration with fallbacks and validation
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wlliqmcpiiktcdzwzhdn.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsbGlxbWNwaWlrdGNkend6aGRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NTQ4NjYsImV4cCI6MjA3MTIzMDg2Nn0.of83kjXRw4ZFCi22vTosULBEVEhS6ESX3z2HuTljRjo';

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// API Functions inline - para evitar problemas de imports
const authAPI = {
  upsertUserProfile: async (userData) => {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('users')
        .upsert(userData, { onConflict: 'id' })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error upserting user profile:', error);
      throw error;
    }
  }
};

const activitiesAPI = {
  getFeaturedActivities: async () => {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          activity_categories (id, name, color, icon),
          users!activities_created_by_fkey (first_name, last_name)
        `)
        .eq('visibility', 'public')
        .eq('featured', true)
        .order('created_at', { ascending: false })
        .limit(6);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching featured activities:', error);
      return [];
    }
  },

  getPublicActivities: async () => {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          activity_categories (id, name, color, icon),
          users!activities_created_by_fkey (first_name, last_name),
          activity_participants (id, status)
        `)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching public activities:', error);
      return [];
    }
  },

  createActivity: async (activityData) => {
    if (!supabase) throw new Error('Supabase not available');
    try {
      const { data, error } = await supabase
        .from('activities')
        .insert(activityData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
  },

  deleteActivity: async (id) => {
    if (!supabase) throw new Error('Supabase not available');
    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting activity:', error);
      throw error;
    }
  }
};

const categoriesAPI = {
  getAllCategories: async () => {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('activity_categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }
};

const postsAPI = {
  getPublicPosts: async (limit = 10) => {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          users!posts_author_id_fkey (id, first_name, last_name, avatar_url),
          activities (id, title, status)
        `)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching public posts:', error);
      return [];
    }
  }
};

const statsAPI = {
  getDashboardStats: async () => {
    if (!supabase) {
      return {
        active_projects: 0,
        completed_projects: 0,
        total_volunteers: 0,
        total_donations: 0,
        lives_transformed: 0
      };
    }
    
    try {
      const [activitiesResponse, volunteersResponse] = await Promise.all([
        supabase.from('activities').select('status', { count: 'exact' }),
        supabase.from('activity_participants').select('id', { count: 'exact' })
      ]);

      const activities = activitiesResponse.data || [];
      const activeActivities = activities.filter(a => a.status === 'active').length;
      const completedActivities = activities.filter(a => a.status === 'completed').length;
      const totalVolunteers = volunteersResponse.count || 0;

      return {
        active_projects: activeActivities,
        completed_projects: completedActivities,
        total_volunteers: totalVolunteers,
        total_donations: 0,
        lives_transformed: Math.floor(totalVolunteers * 1.5)
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        active_projects: 0,
        completed_projects: 0,
        total_volunteers: 0,
        total_donations: 0,
        lives_transformed: 0
      };
    }
  }
};

// Auth hook
function useAuth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { session, loading };
}

// Google OAuth Button Component
const GoogleOAuthButton = ({ onSuccess, onError, disabled = false }) => {
  const handleGoogleSignIn = async () => {
    if (!supabase) {
      const error = new Error('Supabase not configured');
      console.error('Google OAuth error: Supabase not available');
      if (onError) onError(error);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/dashboard',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });

      if (error) {
        console.error('Error with Google OAuth:', error);
        if (onError) onError(error);
        return;
      }

      if (onSuccess) {
        onSuccess(data);
      }
    } catch (error) {
      console.error('Google OAuth error:', error);
      if (onError) onError(error);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={disabled}
      className="group relative w-full overflow-hidden py-4 px-6 text-lg font-semibold rounded-2xl text-gray-700 bg-white border-2 border-gray-300 hover:border-blue-500 hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
    >
      {/* Efecto de brillo */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent transform skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
      
      <span className="relative flex items-center justify-center">
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
        {disabled ? 'Iniciando sesión...' : 'Continuar con Google'}
      </span>
    </button>
  );
};

// Componente de Landing Page
function LandingPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [showObrasRealizadas, setShowObrasRealizadas] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar proyectos destacados desde Supabase
        try {
          const activities = await activitiesAPI.getFeaturedActivities();
          const stats = await statsAPI.getDashboardStats();
          
          setProjects(activities || []);
          setStats(stats || {});
        } catch (error) {
          console.error('Error loading data from Supabase:', error);
          // Fallback to static data
          setProjects([]);
          setStats({});
        }

        // Usar posts de ejemplo con imágenes actualizadas
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
  }, []);

  const impactStories = [
    {
      title: "Nueva Biblioteca en San Juan",
      description: "Gracias a nuestros donantes, 300 niños ahora tienen acceso a libros y tecnología",
      image: "https://colegio.agape.edu.sv/wp-content/uploads/2024/08/SL2.png",
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
      avatar: "/grupo-canadienses.jpg"
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
        "https://www.colegiosanfranciscodeasis.cl/csfda/wp-content/uploads/2016/10/CSFDA_infraestructura_lab_ciencias_2-1051x750.jpg"
      ],
      donors: ["Médicos sin Fronteras", "Rotarios Guatemala", "Empresa Farmacéutica"],
      features: ["3 Consultorios médicos", "Farmacia equipada", "Área de emergencias", "Laboratorio básico"],
      impact: "800 personas reciben atención médica regular sin viajar grandes distancias"
    },
    {
      id: 5,
      title: "Puente Peatonal Seguro",
      description: "Construcción de puente peatonal sobre río para conexión segura entre comunidades.",
      location: "Río Azul, Izabal",
      completedDate: "Noviembre 2023",
      budget: "Q 95,000",
      beneficiaries: "600 personas",
      category: "Infraestructura",
      images: [
        "https://hficprovinciadivinosalvador.com/wp-content/uploads/2023/05/2-3.jpg",
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS0ApgZmOJjv6vQHFt8vyUuVXgOTFiQrN8Umg&s"
      ],
      donors: ["Ingenieros Unidos", "Alcaldía Regional", "Comerciantes Locales"],
      features: ["Longitud 45 metros", "Capacidad 50 personas", "Barandas seguridad", "Iluminación LED"],
      impact: "600 personas cruzan el río de forma segura, especialmente niños que van a la escuela"
    },
    {
      id: 6,
      title: "Centro de Capacitación Técnica",
      description: "Instalaciones para formación técnica en oficios como carpintería, electricidad y computación.",
      location: "Chimaltenango Centro",
      completedDate: "Octubre 2023",
      budget: "Q 240,000",
      beneficiaries: "200 jóvenes/año",
      category: "Educación Técnica",
      images: [
        "https://www.feyalegria.org.do/wp-content/uploads/2021/03/09.jpg",
        "https://www.colegiosanfranciscodeasis.cl/csfda/wp-content/uploads/2016/10/CSFDA_infraestructura_lab_ciencias_2-1051x750.jpg"
      ],
      donors: ["INTECAP", "Empresarios Locales", "Fundación Educativa"],
      features: ["Taller de carpintería", "Lab. electricidad", "Centro de cómputo", "Aula teórica"],
      impact: "200 jóvenes por año se capacitan en oficios técnicos, mejorando sus oportunidades laborales"
    }
  ];

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
                AMISTAD CASIRA
              </h1>
            </div>
            <nav className="hidden md:flex space-x-6">
              <Link 
                to="/" 
                className="px-4 py-2 text-gray-700 hover:text-sky-600 hover:bg-white/50 rounded-lg transition-all duration-200 font-medium"
              >
                Inicio
              </Link>
              <Link 
                to="/activities" 
                className="px-4 py-2 text-gray-700 hover:text-sky-600 hover:bg-white/50 rounded-lg transition-all duration-200 font-medium"
              >
                Actividades
              </Link>
              <Link 
                to="/login" 
                className="px-4 py-2 text-gray-700 hover:text-sky-600 hover:bg-white/50 rounded-lg transition-all duration-200 font-medium"
              >
                Iniciar Sesión
              </Link>
              <Link 
                to="/dashboard" 
                className="bg-gradient-to-r from-sky-600 to-blue-700 text-white px-6 py-2 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 font-medium"
              >
                Dashboard
              </Link>
            </nav>
            
            {/* Navegación móvil simplificada */}
            <div className="md:hidden flex items-center space-x-2">
              <Link 
                to="/login" 
                className="px-3 py-2 text-sm text-gray-700 hover:text-sky-600 font-medium"
              >
                Login
              </Link>
              <Link 
                to="/dashboard" 
                className="bg-gradient-to-r from-sky-600 to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 lg:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-purple-600/5 to-indigo-600/5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="space-y-8 animate-fade-in">
              <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 shadow-lg">
                <span className="animate-bounce mr-2">🏗️</span>
                Red de Transformación Social
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Transforma comunidades a través de{' '}
                <span className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 bg-clip-text text-transparent animate-pulse">
                  obras que perduran
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 max-w-lg leading-relaxed">
                Únete a nuestra red de constructores de sueños que están 
                creando obras tangibles para las comunidades de Guatemala.
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
              <div className="grid grid-cols-3 gap-3 sm:gap-6 lg:gap-8 pt-6 sm:pt-8">
                <div className="text-center p-3 sm:p-4 bg-white/60 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-sky-600 to-blue-700 bg-clip-text text-transparent">
                    {stats.active_projects || 0}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 font-medium">Obras en Progreso</div>
                </div>
                <div className="text-center p-3 sm:p-4 bg-white/60 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-sky-600 to-blue-700 bg-clip-text text-transparent">
                    {stats.completed_projects || 0}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 font-medium">Obras Completadas</div>
                </div>
                <div className="text-center p-3 sm:p-4 bg-white/60 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-sky-600 to-blue-700 bg-clip-text text-transparent">
                    1,200+
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 font-medium">Vidas Transformadas</div>
                </div>
              </div>
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
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-800 rounded-full text-sm font-medium mb-4">
              ⭐ Héroes de la Transformación
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
                    <div className="absolute -inset-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full blur-lg group-hover:blur-xl transition-all duration-300"></div>
                    <img 
                      src={donor.avatar} 
                      alt={donor.name}
                      className="relative w-20 h-20 rounded-full mx-auto object-cover border-4 border-white shadow-lg"
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
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-full text-sm font-medium mb-4">
              🎯 Impacto Real
            </div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-6">
              Obras que Transforman Vidas
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Cada obra cuenta una historia de transformación real y tangible que perdura en el tiempo
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {impactStories.map((story, index) => (
              <div 
                key={index} 
                className="group relative bg-white rounded-3xl shadow-2xl overflow-hidden hover:shadow-3xl transform hover:-translate-y-5 transition-all duration-700 hover:scale-[1.03]"
              >
                {/* Decorative gradient border */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl p-[3px] opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="bg-white rounded-3xl h-full w-full"></div>
                </div>
                
                <div className="relative">
                  <div className="relative overflow-hidden rounded-t-3xl">
                    <img 
                      src={story.image} 
                      alt={story.title}
                      className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                    
                    {/* Enhanced status badge */}
                    <div className="absolute top-6 right-6 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm rounded-2xl font-bold shadow-xl backdrop-blur-sm border border-white/20">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                        Completado
                      </div>
                    </div>
                    
                    {/* Progress overlay */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-lg">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="font-bold text-gray-800">Estado del Proyecto</span>
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">100%</span>
                        </div>
                        <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full w-full animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-8">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-900 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-500">
                        {story.title}
                      </h3>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      {story.description}
                    </p>
                    
                    {/* Enhanced transform badge */}
                    <div className="inline-flex items-center px-5 py-3 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-2 border-blue-200 rounded-2xl mb-6 group-hover:border-purple-300 transition-colors duration-300">
                      <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mr-3 animate-pulse"></div>
                      <span className="text-blue-800 font-bold text-sm">{story.beforeAfter}</span>
                    </div>
                    
                    {/* Enhanced bottom section */}
                    <div className="bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 rounded-2xl p-5 border border-gray-100 group-hover:border-blue-200 transition-colors duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex -space-x-2">
                            {Array.from({ length: Math.min(story.donorCount, 4) }).map((_, i) => (
                              <div 
                                key={i} 
                                className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full border-3 border-white shadow-lg flex items-center justify-center text-white text-sm font-bold hover:scale-110 transition-transform duration-200"
                              >
                                {String.fromCharCode(65 + i)}
                              </div>
                            ))}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                              {story.donorCount} Constructores
                            </div>
                            <div className="text-xs text-gray-500">unidos por el cambio</div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm rounded-xl font-bold shadow-lg">
                            {story.impact}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">impacto real</div>
                        </div>
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
        <div className="absolute inset-0" style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"}}></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-medium mb-6">
            🚀 Únete al Cambio
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <img src="/logo.png" alt="AMISTAD CASIRA" className="h-8 w-auto object-contain mr-3 brightness-75" />
                <span className="text-lg font-semibold">AMISTAD CASIRA</span>
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
                
                {/* Estadísticas rápidas */}
                <div className="px-8 py-6 bg-gradient-to-r from-blue-50 to-purple-50">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">6</div>
                      <div className="text-sm text-gray-600">Obras Completadas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">Q1.6M</div>
                      <div className="text-sm text-gray-600">Inversión Total</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">4,230</div>
                      <div className="text-sm text-gray-600">Beneficiarios</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">18</div>
                      <div className="text-sm text-gray-600">Comunidades</div>
                    </div>
                  </div>
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
}

// Componente de Login
function LoginPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  // Redireccionar si ya está autenticado
  useEffect(() => {
    if (!loading && session) {
      navigate('/dashboard');
    }
  }, [session, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch('https://proyecto-casira.onrender.com/api/auth/login', {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-sky-400/20 to-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-blue-400/20 to-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-sky-300/10 to-blue-400/10 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="max-w-lg w-full space-y-8 relative z-10">
        {/* Container principal con glassmorphism */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 lg:p-10">
          {/* Header mejorado */}
          <div className="text-center mb-8">
            {/* Logo con efectos */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-sky-400 to-blue-500 rounded-2xl blur-lg opacity-60 animate-pulse"></div>
                <div className="relative bg-white p-4 rounded-2xl shadow-xl">
                  <img src="/logo.png" alt="AMISTAD CASIRA" className="h-16 w-auto object-contain" />
                </div>
              </div>
            </div>
            
            <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-sky-600 to-blue-700 bg-clip-text text-transparent mb-3">
              Bienvenido a AMISTAD CASIRA
            </h2>
            <p className="text-gray-600 text-lg">
              Únete a la red de transformación social
            </p>
            
            {/* Indicador decorativo */}
            <div className="flex items-center justify-center mt-4 space-x-2">
              <div className="w-2 h-2 bg-sky-400 rounded-full animate-ping"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
            </div>
          </div>
        
          {/* Cuentas Demo con diseño premium */}
          <div className="bg-gradient-to-r from-sky-50 to-blue-50 border-2 border-sky-200/50 rounded-2xl p-6 mb-6 shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-sky-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                <Users className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-bold text-sky-800">Cuentas de Demostración</h3>
            </div>
            <div className="space-y-3">
              {demoAccounts.map((account, index) => (
                <div key={index} className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-sky-200/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-sky-700 text-sm">{account.role}</div>
                      <div className="text-xs text-gray-600">{account.email}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Contraseña:</div>
                      <div className="font-mono text-sm bg-sky-100 text-sky-700 px-2 py-1 rounded">
                        {account.password}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Formulario mejorado */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Campo Email */}
              <div className="relative">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="w-full px-4 py-4 bg-white/60 backdrop-blur-sm border-2 border-sky-200/50 rounded-2xl placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-4 focus:ring-sky-500/20 focus:border-sky-500 transition-all duration-300 text-lg"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                    <div className="w-2 h-2 bg-sky-400 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Campo Contraseña */}
              <div className="relative">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="w-full px-4 py-4 bg-white/60 backdrop-blur-sm border-2 border-sky-200/50 rounded-2xl placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-4 focus:ring-sky-500/20 focus:border-sky-500 transition-all duration-300 text-lg"
                    placeholder="Tu contraseña"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Botón mejorado */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full overflow-hidden py-4 px-6 text-lg font-semibold rounded-2xl text-white bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-sky-500/20 disabled:opacity-50 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
              >
                {/* Efecto de brillo */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                
                <span className="relative flex items-center justify-center">
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                      Iniciando sesión...
                    </>
                  ) : (
                    <>
                      Iniciar Sesión
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
              </button>
            </div>

            {/* Divisor */}
            <div className="pt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white/80 text-gray-500 font-medium">O continúa con</span>
                </div>
              </div>
            </div>

            {/* Google OAuth Button - Solo si Supabase está configurado */}
            {supabase && (
              <div className="pt-6">
                <GoogleOAuthButton
                  onSuccess={(data) => {
                    console.log('Google OAuth success:', data);
                    // La redirección se manejará automáticamente por el hook useAuth
                  }}
                  onError={(error) => {
                    console.error('Google OAuth error:', error);
                    alert('Error al iniciar sesión con Google: ' + error.message);
                  }}
                  disabled={isLoading}
                />
              </div>
            )}

            {/* Link de retorno mejorado */}
            <div className="text-center pt-4">
              <Link 
                to="/" 
                className="inline-flex items-center text-sky-600 hover:text-sky-700 font-medium transition-colors duration-200 group"
              >
                <ArrowRight className="mr-2 h-4 w-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                Volver al inicio
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Componente de Dashboard
function DashboardPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    if (loading) return; // Esperar a que cargue la autenticación

    // Comprobar autenticación de Supabase (Google OAuth)
    if (session) {
      const handleGoogleUser = async () => {
        try {
          // Crear o actualizar perfil de usuario
          const userData = {
            id: session.user.id,
            email: session.user.email,
            first_name: session.user.user_metadata.full_name?.split(' ')[0] || session.user.email.split('@')[0],
            last_name: session.user.user_metadata.full_name?.split(' ')[1] || '',
            avatar_url: session.user.user_metadata.avatar_url,
            role: session.user.id === '9e8385dc-cf3b-4f6e-87dc-e287c6d444c6' ? 'admin' : 'volunteer'
          };
          
          // Upsert user profile
          await authAPI.upsertUserProfile(userData);
          setUser(userData);
        } catch (error) {
          console.error('Error handling Google OAuth user:', error);
          const googleUser = {
            id: session.user.id,
            first_name: session.user.user_metadata.full_name?.split(' ')[0] || session.user.email.split('@')[0],
            last_name: session.user.user_metadata.full_name?.split(' ')[1] || '',
            email: session.user.email,
            role: session.user.id === '9e8385dc-cf3b-4f6e-87dc-e287c6d444c6' ? 'admin' : 'volunteer',
            bio: 'Usuario autenticado con Google'
          };
          setUser(googleUser);
        }
      };
      
      handleGoogleUser();
    } else {
      // Comprobar autenticación tradicional
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (!token || !userData) {
        navigate('/login');
        return;
      }
      
      setUser(JSON.parse(userData));
    }
    
    // Cargar datos del dashboard
    const loadDashboardData = async () => {
      try {
        // Cargar datos desde Supabase
        try {
          // Using inline API functions
          const [postsData, projectsData] = await Promise.all([
            postsAPI.getPublicPosts(10),
            activitiesAPI.getPublicActivities()
          ]);
          
          // Si tenemos datos reales, los usamos
          if (postsData && postsData.length > 0) {
            setPosts(postsData);
          }
          
          setProjects(projectsData || []);
        } catch (error) {
          console.error('Error loading dashboard data from Supabase:', error);
        }
        
        // Usar siempre posts de ejemplo con imágenes actualizadas
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
        
        setProjects(projectsData.projects || []);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };
    
    loadDashboardData();
  }, [navigate, session, loading]);

  const handleLogout = async () => {
    try {
      // Cerrar sesión de Supabase si existe
      if (session && supabase) {
        await supabase.auth.signOut();
      }
      
      // Limpiar localStorage para autenticación tradicional
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      navigate('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      // Navegar de todas formas
      navigate('/');
    }
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  // Si es administrador, mostrar AdminDashboard
  if (user.role === 'admin') {
    return <AdminDashboard user={user} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <img src="/logo.png" alt="AMISTAD CASIRA" className="h-10 w-auto object-contain mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">AMISTAD CASIRA</h1>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Feed Principal */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Feed de la Comunidad
              </h2>
              
              {posts.length > 0 ? (
                <div className="space-y-6 sm:space-y-8">
                  {posts.map((post) => (
                    <div key={post.id} className="bg-white rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
                      {/* Header del post */}
                      <div className="p-4 sm:p-6 border-b border-gray-100">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                            {post.author?.first_name?.[0] || 'U'}
                          </div>
                          <div className="ml-4">
                            <p className="font-bold text-gray-900">
                              {post.author?.first_name} {post.author?.last_name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(post.created_at).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Contenido del post */}
                      <div className="p-4 sm:p-6">
                        <p className="text-gray-800 leading-relaxed mb-4 sm:mb-6 text-base sm:text-lg">{post.content}</p>
                        
                        {/* Imagen mejorada con diseño responsivo */}
                        {post.image_url && (
                          <div className="relative rounded-xl sm:rounded-2xl overflow-hidden shadow-xl mb-4 sm:mb-6 group">
                            <div className="aspect-w-16 aspect-h-10">
                              <img 
                                src={post.image_url} 
                                alt="Imagen del proyecto"
                                className="w-full h-64 sm:h-80 object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            </div>
                            {/* Badge de proyecto */}
                            <div className="absolute bottom-4 left-4 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg">
                              <span className="text-sm font-semibold text-gray-800">📸 Galería de Impacto</span>
                            </div>
                          </div>
                        )}
                        
                        {/* Interacciones mejoradas */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-gray-100 space-y-3 sm:space-y-0">
                          <div className="flex items-center justify-center sm:justify-start space-x-4 sm:space-x-6">
                            <button className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 hover:bg-red-50 rounded-lg sm:rounded-xl transition-colors group">
                              <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-hover:text-red-500 transition-colors" />
                              <span className="text-xs sm:text-sm font-medium text-gray-600 group-hover:text-red-500">{post.likes_count}</span>
                            </button>
                            <button className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 hover:bg-sky-50 rounded-lg sm:rounded-xl transition-colors group">
                              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-hover:text-sky-600 transition-colors" />
                              <span className="text-xs sm:text-sm font-medium text-gray-600 group-hover:text-sky-600">{post.comments_count}</span>
                            </button>
                            <button className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 hover:bg-green-50 rounded-lg sm:rounded-xl transition-colors group">
                              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-hover:text-green-500 transition-colors" />
                              <span className="text-xs sm:text-sm font-medium text-gray-600 group-hover:text-green-500">{post.shares_count}</span>
                            </button>
                          </div>
                          
                          {/* Indicador de engagement */}
                          <div className="px-3 py-1 bg-gradient-to-r from-sky-100 to-blue-100 text-sky-800 rounded-full text-xs font-bold text-center sm:text-left">
                            ⚡ {post.likes_count + post.comments_count + post.shares_count} interacciones
                          </div>
                        </div>
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

// Componente de Activities Page
function ActivitiesPage() {
  const [activities, setActivities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadActivities();
    loadCategories();
  }, []);

  const loadActivities = async () => {
    try {
      const data = await activitiesAPI.getPublicActivities();
      setActivities(data || []);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await categoriesAPI.getAllCategories();
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const filteredActivities = selectedCategory 
    ? activities.filter(activity => activity.category_id === selectedCategory)
    : activities;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link to="/" className="flex items-center">
              <img src="/logo.png" alt="AMISTAD CASIRA" className="h-10 w-auto object-contain mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">AMISTAD CASIRA</h1>
            </Link>
            <nav className="flex space-x-6">
              <Link to="/" className="text-gray-700 hover:text-blue-600">Inicio</Link>
              <Link to="/activities" className="text-blue-600 font-semibold">Actividades</Link>
              <Link to="/login" className="text-gray-700 hover:text-blue-600">Login</Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Actividades y Proyectos</h1>
          <p className="text-xl text-gray-600 mb-6">
            Descubre todas las oportunidades para ser parte del cambio en tu comunidad
          </p>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-3 mb-8">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                !selectedCategory 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Todas
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {category.icon} {category.name}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando actividades...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredActivities.map((activity) => (
              <div key={activity.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={activity.image_url || '/logo.png'} 
                    alt={activity.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${
                      activity.status === 'active' ? 'bg-green-500' :
                      activity.status === 'planning' ? 'bg-yellow-500' :
                      activity.status === 'completed' ? 'bg-blue-500' :
                      'bg-gray-500'
                    }`}>
                      {activity.status === 'active' ? 'Activo' :
                       activity.status === 'planning' ? 'Planificando' :
                       activity.status === 'completed' ? 'Completado' : 'Cancelado'}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center mb-3">
                    {activity.activity_categories && (
                      <span 
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: activity.activity_categories.color }}
                      >
                        {activity.activity_categories.icon} {activity.activity_categories.name}
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-2">{activity.title}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-3">{activity.description}</p>

                  {activity.location && (
                    <p className="text-sm text-gray-500 mb-3">📍 {activity.location}</p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                      <Users className="h-4 w-4 mr-1" />
                      <span>{activity.current_volunteers || 0}/{activity.max_volunteers || '∞'} voluntarios</span>
                    </div>
                    
                    <Link
                      to="/login"
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Participar
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredActivities.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Calendar className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay actividades disponibles</h3>
            <p className="text-gray-600">
              {selectedCategory ? 'No hay actividades en esta categoría.' : 'Pronto habrá nuevas actividades disponibles.'}
            </p>
          </div>
        )}
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
        <Route path="/activities" element={<ActivitiesPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </Router>
  );
}

export default App;
