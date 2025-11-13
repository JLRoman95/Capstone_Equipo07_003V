import React, { useState, useEffect } from 'react';
import { inventarioFirebase, productosFirebase } from '../services/firestoreService';
import { useNavigate } from 'react-router-dom';
import usePermissions from '../hooks/usePermissions';
import ImportExportButtons from '../components/ImportExportButtons';
import { validarInventario } from '../services/importService';
import { exportarInventarioPDF } from '../services/exportService';

const Inventario = () => {
  const navigate = useNavigate();
  const { can, getRoleName } = usePermissions();
  const [inventario, setInventario] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    codigo_producto: '',
    cantidad_unidades: '',
    lote: '',
    fecha_ingreso: new Date().toISOString().split('T')[0],
    fecha_vencimiento: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [invData, prodData] = await Promise.all([
        inventarioFirebase.listar(),
        productosFirebase.listar()
      ]);
      setInventario(invData);
      setProductos(prodData);
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
      const newItem = {
        ...formData,
        cantidad_unidades: parseInt(formData.cantidad_unidades),
        estado: 'disponible'
      };
      await inventarioFirebase.crear(newItem);
      setShowModal(false);
      setFormData({ 
        codigo_producto: '', 
        cantidad_unidades: '', 
        lote: '', 
        fecha_ingreso: new Date().toISOString().split('T')[0],
        fecha_vencimiento: '' 
      });
      loadData();
    } catch (error) {
      setError('Error al crear inventario');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro de eliminar este registro?')) return;
    try {
      await inventarioFirebase.eliminar(id);
      loadData();
    } catch (error) {
      setError('Error al eliminar');
    }
  };

  const handleImport = async (datos) => {
    try {
      for (const item of datos) {
        await inventarioFirebase.crear(item);
      }
      loadData();
    } catch (error) {
      throw new Error('Error al importar inventario: ' + error.message);
    }
  };

  const handleExport = async () => {
    exportarInventarioPDF(inventario);
  };

  const getProductoNombre = (codigoProducto) => {
    const producto = productos.find(p => p.codigo_producto === codigoProducto);
    return producto?.nombre || 'Desconocido';
  };

  const isExpiringSoon = (fecha) => {
    const days = Math.ceil((new Date(fecha) - new Date()) / (1000 * 60 * 60 * 24));
    return days <= 7 && days >= 0;
  };

  const isExpired = (fecha) => {
    return new Date(fecha) < new Date();
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '1.5rem' }}>
      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>📦 Inventario</h1>
            <p style={{ color: '#6b7280' }}>Gestión de inventario con sistema FIFO • {getRoleName()}</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={() => navigate('/dashboard')} className="btn" style={{ backgroundColor: '#6b7280', color: 'white' }}>
              ← Volver
            </button>
            {can('inventario', 'create') && (
              <button onClick={() => setShowModal(true)} className="btn btn-primary">
                + Nuevo Lote
              </button>
            )}
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <ImportExportButtons
          tipo="inventario"
          onImport={handleImport}
          onExport={handleExport}
          validarDatos={validarInventario}
          permisoImportar={can('inventario', 'create')}
          permisoExportar={true}
        />

        {/* Tabla */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="card" style={{ overflow: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Lote</th>
                  <th>Cantidad</th>
                  <th>Fecha Ingreso</th>
                  <th>Fecha Vencimiento</th>
                  <th>Estado</th>
                  {can('inventario', 'delete') && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {inventario.map((item) => (
                  <tr key={item.id} style={{ backgroundColor: isExpired(item.fecha_vencimiento) ? '#fee2e2' : isExpiringSoon(item.fecha_vencimiento) ? '#fef3c7' : 'white' }}>
                    <td style={{ fontWeight: '500' }}>{getProductoNombre(item.codigo_producto)}</td>
                    <td>{item.lote}</td>
                    <td>{item.cantidad_unidades} unidades</td>
                    <td>{new Date(item.fecha_ingreso).toLocaleDateString()}</td>
                    <td>{new Date(item.fecha_vencimiento).toLocaleDateString()}</td>
                    <td>
                      {isExpired(item.fecha_vencimiento) ? (
                        <span className="badge badge-danger">Vencido</span>
                      ) : isExpiringSoon(item.fecha_vencimiento) ? (
                        <span className="badge badge-warning">Por Vencer</span>
                      ) : (
                        <span className="badge badge-success">OK</span>
                      )}
                    </td>
                    {can('inventario', 'delete') && (
                      <td>
                        <button onClick={() => handleDelete(item.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>
                          🗑️
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Nuevo Lote de Inventario</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Producto</label>
                <select
                  value={formData.codigo_producto}
                  onChange={(e) => setFormData({ ...formData, codigo_producto: e.target.value })}
                  className="input"
                  required
                >
                  <option value="">Seleccionar producto</option>
                  {productos.map(p => (
                    <option key={p.id} value={p.codigo_producto}>{p.nombre}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Lote</label>
                <input
                  type="text"
                  value={formData.lote}
                  onChange={(e) => setFormData({ ...formData, lote: e.target.value })}
                  className="input"
                  placeholder="Ej: L20241115"
                  required
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Cantidad (unidades)</label>
                <input
                  type="number"
                  value={formData.cantidad_unidades}
                  onChange={(e) => setFormData({ ...formData, cantidad_unidades: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Fecha de Ingreso</label>
                <input
                  type="date"
                  value={formData.fecha_ingreso}
                  onChange={(e) => setFormData({ ...formData, fecha_ingreso: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="label">Fecha de Vencimiento</label>
                <input
                  type="date"
                  value={formData.fecha_vencimiento}
                  onChange={(e) => setFormData({ ...formData, fecha_vencimiento: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn" style={{ flex: 1, backgroundColor: '#6b7280', color: 'white' }}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
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

export default Inventario;
