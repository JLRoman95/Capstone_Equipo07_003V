import React, { useState, useEffect } from 'react';
import { addDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState(null);
  const [editingChecklist, setEditingChecklist] = useState(null);
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    turno: 'Mañana',
    responsable: '',
    items: [
      { tarea: 'Recepción y Almacenamiento FIFO/Trazabilidad', tipo: 'text', valor: '', completado: false },
      { tarea: 'Verificación de temperatura de recepción (cadena de frío)', tipo: 'number', valor: '', completado: false },
      { tarea: 'Estado del embalaje de materias primas', tipo: 'text', valor: '', completado: false },
      { tarea: 'Temperatura final de cocción (PCC)', tipo: 'number', valor: '', completado: false },
      { tarea: 'Temperatura de mantención/servicio (buffet)', tipo: 'number', valor: '', completado: false },
      { tarea: 'Separación de áreas y utensilios (crudo/cocido/alérgenos)', tipo: 'checkbox', valor: false, completado: false },
      { tarea: 'Limpieza y sanitización de mesones', tipo: 'checkbox', valor: false, completado: false },
      { tarea: 'Calidad del agua y hielo (potable)', tipo: 'checkbox', valor: false, completado: false },
      { tarea: 'Programa de limpieza (POE)', tipo: 'text', valor: '', completado: false },
      { tarea: 'Control y separación de químicos de aseo', tipo: 'checkbox', valor: false, completado: false },
      { tarea: 'Frecuencia y limpieza de residuos/basura', tipo: 'text', valor: '', completado: false },
      { tarea: 'Control de plagas (registros y mallas)', tipo: 'checkbox', valor: false, completado: false },
      { tarea: 'Higiene personal y capacitación', tipo: 'checkbox', valor: false, completado: false },
      { tarea: 'Inspección de instalaciones (grietas, fugas, ventilación)', tipo: 'text', valor: '', completado: false },
      { tarea: 'Verificación de lavamanos y dotación', tipo: 'checkbox', valor: false, completado: false }
    ]
  });
  const [newTask, setNewTask] = useState('');
  const [newTaskType, setNewTaskType] = useState('text');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      if (formData.items.length === 0) {
        setError('Debes agregar al menos una tarea');
        return;
      }
      
      const newChecklist = {
        ...formData,
        estado: 'pendiente'
      };
      await checklistsFirebase.crear(newChecklist);
      setShowModal(false);
      setFormData({ 
        fecha: new Date().toISOString().split('T')[0], 
        turno: 'Mañana', 
        responsable: '', 
        items: [] 
      });
      setSuccess('Checklist creado exitosamente');
      setTimeout(() => setSuccess(''), 3000);
      loadData();
    } catch (error) {
      setError('Error al crear checklist');
    }
  };

  const handleAddTask = () => {
    if (newTask.trim()) {
      setFormData({
        ...formData,
        items: [...formData.items, { tarea: newTask.trim(), tipo: newTaskType, valor: newTaskType === 'checkbox' ? false : '', completado: false }]
      });
      setNewTask('');
      setNewTaskType('text');
    }
  };

  const handleRemoveTask = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const handleEditChecklist = (checklist) => {
    setEditingChecklist({
      ...checklist,
      fecha: checklist.fecha?.toDate 
        ? checklist.fecha.toDate().toISOString().split('T')[0]
        : new Date(checklist.fecha).toISOString().split('T')[0]
    });
    setShowEditModal(true);
  };

  const handleUpdateChecklist = async (e) => {
    e.preventDefault();
    try {
      if (editingChecklist.items.length === 0) {
        setError('Debes tener al menos una tarea');
        return;
      }

      await checklistsFirebase.actualizar(editingChecklist.id, {
        fecha: editingChecklist.fecha,
        turno: editingChecklist.turno,
        responsable: editingChecklist.responsable,
        items: editingChecklist.items
      });
      
      setShowEditModal(false);
      setEditingChecklist(null);
      setSuccess('Checklist actualizado exitosamente');
      setTimeout(() => setSuccess(''), 3000);
      loadData();
    } catch (error) {
      setError('Error al actualizar checklist');
    }
  };

  const handleDeleteChecklist = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este checklist?')) {
      try {
        await checklistsFirebase.eliminar(id);
        setSuccess('Checklist eliminado exitosamente');
        setTimeout(() => setSuccess(''), 3000);
        loadData();
      } catch (error) {
        setError('Error al eliminar checklist');
      }
    }
  };

  const handleAddTaskToEdit = () => {
    if (newTask.trim()) {
      setEditingChecklist({
        ...editingChecklist,
        items: [...editingChecklist.items, { tarea: newTask.trim(), tipo: newTaskType, valor: newTaskType === 'checkbox' ? false : '', completado: false }]
      });
      setNewTask('');
      setNewTaskType('text');
    }
  };

  const handleRemoveTaskFromEdit = (index) => {
    setEditingChecklist({
      ...editingChecklist,
      items: editingChecklist.items.filter((_, i) => i !== index)
    });
  };

  const handleExport = async () => {
    exportarChecklistsPDF(checklists);
  };

  const handleToggleItem = async (checklistId, itemIndex) => {
    // Solo auditores pueden marcar tareas
    if (!isRole('auditor')) {
      setError('Solo los auditores pueden completar las tareas del checklist');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      const checklist = checklists.find(c => c.id === checklistId);
      if (!checklist) return;

      const updatedItems = [...checklist.items];
      updatedItems[itemIndex].completado = !updatedItems[itemIndex].completado;

      // Verificar si todas las tareas están completadas
      const todasCompletadas = updatedItems.every(item => item.completado);
      const nuevoEstado = todasCompletadas ? 'completo' : 'pendiente';

      await checklistsFirebase.actualizar(checklistId, {
        items: updatedItems,
        estado: nuevoEstado
      });

      // Actualizar el estado local
      setChecklists(checklists.map(c => 
        c.id === checklistId 
          ? { ...c, items: updatedItems, estado: nuevoEstado }
          : c
      ));

      // Actualizar el checklist seleccionado si está abierto
      if (selectedChecklist?.id === checklistId) {
        setSelectedChecklist({ ...selectedChecklist, items: updatedItems, estado: nuevoEstado });
      }
    } catch (error) {
      setError('Error al actualizar checklist');
      console.error(error);
    }
  };

  // Actualizar sólo el valor (temperatura, fecha, texto, sí/no) sin cambiar estado de completado
  const handleUpdateItemValue = async (checklistId, itemIndex, value) => {
    try {
      const checklist = checklists.find(c => c.id === checklistId);
      if (!checklist) return;
      const updatedItems = [...checklist.items];
      updatedItems[itemIndex].valor = value;
      // Validación PCC: Temperatura buffet >= 65°C
      const item = updatedItems[itemIndex];
      if (item.tipo === 'number' && item.tarea.toLowerCase().includes('buffet')) {
        const numeric = Number(value);
        if (!isNaN(numeric)) {
          if (numeric < 65) {
            // Marcar alerta visual
            updatedItems[itemIndex].alertaPCC = true;
            // Verificar si ya existe alerta activa para este checklist + tarea
            const q = query(collection(db, 'alertas'), where('estado', '==', 'activa'), where('tipo', '==', 'pcc_temperatura'));
            const snapshot = await getDocs(q);
            const exists = snapshot.docs.some(d => {
              const data = d.data();
              return data.metadata?.checklist_id === checklistId && data.metadata?.item_tarea === item.tarea;
            });
            if (!exists) {
              await addDoc(collection(db, 'alertas'), {
                tipo: 'pcc_temperatura',
                titulo: '🚨 Temperatura Buffet Baja',
                mensaje: `Valor registrado ${numeric}°C (<65°C) en ${item.tarea}`,
                prioridad: numeric < 60 ? 'alta' : 'media',
                estado: 'activa',
                fecha: Timestamp.now(),
                creado_en: new Date().toISOString(),
                metadata: {
                  checklist_id: checklistId,
                  item_tarea: item.tarea,
                  valor: numeric,
                  umbral_minimo: 65
                }
              });
            }
          } else {
            // Remover marca de alerta si se corrige
            updatedItems[itemIndex].alertaPCC = false;
          }
        }
      }
      await checklistsFirebase.actualizar(checklistId, { items: updatedItems });
      setChecklists(checklists.map(c => c.id === checklistId ? { ...c, items: updatedItems } : c));
      if (selectedChecklist?.id === checklistId) {
        setSelectedChecklist({ ...selectedChecklist, items: updatedItems });
      }
    } catch (e) {
      setError('Error al actualizar valor');
      setTimeout(() => setError(''), 3000);
    }
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

        {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
        {success && <div className="alert alert-success" style={{ marginBottom: '1rem', backgroundColor: '#d1fae5', color: '#065f46', border: '1px solid #10b981' }}>{success}</div>}

        <div style={{ marginBottom: '20px' }}>
          <button 
            onClick={handleExport} 
            className="btn" 
            style={{ backgroundColor: '#e74c3c', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            Exportar
          </button>
      </div>

      {/* Listado de checklists existentes */}
      {loading ? (
        <p style={{ color: '#6b7280' }}>Cargando checklists...</p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {checklists.length === 0 ? (
            <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No hay checklists registrados.</p>
          ) : (
            checklists.map((check) => (
              <div key={check.id} style={{
                backgroundColor: 'white',
                padding: '1rem',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>Checklist {new Date(check.fecha).toLocaleDateString()} • {check.turno}</h3>
                  <p style={{ margin: '0.25rem 0', color: '#374151' }}>Responsable: {check.responsable || '—'}</p>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: check.estado === 'completo' ? '#059669' : '#b45309' }}>
                    Estado: {check.estado === 'completo' ? '✔ Completado' : 'Pendiente'}
                  </p>
                  {/* Barra de progreso */}
                  {check.items && check.items.length > 0 && (
                    (() => {
                      const total = check.items.length;
                      const done = check.items.filter(i => i.completado).length;
                      const pct = Math.round(done / total * 100);
                      return (
                        <div style={{ marginTop: '0.4rem' }}>
                          <div style={{ height: '6px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: pct + '%', background: pct === 100 ? '#10b981' : '#f59e0b', height: '100%' }}></div>
                          </div>
                          <span style={{ fontSize: '0.7rem', color: '#374151' }}>{pct}% completado</span>
                        </div>
                      );
                    })()
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => setSelectedChecklist(check)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                    title="Ver detalle"
                  >
                    👁️
                  </button>
                  {can('checklists', 'update') && (
                    <button
                      onClick={() => handleEditChecklist(check)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                      title="Editar"
                    >
                      ✏️
                    </button>
                  )}
                  {can('checklists', 'delete') && (
                    <button
                      onClick={() => handleDeleteChecklist(check.id)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
      {/* cierre del contenedor principal */}
      </div>

      {/* Modal para crear checklist */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '90vh', overflow: 'auto' }}>
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
              <div style={{ marginBottom: '1rem' }}>
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
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="label">Tareas del Checklist</label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    className="input"
                    placeholder="Agregar nueva tarea"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTask())}
                  />
                  <select
                    value={newTaskType}
                    onChange={(e) => setNewTaskType(e.target.value)}
                    className="input"
                    style={{ maxWidth: '140px' }}
                  >
                    <option value="text">Texto</option>
                    <option value="number">Número</option>
                    <option value="date">Fecha</option>
                    <option value="checkbox">Sí/No</option>
                  </select>
                  <button 
                    type="button" 
                    onClick={handleAddTask}
                    className="btn btn-primary"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    + Agregar
                  </button>
                </div>
                {formData.items.length === 0 ? (
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', fontStyle: 'italic' }}>
                    No hay tareas agregadas. Agrega al menos una tarea.
                  </p>
                ) : (
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.375rem', padding: '0.5rem' }}>
                    {formData.items.map((item, idx) => (
                      <div key={idx} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '0.5rem',
                        borderBottom: idx < formData.items.length - 1 ? '1px solid #e5e7eb' : 'none'
                      }}>
                        <span style={{ fontSize: '0.95rem' }}>{item.tarea}</span>
                        {item.tipo === 'number' && (
                          <input type="number" value={item.valor} onChange={e => {
                            const items = [...formData.items];
                            items[idx].valor = e.target.value;
                            setFormData({ ...formData, items });
                          }} style={{ marginLeft: '1rem', width: '80px' }} />
                        )}
                        {item.tipo === 'date' && (
                          <input type="date" value={item.valor} onChange={e => {
                            const items = [...formData.items];
                            items[idx].valor = e.target.value;
                            setFormData({ ...formData, items });
                          }} style={{ marginLeft: '1rem' }} />
                        )}
                        {item.tipo === 'checkbox' && (
                          <input type="checkbox" checked={!!item.valor} onChange={e => {
                            const items = [...formData.items];
                            items[idx].valor = e.target.checked;
                            setFormData({ ...formData, items });
                          }} style={{ marginLeft: '1rem' }} />
                        )}
                        {item.tipo === 'text' && (
                          <input type="text" value={item.valor} onChange={e => {
                            const items = [...formData.items];
                            items[idx].valor = e.target.value;
                            setFormData({ ...formData, items });
                          }} style={{ marginLeft: '1rem', width: '200px' }} />
                        )}
                        <button type="button" onClick={() => handleRemoveTask(idx)} style={{ marginLeft: '1rem', color: 'red' }}>Eliminar</button>
                      </div>
                    ))}
                  </div>
                )}
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
              {!isRole('auditor') && (
                <p style={{ 
                  fontSize: '0.875rem', 
                  color: '#f59e0b', 
                  backgroundColor: '#fffbeb',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  marginBottom: '0.75rem',
                  border: '1px solid #fde68a'
                }}>
                  ⚠️ Solo los auditores pueden marcar las tareas como completadas
                </p>
              )}
              {selectedChecklist.items?.map((item, idx) => (
                <div key={idx} style={{
                  padding: '0.75rem',
                  borderBottom: '1px solid #e5e7eb',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  backgroundColor: item.alertaPCC ? '#fef2f2' : (item.completado ? '#f0fdf4' : 'white'),
                  borderLeft: item.alertaPCC ? '4px solid #dc2626' : '4px solid transparent'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <input
                      type="checkbox"
                      checked={item.completado}
                      onChange={() => isRole('auditor') && handleToggleItem(selectedChecklist.id, idx)}
                      disabled={!isRole('auditor')}
                      style={{
                        width: '20px',
                        height: '20px',
                        cursor: isRole('auditor') ? 'pointer' : 'not-allowed',
                        accentColor: '#10b981'
                      }}
                    />
                    <span style={{
                      textDecoration: item.completado ? 'line-through' : 'none',
                      color: item.completado ? '#6b7280' : '#111827',
                      flex: 1,
                      fontSize: '0.95rem'
                    }}>
                      {item.tarea}
                    </span>
                    {item.completado && <span style={{ color: '#10b981', fontSize: '1.2rem' }}>✓</span>}
                  </div>
                  {/* Edición de valor */}
                  {isRole('auditor') && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <label style={{ fontSize: '0.75rem', color: '#374151' }}>Valor:</label>
                      {item.tipo === 'number' && (
                        <input
                          type="number"
                          value={item.valor || ''}
                          onClick={e => e.stopPropagation()}
                          onChange={e => handleUpdateItemValue(selectedChecklist.id, idx, e.target.value)}
                          style={{ width: '90px' }}
                        />
                      )}
                      {item.tipo === 'date' && (
                        <input
                          type="date"
                          value={item.valor || ''}
                          onClick={e => e.stopPropagation()}
                          onChange={e => handleUpdateItemValue(selectedChecklist.id, idx, e.target.value)}
                        />
                      )}
                      {item.tipo === 'checkbox' && (
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}>
                          <input
                            type="checkbox"
                            checked={!!item.valor}
                            onClick={e => e.stopPropagation()}
                            onChange={e => handleUpdateItemValue(selectedChecklist.id, idx, e.target.checked)}
                          />
                          {item.valor ? 'Sí' : 'No'}
                        </label>
                      )}
                      {item.tipo === 'text' && (
                        <input
                          type="text"
                          value={item.valor || ''}
                          onClick={e => e.stopPropagation()}
                          onChange={e => handleUpdateItemValue(selectedChecklist.id, idx, e.target.value)}
                          style={{ minWidth: '220px' }}
                          placeholder="Ingresar dato"
                        />
                      )}
                      {item.alertaPCC && item.tipo === 'number' && item.tarea.toLowerCase().includes('buffet') && (
                        <span style={{ color: '#dc2626', fontSize: '0.75rem', fontWeight: 500 }}>
                          Temperatura bajo umbral (≥65°C)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button onClick={() => setSelectedChecklist(null)} className="btn" style={{ width: '100%', backgroundColor: '#6b7280', color: 'white' }}>
              Cerrar
            </button>
          </div>
        </div>
      )}

      {showEditModal && editingChecklist && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '90vh', overflow: 'auto' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Editar Checklist</h2>
            <form onSubmit={handleUpdateChecklist}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Fecha</label>
                <input
                  type="date"
                  value={editingChecklist.fecha}
                  onChange={(e) => setEditingChecklist({ ...editingChecklist, fecha: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Turno</label>
                <select
                  value={editingChecklist.turno}
                  onChange={(e) => setEditingChecklist({ ...editingChecklist, turno: e.target.value })}
                  className="input"
                  required
                >
                  <option value="Mañana">Mañana</option>
                  <option value="Tarde">Tarde</option>
                  <option value="Noche">Noche</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Responsable</label>
                <input
                  type="text"
                  value={editingChecklist.responsable}
                  onChange={(e) => setEditingChecklist({ ...editingChecklist, responsable: e.target.value })}
                  className="input"
                  placeholder="Nombre del responsable"
                  required
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="label">Tareas del Checklist</label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    className="input"
                    placeholder="Agregar nueva tarea"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTaskToEdit())}
                  />
                  <select
                    value={newTaskType}
                    onChange={(e) => setNewTaskType(e.target.value)}
                    className="input"
                    style={{ maxWidth: '140px' }}
                  >
                    <option value="text">Texto</option>
                    <option value="number">Número</option>
                    <option value="date">Fecha</option>
                    <option value="checkbox">Sí/No</option>
                  </select>
                  <button 
                    type="button" 
                    onClick={handleAddTaskToEdit}
                    className="btn btn-primary"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    + Agregar
                  </button>
                </div>
                
                {editingChecklist.items.length === 0 ? (
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', fontStyle: 'italic' }}>
                    No hay tareas. Agrega al menos una tarea.
                  </p>
                ) : (
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.375rem', padding: '0.5rem' }}>
                    {editingChecklist.items.map((item, idx) => (
                      <div key={idx} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '0.5rem',
                        borderBottom: idx < editingChecklist.items.length - 1 ? '1px solid #e5e7eb' : 'none',
                        backgroundColor: item.completado ? '#f0fdf4' : 'white'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                          {item.completado && <span style={{ color: '#10b981' }}>✓</span>}
                          <span style={{ 
                            fontSize: '0.95rem',
                            textDecoration: item.completado ? 'line-through' : 'none',
                            color: item.completado ? '#6b7280' : '#111827'
                          }}>
                            {item.tarea}
                          </span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => handleRemoveTaskFromEdit(idx)}
                          style={{ 
                            background: 'transparent', 
                            border: 'none', 
                            cursor: 'pointer', 
                            fontSize: '1.2rem',
                            color: '#ef4444'
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  type="button" 
                  onClick={() => { setShowEditModal(false); setEditingChecklist(null); setNewTask(''); }} 
                  className="btn" 
                  style={{ flex: 1, backgroundColor: '#6b7280', color: 'white' }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn" style={{ flex: 1, backgroundColor: '#f59e0b', color: 'white' }}>
                  Actualizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checklists;
