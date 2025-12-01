import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { alertasFirebase, inventarioFirebase, produccionFirebase, proveedoresFirebase, productosFirebase, checklistsFirebase } from '../services/firestoreService';
import { useNavigate } from 'react-router-dom';
import useAnalytics from '../hooks/useAnalytics';
import usePermissions from '../hooks/usePermissions';
import Layout from '../components/Layout';
import { exportarReporteConsolidadoPDF } from '../services/exportService';
import { buildConsolidatedReportPayload } from '../utils/reportUtils';

const iconProps = {
  width: 28,
  height: 28,
  strokeWidth: 1.8,
  fill: 'none',
  strokeLinecap: 'round',
  strokeLinejoin: 'round'
};

const IconBox = ({ color = '#1d4ed8' }) => (
  <svg viewBox="0 0 24 24" {...iconProps} stroke={color}>
    <path d="M3 9l9 5 9-5" />
    <path d="M3 9l9-5 9 5" />
    <path d="M3 9v6l9 5 9-5V9" />
  </svg>
);

const IconBowl = () => (
  <svg viewBox="0 0 64 64" width={36} height={36} fill="none">
    <circle cx="32" cy="32" r="30" fill="#d1fae5" />
    <path
      d="M15 32c0 9.5 7.6 17 17 17s17-7.5 17-17H15z"
      fill="#0d9488"
    />
    <path
      d="M20 32c0 6.6 5.4 12 12 12s12-5.4 12-12H20z"
      fill="#6ee7b7"
    />
    <path
      d="M17 36h30"
      stroke="#0f766e"
      strokeWidth="3"
      strokeLinecap="round"
    />
    <path
      d="M26 18c0 2.5-2 2.5-2 5"
      stroke="#0f766e"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <path
      d="M32 17c0 2.5-2 2.5-2 5"
      stroke="#0f766e"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <path
      d="M38 18c0 2.5-2 2.5-2 5"
      stroke="#0f766e"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
);
const IconProducts = IconBowl;

const IconTruck = ({ color = '#7c3aed' }) => (
  <svg viewBox="0 0 24 24" {...iconProps} stroke={color}>
    <path d="M3 6h11v9H3z" />
    <path d="M14 9h4l3 3v3h-7z" />
    <circle cx="7.5" cy="17" r="1.5" />
    <circle cx="18.5" cy="17" r="1.5" />
  </svg>
);

const IconChecklist = ({ color = '#d97706' }) => (
  <svg viewBox="0 0 24 24" {...iconProps} stroke={color}>
    <path d="M9 5h11" />
    <path d="M9 12h11" />
    <path d="M9 19h11" />
    <path d="M4 8l2 2 3-4" />
    <path d="M4 15l2 2 3-4" />
  </svg>
);

const IconChef = ({ color = '#dc2626' }) => (
  <svg viewBox="0 0 24 24" {...iconProps} stroke={color}>
    <path d="M5 10h14" />
    <path d="M7 6c0-1.657 1.79-3 4-3s4 1.343 4 3" />
    <path d="M6 18h12" />
    <path d="M8 10v8" />
    <path d="M16 10v8" />
  </svg>
);

const IconBell = ({ color = '#db2777' }) => (
  <svg viewBox="0 0 24 24" {...iconProps} stroke={color}>
    <path d="M18 14V9a6 6 0 10-12 0v5l-2 2h16z" />
    <path d="M9 18a3 3 0 006 0" />
  </svg>
);

const IconReport = ({ color = '#4f46e5' }) => (
  <svg viewBox="0 0 24 24" {...iconProps} stroke={color}>
    <path d="M4 19h16" />
    <path d="M7 15v-6" />
    <path d="M12 15v-10" />
    <path d="M17 15v-3" />
  </svg>
);

