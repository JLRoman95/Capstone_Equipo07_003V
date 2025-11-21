import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { alertasFirebase } from '../services/firestoreService';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [alertas, setAlertas] = useState([]);
  const [alertasCriticas, setAlertasCriticas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Función para determinar si una alerta es crítica
  const esAlertaCritica = (alerta) => {
    // Producto vencido
    if (alerta.tipo === 'producto_vencido') return true;
    
    // Stock en 0 (stock crítico)
    if (alerta.tipo === 'stock_critico') return true;
    
    // Checklist pendiente cerca del fin de jornada
    if (alerta.tipo === 'checklist_pendiente') {
      const ahora = new Date();
      const horaActual = ahora.getHours();
      const minutosActuales = ahora.getMinutes();
      
      // Determinar turno actual y hora de fin
      let finJornada = null;
      if (horaActual >= 0 && horaActual < 8) {
        finJornada = { hora: 8, minutos: 0 };
      } else if (horaActual >= 8 && horaActual < 16) {
        finJornada = { hora: 16, minutos: 0 };
      } else {
        finJornada = { hora: 24, minutos: 0 };
      }
      
      // Calcular minutos hasta el fin de jornada
      let minutosHastaFin;
      if (finJornada.hora === 24) {
        minutosHastaFin = (24 - horaActual) * 60 - minutosActuales;
      } else {
        minutosHastaFin = (finJornada.hora - horaActual) * 60 + (finJornada.minutos - minutosActuales);
      }
      
      // Crítico si faltan 5 minutos o menos
      if (minutosHastaFin <= 5 && minutosHastaFin >= 0) return true;
    }
    
    return false;
  };

  useEffect(() => {
    if (user) {
      loadAlertas();
      
      // Actualizar cada 30 segundos
      const interval = setInterval(loadAlertas, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadAlertas = async () => {
    try {
      const data = await alertasFirebase.listar();
      // alertasFirebase.listar() ya retorna solo activas por el filtro en Firestore
      setAlertas(data);
      
      // Identificar alertas críticas
      const criticas = data.filter(esAlertaCritica);
      setAlertasCriticas(criticas);
      
      console.log('Alertas cargadas:', data.length, 'Críticas:', criticas.length);
    } catch (error) {
      console.error('Error al cargar alertas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPrioridadColor = (prioridad) => {
    switch(prioridad) {
      case 'alta': return '#ef4444';
      case 'media': return '#f59e0b';
      case 'baja': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getAlertIcon = (tipo) => {
    switch(tipo) {
      case 'stock_bajo': return '📉';
      case 'stock_critico': return '🚨';
      case 'caducidad': return '⏰';
      case 'producto_vencido': return '❌';
      case 'checklist_pendiente': return '📋';
      default: return '🔔';
    }
  };

  const navegarAOrigen = (alerta) => {
    const metadata = alerta.metadata || {};
    
    switch(alerta.tipo) {
      case 'stock_bajo':
      case 'stock_critico':
      case 'caducidad':
      case 'producto_vencido':
        navigate('/inventario');
        break;
      case 'checklist_pendiente':
        navigate('/checklists');
        break;
      default:
        navigate('/alertas');
        break;
    }
    setShowDropdown(false);
  };

  const handleResolverAlerta = async (alertaId, e) => {
    e.stopPropagation();
    try {
      await alertasFirebase.actualizar(alertaId, { estado: 'resuelta' });
      await loadAlertas();
    } catch (error) {
      console.error('Error al resolver alerta:', error);
    }
  };

  if (!user) return null;

  return (
    <div style={{ position: 'relative' }}>
      <style>
        {`
          @keyframes pulse-bell {
            0%, 100% {
              transform: scale(1);
              filter: drop-shadow(0 0 0 rgba(239, 68, 68, 0.7));
            }
            50% {
              transform: scale(1.1);
              filter: drop-shadow(0 0 10px rgba(239, 68, 68, 0.9));
            }
          }
          
          .bell-critical {
            animation: pulse-bell 1.5s infinite;
          }
        `}
      </style>
      {/* Bell Icon */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={alertasCriticas.length > 0 ? 'bell-critical' : ''}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          padding: '0.5rem',
          fontSize: '1.5rem'
        }}
      >
        {alertasCriticas.length > 0 ? '🔴' : '🔔'}
        {alertas.length > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '0',
              right: '0',
              background: alertasCriticas.length > 0 ? '#dc2626' : '#ef4444',
              color: 'white',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.7rem',
              fontWeight: 'bold',
              animation: alertasCriticas.length > 0 ? 'pulse-bell 1.5s infinite' : 'none'
            }}
          >
            {alertas.length > 9 ? '9+' : alertas.length}
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
                alignItems: 'center',
                background: alertasCriticas.length > 0 ? '#fee2e2' : 'white'
              }}
            >
              <h3 style={{ fontSize: '1rem', fontWeight: 'bold', margin: 0 }}>
                🚨 Alertas ({alertas.length})
                {alertasCriticas.length > 0 && (
                  <span style={{ 
                    fontSize: '0.75rem', 
                    color: '#dc2626',
                    marginLeft: '0.5rem',
                    fontWeight: 'normal'
                  }}>
                    • {alertasCriticas.length} crítica{alertasCriticas.length !== 1 ? 's' : ''}
                  </span>
                )}
              </h3>
              <button
                onClick={() => { navigate('/alertas'); setShowDropdown(false); }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#3b82f6',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  textDecoration: 'underline'
                }}
              >
                Ver todas
              </button>
            </div>

            {/* Notifications List */}
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {alertas.length === 0 ? (
                <div
                  style={{
                    padding: '2rem',
                    textAlign: 'center',
                    color: '#6b7280'
                  }}
                >
                  <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</p>
                  <p style={{ fontSize: '0.875rem' }}>No hay alertas activas</p>
                </div>
              ) : (
                <>
                  {/* Mostrar alertas críticas primero */}
                  {alertasCriticas.length > 0 && (
                    <div style={{ 
                      background: '#fee2e2', 
                      padding: '0.5rem 1rem',
                      borderBottom: '2px solid #ef4444',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      color: '#dc2626'
                    }}>
                      ⚠️ ALERTAS CRÍTICAS
                    </div>
                  )}
                  
                  {alertas.map((alerta) => {
                    const esCritica = esAlertaCritica(alerta);
                    return (
                      <div
                        key={alerta.id}
                        onClick={() => navegarAOrigen(alerta)}
                        style={{
                          padding: '1rem',
                          borderBottom: '1px solid #f3f4f6',
                          cursor: 'pointer',
                          transition: 'background 0.2s',
                          background: esCritica ? '#fef2f2' : 'white',
                          borderLeft: esCritica ? '4px solid #ef4444' : 'none'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = esCritica ? '#fee2e2' : '#f9fafb';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = esCritica ? '#fef2f2' : 'white';
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                          <div style={{ fontSize: '1.5rem' }}>
                            {getAlertIcon(alerta.tipo)}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                              <p style={{ 
                                fontSize: '0.875rem', 
                                fontWeight: '600', 
                                margin: 0,
                                color: esCritica ? '#dc2626' : '#111827'
                              }}>
                                {alerta.titulo}
                              </p>
                              {esCritica && <span style={{ fontSize: '1rem' }}>🚨</span>}
                            </div>
                            <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0.25rem 0' }}>
                              {alerta.mensaje}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                              <span 
                                style={{ 
                                  fontSize: '0.65rem',
                                  padding: '0.125rem 0.375rem',
                                  borderRadius: '0.25rem',
                                  background: getPrioridadColor(alerta.prioridad),
                                  color: 'white',
                                  textTransform: 'uppercase',
                                  fontWeight: '600'
                                }}
                              >
                                {alerta.prioridad}
                              </span>
                              <p style={{ fontSize: '0.7rem', color: '#9ca3af', margin: 0 }}>
                                {alerta.fecha?.toDate ? alerta.fecha.toDate().toLocaleString('es-ES') : 'Ahora'}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={(e) => handleResolverAlerta(alerta.id, e)}
                            title="Resolver"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#10b981',
                              cursor: 'pointer',
                              fontSize: '1.2rem',
                              padding: '0.25rem'
                            }}
                          >
                            ✓
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
