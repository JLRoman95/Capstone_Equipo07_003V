import React, { useState, useEffect } from 'react';
import { alertasFirebase } from '../services/firestoreService';
import { generarAlertasAutomaticas, obtenerResumenAlertas, limpiarAlertasChecklistDuplicadas } from '../services/alertasAutomaticas';
import { exportarAlertasPDF } from '../services/exportService';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

const Alertas = () => {
  const navigate = useNavigate();
  const [alertas, setAlertas] = useState([]);
  const [alertasFiltradas, setAlertasFiltradas] = useState([]);
  const [filtroActivo, setFiltroActivo] = useState('todas');
  const [resumen, setResumen] = useState({
    total: 0,
    stock_bajo: 0,
    caducidad: 0,
    producto_vencido: 0,
    stock_critico: 0,
    checklist_pendiente: 0
  });
  const [loading, setLoading] = useState(true);
  const [generandoAlertas, setGenerandoAlertas] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [alertasCriticas, setAlertasCriticas] = useState([]);

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
        // Noche: termina a las 08:00
        finJornada = { hora: 8, minutos: 0 };
      } else if (horaActual >= 8 && horaActual < 16) {
        // Mañana: termina a las 16:00
        finJornada = { hora: 16, minutos: 0 };
      } else {
        // Tarde: termina a las 24:00 (00:00)
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
    loadData();
    
    // Auto-actualización cada 30 segundos
    const interval = setInterval(() => {
      loadData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      // Limpiar duplicados de checklist primero (solo se ejecuta una vez)
      if (!window.checklistDuplicadosLimpiados) {
        await limpiarAlertasChecklistDuplicadas();
        window.checklistDuplicadosLimpiados = true;
      }
      
      // Generar/actualizar alertas antes de leerlas (idempotente por claves únicas)
      await generarAlertasAutomaticas();
      const [alertasData, resumenData] = await Promise.all([
        alertasFirebase.listar(),
        obtenerResumenAlertas()
      ]);
      setAlertas(alertasData);
      setAlertasFiltradas(alertasData);
      setResumen(resumenData);
      
      // Identificar alertas críticas
      const criticas = alertasData.filter(esAlertaCritica);
      setAlertasCriticas(criticas);
      
      setError('');
    } catch (error) {
      setError('Error al cargar alertas');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filtrarAlertas = (tipo) => {
    setFiltroActivo(tipo);
    if (tipo === 'todas') {
      setAlertasFiltradas(alertas);
    } else {
      setAlertasFiltradas(alertas.filter(a => a.tipo === tipo));
    }
  };

  const navegarDirecto = (tipo) => {
    switch(tipo) {
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
        break;
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
        break;
    }
  };

  const handleGenerarAlertas = async () => {
    setGenerandoAlertas(true);
    setError('');
    setSuccess('');
    
    try {
      const resultado = await generarAlertasAutomaticas();
      setSuccess(`✅ Alertas generadas: ${resultado.total} nuevas (Stock Bajo: ${resultado.stock_bajo}, Caducidad: ${resultado.caducidad}, Vencidos: ${resultado.producto_vencido}, Sin Stock: ${resultado.stock_critico}, Checklists: ${resultado.checklist_pendiente || 0})`);
      
      // Recargar datos después de generar
      setTimeout(() => {
        loadData();
      }, 1000);
    } catch (error) {
      setError('Error al generar alertas automáticas');
      console.error(error);
    } finally {
      setGenerandoAlertas(false);
    }
  };

  const handleResolverAlerta = async (alertaId) => {
    try {
      await alertasFirebase.resolver(alertaId);
      setSuccess('Alerta resuelta correctamente');
      loadData();
    } catch (error) {
      setError('Error al resolver alerta');
      console.error(error);
    }
  };

  const getAlertIcon = (tipo) => {
    switch(tipo) {
      case 'stock_bajo': return '📉';
      case 'caducidad': return '⏰';
      case 'producto_vencido': return '🚨';
      case 'stock_critico': return '❌';
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

  const getTipoTexto = (tipo) => {
    const tipos = {
      'stock_bajo': 'STOCK BAJO',
      'caducidad': 'PRÓXIMO A CADUCAR',
      'producto_vencido': 'PRODUCTO VENCIDO',
      'stock_critico': 'SIN STOCK',
      'checklist_pendiente': 'CHECKLIST PENDIENTE'
    };
    return tipos[tipo] || tipo.toUpperCase();
  };

  const formatearDetalles = (alerta) => {
    const metadata = alerta.metadata || {};
    const detalles = [];

    if (metadata.dias_restantes !== undefined) {
      detalles.push(`${metadata.dias_restantes} días restantes`);
    }
    
    if (metadata.lote) {
      detalles.push(`Lote: ${metadata.lote}`);
    }

    if (metadata.stock_actual !== undefined && metadata.stock_minimo !== undefined) {
      detalles.push(`Stock: ${metadata.stock_actual}/${metadata.stock_minimo}`);
    } else if (metadata.cantidad_restante !== undefined) {
      detalles.push(`Cantidad: ${metadata.cantidad_restante}`);
    }

    if (metadata.fecha_vencimiento) {
      const fecha = metadata.fecha_vencimiento?.toDate ? 
        metadata.fecha_vencimiento.toDate() : 
        new Date(metadata.fecha_vencimiento);
      detalles.push(`Vence: ${fecha.toLocaleDateString('es-ES')}`);
    }

    return detalles.join(' • ');
  };

  return (
    <Layout>
    <div style={{ padding: '1.5rem' }}>
      <style>
        {`
          @keyframes pulse-critical {
            0%, 100% {
              box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
              border-color: #ef4444;
            }
            50% {
              box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
              border-color: #dc2626;
            }
          }
          
          .alerta-critica {
            animation: pulse-critical 2s infinite;
            border: 2px solid #ef4444 !important;
            background: linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%) !important;
          }
          
          .alerta-critica::before {
            content: '⚠️';
            position: absolute;
            top: -10px;
            right: -10px;
            font-size: 2rem;
            animation: bounce 1s infinite;
          }
          
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
        `}
      </style>
      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>🚨 Alertas del Sistema</h1>
            <p style={{ color: '#6b7280' }}>Sistema de notificaciones y alertas automáticas</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          onClick={() => exportarAlertasPDF(alertasFiltradas)} 
                          className="btn" 
                          style={{ 
                            backgroundColor: '#8b5cf6', 
                            color: 'white'
                          }}
                        >
                          📄 Exportar PDF
                        </button>
            <button 
              onClick={handleGenerarAlertas} 
              disabled={generandoAlertas}
              className="btn" 
              style={{ 
                backgroundColor: '#10b981', 
                color: 'white',
                opacity: generandoAlertas ? 0.6 : 1
              }}
            >
              {generandoAlertas ? '🔄 Generando...' : '🔄 Generar Alertas'}
            </button>
            <button onClick={() => navigate('/dashboard')} className="btn" style={{ backgroundColor: '#6b7280', color: 'white' }}>
              ← Volver
            </button>
          </div>
        </div>

        {/* Mensajes */}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}
        {success && (
          <div className="alert" style={{ marginBottom: '1rem', backgroundColor: '#d1fae5', color: '#065f46', padding: '1rem', borderRadius: '0.5rem' }}>
            {success}
          </div>
        )}

        {/* Banner de alertas críticas */}
        {alertasCriticas.length > 0 && (
          <div style={{
            backgroundColor: '#fee2e2',
            border: '2px solid #ef4444',
            borderRadius: '0.5rem',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            animation: 'pulse-critical 2s infinite'
          }}>
            <span style={{ fontSize: '2rem' }}>🚨</span>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#dc2626', margin: 0 }}>
                ¡ATENCIÓN! Alertas Críticas Activas
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#991b1b', margin: '0.25rem 0 0 0' }}>
                {alertasCriticas.length} alerta{alertasCriticas.length !== 1 ? 's' : ''} requiere{alertasCriticas.length === 1 ? '' : 'n'} atención inmediata
              </p>
            </div>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc2626' }}>
              {alertasCriticas.length}
            </span>
          </div>
        )}

        {/* Resumen de alertas */}
        {!loading && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: '1rem', 
            marginBottom: '1.5rem' 
          }}>
            <div 
              className="card" 
              onClick={() => filtrarAlertas('todas')}
              style={{ 
                textAlign: 'center', 
                padding: '1.5rem', 
                borderLeft: '4px solid #2196f3',
                cursor: 'pointer',
                opacity: filtroActivo === 'todas' ? 1 : 0.6,
                transition: 'opacity 0.2s',
                ':hover': { opacity: 1 }
              }}
            >
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2196f3' }}>{resumen.total}</div>
              <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Total Alertas</div>
            </div>
            <div 
              className="card" 
              onClick={() => navegarDirecto('stock_bajo')}
              style={{ 
                textAlign: 'center', 
                padding: '1.5rem', 
                borderLeft: '4px solid #f59e0b',
                cursor: 'pointer',
                opacity: filtroActivo === 'stock_bajo' ? 1 : 0.6,
                transition: 'opacity 0.2s'
              }}
            >
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>{resumen.stock_bajo}</div>
              <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Stock Bajo</div>
            </div>
            <div 
              className="card" 
              onClick={() => navegarDirecto('caducidad')}
              style={{ 
                textAlign: 'center', 
                padding: '1.5rem', 
                borderLeft: '4px solid #f59e0b',
                cursor: 'pointer',
                opacity: filtroActivo === 'caducidad' ? 1 : 0.6,
                transition: 'opacity 0.2s'
              }}
            >
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#9c27b0' }}>{resumen.caducidad}</div>
              <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Próximos a Caducar</div>
            </div>
            <div 
              className="card" 
              onClick={() => navegarDirecto('producto_vencido')}
              style={{ 
                textAlign: 'center', 
                padding: '1.5rem', 
                borderLeft: '4px solid #dc2626',
                cursor: 'pointer',
                opacity: filtroActivo === 'producto_vencido' ? 1 : 0.6,
                transition: 'opacity 0.2s',
                position: 'relative',
                animation: resumen.producto_vencido > 0 ? 'pulse-critical 2s infinite' : 'none'
              }}
            >
              {resumen.producto_vencido > 0 && (
                <span style={{ 
                  position: 'absolute', 
                  top: '-5px', 
                  right: '-5px', 
                  fontSize: '1.5rem' 
                }}>
                  🚨
                </span>
              )}
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626' }}>{resumen.producto_vencido}</div>
              <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Vencidos</div>
            </div>
            <div 
              className="card" 
              onClick={() => navegarDirecto('stock_critico')}
              style={{ 
                textAlign: 'center', 
                padding: '1.5rem', 
                borderLeft: '4px solid #ef4444',
                cursor: 'pointer',
                opacity: filtroActivo === 'stock_critico' ? 1 : 0.6,
                transition: 'opacity 0.2s',
                position: 'relative',
                animation: resumen.stock_critico > 0 ? 'pulse-critical 2s infinite' : 'none'
              }}
            >
              {resumen.stock_critico > 0 && (
                <span style={{ 
                  position: 'absolute', 
                  top: '-5px', 
                  right: '-5px', 
                  fontSize: '1.5rem' 
                }}>
                  🚨
                </span>
              )}
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444' }}>{resumen.stock_critico}</div>
              <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Sin Stock</div>
            </div>
            <div 
              className="card" 
              onClick={() => navegarDirecto('checklist_pendiente')}
              style={{ 
                textAlign: 'center', 
                padding: '1.5rem', 
                borderLeft: '4px solid #3b82f6',
                cursor: 'pointer',
                opacity: filtroActivo === 'checklist_pendiente' ? 1 : 0.6,
                transition: 'opacity 0.2s',
                position: 'relative',
                animation: alertasCriticas.some(a => a.tipo === 'checklist_pendiente') ? 'pulse-critical 2s infinite' : 'none'
              }}
            >
              {alertasCriticas.some(a => a.tipo === 'checklist_pendiente') && (
                <span style={{ 
                  position: 'absolute', 
                  top: '-5px', 
                  right: '-5px', 
                  fontSize: '1.5rem' 
                }}>
                  ⏰
                </span>
              )}
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6' }}>{resumen.checklist_pendiente}</div>
              <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Checklists Pendientes</div>
            </div>
          </div>
        )}

        {/* Lista de alertas */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            {filtroActivo !== 'todas' && (
              <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                  Mostrando: <strong>{getTipoTexto(filtroActivo)}</strong>
                </span>
                <button 
                  onClick={() => filtrarAlertas('todas')}
                  className="btn"
                  style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', backgroundColor: '#6b7280', color: 'white' }}
                >
                  Ver todas
                </button>
              </div>
            )}
            <div style={{ display: 'grid', gap: '1rem' }}>
              {alertasFiltradas.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827' }}>
                    {filtroActivo === 'todas' ? 'No hay alertas activas' : `No hay alertas de tipo ${getTipoTexto(filtroActivo)}`}
                  </h3>
                  <p style={{ color: '#6b7280' }}>Todo está funcionando correctamente</p>
                  <button 
                    onClick={handleGenerarAlertas}
                    className="btn"
                    style={{ marginTop: '1rem', backgroundColor: '#10b981', color: 'white' }}
                  >
                    Generar Alertas
                  </button>
                </div>
              ) : (
                alertasFiltradas.map((alerta) => {
                  const esCritica = esAlertaCritica(alerta);
                  return (
                  <div 
                    key={alerta.id} 
                    className={`card ${esCritica ? 'alerta-critica' : ''}`}
                    onClick={() => navegarAOrigen(alerta)}
                    style={{ 
                      borderLeft: `4px solid ${getPrioridadColor(alerta.prioridad)}`,
                      padding: '1.5rem',
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ fontSize: '2rem' }}>
                      {getAlertIcon(alerta.tipo)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>
                          {alerta.titulo || alerta.mensaje}
                        </h3>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <span 
                            className="badge" 
                            style={{ 
                              backgroundColor: getPrioridadColor(alerta.prioridad),
                              color: 'white',
                              textTransform: 'uppercase',
                              fontSize: '0.75rem',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '0.25rem'
                            }}
                          >
                            {alerta.prioridad}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResolverAlerta(alerta.id);
                            }}
                            className="btn"
                            style={{
                              padding: '0.25rem 0.75rem',
                              fontSize: '0.75rem',
                              backgroundColor: '#10b981',
                              color: 'white'
                            }}
                          >
                            ✓ Resolver
                          </button>
                        </div>
                      </div>
                      <p style={{ color: '#6b7280', marginBottom: '0.75rem' }}>
                        {alerta.mensaje}
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.875rem', color: '#9ca3af' }}>
                        <span>📅 {alerta.fecha?.toDate ? alerta.fecha.toDate().toLocaleDateString('es-ES') : new Date(alerta.fecha).toLocaleDateString('es-ES')}</span>
                        <span>🏷️ {getTipoTexto(alerta.tipo)}</span>
                        {formatearDetalles(alerta) && (
                          <span>📊 {formatearDetalles(alerta)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                );
              })
              )}
            </div>
          </>
        )}
      </div>
    </div>
    </Layout>
  );
};

export default Alertas;
