// ============= CASIRA Activities Service =============
import apiClient from '../axios-config.js';

class ActivitiesService {
  
  // ============= ACTIVITY CRUD OPERATIONS =============
  
  async getAllActivities() {
    try {
      const activities = this.getStoredActivities();
      console.log('📋 ActivitiesService: Retrieved all activities:', activities.length);
      return activities;
    } catch (error) {
      console.error('❌ ActivitiesService: Error getting activities:', error);
      throw error;
    }
  }

  async getActivityById(id) {
    try {
      const activities = this.getStoredActivities();
      const activity = activities.find(a => a.id == id);
      console.log('🎯 ActivitiesService: Retrieved activity by ID:', activity?.title || 'Not found');
      return activity || null;
    } catch (error) {
      console.error('❌ ActivitiesService: Error getting activity by ID:', error);
      throw error;
    }
  }

  async createActivity(activityData) {
    try {
      const activities = this.getStoredActivities();
      
      const newActivity = {
        id: Date.now(),
        ...activityData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'active',
        participants: [],
        comments: [],
        photos: []
      };

      activities.push(newActivity);
      this.saveActivities(activities);
      
      console.log('✅ ActivitiesService: Activity created:', newActivity.title);
      return newActivity;
    } catch (error) {
      console.error('❌ ActivitiesService: Error creating activity:', error);
      throw error;
    }
  }

  async updateActivity(activityId, updateData) {
    try {
      const activities = this.getStoredActivities();
      const activityIndex = activities.findIndex(a => a.id == activityId);
      
      if (activityIndex === -1) {
        throw new Error('Actividad no encontrada');
      }

      activities[activityIndex] = { 
        ...activities[activityIndex], 
        ...updateData, 
        updated_at: new Date().toISOString() 
      };

      this.saveActivities(activities);
      console.log('✅ ActivitiesService: Activity updated:', activities[activityIndex].title);
      return activities[activityIndex];
    } catch (error) {
      console.error('❌ ActivitiesService: Error updating activity:', error);
      throw error;
    }
  }

  async deleteActivity(activityId) {
    try {
      const activities = this.getStoredActivities();
      const activityIndex = activities.findIndex(a => a.id == activityId);
      
      if (activityIndex === -1) {
        throw new Error('Actividad no encontrada');
      }

      const deletedActivity = activities[activityIndex];
      activities.splice(activityIndex, 1);
      
      this.saveActivities(activities);
      console.log('🗑️ ActivitiesService: Activity deleted:', deletedActivity.title);
      return deletedActivity;
    } catch (error) {
      console.error('❌ ActivitiesService: Error deleting activity:', error);
      throw error;
    }
  }

  // ============= PARTICIPATION MANAGEMENT =============

  async joinActivity(activityId, userId) {
    try {
      const activities = this.getStoredActivities();
      const activity = activities.find(a => a.id == activityId);
      
      if (!activity) {
        throw new Error('Actividad no encontrada');
      }

      if (!activity.participants.includes(userId)) {
        activity.participants.push(userId);
        activity.updated_at = new Date().toISOString();
        
        await this.updateActivity(activityId, { participants: activity.participants });
        console.log('🤝 ActivitiesService: User joined activity:', userId, activity.title);
      }
      
      return activity;
    } catch (error) {
      console.error('❌ ActivitiesService: Error joining activity:', error);
      throw error;
    }
  }

  async leaveActivity(activityId, userId) {
    try {
      const activities = this.getStoredActivities();
      const activity = activities.find(a => a.id == activityId);
      
      if (!activity) {
        throw new Error('Actividad no encontrada');
      }

      const participantIndex = activity.participants.indexOf(userId);
      if (participantIndex > -1) {
        activity.participants.splice(participantIndex, 1);
        activity.updated_at = new Date().toISOString();
        
        await this.updateActivity(activityId, { participants: activity.participants });
        console.log('👋 ActivitiesService: User left activity:', userId, activity.title);
      }
      
      return activity;
    } catch (error) {
      console.error('❌ ActivitiesService: Error leaving activity:', error);
      throw error;
    }
  }

  // ============= COMMENTS MANAGEMENT =============

  async addComment(activityId, commentData) {
    try {
      const activities = this.getStoredActivities();
      const activity = activities.find(a => a.id == activityId);
      
      if (!activity) {
        throw new Error('Actividad no encontrada');
      }

      const newComment = {
        id: Date.now(),
        ...commentData,
        created_at: new Date().toISOString()
      };

      if (!activity.comments) {
        activity.comments = [];
      }
      
      activity.comments.push(newComment);
      activity.updated_at = new Date().toISOString();
      
      await this.updateActivity(activityId, { comments: activity.comments });
      console.log('💬 ActivitiesService: Comment added to activity:', activity.title);
      return newComment;
    } catch (error) {
      console.error('❌ ActivitiesService: Error adding comment:', error);
      throw error;
    }
  }

