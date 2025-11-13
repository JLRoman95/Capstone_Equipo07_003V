import { useEffect } from 'react';
import { trackEvent, updateSession } from '../services/firebaseService';
import { useAuth } from '../context/AuthContext';

/**
 * Hook para registrar eventos de analytics con Firebase
 */
export const useAnalytics = () => {
  const { user, sessionId } = useAuth();

  const track = async (eventType, eventData = {}) => {
    if (!user) return;

    await trackEvent({
      eventType,
      userId: user.id_usuario,
      userName: user.nombre,
      userRole: user.rol,
      sessionId,
      ...eventData
    });
  };

  const trackPageView = async (pageName, pageUrl) => {
    await track('page_view', {
      pageName,
      pageUrl,
      timestamp: new Date().toISOString()
    });
  };

  const trackAction = async (actionName, actionData = {}) => {
    await track('user_action', {
      actionName,
      ...actionData,
      timestamp: new Date().toISOString()
    });
  };

  const trackError = async (errorType, errorMessage, errorStack = null) => {
    await track('error', {
      errorType,
      errorMessage,
      errorStack,
      timestamp: new Date().toISOString()
    });
  };

  // Actualizar sesión cada 5 minutos
  useEffect(() => {
    if (!sessionId) return;

    const interval = setInterval(async () => {
      await updateSession(sessionId, {
        lastActivity: new Date().toISOString()
      });
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(interval);
  }, [sessionId]);

  return {
    track,
    trackPageView,
    trackAction,
    trackError
  };
};

export default useAnalytics;
