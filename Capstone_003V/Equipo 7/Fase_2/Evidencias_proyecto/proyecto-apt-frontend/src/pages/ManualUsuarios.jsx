import React, { useMemo, useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Administrador', color: '#ef4444' },
  { value: 'auditor', label: 'Auditor', color: '#f59e0b' },
  { value: 'cocinero', label: 'Cocinero', color: '#10b981' }
];

const ROLE_MANUALS = {
  admin: {
    overview:
      'El administrador coordina la operación completa del sistema APT: gestiona usuarios, valida inventarios y aprueba alertas o reportes para Dirección.',
    objectives: [
      'Mantener la base de datos depurada (usuarios, productos y proveedores).',
      'Supervisar inventario, producción y alertas críticas en tiempo real.',
      'Publicar reportes consolidados y respaldos para auditorías externas.'
    ],
    quickActions: [
      {
        title: 'Revisión diaria',
        description:
          'Abra el Dashboard, revise los indicadores rojos y atienda alertas de stock o vencimientos antes de iniciar operaciones.'
      },
      {
        title: 'Control maestro',
        description:
          'Desde "Crear Usuario" mantenga los perfiles, roles y accesos mínimos necesarios. Documente cada alta o baja.'
      },
      {
        title: 'Cierre semanal',
        description:
          'En Reportes exporte PDF/Excel de inventario, producción y checklists para archivarlos en la carpeta compartida.'
      }
    ],
    modules: [
      {
        name: 'Dashboard',
        purpose: 'Monitoreo integral',
        steps: [
          'Revise tarjetas de estado: inventario utilizable, productos críticos y alertas abiertas.',
          'Entre al módulo resaltado para atender la alerta (ej. Inventario o Alertas Automáticas).'
        ]
      },
      {
        name: 'Crear Usuario',
        purpose: 'Gestión de personal y roles',
        steps: [
          'Complete datos básicos y asigne rol (Admin, Auditor o Cocinero).',
          'Verifique que el rol coincide con las funciones reales para evitar accesos indebidos.'
        ]
      },
      {
        name: 'Inventario y Productos',
        purpose: 'Control de existencias',
        steps: [
          'Desde Productos registre fichas maestras con unidades, temperatura y proveedor.',
          'En Inventario cargue ingresos/egresos y valide lotes vencidos (se marcan como Sin Stock).'
        ]
      },
      {
        name: 'Producción',
        purpose: 'Planeación diaria',
        steps: [
          'Cree órdenes de producción, asigne responsable y hora.',
          'Actualice estados y cantidades terminadas para sincronizar con inventario.'
        ]
      },
      {
        name: 'Alertas y Reportes',
        purpose: 'Seguimiento correctivo',
        steps: [
          'En Alertas Automáticas documente acciones tomadas y cierre los eventos resueltos.',
          'Use Reportes para exportar evidencia (PDF/Excel) y adjuntarla en auditorías.'
        ]
      }
    ],
    bestPractices: [
      'Realice un respaldo de reportes cada viernes y compártalo con Dirección.',
      'Mantenga comunicación con Cocina y Auditoría mediante comentarios en alertas.',
      'Cierre siempre la sesión al terminar para liberar licencias activas.'
    ]
  },
  auditor: {
    overview:
      'El auditor verifica el cumplimiento de BPM/POES, registra hallazgos en checklists y abre alertas cuando detecta desviaciones.',
    objectives: [
      'Auditar checklists y limpieza con evidencia fotográfica.',
      'Formalizar alertas con responsable y fecha límite.',
      'Generar reportes firmados para entes regulatorios.'
    ],
    quickActions: [
      {
        title: 'Inicio de jornada',
        description:
          'Descargue el checklist correspondiente, inspeccione áreas y registre pendientes en la app.'
      },
      {
        title: 'Gestión de alertas',
        description:
          'Cree alertas desde el módulo dedicado, adjunte notas y reasigne responsables si observa reincidencias.'
      },
      {
        title: 'Entrega de evidencia',
        description:
          'Exporta reportes y súbelos al repositorio externo o compártelos con el administrador.'
      }
    ],
    modules: [
      {
        name: 'Checklists',
        purpose: 'Auditoría estructurada',
        steps: [
          'Filtre por área o fecha para encontrar la plantilla correcta.',
          'Use el modo edición para marcar hallazgos y agregar comentarios detallados.'
        ]
      },
      {
        name: 'Alertas Automáticas',
        purpose: 'Escalamiento de no conformidades',
        steps: [
          'Revise alertas generadas por inventario y cree nuevas cuando detecte fallas.',
          'Actualice el estado (En seguimiento / Cerrada) y documente las acciones correctivas.'
        ]
      },
      {
        name: 'Reportes',
        purpose: 'Evidencia formal',
        steps: [
          'Utilice filtros por rango de fechas y módulo.',
          'Descargue versiones PDF o Excel y agregue su firma en el documento maestro.'
        ]
      }
    ],
    bestPractices: [
      'Mantenga lenguaje claro y sin abreviaturas en cada hallazgo.',
      'Acompañe las alertas con fotografías o códigos de lote para facilitar el seguimiento.',
      'Valide que los responsables cierren las acciones antes de concluir la auditoría.'
    ]
  },
  cocinero: {
    overview:
      'El cocinero ejecuta producción diaria, actualiza inventario útil y confirma la limpieza de áreas asignadas.',
    objectives: [
      'Registrar consumos y recepciones sin depender del administrador.',
      'Completar checklists de limpieza y producción justo después de cada turno.',
      'Monitorear alertas que afecten la preparación de alimentos.'
    ],
    quickActions: [
      {
        title: 'Antes de producir',
        description:
          'Entre a Inventario para verificar stock utilizable y caducidades próximas.'
      },
      {
        title: 'Durante el turno',
        description:
          'Use Producción para documentar lotes elaborados y tiempos de cocción.'
      },
      {
        title: 'Cierre del turno',
        description:
          'Complete el checklist de limpieza, adjunte comentarios y revise alertas abiertas.'
      }
    ],
    modules: [
      {
        name: 'Inventario',
        purpose: 'Actualización de existencias',
        steps: [
          'Registre ingresos (recepciones) o egresos (consumo) con lote y temperatura.',
          'Marque productos vencidos; el sistema los moverá automáticamente a "Sin stock".'
        ]
      },
      {
        name: 'Producción',
        purpose: 'Bitácora de elaboración',
        steps: [
          'Cree registros por receta indicando cantidad, hora y responsable.',
          'Cambie el estado a "Terminado" para que Inventario descuente los insumos.'
        ]
      },
      {
        name: 'Checklists y Alertas',
        purpose: 'Higiene y comunicación',
        steps: [
          'Complete cada checklist asignado al finalizar la actividad, adjuntando observaciones.',
          'Consulte alertas; si soluciona una incidencia, actualice la nota y notifíquelo al administrador.'
        ]
      }
    ],
    bestPractices: [
      'Registre movimientos inmediatamente; evita ajustes manuales posteriores.',
      'Si falta un dato obligatorio (ej. lote), comuníquelo al administrador antes de cerrar el registro.',
      'Use comentarios claros para que Auditoría entienda rápidamente el contexto.'
    ]
  }
};

