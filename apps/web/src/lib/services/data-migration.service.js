// ============= CASIRA Data Migration Service =============
// Servicio para migrar datos entre localStorage y Supabase
import { supabase } from '../supabase-singleton.js';
import { supabaseAPI } from '../supabase-api.js';
import storageManager from '../storage-manager.js';

class DataMigrationService {
  constructor() {
    this.isRunning = false;
    this.migrationLog = [];
  }

  // ============= MIGRACIÓN PRINCIPAL =============

  async migrateAllData(options = {}) {
    if (this.isRunning) {
      console.warn('⚠️ MIGRATION: Migration already in progress');
      return { success: false, message: 'Migration already running' };
    }

    this.isRunning = true;
    this.migrationLog = [];

    try {
      console.log('🚀 MIGRATION: Starting data migration to Supabase...');

      const {
        migrateUsers = true,
        migrateActivities = true,
        createTestData = false,
        forceUpdate = false
      } = options;

      const results = {
        users: { migrated: 0, errors: 0 },
        activities: { migrated: 0, errors: 0 },
        total: { success: 0, errors: 0 }
      };

      // 1. Cargar datos de localStorage
      const localData = storageManager.loadData();
      this.log('📦 MIGRATION: Loaded local data', {
        users: localData.users?.length || 0,
        activities: localData.activities?.length || 0
      });

      // 2. Migrar usuarios
      if (migrateUsers && localData.users?.length > 0) {
        const userResults = await this.migrateUsers(localData.users, forceUpdate);
        results.users = userResults;
        this.log('👥 MIGRATION: Users migration completed', userResults);
      }

      // 3. Migrar actividades
      if (migrateActivities && localData.activities?.length > 0) {
        const activityResults = await this.migrateActivities(localData.activities, forceUpdate);
        results.activities = activityResults;
        this.log('📋 MIGRATION: Activities migration completed', activityResults);
      }

      // 4. Crear datos de prueba si se solicita
      if (createTestData) {
        await this.createTestData();
        this.log('🧪 MIGRATION: Test data created');
      }

      // 5. Calcular totales
      results.total.success = results.users.migrated + results.activities.migrated;
      results.total.errors = results.users.errors + results.activities.errors;

      console.log('✅ MIGRATION: Migration completed successfully', results);
      return { success: true, results, log: this.migrationLog };

    } catch (error) {
      console.error('❌ MIGRATION: Migration failed:', error);
      this.log('❌ MIGRATION: Migration failed', error.message);
      return { success: false, error: error.message, log: this.migrationLog };
    } finally {
      this.isRunning = false;
    }
  }

  // ============= MIGRACIÓN DE USUARIOS =============

  async migrateUsers(localUsers, forceUpdate = false) {
    const results = { migrated: 0, errors: 0, skipped: 0 };

    for (const localUser of localUsers) {
      try {
        // Validar datos del usuario
        if (!localUser.email) {
          this.log('⚠️ USER: Skipping user without email', localUser.id);
          results.skipped++;
          continue;
        }

        // Buscar usuario existente en Supabase
        let existingUser = null;
        try {
          existingUser = await supabaseAPI.users.getUserByEmail(localUser.email);
        } catch (error) {
          // Usuario no existe, está bien
        }

        if (existingUser && !forceUpdate) {
          this.log('📝 USER: User already exists, skipping', localUser.email);
          results.skipped++;

          // Actualizar el supabase_id en localStorage si no lo tiene
          if (!localUser.supabase_id) {
            await this.updateLocalUserSupabaseId(localUser.id, existingUser.id);
          }
          continue;
        }

        // Preparar datos para Supabase
        const userData = {
          email: localUser.email,
          first_name: localUser.first_name || localUser.given_name || 'Usuario',
          last_name: localUser.last_name || localUser.family_name || 'Nuevo',
          full_name: localUser.name || localUser.full_name || `${localUser.first_name || ''} ${localUser.last_name || ''}`.trim(),
          avatar_url: localUser.picture || localUser.avatar_url,
          role: localUser.role || 'visitor',
          bio: localUser.bio || `Usuario migrado desde localStorage - ${new Date().toLocaleDateString()}`,
          phone: localUser.phone || null,
          location: localUser.location || null,
          skills: localUser.skills || [],
          interests: localUser.interests || [],
          social_links: localUser.social_links || {}
        };

        let supabaseUser;
        if (existingUser && forceUpdate) {
          // Actualizar usuario existente
          supabaseUser = await supabaseAPI.users.updateUser(existingUser.id, userData);
          this.log('🔄 USER: Updated existing user', localUser.email);
        } else {
          // Crear nuevo usuario
          supabaseUser = await supabaseAPI.users.createUser(userData);
          this.log('✅ USER: Created new user', localUser.email);
        }

        // Actualizar localStorage con supabase_id
        await this.updateLocalUserSupabaseId(localUser.id, supabaseUser.id);

        results.migrated++;

      } catch (error) {
        console.error(`❌ MIGRATION: Error migrating user ${localUser.email}:`, error);
        this.log(`❌ USER: Failed to migrate ${localUser.email}`, error.message);
        results.errors++;
      }
    }

    return results;
  }

