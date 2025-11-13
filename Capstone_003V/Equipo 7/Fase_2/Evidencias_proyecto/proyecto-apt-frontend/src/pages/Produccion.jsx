import React, { useState, useEffect } from 'react';
import { produccionFirebase, productosFirebase } from '../services/firestoreService';
import { useNavigate } from 'react-router-dom';
import usePermissions from '../hooks/usePermissions';
import ImportExportButtons from '../components/ImportExportButtons';
import { validarProduccion } from '../services/importService';
import { exportarProduccionPDF } from '../services/exportService';

const Produccion = () => {
  const navigate = useNavigate();
  const { can, getRoleName } = usePermissions();
  const [produccion, setProduccion] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    responsable: '',
    turno: 'Mañana',
    plato: '',
    cantidad: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [prodData, productoData] = await Promise.all([
        produccionFirebase.listar(),
        productosFirebase.listar()
      ]);
      setProduccion(prodData);
      setProductos(productoData);
    } catch (error) {
      setError('Error al cargar datos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const newProduccion = {
        ...formData,
        cantidad: parseInt(formData.cantidad)
      };
      await produccionFirebase.crear(newProduccion);
      setShowModal(false);
      setFormData({ fecha: new Date().toISOString().split('T')[0], responsable: '', turno: 'Mañana', plato: '', cantidad: '' });
      loadData();
    } catch (error) {
      setError('Error al registrar producción');
    }
  };

  const handleImport = async (datos) => {
    try {
      for (const registro of datos) {
        await produccionFirebase.crear(registro);
      }
      loadData();
    } catch (error) {
      throw new Error('Error al importar producción: ' + error.message);
    }
  };

  const handleExport = async () => {
    exportarProduccionPDF(produccion);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '1.5rem' }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>👨‍🍳 Producción</h1>
            <p style={{ color: '#6b7280' }}>Registro de producción de alimentos • {getRoleName()}</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={() => navigate('/dashboard')} className="btn" style={{ backgroundColor: '#6b7280', color: 'white' }}>
              ← Volver
            </button>
            {can('produccion', 'create') && (
              <button onClick={() => setShowModal(true)} className="btn btn-danger">
                + Registrar Producción
              </button>
            )}
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <ImportExportButtons
          tipo="produccion"
          onImport={handleImport}
          onExport={handleExport}
          validarDatos={validarProduccion}
          permisoImportar={can('produccion', 'create')}
          permisoExportar={true}
        />

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
                  <th>Responsable</th>
                  <th>Turno</th>
                  <th>Plato</th>
                  <th>Cantidad</th>
                </tr>
              </thead>
              <tbody>
                {produccion.map((prod) => (
                  <tr key={prod.id}>
                    <td>{new Date(prod.fecha).toLocaleDateString()}</td>
                    <td>{prod.responsable}</td>
                    <td>{prod.turno}</td>
                    <td>{prod.plato}</td>
                    <td>{prod.cantidad} porciones</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Registrar Producción</h2>
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
                <label className="label">Plato</label>
                <input
                  type="text"
                  value={formData.plato}
                  onChange={(e) => setFormData({ ...formData, plato: e.target.value })}
                  className="input"
                  placeholder="Nombre del plato"
                  required
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="label">Cantidad (porciones)</label>
                <input
                  type="number"
                  value={formData.cantidad}
                  onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                  className="input"
                  placeholder="Número de porciones"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn" style={{ flex: 1, backgroundColor: '#6b7280', color: 'white' }}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-danger" style={{ flex: 1 }}>
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Produccion;
