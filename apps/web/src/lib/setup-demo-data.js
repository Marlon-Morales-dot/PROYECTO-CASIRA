// ============= CASIRA Connect - Setup Demo Data =============
import { supabase } from './supabase-client.js';

// ============= CREAR DATOS DE DEMOSTRACIÓN =============
export const setupDemoData = async () => {
  console.log('🚀 SETUP: Creating demo data for CASIRA Connect...');
  
  try {
    // 1. Crear categorías de actividades
    const categories = [
      { name: 'Medio Ambiente', description: 'Actividades de conservación y sostenibilidad', color: '#10B981', icon: '🌱' },
      { name: 'Educación', description: 'Programas educativos y de capacitación', color: '#3B82F6', icon: '📚' },
      { name: 'Alimentación', description: 'Programas de seguridad alimentaria', color: '#F59E0B', icon: '🍞' },
      { name: 'Salud', description: 'Actividades de salud comunitaria', color: '#EF4444', icon: '❤️' },
      { name: 'Vivienda', description: 'Proyectos de construcción y vivienda', color: '#8B5CF6', icon: '🏠' }
    ];
    
    console.log('📝 SETUP: Creating activity categories...');
    for (const category of categories) {
      try {
        await supabase
          .from('activity_categories')
          .upsert(category, { onConflict: 'name' });
        console.log(`✅ SETUP: Category created: ${category.name}`);
      } catch (error) {
        console.log(`⚠️ SETUP: Category may already exist: ${category.name}`);
      }
    }

    // 2. Obtener las categorías creadas
    const { data: createdCategories } = await supabase
      .from('activity_categories')
      .select('*');
    
    // 3. Crear actividades de ejemplo
    const activities = [
      {
        title: 'Reforestación Comunitaria',
        description: 'Plantar árboles nativos para restaurar el ecosistema local',
        detailed_description: 'Proyecto de reforestación que busca plantar 1000 árboles nativos en áreas degradadas de la comunidad. Incluye capacitación sobre cuidado del medio ambiente y técnicas de plantación.',
        category_id: createdCategories?.find(c => c.name === 'Medio Ambiente')?.id,
        created_by: '9e8385dc-cf3b-4f6e-87dc-e287c6d444c6', // Admin user ID
        status: 'active',
        priority: 'high',
        location: 'Bosque de San Juan',
        start_date: '2024-09-15T08:00:00Z',
        end_date: '2024-09-17T17:00:00Z',
        max_volunteers: 50,
        current_volunteers: 0,
        budget: 5000,
        funds_raised: 2500,
        image_url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=500',
        requirements: ['Ropa cómoda', 'Protector solar', 'Botella de agua'],
        benefits: ['Certificado de participación', 'Almuerzo incluido', 'Transporte'],
        contact_info: { email: 'admin@casira.org', phone: '+502-1234-5678' },
        visibility: 'public',
        featured: true
      },
      {
        title: 'Biblioteca Digital Rural',
        description: 'Implementar biblioteca digital en escuelas rurales',
        detailed_description: 'Proyecto para instalar y configurar bibliotecas digitales en 5 escuelas rurales, incluyendo capacitación a maestros y estudiantes sobre el uso de tecnología educativa.',
        category_id: createdCategories?.find(c => c.name === 'Educación')?.id,
        created_by: '9e8385dc-cf3b-4f6e-87dc-e287c6d444c6',
        status: 'active',
        priority: 'medium',
        location: 'Escuelas rurales de San Marcos',
        start_date: '2024-09-20T09:00:00Z',
        end_date: '2024-09-25T16:00:00Z',
        max_volunteers: 20,
        current_volunteers: 0,
        budget: 8000,
        funds_raised: 3500,
        image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500',
        requirements: ['Conocimientos básicos de computación', 'Disponibilidad de tiempo completo'],
        benefits: ['Capacitación certificada', 'Almuerzo y transporte', 'Experiencia educativa'],
        visibility: 'public',
        featured: true
      },
      {
        title: 'Comedor Comunitario',
        description: 'Preparar y distribuir alimentos para familias necesitadas',
        detailed_description: 'Programa semanal de preparación y distribución de alimentos nutritivos para 100 familias en situación vulnerable. Incluye educación nutricional y seguimiento familiar.',
        category_id: createdCategories?.find(c => c.name === 'Alimentación')?.id,
        created_by: '9e8385dc-cf3b-4f6e-87dc-e287c6d444c6',
        status: 'active',
        priority: 'high',
        location: 'Centro Comunitario La Esperanza',
        start_date: '2024-09-18T06:00:00Z',
        max_volunteers: 30,
        current_volunteers: 0,
        image_url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=500',
        requirements: ['Certificado de salud', 'Disponibilidad matutina'],
        benefits: ['Desayuno incluido', 'Certificado de servicio social'],
        visibility: 'public',
        featured: false
      }
    ];

    console.log('🎯 SETUP: Creating sample activities...');
    for (const activity of activities) {
      try {
        const { data, error } = await supabase
          .from('activities')
          .insert(activity)
          .select()
          .single();
        
        if (error) throw error;
        console.log(`✅ SETUP: Activity created: ${activity.title}`);
      } catch (error) {
        console.log(`⚠️ SETUP: Activity may already exist: ${activity.title}`, error.message);
      }
    }

    // 4. Crear posts de ejemplo
    const posts = [
      {
        author_id: '9e8385dc-cf3b-4f6e-87dc-e287c6d444c6',
        title: '¡Bienvenidos a CASIRA Connect!',
        content: '¡Hola a todos! Estoy emocionado de compartir este nuevo espacio donde nuestra comunidad puede conectarse, colaborar y crear impacto positivo juntos. 🌟\n\nAquí podrán encontrar actividades, compartir experiencias y construir una red de apoyo sólida. ¡Vamos a hacer la diferencia!',
        post_type: 'announcement',
        visibility: 'public',
        featured: true
      },
      {
        author_id: '9e8385dc-cf3b-4f6e-87dc-e287c6d444c6',
        title: 'Nuevas Actividades Disponibles',
        content: 'Tenemos tres nuevas actividades esperando por ustedes:\n\n🌱 Reforestación Comunitaria - ¡Plantemos juntos el futuro!\n📚 Biblioteca Digital Rural - Llevemos tecnología a las escuelas\n🍞 Comedor Comunitario - Alimentemos la esperanza\n\n¿Cuál te llama más la atención?',
        post_type: 'update',
        visibility: 'public',
        featured: false
      }
    ];

    console.log('📝 SETUP: Creating sample posts...');
    for (const post of posts) {
      try {
        const { data, error } = await supabase
          .from('posts')
          .insert(post)
          .select()
          .single();
        
        if (error) throw error;
        console.log(`✅ SETUP: Post created: ${post.title}`);
      } catch (error) {
        console.log(`⚠️ SETUP: Post may already exist: ${post.title}`, error.message);
      }
    }

    // 5. Crear algunos comentarios de ejemplo
    const { data: createdPosts } = await supabase
      .from('posts')
      .select('*')
      .limit(2);

    if (createdPosts && createdPosts.length > 0) {
      const comments = [
        {
          post_id: createdPosts[0].id,
          author_id: 'cbac644a-91e5-485e-9b2f-8f4e731b57c6', // Admin CASIRA user
          content: '¡Excelente iniciativa! Estoy muy emocionado de ver cómo nuestra comunidad se une por causas importantes. 👏',
        },
        {
          post_id: createdPosts[0].id,
          author_id: '9e8385dc-cf3b-4f6e-87dc-e287c6d444c6',
          content: 'Gracias por el apoyo. Juntos podemos lograr grandes cambios. ¿Ya decidiste en qué actividad vas a participar?',
        }
      ];

      console.log('💬 SETUP: Creating sample comments...');
      for (const comment of comments) {
        try {
          await supabase
            .from('comments')
            .insert(comment);
          console.log(`✅ SETUP: Comment created`);
        } catch (error) {
          console.log(`⚠️ SETUP: Comment creation failed:`, error.message);
        }
      }
    }

    console.log('🎉 SETUP: Demo data creation completed successfully!');
    return {
      success: true,
      message: 'Demo data created successfully'
    };

  } catch (error) {
    console.error('❌ SETUP: Error creating demo data:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// ============= LIMPIAR DATOS DE DEMOSTRACIÓN =============
export const cleanDemoData = async () => {
  console.log('🧹 SETUP: Cleaning demo data...');
  
  try {
    // Limpiar en orden para evitar problemas de foreign keys
    await supabase.from('comments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('posts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('activity_participants').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('volunteer_requests').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('activities').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    // No eliminamos categories ya que pueden ser útiles
    
    console.log('✅ SETUP: Demo data cleaned successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ SETUP: Error cleaning demo data:', error);
    return { success: false, error: error.message };
  }
};

// ============= VERIFICAR ESTADO DE LOS DATOS =============
export const checkDataStatus = async () => {
  try {
    const [
      { count: usersCount },
      { count: activitiesCount },
      { count: postsCount },
      { count: commentsCount },
      { count: categoriesCount }
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('activities').select('*', { count: 'exact', head: true }),
      supabase.from('posts').select('*', { count: 'exact', head: true }),
      supabase.from('comments').select('*', { count: 'exact', head: true }),
      supabase.from('activity_categories').select('*', { count: 'exact', head: true })
    ]);

    return {
      users: usersCount,
      activities: activitiesCount,
      posts: postsCount,
      comments: commentsCount,
      categories: categoriesCount,
      ready: usersCount > 0 && activitiesCount > 0 && postsCount > 0
    };
  } catch (error) {
    console.error('❌ SETUP: Error checking data status:', error);
    return { error: error.message };
  }
};

export default { setupDemoData, cleanDemoData, checkDataStatus };