const IconUserPlus = ({ color = '#0f9d8a' }) => (
  <svg viewBox="0 0 24 24" {...iconProps} stroke={color}>
    <circle cx="9" cy="7" r="3" />
    <path d="M4 21v-2a4 4 0 014-4h2" />
    <path d="M16 11v6" />
    <path d="M13 14h6" />
  </svg>
);

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { trackPageView, track } = useAnalytics();
  const { can } = usePermissions();
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
    if (user) {
      loadStats(true); // Carga inicial
      trackPageView('Dashboard');
    }
  }, [user]);

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
        alertas: alertasData.length, // alertasFirebase.listar() ya retorna solo activas
        inventario: inventarioData.length,
        produccion: produccionData.length,
        productos: productosData.length,
        proveedores: proveedoresData.length,
        checklists: checklistsData.length
      });
      
      console.log('Dashboard stats cargadas:', {
        alertasActivas: alertasData.length,
        alertasData: alertasData
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

      const datosConsolidados = buildConsolidatedReportPayload({
        proveedores: proveedoresData,
        productos: productosData,
        inventario: inventarioData,
        produccion: produccionData,
        checklists: checklistsData,
        alertas: alertasData
      });

      exportarReporteConsolidadoPDF(datosConsolidados);
    } catch (error) {
      console.error('Error al exportar reporte consolidado:', error);
      alert('Error al generar el reporte consolidado');
    }
  };

  const modules = [
    {
      name: 'Inventario',
      icon: <IconBox />,
      description: 'Gestión de inventario FIFO',
      path: '/inventario',
      iconBg: '#e0edff',
      accent: '#3b82f6',
      stat: stats.inventario
    },
    {
      name: 'Productos',
      icon: <IconProducts />,
      description: 'Catálogo de productos',
      path: '/productos',
      iconBg: '#d1fae5',
      accent: '#0f766e',
      stat: stats.productos
    },
    {
      name: 'Proveedores',
      icon: <IconTruck />,
      description: 'Gestión de proveedores',
      path: '/proveedores',
      iconBg: '#ede9fe',
      accent: '#7c3aed',
      stat: stats.proveedores
    },
    {
      name: 'Checklists',
      icon: <IconChecklist />,
      description: 'Control de calidad',
      path: '/checklists',
      iconBg: '#fef3c7',
      accent: '#d97706',
      stat: stats.checklists
    },
    {
      name: 'Producción',
      icon: <IconChef />,
      description: 'Registro de producción',
      path: '/produccion',
      iconBg: '#fee2e2',
      accent: '#dc2626',
      stat: stats.produccion
    },
    {
      name: 'Alertas',
      icon: <IconBell />,
      description: 'Notificaciones y alertas',
      path: '/alertas',
      iconBg: '#fce7f3',
      accent: '#db2777',
      stat: stats.alertas
    },
    {
      name: 'Reportes',
      icon: <IconReport />,
      description: 'Reportes y estadísticas',
      path: '/reportes',
      iconBg: '#e0e7ff',
      accent: '#4f46e5',
      stat: null
    },
    ...(can('usuarios', 'create')
      ? [{
          name: 'Crear Usuario',
          icon: <IconUserPlus />,
          description: 'Registrar nuevo usuario',
          path: '/crear-usuario',
          iconBg: '#ccfbf1',
          accent: '#0f9d8a',
          stat: null
        }]
      : [])
  ];

  return (
    <Layout>
      {/* Main Content */}

      {/* Main Content */}
      <main className="container" style={{ padding: '2rem', paddingBottom: '2rem', color: '#e2e8f0' }}>
        {/* Alertas */}
        {stats.alertas > 0 && (
          <div
            className="alert alert-warning"
            style={{
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(250, 204, 21, 0.12)',
              border: '1px solid rgba(250, 204, 21, 0.3)',
              color: '#fde68a',
              borderRadius: '16px',
              padding: '1rem 1.25rem'
            }}
          >
            <span style={{ fontSize: '1.75rem', marginRight: '0.75rem' }}>⚠️</span>
            <div>
              <p style={{ fontWeight: 'bold', margin: 0, color: '#fefce8' }}>Alertas Activas</p>
              <p style={{ margin: 0, color: '#fefce8' }}>Hay {stats.alertas} alerta{stats.alertas !== 1 ? 's' : ''} que requieren atención</p>
            </div>
          </div>
        )}

        {/* Bienvenida */}
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ flex: '1 1 auto', minWidth: '200px' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#f8fafc', marginBottom: '0.5rem', margin: 0 }}>
              Bienvenido, {user?.nombre || 'Usuario'}
            </h2>
            <p style={{ color: '#cbd5f5', margin: 0, marginTop: '0.5rem', fontSize: '0.95rem' }}>
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
            <p style={{ marginTop: '1rem', color: '#94a3b8' }}>Cargando estadísticas...</p>
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
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  borderRadius: '1.25rem',
                  padding: '1.5rem',
                  backgroundColor: '#ffffff',
                  border: '1px solid rgba(15,23,42,0.06)',
                  boxShadow: '0 15px 40px rgba(15,23,42,0.18)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.boxShadow = '0 25px 45px rgba(15,23,42,0.35)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 15px 40px rgba(15,23,42,0.18)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '18px',
                      background: module.iconBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {module.icon}
                  </div>
                  {module.stat !== null && (
                    <div
                      style={{
                        backgroundColor: '#f8fafc',
                        borderRadius: '12px',
                        padding: '0.5rem 0.85rem',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>{module.stat}</div>
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>registros</span>
                    </div>
                  )}
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '1.25rem', marginBottom: '0.35rem', color: '#0f172a' }}>{module.name}</h3>
                <p style={{ color: '#475569', marginBottom: '1.5rem', fontSize: '0.95rem' }}>{module.description}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: module.accent, fontWeight: 600 }}>
                  <span>Ir al módulo</span>
                  <span>→</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Info */}
        {(() => {
          const resumenCards = [
            {
              label: 'Productos en Inventario',
              value: stats.inventario,
              icon: <IconBox color="#1d4ed8" />,
              bg: '#e0edff'
            },
            {
              label: 'Registros de Producción',
              value: stats.produccion,
              icon: <IconChef color="#dc2626" />,
              bg: '#fee2e2'
            },
            {
              label: 'Alertas Activas',
              value: stats.alertas,
              icon: <IconBell color="#d97706" />,
              bg: '#fff7ed'
            }
          ];
          return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              {resumenCards.map((card) => (
                <div
                  key={card.label}
                  style={{
                    background: '#fff',
                    borderRadius: '1.25rem',
                    padding: '1.25rem',
                    boxShadow: '0 15px 35px rgba(15,23,42,0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center'
                  }}
                >
                  <div
                    style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '16px',
                      background: card.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '0.75rem'
                    }}
                  >
                    {card.icon}
                  </div>
                  <p style={{ fontSize: '2rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>{card.value}</p>
                  <p style={{ fontSize: '0.9rem', color: '#475569', marginTop: '0.15rem' }}>{card.label}</p>
                </div>
              ))}
            </div>
          );
        })()}
      </main>
    </Layout>
  );
};

export default Dashboard;
