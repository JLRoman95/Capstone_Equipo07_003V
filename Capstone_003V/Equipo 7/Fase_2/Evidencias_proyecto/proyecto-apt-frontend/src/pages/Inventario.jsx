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
  const [showLotesModal, setShowLotesModal] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [lotesProducto, setLotesProducto] = useState([]);
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
  
  const agruparInventarioPorProducto = () => {
    const agrupado = {};
    
    inventario.forEach(item => {
      if (!agrupado[item.codigo_producto]) {
        agrupado[item.codigo_producto] = {
          codigo_producto: item.codigo_producto,
          nombre: getProductoNombre(item.codigo_producto),
          lotes: [],
          total_unidades: 0,
          lotes_por_vencer: 0,
          lotes_vencidos: 0
        };
      }
      
      agrupado[item.codigo_producto].lotes.push(item);
      agrupado[item.codigo_producto].total_unidades += item.cantidad_unidades;
      
      if (isExpired(item.fecha_vencimiento)) {
        agrupado[item.codigo_producto].lotes_vencidos++;
      } else if (isExpiringSoon(item.fecha_vencimiento)) {
        agrupado[item.codigo_producto].lotes_por_vencer++;
      }
    });
    
    return Object.values(agrupado).sort((a, b) => a.nombre.localeCompare(b.nombre));
  };
  
  const verLotesProducto = (codigoProducto) => {
    const lotes = inventario
      .filter(item => item.codigo_producto === codigoProducto)
      .sort((a, b) => new Date(a.fecha_vencimiento) - new Date(b.fecha_vencimiento));
    
    setLotesProducto(lotes);
    setProductoSeleccionado(productos.find(p => p.codigo_producto === codigoProducto));
    setShowLotesModal(true);
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
                  <th>Total Unidades</th>
                  <th>Total Lotes</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {agruparInventarioPorProducto().map((item) => (
                  <tr key={item.codigo_producto} style={{ cursor: 'pointer' }}>
                    <td style={{ fontWeight: '500' }}>{item.nombre}</td>
                    <td>{item.total_unidades} unidades</td>
                    <td>{item.lotes.length} lote(s)</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {item.lotes_vencidos > 0 && (
                          <span className="badge badge-danger" style={{ fontSize: '0.75rem' }}>
                            {item.lotes_vencidos} vencido(s)
                          </span>
                        )}
                        {item.lotes_por_vencer > 0 && (
                          <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>
                            {item.lotes_por_vencer} por vencer
                          </span>
                        )}
                        {item.lotes_vencidos === 0 && item.lotes_por_vencer === 0 && (
                          <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>OK</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <button
                        onClick={() => verLotesProducto(item.codigo_producto)}
                        className="btn btn-primary"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                      >
                        📊 Ver Lotes
                      </button>
                    </td>
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

      {/* Modal de Lotes de Producto */}
      {showLotesModal && productoSeleccionado && (
        <div className="modal-overlay" onClick={() => setShowLotesModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              📦 Lotes de {productoSeleccionado.nombre}
            </h2>
            
            <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#f3f4f6', borderRadius: '0.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', fontSize: '0.9rem' }}>
                <div>
                  <strong>Código:</strong> {productoSeleccionado.codigo_producto}
                </div>
                <div>
                  <strong>Total Lotes:</strong> {lotesProducto.length}
                </div>
                <div>
                  <strong>Total Unidades:</strong> {lotesProducto.reduce((sum, lote) => sum + lote.cantidad_unidades, 0)}
                </div>
              </div>
            </div>
            
            <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '1rem' }}>
              <table className="table" style={{ fontSize: '0.9rem' }}>
                <thead>
                  <tr>
                    <th>Lote</th>
                    <th>Cantidad</th>
                    <th>Fecha Ingreso</th>
                    <th>Fecha Vencimiento</th>
                    <th>Días Restantes</th>
                    <th>Estado</th>
                    {can('inventario', 'delete') && <th>Acción</th>}
                  </tr>
                </thead>
                <tbody>
                  {lotesProducto.map((lote) => {
                    const diasRestantes = Math.ceil((new Date(lote.fecha_vencimiento) - new Date()) / (1000 * 60 * 60 * 24));
                    return (
                      <tr key={lote.id} style={{ 
                        backgroundColor: isExpired(lote.fecha_vencimiento) ? '#fee2e2' : 
                                       isExpiringSoon(lote.fecha_vencimiento) ? '#fef3c7' : 'white' 
                      }}>
                        <td style={{ fontWeight: '500' }}>{lote.lote}</td>
                        <td>{lote.cantidad_unidades} unidades</td>
                        <td>{new Date(lote.fecha_ingreso).toLocaleDateString()}</td>
                        <td>{new Date(lote.fecha_vencimiento).toLocaleDateString()}</td>
                        <td>
                          {diasRestantes > 0 ? (
                            <span>{diasRestantes} días</span>
                          ) : (
                            <span style={{ color: '#dc2626', fontWeight: '600' }}>Vencido</span>
                          )}
                        </td>
                        <td>
                          {isExpired(lote.fecha_vencimiento) ? (
                            <span className="badge badge-danger">Vencido</span>
                          ) : isExpiringSoon(lote.fecha_vencimiento) ? (
                            <span className="badge badge-warning">Por Vencer</span>
                          ) : diasRestantes <= 14 ? (
                            <span className="badge" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>Próximo</span>
                          ) : (
                            <span className="badge badge-success">OK</span>
                          )}
                        </td>
                        {can('inventario', 'delete') && (
                          <td>
                            <button 
                              onClick={() => {
                                handleDelete(lote.id);
                                setShowLotesModal(false);
                              }} 
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                              title="Eliminar lote"
                            >
                              🗑️
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                📄 Sistema FIFO: Los lotes se ordenan por fecha de vencimiento
              </div>
              <button 
                onClick={() => setShowLotesModal(false)} 
                className="btn" 
                style={{ backgroundColor: '#6b7280', color: 'white' }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventario;