  // ============= MIGRACIÓN DE ACTIVIDADES =============

  async migrateActivities(localActivities, forceUpdate = false) {
    const results = { migrated: 0, errors: 0, skipped: 0 };

    for (const localActivity of localActivities) {
      try {
        // Validar datos de la actividad
        if (!localActivity.title || !localActivity.description) {
          this.log('⚠️ ACTIVITY: Skipping activity without title/description', localActivity.id);
          results.skipped++;
          continue;
        }

        // Buscar actividad existente por título (simple matching)
        const { data: existingActivities } = await supabase
          .from('activities')
          .select('*')
          .eq('title', localActivity.title)
          .limit(1);

        if (existingActivities?.length > 0 && !forceUpdate) {
          this.log('📝 ACTIVITY: Activity already exists, skipping', localActivity.title);
          results.skipped++;
          continue;
        }

        // Buscar creador en Supabase
        let creatorId = null;
        if (localActivity.creator_id) {
          // Buscar en localStorage primero
          const localData = storageManager.loadData();
          const localCreator = localData.users?.find(u => u.id === localActivity.creator_id);

          if (localCreator?.supabase_id) {
            creatorId = localCreator.supabase_id;
          } else if (localCreator?.email) {
            try {
              const supabaseCreator = await supabaseAPI.users.getUserByEmail(localCreator.email);
              if (supabaseCreator) {
                creatorId = supabaseCreator.id;
                // Actualizar localStorage
                await this.updateLocalUserSupabaseId(localCreator.id, supabaseCreator.id);
              }
            } catch (error) {
              console.warn('⚠️ Creator not found in Supabase:', localCreator.email);
            }
          }
        }

        // Si no encontramos creador, buscar un admin como fallback
        if (!creatorId) {
          try {
            const admins = await supabaseAPI.users.getAllUsers();
            const adminUser = admins.find(u => u.role === 'admin');
            if (adminUser) {
              creatorId = adminUser.id;
              this.log('🔄 ACTIVITY: Using admin as creator fallback');
            }
          } catch (error) {
            console.warn('⚠️ Could not find admin user as fallback');
          }
        }

        // Preparar datos para Supabase
        const activityData = {
          title: localActivity.title,
          description: localActivity.description,
          creator_id: creatorId,
          location: localActivity.location || null,
          start_date: localActivity.date ? new Date(localActivity.date).toISOString() : null,
          end_date: localActivity.end_date ? new Date(localActivity.end_date).toISOString() : null,
          max_volunteers: parseInt(localActivity.max_participants || localActivity.volunteers_needed || 0) || null,
          current_volunteers: parseInt(localActivity.participants?.length || 0) || 0,
          status: localActivity.status || 'active',
          requirements: localActivity.requirements || null,
          benefits: localActivity.benefits || null,
          images: localActivity.images || (localActivity.image_url ? [localActivity.image_url] : null),
          priority: localActivity.priority || 'normal',
          budget: localActivity.budget ? parseFloat(localActivity.budget) : null,
          contact_info: localActivity.contact_info || null,
          is_featured: localActivity.featured || false,
          views_count: parseInt(localActivity.views_count || 0) || 0,
          likes_count: parseInt(localActivity.likes_count || 0) || 0
        };

        // Crear actividad en Supabase
        const { data: newActivity, error } = await supabase
          .from('activities')
          .insert(activityData)
          .select()
          .single();

        if (error) throw error;

        this.log('✅ ACTIVITY: Created activity', localActivity.title);

        // Migrar participantes si los hay
        if (localActivity.participants?.length > 0) {
          await this.migrateActivityParticipants(newActivity.id, localActivity.participants);
        }

        results.migrated++;

      } catch (error) {
        console.error(`❌ MIGRATION: Error migrating activity ${localActivity.title}:`, error);
        this.log(`❌ ACTIVITY: Failed to migrate ${localActivity.title}`, error.message);
        results.errors++;
      }
    }

    return results;
  }