const ManualUsuarios = () => {
  const { user } = useAuth();
  const defaultRole = user?.rol || 'cocinero';
  const [selectedRole, setSelectedRole] = useState(defaultRole);

  const manual = useMemo(() => ROLE_MANUALS[selectedRole], [selectedRole]);

  return (
    <Layout>
      <div className="container" style={{ padding: '2.5rem 1rem 3rem' }}>
        <div style={{ background: 'rgba(15,23,42,0.6)', borderRadius: '1rem', padding: '2rem', border: '1px solid rgba(148,163,184,0.2)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p style={{ color: '#38bdf8', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>Centro de ayuda</p>
            <h1 style={{ margin: 0, fontSize: '2.5rem', color: '#f8fafc' }}>Manual de Uso por Rol</h1>
            <p style={{ margin: 0, color: '#cbd5f5', maxWidth: '720px' }}>
              Consulta las actividades, módulos y buenas prácticas correspondientes a tu perfil. Puedes revisar otros roles para capacitar equipos cruzados.
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1.5rem' }}>
            {ROLE_OPTIONS.map((role) => (
              <button
                key={role.value}
                onClick={() => setSelectedRole(role.value)}
                style={{
                  border: 'none',
                  borderRadius: '999px',
                  padding: '0.5rem 1.25rem',
                  fontWeight: 600,
                  backgroundColor: selectedRole === role.value ? role.color : 'rgba(15,23,42,0.6)',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {role.label}
                {defaultRole === role.value && selectedRole !== role.value ? ' (tu rol)' : ''}
              </button>
            ))}
          </div>

          <div style={{ marginTop: '2rem', display: 'grid', gap: '1.25rem' }}>
            <section style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ background: 'rgba(15,23,42,0.7)', borderRadius: '0.75rem', padding: '1.5rem', border: '1px solid rgba(59,130,246,0.2)' }}>
                <h2 style={{ margin: '0 0 0.75rem 0', color: '#f1f5f9' }}>Rol seleccionado</h2>
                <p style={{ margin: 0, color: '#e2e8f0' }}>{manual.overview}</p>
              </div>

              <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                {manual.objectives.map((objective) => (
                  <div key={objective} style={{ background: 'rgba(15,23,42,0.7)', borderRadius: '0.75rem', padding: '1rem', border: '1px solid rgba(148,163,184,0.25)' }}>
                    <p style={{ margin: 0, color: '#c7d2fe', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Objetivo</p>
                    <p style={{ margin: '0.35rem 0 0 0', color: '#f8fafc', fontWeight: 500 }}>{objective}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 style={{ color: '#f1f5f9', marginBottom: '0.75rem' }}>Acciones rápidas</h2>
              <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                {manual.quickActions.map((action) => (
                  <div key={action.title} style={{ background: 'rgba(14,116,144,0.25)', borderRadius: '0.75rem', padding: '1rem', border: '1px solid rgba(14,165,233,0.3)' }}>
                    <h3 style={{ margin: 0, color: '#67e8f9', fontSize: '1rem' }}>{action.title}</h3>
                    <p style={{ margin: '0.5rem 0 0 0', color: '#e0f2fe', fontSize: '0.95rem' }}>{action.description}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                <h2 style={{ color: '#f1f5f9', margin: 0 }}>Guía por módulo</h2>
                <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Cada módulo resume propósito y pasos recomendados.</span>
              </div>
              <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
                {manual.modules.map((module) => (
                  <div key={module.name} style={{ background: 'rgba(15,23,42,0.8)', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid rgba(148,163,184,0.2)', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    <div>
                      <p style={{ margin: 0, color: '#38bdf8', fontSize: '0.85rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Módulo</p>
                      <h3 style={{ margin: '0.15rem 0 0 0', color: '#f8fafc' }}>{module.name}</h3>
                    </div>
                    <p style={{ margin: 0, color: '#cbd5f5', fontStyle: 'italic' }}>{module.purpose}</p>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#e2e8f0', display: 'grid', gap: '0.25rem', fontSize: '0.95rem' }}>
                      {module.steps.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 style={{ color: '#f1f5f9', marginBottom: '0.75rem' }}>Buenas prácticas</h2>
              <div style={{ background: 'rgba(22,78,99,0.5)', borderRadius: '0.75rem', padding: '1.5rem', border: '1px solid rgba(59,130,246,0.25)' }}>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'grid', gap: '0.35rem', color: '#e0f2fe', fontSize: '1rem' }}>
                  {manual.bestPractices.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </div>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ManualUsuarios;
