import React, { useState, useEffect } from 'react';
import { Heart, Users, Building, Star, ArrowRight, MapPin, Calendar, Clock, Phone, Mail, Camera, Award, Target, Globe } from 'lucide-react';
import { activitiesAPI, volunteersAPI, forceRefreshData } from '@/lib/api.js';

const VisitorDashboard = ({ user, onLogout }) => {
  const [activities, setActivities] = useState([]);
  const [featuredActivities, setFeaturedActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [userRegistrations, setUserRegistrations] = useState([]);

  useEffect(() => {
    loadVisitorData();
  }, []);

  const loadVisitorData = async () => {
    try {
      setIsLoading(true);
      console.log('VisitorDashboard: Starting data load...');
      console.log('VisitorDashboard: User ID:', user?.id);
      
      // Force refresh data first
      console.log('VisitorDashboard: Forcing data refresh...');
      forceRefreshData();
      
      // Wait a bit for data to be ready
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('VisitorDashboard: Loading activities...');
      const activitiesData = await activitiesAPI.getPublicActivities();
      console.log('VisitorDashboard: Activities result:', activitiesData);
      
      console.log('VisitorDashboard: Loading featured activities...');
      const featuredData = await activitiesAPI.getFeaturedActivities();
      console.log('VisitorDashboard: Featured result:', featuredData);
      
      let registrationsData = [];
      if (user?.id) {
        console.log('VisitorDashboard: Loading user registrations...');
        registrationsData = await volunteersAPI.getUserRegistrations(user.id);
        console.log('VisitorDashboard: Registrations result:', registrationsData);
      }
      
      console.log('VisitorDashboard: Setting state...');
      console.log('- Activities:', activitiesData?.length || 0);
      console.log('- Featured:', featuredData?.length || 0);  
      console.log('- Registrations:', registrationsData?.length || 0);
      
      setActivities(activitiesData || []);
      setFeaturedActivities(featuredData || []);
      setUserRegistrations(registrationsData || []);
      
      console.log('VisitorDashboard: Data load complete!');
    } catch (error) {
      console.error('VisitorDashboard: Error loading data:', error);
      console.error('VisitorDashboard: Error stack:', error.stack);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinActivity = async (activity) => {
    setSelectedActivity(activity);
    setShowJoinModal(true);
  };

  const confirmJoinActivity = async () => {
    try {
      if (selectedActivity && user) {
        console.log('Visitor registering for activity:', selectedActivity.title, 'User:', user.first_name);
        
        // Create registration with additional data
        const registrationData = {
          notes: `Solicitud de ${user.first_name} ${user.last_name} desde el portal de visitantes`,
          skills_offered: user.skills || []
        };
        
        await volunteersAPI.registerForActivity(user.id, selectedActivity.id, registrationData);
        
        alert(`¡Te has registrado exitosamente para "${selectedActivity.title}"!\n\n✅ Tu solicitud ha sido enviada al equipo de coordinación.\n🔔 Recibirás una notificación cuando sea aprobada.\n📧 También te contactaremos por email con más detalles.`);
        
        setShowJoinModal(false);
        setSelectedActivity(null);
        loadVisitorData(); // Refresh data
      }
    } catch (error) {
      console.error('Error joining activity:', error);
      if (error.message.includes('Ya estás registrado')) {
        alert('Ya te has registrado previamente para esta actividad.');
      } else {
        alert('Hubo un error al registrarte. Por favor, intenta nuevamente.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando experiencia CASIRA...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    AMISTAD CASIRA
                  </h1>
                  <p className="text-xs text-gray-500">Portal del Visitante</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <span className="text-gray-600">Bienvenido/a, </span>
                <span className="font-semibold text-gray-900">{user?.first_name} {user?.last_name}</span>
                <div className="text-xs text-purple-600">👀 Visitante</div>
                {userRegistrations.length > 0 && (
                  <div className="text-xs text-green-600">
                    📋 {userRegistrations.length} solicitudes enviadas
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  console.log('Debug: Force refresh data');
                  forceRefreshData();
                  loadVisitorData();
                }}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors duration-200"
              >
                🔄 Debug
              </button>
              <button
                onClick={onLogout}
                className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 mb-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24"></div>
          <div className="relative z-10">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <Globe className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-2">¡Descubre el Impacto que Puedes Crear!</h2>
                <p className="text-blue-100 text-lg">Únete a nuestra comunidad de cambio social en Guatemala</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <Users className="h-6 w-6 text-white" />
                  <span className="font-semibold">1,200+ Voluntarios</span>
                </div>
                <p className="text-blue-100 text-sm">Personas como tú creando impacto real</p>
              </div>
              
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <Building className="h-6 w-6 text-white" />
                  <span className="font-semibold">45+ Proyectos</span>
                </div>
                <p className="text-blue-100 text-sm">Iniciativas activas transformando comunidades</p>
              </div>
              
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <Award className="h-6 w-6 text-white" />
                  <span className="font-semibold">15 años</span>
                </div>
                <p className="text-blue-100 text-sm">De experiencia en desarrollo comunitario</p>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Activities */}
        {featuredActivities.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                <Star className="h-6 w-6 text-yellow-500 mr-2" />
                Actividades Destacadas
              </h3>
              <span className="text-sm text-gray-600">¡Las más populares!</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredActivities.slice(0, 3).map((activity) => (
                <div key={activity.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="relative h-48">
                    <img 
                      src={activity.image_url || '/placeholder-activity.jpg'} 
                      alt={activity.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 right-4">
                      <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                        <Star className="h-3 w-3 mr-1" />
                        Destacada
                      </span>
                    </div>
                    <div className="absolute bottom-4 left-4">
                      <span className="bg-white/90 backdrop-blur-sm text-gray-800 px-3 py-1 rounded-full text-xs font-semibold">
                        {activity.current_volunteers || 0}/{activity.max_volunteers || '∞'} voluntarios
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">{activity.title}</h4>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{activity.description}</p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mb-4">
                      <div className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {activity.location || 'Ubicación por confirmar'}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {activity.start_date ? new Date(activity.start_date).toLocaleDateString() : 'Fecha por confirmar'}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleJoinActivity(activity)}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2"
                    >
                      <Heart className="h-4 w-4" />
                      <span>¡Quiero Participar!</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* User Registrations Status */}
        {userRegistrations.length > 0 && (
          <section className="mb-12">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 text-green-600 mr-2" />
                Mis Solicitudes Enviadas
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userRegistrations.map((registration) => {
                  const activity = activities.find(a => a.id == registration.activity_id);
                  return (
                    <div key={registration.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-900">{activity?.title || 'Actividad'}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          registration.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          registration.status === 'registered' ? 'bg-blue-100 text-blue-800' :
                          registration.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {registration.status === 'confirmed' ? '✅ Aprobado' :
                           registration.status === 'registered' ? '📋 Registrado' :
                           registration.status === 'pending' ? '⏳ Pendiente' : registration.status}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          Solicitado: {new Date(registration.registration_date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {activity?.location || 'Ubicación por confirmar'}
                        </div>
                        {registration.notes && (
                          <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded">
                            {registration.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-blue-600 mr-2" />
                  <div className="text-sm text-blue-800">
                    <strong>¿Qué sigue?</strong> Nuestro equipo revisará tus solicitudes y te contactará por email con los siguientes pasos.
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* All Activities */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center">
              <Target className="h-6 w-6 text-blue-600 mr-2" />
              Todas las Oportunidades
            </h3>
            <span className="text-sm text-gray-600">{activities.length} actividades disponibles</span>
          </div>
          
          {activities.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <Target className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-600 mb-2">No hay actividades disponibles</h4>
              <p className="text-gray-500 mb-4">Estamos preparando nuevas oportunidades para ti.</p>
              <button
                onClick={loadVisitorData}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Recargar Actividades
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {activities.map((activity) => (
              <div key={activity.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="flex">
                  <div className="flex-shrink-0 w-32 h-32">
                    <img 
                      src={activity.image_url || '/placeholder-activity.jpg'} 
                      alt={activity.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1 p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">{activity.title}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        activity.status === 'active' ? 'bg-green-100 text-green-800' :
                        activity.status === 'planning' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {activity.status === 'active' ? 'Activa' :
                         activity.status === 'planning' ? 'Planificando' : activity.status}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{activity.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 text-xs text-gray-500">
                        <div className="flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          {activity.current_volunteers || 0} participantes
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {activity.location || 'Por definir'}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleJoinActivity(activity)}
                        className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors duration-200 text-sm flex items-center space-x-1"
                      >
                        <span>Unirse</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              ))}
            </div>
          )}
        </section>

        {/* Impact Gallery */}
        <section className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Camera className="h-6 w-6 text-purple-600 mr-2" />
            Nuestro Impacto en Imágenes
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { src: '/reforestacion.jpg', title: 'Reforestación' },
              { src: '/educacion.jpg', title: 'Educación' },
              { src: '/alimentacion.jpg', title: 'Alimentación' },
              { src: '/construccion.jpg', title: 'Construcción' },
              { src: '/salud.jpg', title: 'Salud Comunitaria' },
              { src: '/juventud.jpg', title: 'Juventud' },
              { src: '/mujeres.jpg', title: 'Empoderamiento' },
              { src: '/grupo-canadienses.jpg', title: 'Colaboración International' }
            ].map((image, index) => (
              <div key={index} className="relative group overflow-hidden rounded-lg aspect-square">
                <img 
                  src={image.src} 
                  alt={image.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-4 left-4">
                    <p className="text-white text-sm font-semibold">{image.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Call to Action */}
        <section className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white text-center">
          <h3 className="text-3xl font-bold mb-4">¿Listo para Hacer la Diferencia?</h3>
          <p className="text-purple-100 text-lg mb-6">
            Únete a nuestra comunidad y comienza a crear impacto real en Guatemala
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Heart className="h-6 w-6" />
              </div>
              <h4 className="font-semibold mb-2">Encuentra tu Pasión</h4>
              <p className="text-purple-100 text-sm">Descubre actividades que se alineen con tus intereses</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6" />
              </div>
              <h4 className="font-semibold mb-2">Conecta con Otros</h4>
              <p className="text-purple-100 text-sm">Conoce personas increíbles que comparten tus valores</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Award className="h-6 w-6" />
              </div>
              <h4 className="font-semibold mb-2">Crea Impacto</h4>
              <p className="text-purple-100 text-sm">Ve los resultados tangibles de tu contribución</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => alert('¡Excelente! Un coordinador se pondrá en contacto contigo pronto para ayudarte a comenzar tu experiencia como voluntario.')}
              className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200"
            >
              Quiero Ser Voluntario
            </button>
            <button
              onClick={() => alert('¡Gracias por tu interés! Te contactaremos para discutir oportunidades de donación y patrocinio.')}
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-purple-600 transition-colors duration-200"
            >
              Quiero Donar
            </button>
          </div>
        </section>
      </div>

      {/* Contact Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Contáctanos</h4>
              <div className="space-y-2 text-gray-300">
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  <span>+502 2334-5678</span>
                </div>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  <span>info@casira.org</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>Guatemala City, Guatemala</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Síguenos</h4>
              <div className="space-y-2 text-gray-300">
                <div>Facebook: @AmistadCASIRA</div>
                <div>Instagram: @casira_guatemala</div>
                <div>Twitter: @CASIRAorg</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Horarios</h4>
              <div className="space-y-2 text-gray-300 text-sm">
                <div>Lunes - Viernes: 8:00 AM - 6:00 PM</div>
                <div>Sábados: 9:00 AM - 2:00 PM</div>
                <div>Domingos: Cerrado</div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Join Activity Modal */}
      {showJoinModal && selectedActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              ¿Quieres unirte a "{selectedActivity.title}"?
            </h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-2" />
                <span>Fecha: {selectedActivity.start_date ? new Date(selectedActivity.start_date).toLocaleDateString() : 'Por confirmar'}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="h-4 w-4 mr-2" />
                <span>Lugar: {selectedActivity.location || 'Por confirmar'}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Users className="h-4 w-4 mr-2" />
                <span>Participantes: {selectedActivity.current_volunteers || 0}/{selectedActivity.max_volunteers || '∞'}</span>
              </div>
            </div>
            
            <p className="text-gray-600 text-sm mb-6">
              Al unirte a esta actividad, un coordinador se pondrá en contacto contigo para proporcionarte todos los detalles y preparación necesaria.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowJoinModal(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={confirmJoinActivity}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
              >
                ¡Unirme!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitorDashboard;