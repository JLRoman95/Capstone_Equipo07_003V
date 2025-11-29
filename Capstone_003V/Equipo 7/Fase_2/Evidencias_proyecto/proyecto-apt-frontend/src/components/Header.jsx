import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentShift, setCurrentShift] = useState('');

  useEffect(() => {
    const updateTimeAndShift = () => {
      const now = new Date();
      setCurrentTime(now);
      
      const hours = now.getHours();
      let shift = '';
      
      // Noche: 00:00 - 08:00
      if (hours >= 0 && hours < 8) {
        shift = 'Noche';
      }
      // Mañana: 08:00 - 16:00
      else if (hours >= 8 && hours < 16) {
        shift = 'Mañana';
      }
      // Tarde: 16:00 - 24:00
      else {
        shift = 'Tarde';
      }
      
      setCurrentShift(shift);
    };

    updateTimeAndShift();
    const interval = setInterval(updateTimeAndShift, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getShiftColor = (shift) => {
    switch(shift) {
      case 'Mañana':
        return '#f59e0b'; // amber
      case 'Tarde':
        return '#3b82f6'; // blue
      case 'Noche':
        return '#6366f1'; // indigo
      default:
        return '#6b7280'; // gray
    }
  };

  const getShiftTimeRange = (shift) => {
    switch(shift) {
      case 'Mañana':
        return '08:00 - 16:00';
      case 'Tarde':
        return '16:00 - 24:00';
      case 'Noche':
        return '00:00 - 08:00';
      default:
        return '';
    }
  };

  return (
    <header style={{ backgroundColor: '#f1f5f9', boxShadow: '0 2px 12px rgba(15,23,42,0.08)', padding: '1rem 0' }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>Sistema APT</h1>
          <p style={{ fontSize: '0.875rem', color: '#475569', margin: 0 }}>Control de Calidad Alimentaria</p>
        </div>

        {/* Clock and Shift Display */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          padding: '0.5rem 1rem',
          backgroundColor: '#f9fafb',
          borderRadius: '0.5rem',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ 
            fontSize: '1.5rem', 
            fontWeight: 'bold', 
            color: '#111827',
            fontFamily: 'monospace',
            letterSpacing: '0.05em'
          }}>
            {formatTime(currentTime)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
            {formatDate(currentTime)}
          </div>
          <div style={{ 
            marginTop: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: '600',
              color: 'white',
              backgroundColor: getShiftColor(currentShift),
              padding: '0.25rem 0.75rem',
              borderRadius: '0.25rem',
              textTransform: 'uppercase'
            }}>
              {currentShift}
            </span>
            <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>
              {getShiftTimeRange(currentShift)}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <NotificationBell />
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#0f172a', margin: 0, whiteSpace: 'nowrap' }}>{user?.nombre || 'Usuario'}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
              <span 
                style={{ 
                  fontSize: '0.65rem', 
                  color: 'white',
                  backgroundColor: user?.rol === 'admin' ? '#ef4444' : user?.rol === 'auditor' ? '#f59e0b' : '#10b981',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap'
                }}
              >
                {user?.rol === 'admin' ? 'Admin' : user?.rol === 'auditor' ? 'Auditor' : 'Cocinero'}
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate('/manual')}
            className="btn btn-outline-primary"
            style={{ whiteSpace: 'nowrap' }}
          >
            Manual de uso
          </button>
          <button
            onClick={logout}
            className="btn btn-danger"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
