import React, { useState, useEffect, useMemo } from 'react';
import { inventarioFirebase, productosFirebase } from '../services/firestoreService';
import { useNavigate } from 'react-router-dom';
import usePermissions from '../hooks/usePermissions';
import Layout from '../components/Layout';
import ImportExportButtons from '../components/ImportExportButtons';
import { validarInventario } from '../services/importService';
import { exportarInventarioPDF } from '../services/exportService';
import { buildUniqueProductOptions } from '../utils/productUtils';

const Inventario = () => {
  const navigate = useNavigate();
  const { can, getRoleName } = usePermissions();
  const [inventario, setInventario] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showLotesModal, setShowLotesModal] = useState(false);
  const [showStockMinModal, setShowStockMinModal] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [lotesProducto, setLotesProducto] = useState([]);
  const [productoMinSeleccionado, setProductoMinSeleccionado] = useState(null);
  const [nuevoStockMin, setNuevoStockMin] = useState('');
  const [formData, setFormData] = useState({
    codigo_producto: '',
    cantidad_unidades: '',
    lote: '',
    fecha_ingreso: new Date().toISOString().split('T')[0],
    fecha_vencimiento: ''
  });
  const [error, setError] = useState('');

  // Helpers: robust date parsing/formatting and safe getters
  const toDate = (v) => {
    if (!v) return null;
    if (v instanceof Date) return isNaN(v) ? null : v;
    if (typeof v?.toDate === 'function') {
      const d = v.toDate();
      return isNaN(d) ? null : d;
    }
    if (typeof v === 'object' && typeof v.seconds === 'number') {
      const d = new Date(v.seconds * 1000);
      return isNaN(d) ? null : d;
    }
    const d = new Date(v);
    return isNaN(d) ? null : d;
  };

  const formatDate = (v) => {
    const d = toDate(v);
    return d ? d.toLocaleDateString() : '-';
  };

  const getLoteId = (lote) => lote?.lote || lote?.numero_lote || lote?.id || '-';

  const getCantidadActual = (registro) => {
    if (!registro) return 0;
    const valor = registro.cantidad_actual ?? registro.cantidad_unidades ?? registro.cantidad ?? 0;
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : 0;
  };

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
      const cantidadParseada = parseInt(formData.cantidad_unidades, 10) || 0;
      const newItem = {
        ...formData,
        cantidad_unidades: cantidadParseada,
        cantidad_actual: cantidadParseada,
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
    // Buscar por ID del documento o codigo_producto
    const producto = productos.find(p => p.id === codigoProducto || p.codigo_producto === codigoProducto);
    return producto?.nombre || 'Desconocido';
  };
  
  const getProductoStockMinimo = (codigoProducto) => {
    // Buscar por ID del documento o codigo_producto
    const producto = productos.find(p => p.id === codigoProducto || p.codigo_producto === codigoProducto);
    return producto?.stock_minimo ?? 0;
  };

  const productosUnicos = useMemo(() => buildUniqueProductOptions(productos), [productos]);
  
  const agruparInventarioPorProducto = () => {
    const agrupado = {};
    
    inventario.forEach(item => {
      // Usar codigo_producto como clave para agrupar
      const key = item.codigo_producto || item.producto;
      if (!agrupado[key]) {
        agrupado[key] = {
          codigo_producto: item.codigo_producto,
          nombre: item.producto || getProductoNombre(item.codigo_producto),
          stock_minimo: getProductoStockMinimo(item.codigo_producto),
          lotes: [],
          total_unidades: 0,
          lotes_por_vencer: 0,
          lotes_vencidos: 0,
          unidades_vencidas: 0
        };
      }
      
      const grupo = agrupado[key];
      grupo.lotes.push(item);
      const qty = getCantidadActual(item);
      const expirado = isExpired(item.fecha_vencimiento);
      
      if (expirado) {
        grupo.lotes_vencidos++;
        grupo.unidades_vencidas += qty;
      } else {
        grupo.total_unidades += qty;
        if (isExpiringSoon(item.fecha_vencimiento)) {
          grupo.lotes_por_vencer++;
        }
      }
    });
    
    return Object.values(agrupado).sort((a, b) => a.nombre.localeCompare(b.nombre));
  };
  
  const verLotesProducto = (codigoProducto) => {
    const lotes = inventario
      .filter(item => item.codigo_producto === codigoProducto)
      .sort((a, b) => {
        const da = toDate(a.fecha_vencimiento);
        const db = toDate(b.fecha_vencimiento);
        if (!da && !db) return 0;
        if (!da) return 1;
        if (!db) return -1;
        return da - db;
      });
    setLotesProducto(lotes);
    const prod = productos.find(p => p.codigo_producto === codigoProducto);
    setProductoSeleccionado(
      prod || { nombre: getProductoNombre(codigoProducto), codigo_producto: codigoProducto }
    );
    setShowLotesModal(true);
  };

  const isExpiringSoon = (fecha) => {
    const d = toDate(fecha);
    if (!d) return false;
    const days = Math.ceil((d - new Date()) / (1000 * 60 * 60 * 24));
    return days <= 7 && days >= 0;
  };

  const isExpired = (fecha) => {
    const d = toDate(fecha);
    if (!d) return false;
    return d < new Date();
  };

  const abrirModalStockMin = (codigoProducto) => {
    const prod = productos.find(p => p.codigo_producto === codigoProducto);
    const fallback = prod || {
      id: null,
      codigo_producto: codigoProducto,
      nombre: getProductoNombre(codigoProducto) || 'Desconocido',
      stock_minimo: getProductoStockMinimo(codigoProducto) ?? 0
    };
    setProductoMinSeleccionado(fallback);
    setNuevoStockMin(fallback.stock_minimo ?? 0);
    setShowStockMinModal(true);
  };
  const guardarStockMin = async () => {
    if (!productoMinSeleccionado) return;
    const valor = parseInt(nuevoStockMin, 10);
    if (isNaN(valor) || valor < 0) {
      alert('El stock mínimo debe ser un número válido mayor o igual a 0');
      return;
    }
    try {
      if (productoMinSeleccionado.id) {
        await productosFirebase.actualizar(productoMinSeleccionado.id, { stock_minimo: valor });
      } else {
        await productosFirebase.crear({
          codigo_producto: productoMinSeleccionado.codigo_producto,
          nombre: productoMinSeleccionado.nombre || 'Desconocido',
          stock_minimo: valor
        });
      }
      setShowStockMinModal(false);
      setProductoMinSeleccionado(null);
      await loadData();
    } catch (e) {
      alert('Error al actualizar el stock mínimo');
      console.error(e);
    }
  };

  return (
    <Layout>
      <div style={{ padding: '1.5rem' }}>
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
                  <tr key={item.codigo_producto || item.nombre}>
                    <td style={{ fontWeight: '500' }}>{item.nombre}</td>
                    <td>
                      <span style={{ color: item.total_unidades < (item.stock_minimo || 0) ? '#b91c1c' : undefined, fontWeight: item.total_unidades < (item.stock_minimo || 0) ? 600 : 400 }}>
                        {item.total_unidades} {item.lotes[0]?.unidad_medida || 'unidades'}
                      </span>
                      {item.unidades_vencidas > 0 && (
                        <span style={{ marginLeft: '0.25rem', fontSize: '0.8rem', color: '#b91c1c' }}>
                          • {item.unidades_vencidas} vencidas
                        </span>
                      )}
                      {item.stock_minimo > 0 && (
                        <span style={{ marginLeft: '0.5rem', color: '#6b7280', fontSize: '0.8rem' }}>
                          (mín: {item.stock_minimo})
                        </span>
                      )}
                    </td>
                    <td>{item.lotes.length} lote(s)</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {item.total_unidades < (item.stock_minimo || 0) && (
                          <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>
                            Stock bajo
                          </span>
                        )}
                        {item.lotes_vencidos > 0 && (
                          <span className="badge badge-danger" style={{ fontSize: '0.75rem' }}>
                            {item.lotes_vencidos} vencido(s)
                          </span>
                        )}
                        {item.total_unidades === 0 && item.unidades_vencidas > 0 && (
                          <span
                            className="badge badge-danger"
                            style={{
                              fontSize: '0.75rem',
                              backgroundColor: '#991b1b',
                              color: '#f8fafc',
                              fontWeight: 700
                            }}
                          >
                            Sin stock utilizable
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
                        onClick={(e) => {
                          e.stopPropagation();
                          verLotesProducto(item.codigo_producto);
                        }}
                        className="btn btn-primary"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                      >
                        📊 Ver Lotes
                      </button>
                      {can('productos', 'update') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirModalStockMin(item.codigo_producto);
                          }}
                          className="btn"
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', marginLeft: '0.5rem', backgroundColor: '#6b7280', color: 'white' }}
                        >
                          ✏️ Editar mínimo
                        </button>
                      )}
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
                  {productosUnicos.map(p => (
                    <option key={p.optionValue} value={p.codigo_producto}>
                      {p.nombre}
                      {p.repeticiones > 1 ? ` (${p.repeticiones} registros)` : ''}
                    </option>
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
                  <strong>Total Unidades:</strong> {lotesProducto.reduce((sum, lote) => sum + getCantidadActual(lote), 0)} {lotesProducto[0]?.unidad_medida || 'unidades'}
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
                    <th>Días en Stock</th>
                    <th>Días Restantes</th>
                    <th>Prioridad FIFO</th>
                    <th>Estado</th>
                    {can('inventario', 'delete') && <th>Acción</th>}
                  </tr>
                </thead>
                <tbody>
                  {lotesProducto.length === 0 ? (
                    <tr>
                      <td colSpan={can('inventario', 'delete') ? 9 : 8} style={{ textAlign: 'center', color: '#6b7280' }}>
                        No hay lotes para este producto
                      </td>
                    </tr>
                  ) : (
                    lotesProducto.map((lote, index) => {
                      const dVence = toDate(lote.fecha_vencimiento);
                      const dIngreso = toDate(lote.fecha_ingreso);
                      const diasRestantes = dVence ? Math.ceil((dVence - new Date()) / (1000 * 60 * 60 * 24)) : NaN;
                      const diasEnStock = dIngreso ? Math.floor((new Date() - dIngreso) / (1000 * 60 * 60 * 24)) : NaN;
                      const backgroundColor = isExpired(lote.fecha_vencimiento) ? '#fee2e2' : 
                                          isExpiringSoon(lote.fecha_vencimiento) ? '#fef3c7' : 
                                          index === 0 ? '#fff7ed' : 'white';
                      return (
                        <tr
                          key={lote.id}
                          style={{
                            backgroundColor,
                            color: '#111827'
                          }}
                        >
                          <td style={{ fontWeight: '500' }}>{getLoteId(lote)}</td>
                          <td>{getCantidadActual(lote)} {lote.unidad_medida || 'unidades'}</td>
                          <td>{formatDate(lote.fecha_ingreso)}</td>
                          <td>{formatDate(lote.fecha_vencimiento)}</td>
                          <td>{isNaN(diasEnStock) ? '-' : `${diasEnStock} días`}</td>
                          <td>
                            {isNaN(diasRestantes) ? (
                              '-'
                            ) : diasRestantes > 0 ? (
                              <span>{diasRestantes} días</span>
                            ) : (
                              <span style={{ color: '#dc2626', fontWeight: '600' }}>Vencido</span>
                            )}
                          </td>
                          <td>
                            {index === 0 ? (
                              <span className="badge" style={{ backgroundColor: '#f59e0b', color: 'white' }}>USAR PRIMERO</span>
                            ) : (
                              <span className="badge" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>{index + 1}° en cola</span>
                            )}
                          </td>
                          <td>
                            {isExpired(lote.fecha_vencimiento) ? (
                              <span className="badge badge-danger">Vencido</span>
                            ) : isExpiringSoon(lote.fecha_vencimiento) ? (
                              <span className="badge badge-warning">Por Vencer</span>
                            ) : !isNaN(diasRestantes) && diasRestantes <= 14 ? (
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
                    })
                  )}
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

      {/* Modal Editar Stock Mínimo */}
      {showStockMinModal && productoMinSeleccionado && (
        <div className="modal-overlay" onClick={() => setShowStockMinModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>Editar Stock Mínimo</h2>
            <div style={{ marginBottom: '1rem', color: '#6b7280' }}>
              Producto: <strong>{productoMinSeleccionado.nombre}</strong> ({productoMinSeleccionado.codigo_producto})
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label className="label">Stock mínimo</label>
              <input
                type="number"
                min="0"
                value={nuevoStockMin}
                onChange={(e) => setNuevoStockMin(e.target.value)}
                className="input"
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setShowStockMinModal(false)} className="btn" style={{ backgroundColor: '#6b7280', color: 'white', flex: 1 }}>
                Cancelar
              </button>
              <button onClick={guardarStockMin} className="btn btn-primary" style={{ flex: 1 }}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </Layout>
  );
};

export default Inventario;
