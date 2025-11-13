import { useState, useEffect } from 'react';
import { subscribeToNotifications, markNotificationAsRead } from '../services/firebaseService';

/**
 * Hook para gestionar notificaciones en tiempo real con Firebase
 */
export const useNotifications = (userId) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Suscribirse a notificaciones en tiempo real
    const unsubscribe = subscribeToNotifications(userId, (newNotifications) => {
      setNotifications(newNotifications);
      setUnreadCount(newNotifications.length);
      setLoading(false);
    });

    // Cleanup al desmontar
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [userId]);

  const markAsRead = async (notificationId) => {
    const result = await markNotificationAsRead(notificationId);
    if (result.success) {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    return result;
  };

  const markAllAsRead = async () => {
    const promises = notifications.map(n => markNotificationAsRead(n.id));
    await Promise.all(promises);
    setNotifications([]);
    setUnreadCount(0);
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead
  };
};

export default useNotifications;
