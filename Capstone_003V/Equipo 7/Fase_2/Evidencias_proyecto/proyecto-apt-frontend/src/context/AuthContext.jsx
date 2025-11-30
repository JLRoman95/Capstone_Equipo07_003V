import React, { createContext, useState, useContext, useEffect } from 'react';
import firebaseAuthService from '../services/firebaseAuthService';
import { logActivity, registerUserSession, closeSession } from '../services/firebaseService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    const storedUser = firebaseAuthService.getCurrentUser();
    if (storedUser) {
      setUser(storedUser);
    }
    
    // Observar cambios en el estado de autenticación de Firebase
    const unsubscribe = firebaseAuthService.onAuthStateChange((user) => {
      if (user) {
        setUser(user);
      }
    });
    
    setLoading(false);
    
    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      const data = await firebaseAuthService.login(email, password);
      setUser(data.user);
      
      // Registrar actividad en Firebase (no bloqueante)
      logActivity({
        userId: data.user.id_usuario,
        action: 'login',
        details: { email, timestamp: new Date().toISOString() }
      }).catch(err => console.warn('No se pudo registrar actividad:', err));
      
      // Registrar sesión en Firebase (no bloqueante)
      registerUserSession({
        userId: data.user.id_usuario,
        userName: data.user.nombre,
        userRole: data.user.rol,
        email: email
      }).then(sessionResult => {
        if (sessionResult.success) {
          setSessionId(sessionResult.sessionId);
        }
      }).catch(err => console.warn('No se pudo registrar sesión:', err));
      
      return data;
    } catch (error) {
      console.error('Error en login del AuthContext:', error);
      throw error;
    }
  };

  const register = async (nombre, email, password, rol = 'admin') => {
    try {
      const data = await firebaseAuthService.register(nombre, email, password, rol);
      
      // Registrar actividad en Firebase (no bloqueante)
      logActivity({
        userId: data.user.id_usuario,
        action: 'register',
        details: { nombre, email, rol, timestamp: new Date().toISOString() }
      }).catch(err => console.warn('No se pudo registrar actividad:', err));
      
      return data;
    } catch (error) {
      console.error('Error en register del AuthContext:', error);
      throw error;
    }
  };

  const logout = async () => {
    const currentUser = user;
    
    // Cerrar sesión en Firebase
    if (sessionId) {
      await closeSession(sessionId);
    }
    
    // Registrar actividad de logout
    if (currentUser) {
      await logActivity({
        userId: currentUser.id_usuario,
        action: 'logout',
        details: { timestamp: new Date().toISOString() }
      });
    }
    
    await firebaseAuthService.logout();
    setUser(null);
    setSessionId(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    isAuthenticated: firebaseAuthService.isAuthenticated(),
    loading,
    sessionId
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};
