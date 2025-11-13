import React, { useState, useEffect } from 'react';
import { checklistsFirebase } from '../services/firestoreService';
import { useNavigate } from 'react-router-dom';
import usePermissions from '../hooks/usePermissions';
import { exportarChecklistsPDF } from '../services/exportService';

const Checklists = () => {
  const navigate = useNavigate();
  const { can, getRoleName, isRole } = usePermissions();
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState(null);
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    turno: 'Mañana',
    responsable: '',
    items: []
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await checklistsFirebase.listar();
      setChecklists(data);
    } catch (error) {
      setError('Error al cargar checklists');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const defaultItems = [
        { tarea: 'Limpieza de superficies', completado: false },
        { tarea: 'Verificación de temperaturas', completado: false },
        { tarea: 'Control de higiene personal', completado: false }
      ];
      const newChecklist = {
        ...formData,
        items: defaultItems,
        estado: 'pendiente'
      };
      await checklistsFirebase.crear(newChecklist);
      setShowModal(false);
      setFormData({ fecha: new Date().toISOString().split('T')[0], turno: 'Mañana', responsable: '', items: [] });
      loadData();
    } catch (error) {
      setError('Error al crear checklist');
    }
  };

  const handleExport = async () => {
    exportarChecklistsPDF(checklists);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '1.5rem' }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>✅ Checklists</h1>
            <p style={{ color: '#6b7280' }}>Control de calidad • {getRoleName()}</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={() => navigate('/dashboard')} className="btn" style={{ backgroundColor: '#6b7280', color: 'white' }}>
              ← Volver
            </button>
            {can('checklists', 'create') && (
              <button onClick={() => setShowModal(true)} className="btn" style={{ backgroundColor: '#f59e0b', color: 'white' }}>
                + Nuevo Checklist
              </button>
            )}
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div style={{ marginBottom: '20px' }}>
          <button 
            onClick={handleExport} 
            className="btn" 
            style={{ backgroundColor: '#e74c3c', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            📄 Exportar PDF
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="card" style={{ overflow: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Turno</th>
                  <th>Responsable</th>
                  <th>Items</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {checklists.map((check) => {
                  const completadas = check.items?.filter(i => i.completado).length || 0;
                  const total = check.items?.length || 0;
                  return (
                    <tr key={check.id}>
                      <td>{new Date(check.fecha).toLocaleDateString()}</td>
                      <td>{check.turno}</td>
                      <td>{check.responsable}</td>
                      <td>{completadas}/{total} completadas</td>
                      <td>
                        <span className={`badge ${check.estado === 'completo' ? 'badge-success' : 'badge-warning'}`}>
                          {check.estado}
                        </span>
                      </td>
                      <td>
                        <button onClick={() => setSelectedChecklist(check)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>
                          👁️
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Nuevo Checklist</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Fecha</label>
                <input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Turno</label>
                <select
                  value={formData.turno}
                  onChange={(e) => setFormData({ ...formData, turno: e.target.value })}
                  className="input"
                  required
                >
                  <option value="Mañana">Mañana</option>
                  <option value="Tarde">Tarde</option>
                  <option value="Noche">Noche</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="label">Responsable</label>
                <input
                  type="text"
                  value={formData.responsable}
                  onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
                  className="input"
                  placeholder="Nombre del responsable"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn" style={{ flex: 1, backgroundColor: '#6b7280', color: 'white' }}>
                  Cancelar
                </button>
                <button type="submit" className="btn" style={{ flex: 1, backgroundColor: '#f59e0b', color: 'white' }}>
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedChecklist && (
        <div className="modal-overlay" onClick={() => setSelectedChecklist(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              Detalle Checklist - {selectedChecklist.turno} {new Date(selectedChecklist.fecha).toLocaleDateString()}
            </h2>
            <div style={{ marginBottom: '1rem' }}>
              <p><strong>Responsable:</strong> {selectedChecklist.responsable}</p>
              <p><strong>Estado:</strong> {selectedChecklist.estado}</p>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Tareas:</h3>
              {selectedChecklist.items?.map((item, idx) => (
                <div key={idx} style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>{item.completado ? '✅' : '⬜'}</span>
                  <span style={{ textDecoration: item.completado ? 'line-through' : 'none' }}>{item.tarea}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setSelectedChecklist(null)} className="btn" style={{ width: '100%', backgroundColor: '#6b7280', color: 'white' }}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checklists;
