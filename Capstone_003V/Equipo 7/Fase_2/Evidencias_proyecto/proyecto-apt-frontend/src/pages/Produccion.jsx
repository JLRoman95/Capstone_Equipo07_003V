import React, { useState, useEffect } from 'react';
import { produccionFirebase, productosFirebase, inventarioFirebase } from '../services/firestoreService';
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
    cantidad: '',
    ingredientes: []
  });
  const [ingredienteActual, setIngredienteActual] = useState({
    codigo_producto: '',
    cantidad_necesaria: ''
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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
    
    if (formData.ingredientes.length === 0) {
      setError('Debe agregar al menos un ingrediente');
      return;
    }
    
    try {
      setLoading(true);
      
      // Calcular cantidades totales necesarias
      const cantidadPorciones = parseInt(formData.cantidad);
      const ingredientesTotales = formData.ingredientes.map(ing => ({
        codigo_producto: ing.codigo_producto,
        cantidad_total: ing.cantidad_necesaria * cantidadPorciones,
        cantidad_por_porcion: ing.cantidad_necesaria
      }));
      
      // Verificar disponibilidad en inventario
      const inventarioData = await inventarioFirebase.listar();
      
      for (const ingrediente of ingredientesTotales) {
        const lotesDisponibles = inventarioData
          .filter(item => item.codigo_producto === ingrediente.codigo_producto)
          .filter(item => new Date(item.fecha_vencimiento) > new Date())
          .sort((a, b) => new Date(a.fecha_vencimiento) - new Date(b.fecha_vencimiento));
        
        const totalDisponible = lotesDisponibles.reduce((sum, lote) => sum + lote.cantidad_unidades, 0);
        
        if (totalDisponible < ingrediente.cantidad_total) {
          const producto = productos.find(p => p.codigo_producto === ingrediente.codigo_producto);
          throw new Error(`Inventario insuficiente para ${producto?.nombre}. Necesario: ${ingrediente.cantidad_total}, Disponible: ${totalDisponible}`);
        }
      }
      
      // Descontar del inventario usando FIFO
      for (const ingrediente of ingredientesTotales) {
        let cantidadRestante = ingrediente.cantidad_total;
        
        const lotesDisponibles = inventarioData
          .filter(item => item.codigo_producto === ingrediente.codigo_producto)
          .filter(item => new Date(item.fecha_vencimiento) > new Date())
          .sort((a, b) => new Date(a.fecha_vencimiento) - new Date(b.fecha_vencimiento));
        
        for (const lote of lotesDisponibles) {
          if (cantidadRestante <= 0) break;
          
          if (lote.cantidad_unidades >= cantidadRestante) {
            // El lote tiene suficiente, solo descontar
            await inventarioFirebase.actualizar(lote.id, {
              ...lote,
              cantidad_unidades: lote.cantidad_unidades - cantidadRestante
            });
            cantidadRestante = 0;
          } else {
            // El lote no es suficiente, usar todo y continuar
            cantidadRestante -= lote.cantidad_unidades;
            await inventarioFirebase.actualizar(lote.id, {
              ...lote,
              cantidad_unidades: 0
            });
          }
        }
      }
      
      // Registrar producción
      const newProduccion = {
        ...formData,
        cantidad: cantidadPorciones,
        ingredientes: ingredientesTotales
      };
      await produccionFirebase.crear(newProduccion);
      
      setSuccessMessage(`Producción registrada exitosamente. Inventario actualizado.`);
      setShowModal(false);
      setFormData({ 
        fecha: new Date().toISOString().split('T')[0], 
        responsable: '', 
        turno: 'Mañana', 
        plato: '', 
        cantidad: '',
        ingredientes: []
      });
      setIngredienteActual({ codigo_producto: '', cantidad_necesaria: '' });
      loadData();
      
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      setError(error.message || 'Error al registrar producción');
    } finally {
      setLoading(false);
    }
  };

  const agregarIngrediente = () => {
    if (!ingredienteActual.codigo_producto || !ingredienteActual.cantidad_necesaria) {
      setError('Complete los datos del ingrediente');
      return;
    }
    
    // Verificar que no esté duplicado
    if (formData.ingredientes.some(ing => ing.codigo_producto === ingredienteActual.codigo_producto)) {
      setError('Este ingrediente ya fue agregado');
      return;
    }
    
    setFormData({
      ...formData,
      ingredientes: [...formData.ingredientes, {
        codigo_producto: ingredienteActual.codigo_producto,
        cantidad_necesaria: parseFloat(ingredienteActual.cantidad_necesaria)
      }]
    });
    
    setIngredienteActual({ codigo_producto: '', cantidad_necesaria: '' });
    setError('');
  };
  
  const eliminarIngrediente = (codigoProducto) => {
    setFormData({
      ...formData,
      ingredientes: formData.ingredientes.filter(ing => ing.codigo_producto !== codigoProducto)
    });
  };
  
  const getProductoNombre = (codigoProducto) => {
    const producto = productos.find(p => p.codigo_producto === codigoProducto);
    return producto?.nombre || 'Desconocido';
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
        {successMessage && <div className="alert" style={{ backgroundColor: '#d1fae5', color: '#065f46', marginBottom: '1rem' }}>{successMessage}</div>}

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
                  <th>Ingredientes</th>
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
                    <td>
                      {prod.ingredientes && prod.ingredientes.length > 0 ? (
                        <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.9rem' }}>
                          {prod.ingredientes.map((ing, idx) => (
                            <li key={idx}>
                              {getProductoNombre(ing.codigo_producto)}: {ing.cantidad_por_porcion} × {prod.cantidad} = {ing.cantidad_total} unidades
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>Sin detalles</span>
                      )}
                    </td>
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

              {/* Sección de Ingredientes */}
              <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.75rem' }}>📋 Ingredientes (Receta por porción)</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <select
                    value={ingredienteActual.codigo_producto}
                    onChange={(e) => setIngredienteActual({ ...ingredienteActual, codigo_producto: e.target.value })}
                    className="input"
                    style={{ fontSize: '0.9rem' }}
                  >
                    <option value="">Seleccionar ingrediente</option>
                    {productos.map(p => (
                      <option key={p.id} value={p.codigo_producto}>{p.nombre}</option>
                    ))}
                  </select>
                  
                  <input
                    type="number"
                    step="0.01"
                    value={ingredienteActual.cantidad_necesaria}
                    onChange={(e) => setIngredienteActual({ ...ingredienteActual, cantidad_necesaria: e.target.value })}
                    className="input"
                    placeholder="Cantidad"
                    style={{ fontSize: '0.9rem' }}
                  />
                  
                  <button
                    type="button"
                    onClick={agregarIngrediente}
                    className="btn btn-primary"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                  >
                    + Agregar
                  </button>
                </div>
                
                {formData.ingredientes.length > 0 && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Ingredientes agregados:</div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {formData.ingredientes.map((ing, idx) => (
                        <li key={idx} style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          padding: '0.5rem',
                          backgroundColor: 'white',
                          borderRadius: '0.25rem',
                          marginBottom: '0.25rem',
                          fontSize: '0.9rem'
                        }}>
                          <span>
                            <strong>{getProductoNombre(ing.codigo_producto)}</strong>: {ing.cantidad_necesaria} unidades/porción
                            {formData.cantidad && (
                              <span style={{ color: '#6b7280', marginLeft: '0.5rem' }}>
                                (Total: {ing.cantidad_necesaria * parseInt(formData.cantidad || 0)} unidades)
                              </span>
                            )}
                          </span>
                          <button
                            type="button"
                            onClick={() => eliminarIngrediente(ing.codigo_producto)}
                            style={{ 
                              background: 'transparent', 
                              border: 'none', 
                              cursor: 'pointer', 
                              fontSize: '1.2rem',
                              color: '#ef4444'
                            }}
                          >
                            🗑️
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {formData.ingredientes.length === 0 && (
                  <div style={{ color: '#9ca3af', fontSize: '0.85rem', fontStyle: 'italic' }}>
                    No hay ingredientes agregados. Agregue al menos uno para continuar.
                  </div>
                )}
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
