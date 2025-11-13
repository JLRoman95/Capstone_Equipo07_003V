import React, { useState, useEffect } from 'react';
import { alertasFirebase } from '../services/firestoreService';
import { useNavigate } from 'react-router-dom';

const Alertas = () => {
  const navigate = useNavigate();
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await alertasFirebase.listar();
      setAlertas(data);
    } catch (error) {
      setError('Error al cargar alertas');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getAlertIcon = (tipo) => {
    switch(tipo) {
      case 'stock_bajo': return '📉';
      case 'proximo_vencer': return '⏰';
      case 'checklist_pendiente': return '⚠️';
      default: return '🔔';
    }
  };

  const getPrioridadColor = (prioridad) => {
    switch(prioridad) {
      case 'alta': return '#ef4444';
      case 'media': return '#f59e0b';
      case 'baja': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '1.5rem' }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>🚨 Alertas Activas</h1>
            <p style={{ color: '#6b7280' }}>Sistema de notificaciones y alertas</p>
          </div>
          <button onClick={() => navigate('/dashboard')} className="btn" style={{ backgroundColor: '#6b7280', color: 'white' }}>
            ← Volver
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <div className="spinner"></div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {alertas.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827' }}>No hay alertas activas</h3>
                <p style={{ color: '#6b7280' }}>Todo está funcionando correctamente</p>
              </div>
            ) : (
              alertas.map((alerta) => (
                <div 
                  key={alerta.id} 
                  className="card" 
                  style={{ 
                    borderLeft: `4px solid ${getPrioridadColor(alerta.prioridad)}`,
                    padding: '1.5rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ fontSize: '2rem' }}>
                      {getAlertIcon(alerta.tipo)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>
                          {alerta.titulo}
                        </h3>
                        <span 
                          className="badge" 
                          style={{ 
                            backgroundColor: getPrioridadColor(alerta.prioridad),
                            color: 'white',
                            textTransform: 'uppercase',
                            fontSize: '0.75rem'
                          }}
                        >
                          {alerta.prioridad}
                        </span>
                      </div>
                      <p style={{ color: '#6b7280', marginBottom: '0.75rem' }}>
                        {alerta.descripcion}
                      </p>
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#9ca3af' }}>
                        <span>📅 {new Date(alerta.fecha).toLocaleDateString()}</span>
                        <span>🏷️ {alerta.tipo.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Alertas;
