import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { alertasFirebase, inventarioFirebase, produccionFirebase, proveedoresFirebase, productosFirebase, checklistsFirebase } from '../services/firestoreService';
import { useNavigate } from 'react-router-dom';
import useAnalytics from '../hooks/useAnalytics';
import NotificationBell from '../components/NotificationBell';
import { exportarReporteConsolidadoPDF } from '../services/exportService';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { trackPageView, track } = useAnalytics();
  const [stats, setStats] = useState({
    alertas: 0,
    inventario: 0,
    produccion: 0,
    productos: 0,
    proveedores: 0,
    checklists: 0
  });
  const [loading, setLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const loadingRef = React.useRef(false);
  const lastLoadTime = React.useRef(0);

  useEffect(() => {
    loadStats(true); // Carga inicial
    trackPageView('Dashboard');
  }, []);

  const loadStats = async (showSpinner = false) => {
    // Evitar múltiples cargas simultáneas
    if (loadingRef.current) return;
    
    // Evitar recargar si se hizo hace menos de 2 segundos
    const now = Date.now();
    if (now - lastLoadTime.current < 2000) return;
    
    try {
      loadingRef.current = true;
      if (showSpinner) setLoading(true);
      
      lastLoadTime.current = now;
      
      // Cargar estadísticas en paralelo
      const [alertasData, inventarioData, produccionData, productosData, proveedoresData, checklistsData] = await Promise.all([
        alertasFirebase.listar(),
        inventarioFirebase.listar(),
        produccionFirebase.listar(),
        productosFirebase.listar(),
        proveedoresFirebase.listar(),
        checklistsFirebase.listar()
      ]);
      
      setStats({
        alertas: alertasData.filter(a => a.estado === 'activa').length,
        inventario: inventarioData.length,
        produccion: produccionData.length,
        productos: productosData.length,
        proveedores: proveedoresData.length,
        checklists: checklistsData.length
      });
      
      if (isInitialLoad) setIsInitialLoad(false);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  const handleExportarReporteConsolidado = async () => {
    try {
      const [proveedoresData, productosData, inventarioData, produccionData, checklistsData, alertasData] = await Promise.all([
        proveedoresFirebase.listar(),
        productosFirebase.listar(),
        inventarioFirebase.listar(),
        produccionFirebase.listar(),
        checklistsFirebase.listar(),
        alertasFirebase.listar()
      ]);

      const alertasCriticas = alertasData.filter(a => a.prioridad === 'alta' && a.estado === 'activa');
      const checklistsCompletos = checklistsData.filter(c => c.estado === 'completo').length;
      
      const productosProximosVencer = inventarioData
        .map(item => ({
          ...item,
          diasRestantes: Math.ceil((new Date(item.fecha_vencimiento) - new Date()) / (1000 * 60 * 60 * 24))
        }))
        .filter(item => item.diasRestantes <= 7 && item.diasRestantes >= 0)
        .sort((a, b) => a.diasRestantes - b.diasRestantes);

      const datosConsolidados = {
        proveedores: proveedoresData.length,
        productos: productosData.length,
        inventario: inventarioData.length,
        produccion: produccionData.length,
        checklists: checklistsData.length,
        checklistsCompletos,
        alertasActivas: alertasData.filter(a => a.estado === 'activa').length,
        alertasCriticas,
        productosProximosVencer
      };

      exportarReporteConsolidadoPDF(datosConsolidados);
    } catch (error) {
      console.error('Error al exportar reporte consolidado:', error);
      alert('Error al generar el reporte consolidado');
    }
  };

  const modules = [
    { name: 'Inventario', icon: '📦', description: 'Gestión de inventario FIFO', path: '/inventario', color: '#3b82f6', stat: stats.inventario },
    { name: 'Productos', icon: '🥘', description: 'Catálogo de productos', path: '/productos', color: '#10b981', stat: stats.productos },
    { name: 'Proveedores', icon: '🚚', description: 'Gestión de proveedores', path: '/proveedores', color: '#8b5cf6', stat: stats.proveedores },
    { name: 'Checklists', icon: '✅', description: 'Control de calidad', path: '/checklists', color: '#f59e0b', stat: stats.checklists },
    { name: 'Producción', icon: '👨‍🍳', description: 'Registro de producción', path: '/produccion', color: '#ef4444', stat: stats.produccion },
    { name: 'Alertas', icon: '🚨', description: 'Notificaciones y alertas', path: '/alertas', color: '#ec4899', stat: stats.alertas },
    { name: 'Reportes', icon: '📊', description: 'Reportes y estadísticas', path: '/reportes', color: '#6366f1', stat: null }
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      {/* Header */}
      <header style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1rem 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>Sistema APT</h1>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Control de Calidad Alimentaria</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <NotificationBell />
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827', margin: 0, whiteSpace: 'nowrap' }}>{user?.nombre || 'Usuario'}</p>
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
              onClick={logout}
              className="btn btn-danger"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        {/* Alertas */}
        {stats.alertas > 0 && (
          <div className="alert alert-warning" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '1.5rem', marginRight: '0.75rem' }}>⚠️</span>
            <div>
              <p style={{ fontWeight: 'bold' }}>Alertas Activas</p>
              <p>Hay {stats.alertas} alerta{stats.alertas !== 1 ? 's' : ''} que requieren atención</p>
            </div>
          </div>
        )}

        {/* Bienvenida */}
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ flex: '1 1 auto', minWidth: '200px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem', margin: 0 }}>
              Bienvenido, {user?.nombre || 'Usuario'}
            </h2>
            <p style={{ color: '#6b7280', margin: 0, marginTop: '0.5rem' }}>
              Selecciona un módulo para comenzar a trabajar
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button
              onClick={() => loadStats(true)}
              disabled={loading}
              style={{
                backgroundColor: loading ? '#9ca3af' : '#10b981',
                color: 'white',
                padding: '10px 16px',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                whiteSpace: 'nowrap'
              }}
              title="Actualizar estadísticas"
            >
              <span>{loading ? '⏳' : '🔄'}</span>
              <span className="btn-text">{loading ? 'Actualizando...' : 'Actualizar'}</span>
            </button>
            <button
              onClick={handleExportarReporteConsolidado}
              style={{
                backgroundColor: '#6366f1',
                color: 'white',
                padding: '10px 16px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
                whiteSpace: 'nowrap'
              }}
              title="Generar reporte consolidado PDF con todas las estadísticas"
            >
              <span>📊</span>
              <span className="btn-text">Exportar Reporte</span>
            </button>
          </div>
        </div>

        {/* Módulos Grid */}
        {loading && isInitialLoad ? (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <div className="spinner"></div>
            <p style={{ marginTop: '1rem', color: '#6b7280' }}>Cargando estadísticas...</p>
          </div>
        ) : (
          <div className="modules-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
            {modules.map((module) => (
              <div
                key={module.path}
                onClick={() => {
                  track('navigate_module', { module: module.name, path: module.path });
                  navigate(module.path);
                }}
                className="card"
                style={{ cursor: 'pointer', transition: 'all 0.3s', border: '2px solid transparent' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.15)';
                  e.currentTarget.style.borderColor = module.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
              >
                <div style={{ backgroundColor: module.color, color: 'white', padding: '1.5rem', borderRadius: '0.5rem 0.5rem 0 0', marginBottom: '1rem', marginLeft: '-1.5rem', marginRight: '-1.5rem', marginTop: '-1.5rem' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{module.icon}</div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{module.name}</h3>
                </div>
                <p style={{ color: '#6b7280', marginBottom: '1rem' }}>{module.description}</p>
                {module.stat !== null && (
                  <div style={{ backgroundColor: '#f3f4f6', borderRadius: '0.375rem', padding: '0.75rem', textAlign: 'center' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>{module.stat}</span>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>registros</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer Info */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📦</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>{stats.inventario}</p>
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Productos en Inventario</p>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👨‍🍳</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>{stats.produccion}</p>
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Registros de Producción</p>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>{stats.alertas}</p>
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Alertas Activas</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
