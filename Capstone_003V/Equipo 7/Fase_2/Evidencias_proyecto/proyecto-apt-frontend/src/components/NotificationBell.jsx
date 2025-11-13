import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import useNotifications from '../hooks/useNotifications';

const NotificationBell = () => {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(user?.id_usuario);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleMarkAsRead = async (notificationId, e) => {
    e.stopPropagation();
    await markAsRead(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    setShowDropdown(false);
  };

  if (!user) return null;

  return (
    <div style={{ position: 'relative' }}>
      {/* Bell Icon */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          padding: '0.5rem',
          fontSize: '1.5rem'
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '0',
              right: '0',
              background: '#ef4444',
              color: 'white',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.7rem',
              fontWeight: 'bold'
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <>
          {/* Overlay */}
          <div
            onClick={() => setShowDropdown(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 40
            }}
          />

          {/* Dropdown Content */}
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: '100%',
              marginTop: '0.5rem',
              width: '350px',
              maxHeight: '400px',
              background: 'white',
              borderRadius: '0.5rem',
              boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
              zIndex: 50,
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '1rem',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <h3 style={{ fontSize: '1rem', fontWeight: 'bold', margin: 0 }}>
                Notificaciones ({unreadCount})
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#3b82f6',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    textDecoration: 'underline'
                  }}
                >
                  Marcar todas como leídas
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div
                  style={{
                    padding: '2rem',
                    textAlign: 'center',
                    color: '#6b7280'
                  }}
                >
                  <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔕</p>
                  <p style={{ fontSize: '0.875rem' }}>No tienes notificaciones</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    style={{
                      padding: '1rem',
                      borderBottom: '1px solid #f3f4f6',
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f9fafb';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'white';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                          {notification.title}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                          {notification.message}
                        </p>
                        <p style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
                          {notification.createdAt ? new Date(notification.createdAt).toLocaleString() : 'Ahora'}
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleMarkAsRead(notification.id, e)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#3b82f6',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          marginLeft: '0.5rem'
                        }}
                      >
                        ✓
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
