import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  onSnapshot,
  serverTimestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Servicio de Firebase para gestión de datos en tiempo real
 * Complementa la API REST del backend
 */

// ==================== COLECCIONES ====================

const COLLECTIONS = {
  LOGS: 'logs',
  NOTIFICATIONS: 'notifications',
  SESSIONS: 'user_sessions',
  ANALYTICS: 'analytics',
  CACHE: 'cache_data'
};

// ==================== LOGS ====================

/**
 * Registrar un log de actividad en Firebase
 */
export const logActivity = async (activity) => {
  try {
    const logData = {
      ...activity,
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(collection(db, COLLECTIONS.LOGS), logData);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error al registrar log:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtener logs filtrados
 */
export const getLogs = async (filters = {}) => {
  try {
    let q = collection(db, COLLECTIONS.LOGS);
    
    if (filters.userId) {
      q = query(q, where('userId', '==', filters.userId));
    }
    
    if (filters.action) {
      q = query(q, where('action', '==', filters.action));
    }
    
    q = query(q, orderBy('timestamp', 'desc'), limit(filters.limit || 50));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error al obtener logs:', error);
    return [];
  }
};

// ==================== NOTIFICACIONES ====================

/**
 * Crear una notificación en tiempo real
 */
export const createNotification = async (notification) => {
  try {
    const notificationData = {
      ...notification,
      read: false,
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), notificationData);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error al crear notificación:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Escuchar notificaciones en tiempo real
 */
export const subscribeToNotifications = (userId, callback) => {
  const q = query(
    collection(db, COLLECTIONS.NOTIFICATIONS),
    where('userId', '==', userId),
    where('read', '==', false),
    orderBy('timestamp', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(notifications);
  });
};

/**
 * Marcar notificación como leída
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const docRef = doc(db, COLLECTIONS.NOTIFICATIONS, notificationId);
    await updateDoc(docRef, { read: true });
    return { success: true };
  } catch (error) {
    console.error('Error al marcar notificación:', error);
    return { success: false, error: error.message };
  }
};

// ==================== SESIONES ====================

/**
 * Registrar sesión de usuario
 */
export const registerUserSession = async (sessionData) => {
  try {
    const data = {
      ...sessionData,
      startTime: serverTimestamp(),
      active: true,
      createdAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(collection(db, COLLECTIONS.SESSIONS), data);
    return { success: true, sessionId: docRef.id };
  } catch (error) {
    console.error('Error al registrar sesión:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Actualizar sesión activa
 */
export const updateSession = async (sessionId, updates) => {
  try {
    const docRef = doc(db, COLLECTIONS.SESSIONS, sessionId);
    await updateDoc(docRef, {
      ...updates,
      lastUpdate: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error al actualizar sesión:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Cerrar sesión
 */
export const closeSession = async (sessionId) => {
  try {
    const docRef = doc(db, COLLECTIONS.SESSIONS, sessionId);
    await updateDoc(docRef, {
      active: false,
      endTime: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    return { success: false, error: error.message };
  }
};

// ==================== ANALYTICS ====================

/**
 * Registrar evento de analítica
 */
export const trackEvent = async (eventData) => {
  try {
    const data = {
      ...eventData,
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString()
    };
    
    await addDoc(collection(db, COLLECTIONS.ANALYTICS), data);
    return { success: true };
  } catch (error) {
    console.error('Error al registrar evento:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtener estadísticas de eventos
 */
export const getEventStats = async (eventType, days = 7) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const q = query(
      collection(db, COLLECTIONS.ANALYTICS),
      where('eventType', '==', eventType),
      where('timestamp', '>=', startDate)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    return [];
  }
};

// ==================== CACHE ====================

/**
 * Guardar datos en caché de Firebase
 */
export const setCacheData = async (key, data, ttl = 3600) => {
  try {
    const cacheData = {
      key,
      data,
      expiresAt: new Date(Date.now() + ttl * 1000).toISOString(),
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString()
    };
    
    const docRef = doc(db, COLLECTIONS.CACHE, key);
    await updateDoc(docRef, cacheData).catch(() => {
      // Si el documento no existe, créalo
      return addDoc(collection(db, COLLECTIONS.CACHE), cacheData);
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error al guardar en caché:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtener datos de caché
 */
export const getCacheData = async (key) => {
  try {
    const docRef = doc(db, COLLECTIONS.CACHE, key);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return { success: false, error: 'Cache not found' };
    }
    
    const cacheData = docSnap.data();
    
    // Verificar si expiró
    if (new Date(cacheData.expiresAt) < new Date()) {
      await deleteDoc(docRef);
      return { success: false, error: 'Cache expired' };
    }
    
    return { success: true, data: cacheData.data };
  } catch (error) {
    console.error('Error al obtener de caché:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Limpiar caché expirado
 */
export const clearExpiredCache = async () => {
  try {
    const q = query(
      collection(db, COLLECTIONS.CACHE),
      where('expiresAt', '<', new Date().toISOString())
    );
    
    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    return { success: true, count: snapshot.docs.length };
  } catch (error) {
    console.error('Error al limpiar caché:', error);
    return { success: false, error: error.message };
  }
};

// ==================== UTILIDADES ====================

/**
 * Escuchar cambios en una colección en tiempo real
 */
export const subscribeToCollection = (collectionName, filters = {}, callback) => {
  let q = collection(db, collectionName);
  
  // Aplicar filtros
  Object.entries(filters).forEach(([field, value]) => {
    q = query(q, where(field, '==', value));
  });
  
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(data);
  });
};

/**
 * Eliminar documento
 */
export const deleteDocument = async (collectionName, docId) => {
  try {
    await deleteDoc(doc(db, collectionName, docId));
    return { success: true };
  } catch (error) {
    console.error('Error al eliminar documento:', error);
    return { success: false, error: error.message };
  }
};

export default {
  // Logs
  logActivity,
  getLogs,
  
  // Notificaciones
  createNotification,
  subscribeToNotifications,
  markNotificationAsRead,
  
  // Sesiones
  registerUserSession,
  updateSession,
  closeSession,
  
  // Analytics
  trackEvent,
  getEventStats,
  
  // Cache
  setCacheData,
  getCacheData,
  clearExpiredCache,
  
  // Utilidades
  subscribeToCollection,
  deleteDocument
};