  // ============= MIGRACIÓN DE PARTICIPANTES =============

  async migrateActivityParticipants(activityId, participantIds) {
    const localData = storageManager.loadData();

    for (const participantId of participantIds) {
      try {
        // Buscar usuario en localStorage
        const localUser = localData.users?.find(u => u.id === participantId);
        if (!localUser?.supabase_id) {
          this.log('⚠️ PARTICIPANT: Participant not found or no supabase_id', participantId);
          continue;
        }

        // Crear participant en Supabase
        const { error } = await supabase
          .from('activity_participants')
          .insert({
            activity_id: activityId,
            user_id: localUser.supabase_id,
            joined_at: new Date().toISOString(),
            role: 'volunteer'
          });

        if (error && error.code !== '23505') { // Ignorar duplicados
          throw error;
        }

        this.log('✅ PARTICIPANT: Added participant', localUser.email);

      } catch (error) {
        console.error(`❌ MIGRATION: Error migrating participant ${participantId}:`, error);
        this.log(`❌ PARTICIPANT: Failed to migrate participant ${participantId}`, error.message);
      }
    }
  }

  // ============= DATOS DE PRUEBA =============

  async createTestData() {
    try {
      // Crear actividad de prueba con datos reales
      const testActivity = {
        title: 'Actividad de Prueba - Sistema Real',
        description: 'Esta es una actividad de prueba para validar el sistema de suscripciones en tiempo real con Supabase.',
        location: 'Centro de Pruebas CASIRA',
        start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // En 7 días
        max_volunteers: 10,
        current_volunteers: 0,
        status: 'active',
        priority: 'high',
        is_featured: true
      };

      // Buscar un admin como creador
      const admins = await supabaseAPI.users.getAllUsers();
      const adminUser = admins.find(u => u.role === 'admin');

      if (adminUser) {
        testActivity.creator_id = adminUser.id;

        const { data, error } = await supabase
          .from('activities')
          .insert(testActivity)
          .select()
          .single();

        if (error) throw error;

        this.log('🧪 TEST: Created test activity', data.title);
        return data;
      } else {
        throw new Error('No admin user found to create test activity');
      }

    } catch (error) {
      console.error('❌ TEST: Error creating test data:', error);
      this.log('❌ TEST: Failed to create test data', error.message);
      throw error;
    }
  }

  // ============= UTILIDADES =============

  async updateLocalUserSupabaseId(localUserId, supabaseId) {
    try {
      const data = storageManager.loadData();
      if (data.users) {
        const userIndex = data.users.findIndex(u => u.id === localUserId);
        if (userIndex !== -1) {
          data.users[userIndex].supabase_id = supabaseId;
          storageManager.saveData(data);
          this.log('🔄 LOCAL: Updated user supabase_id', { localUserId, supabaseId });
        }
      }
    } catch (error) {
      console.error('❌ Error updating local user supabase_id:', error);
    }
  }

  async syncSupabaseToLocal() {
    try {
      console.log('⬇️ SYNC: Syncing Supabase data to localStorage...');

      // Obtener datos de Supabase
      const [users, activities] = await Promise.all([
        supabaseAPI.users.getAllUsers(),
        supabaseAPI.activities.getAllActivities()
      ]);

      // Actualizar localStorage
      const localData = storageManager.loadData();
      const updatedData = {
        ...localData,
        lastSupabaseSync: new Date().toISOString(),
        supabaseUsers: users,
        supabaseActivities: activities
      };

      storageManager.saveData(updatedData);

      console.log('✅ SYNC: Supabase data synced to localStorage', {
        users: users.length,
        activities: activities.length
      });

      return { success: true, users: users.length, activities: activities.length };

    } catch (error) {
      console.error('❌ SYNC: Error syncing Supabase to localStorage:', error);
      throw error;
    }
  }

  log(message, data = null) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      message,
      data
    };
    this.migrationLog.push(logEntry);
    console.log(`🔄 MIGRATION: ${message}`, data || '');
  }

  getMigrationLog() {
    return this.migrationLog;
  }

  clearLog() {
    this.migrationLog = [];
  }
}

// Crear instancia singleton
const dataMigrationService = new DataMigrationService();

export default dataMigrationService;
export { DataMigrationService };