  // ============= FILTERING AND SEARCH =============

  async getActivitiesByCategory(category) {
    try {
      const activities = this.getStoredActivities();
      const filtered = activities.filter(a => a.category === category);
      console.log(`🏷️ ActivitiesService: Retrieved ${category} activities:`, filtered.length);
      return filtered;
    } catch (error) {
      console.error('❌ ActivitiesService: Error getting activities by category:', error);
      throw error;
    }
  }

  async getActivitiesByStatus(status) {
    try {
      const activities = this.getStoredActivities();
      const filtered = activities.filter(a => a.status === status);
      console.log(`📊 ActivitiesService: Retrieved ${status} activities:`, filtered.length);
      return filtered;
    } catch (error) {
      console.error('❌ ActivitiesService: Error getting activities by status:', error);
      throw error;
    }
  }

  async getUserActivities(userId) {
    try {
      const activities = this.getStoredActivities();
      const userActivities = activities.filter(a => 
        a.participants && a.participants.includes(userId)
      );
      console.log('👤 ActivitiesService: Retrieved user activities:', userActivities.length);
      return userActivities;
    } catch (error) {
      console.error('❌ ActivitiesService: Error getting user activities:', error);
      throw error;
    }
  }

  // ============= STATISTICS =============

  async getActivityStats() {
    try {
      const activities = this.getStoredActivities();
      
      const stats = {
        total: activities.length,
        byCategory: {},
        byStatus: {
          active: activities.filter(a => a.status === 'active').length,
          completed: activities.filter(a => a.status === 'completed').length,
          cancelled: activities.filter(a => a.status === 'cancelled').length
        },
        totalParticipants: activities.reduce((sum, a) => sum + (a.participants?.length || 0), 0),
        averageParticipants: activities.length > 0 
          ? activities.reduce((sum, a) => sum + (a.participants?.length || 0), 0) / activities.length 
          : 0
      };

      // Count by categories dynamically
      activities.forEach(activity => {
        const category = activity.category || 'uncategorized';
        stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
      });

      console.log('📊 ActivitiesService: Activity stats:', stats);
      return stats;
    } catch (error) {
      console.error('❌ ActivitiesService: Error getting activity stats:', error);
      throw error;
    }
  }

  // ============= STORAGE HELPERS =============

  getStoredActivities() {
    try {
      const casiraData = localStorage.getItem('casira-data');
      if (casiraData) {
        const data = JSON.parse(casiraData);
        return data.activities || this.getDefaultActivities();
      }
      return this.getDefaultActivities();
    } catch (error) {
      console.error('Error getting stored activities:', error);
      return this.getDefaultActivities();
    }
  }

  saveActivities(activities) {
    try {
      let casiraData = {};
      const existingData = localStorage.getItem('casira-data');
      if (existingData) {
        casiraData = JSON.parse(existingData);
      }
      casiraData.activities = activities;
      localStorage.setItem('casira-data', JSON.stringify(casiraData));
      console.log('💾 ActivitiesService: Activities saved to storage');
    } catch (error) {
      console.error('❌ ActivitiesService: Error saving activities:', error);
    }
  }

  getDefaultActivities() {
    return [
      {
        id: 1,
        title: "Taller de Programación Básica",
        description: "Introducción a la programación para jóvenes de 13-18 años",
        category: "education",
        date: "2024-03-15",
        time: "14:00",
        location: "Centro Comunitario CASIRA",
        max_participants: 20,
        status: "active",
        created_at: "2024-01-01",
        participants: [2, 3, 4],
        comments: [],
        photos: []
      },
      {
        id: 2,
        title: "Campaña de Recolección de Útiles",
        description: "Recolectamos útiles escolares para estudiantes de bajos recursos",
        category: "donation",
        date: "2024-03-20",
        time: "09:00",
        location: "Plaza Central",
        max_participants: 50,
        status: "active",
        created_at: "2024-01-10",
        participants: [1, 2],
        comments: [],
        photos: []
      },
      {
        id: 3,
        title: "Limpieza de Parque Comunitario",
        description: "Actividad de voluntariado para mantener limpio nuestro parque local",
        category: "community",
        date: "2024-03-25",
        time: "08:00", 
        location: "Parque Central",
        max_participants: 30,
        status: "active",
        created_at: "2024-01-15",
        participants: [3, 4],
        comments: [],
        photos: []
      }
    ];
  }
}

// Create singleton instance
const activitiesService = new ActivitiesService();

export default activitiesService;
export { ActivitiesService };