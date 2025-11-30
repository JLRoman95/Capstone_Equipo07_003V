import React, { useState, useEffect } from 'react';
import { produccionFirebase, productosFirebase, inventarioFirebase, recetasFirebase } from '../services/firestoreService';
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
  const [recetas, setRecetas] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showRecetasModal, setShowRecetasModal] = useState(false);
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
  const [showStockWarning, setShowStockWarning] = useState(false);
  const [stockWarnings, setStockWarnings] = useState([]);
  const [pendingIngredientes, setPendingIngredientes] = useState(null);
  const [pendingInventario, setPendingInventario] = useState(null);
  const [showMermasModal, setShowMermasModal] = useState(false);
  const [produccionSeleccionada, setProduccionSeleccionada] = useState(null);
  const [mermas, setMermas] = useState([]);
  const [mermaActual, setMermaActual] = useState({
    codigo_producto: '',
    cantidad: '',
    motivo: ''
  });
  const [recetaForm, setRecetaForm] = useState({
    nombre: '',
    descripcion: '',
    ingredientes: []
  });
  const [editingReceta, setEditingReceta] = useState(null);

  const productosUnicos = React.useMemo(() => {
    const vistos = new Map();
    productos.forEach((producto) => {
      if (!producto) return;
      const nombreClave = (producto.nombre || '').trim().toLowerCase();
      const key = nombreClave || producto.codigo_producto || producto.id;
      if (!key || vistos.has(key)) return;
      vistos.set(key, producto);
    });
    return Array.from(vistos.values()).sort((a, b) => {
      if (!a?.nombre) return 1;
      if (!b?.nombre) return -1;
      return a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' });
    });
  }, [productos]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [prodData, productoData, recetasData, inventarioData] = await Promise.all([
        produccionFirebase.listar(),
        productosFirebase.listar(),
        recetasFirebase.listar(),
        inventarioFirebase.listar()
      ]);
      setProduccion(prodData);
      setProductos(productoData);
      setRecetas(recetasData);
      setInventario(inventarioData);
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
      const warnings = [];
      
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

        // Advertencia si el stock proyectado queda por debajo del mínimo
        const producto = productos.find(p => p.codigo_producto === ingrediente.codigo_producto);
        const stockMinimo = producto?.stock_minimo ?? 0;
        const proyectado = totalDisponible - ingrediente.cantidad_total;
        if (stockMinimo > 0 && proyectado < stockMinimo) {
          warnings.push({
            codigo_producto: ingrediente.codigo_producto,
            nombre: producto?.nombre || ingrediente.codigo_producto,
            minimo: stockMinimo,
            actual: totalDisponible,
            consumo: ingrediente.cantidad_total,
            proyectado
          });
        }
      }
      
      if (warnings.length > 0) {
        // Mostrar modal de advertencia y esperar confirmación
        setStockWarnings(warnings);
        setPendingIngredientes(ingredientesTotales);
        setPendingInventario(inventarioData);
        setShowStockWarning(true);
        setLoading(false);
        return; // No continuar hasta confirmar
      }

      // Si no hay advertencias, procesar directamente
      await procesarProduccion(ingredientesTotales, inventarioData, cantidadPorciones);

    } catch (error) {
      setError(error.message || 'Error al registrar producción');
    } finally {
      setLoading(false);
    }
  };

  const procesarProduccion = async (ingredientesTotales, inventarioData, cantidadPorciones) => {
    try {
      setLoading(true);
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
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const confirmarAdvertenciaYContinuar = async () => {
    if (!pendingIngredientes || !pendingInventario) {
      setShowStockWarning(false);
      return;
    }
    try {
      const cantidadPorciones = parseInt(formData.cantidad);
      await procesarProduccion(pendingIngredientes, pendingInventario, cantidadPorciones);
    } finally {
      setShowStockWarning(false);
      setStockWarnings([]);
      setPendingIngredientes(null);
      setPendingInventario(null);
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
    // Buscar por ID del documento (ya que codigo_producto no existe en los productos)
    const producto = productos.find(p => p.id === codigoProducto || p.codigo_producto === codigoProducto);
    return producto?.nombre || 'Desconocido';
  };

  const abrirModalMermas = (prod) => {
    setProduccionSeleccionada(prod);
    setMermas(prod.mermas || []);
    setShowMermasModal(true);
  };

  const agregarMerma = () => {
    if (!mermaActual.codigo_producto || !mermaActual.cantidad || !mermaActual.motivo) {
      setError('Complete todos los campos de la merma');
      return;
    }

    const nuevaMerma = {
      codigo_producto: mermaActual.codigo_producto,
      cantidad: parseFloat(mermaActual.cantidad),
      motivo: mermaActual.motivo,
      fecha: new Date().toISOString()
    };

    setMermas([...mermas, nuevaMerma]);
    setMermaActual({ codigo_producto: '', cantidad: '', motivo: '' });
    setError('');
  };

  const eliminarMerma = (index) => {
    setMermas(mermas.filter((_, idx) => idx !== index));
  };

  const guardarMermas = async () => {
    try {
      await produccionFirebase.actualizar(produccionSeleccionada.id, {
        mermas: mermas
      });
      
      setSuccessMessage('Mermas guardadas exitosamente');
      setShowMermasModal(false);
      loadData();
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setError('Error al guardar mermas: ' + error.message);
    }
  };

  const seleccionarReceta = (receta) => {
    setFormData({
      ...formData,
      plato: receta.nombre,
      ingredientes: receta.ingredientes.map(ing => ({
        codigo_producto: ing.codigo_producto,
        cantidad_necesaria: ing.cantidad
      }))
    });
    setError('');
  };

  // Configuración de productos que se manejan por unidades
  const productosConUnidades = {
    'Pan Marraqueta': { gramosUnidad: 80, unidadDisplay: 'unidad' }
  };

  const esProductoPorUnidad = (nombreProducto) => {
    return productosConUnidades.hasOwnProperty(nombreProducto);
  };

  const getUnidadMedida = (codigoProducto) => {
    const producto = productos.find(p => p.id === codigoProducto || p.codigo_producto === codigoProducto);
    if (!producto) return 'g/ml';
    
    // Si es un producto que se maneja por unidades, mostrar "unidad"
    if (esProductoPorUnidad(producto.nombre)) {
      return 'unidad';
    }
    
    // Buscar en inventario por nombre del producto para obtener la unidad
    const lote = inventario.find(item => item.producto === producto.nombre);
    return lote?.unidad_medida === 'litros' ? 'ml' : 'g';
  };

  const getStockDisponible = (codigoProducto) => {
    // Primero obtener el nombre del producto por su ID
    const producto = productos.find(p => p.id === codigoProducto || p.codigo_producto === codigoProducto);
    if (!producto) return 0;
    
    // Buscar en inventario por nombre del producto
    const lotesDisponibles = inventario
      .filter(item => item.producto === producto.nombre)
      .filter(item => new Date(item.fecha_vencimiento) > new Date());
    
    const total = lotesDisponibles.reduce((sum, lote) => {
      const cantidad = lote.cantidad_actual || lote.cantidad_unidades || 0;
      // Convertir kg a gramos y litros a ml
      if (lote.unidad_medida === 'kg') return sum + (cantidad * 1000);
      if (lote.unidad_medida === 'litros') return sum + (cantidad * 1000);
      return sum + cantidad;
    }, 0);
    
    // Si el producto se maneja por unidades, convertir gramos a unidades
    if (esProductoPorUnidad(producto.nombre)) {
      const config = productosConUnidades[producto.nombre];
      return Math.floor(total / config.gramosUnidad); // Convertir g a unidades
    }
    
    return total;
  };

  const handleCrearReceta = async (e) => {
    e.preventDefault();
    
    if (!recetaForm.nombre || recetaForm.ingredientes.length === 0) {
      setError('Complete el nombre y agregue al menos un ingrediente');
      return;
    }

    try {
      if (editingReceta) {
        await recetasFirebase.actualizar(editingReceta.id, recetaForm);
        setSuccessMessage('Receta actualizada exitosamente');
      } else {
        await recetasFirebase.crear(recetaForm);
        setSuccessMessage('Receta creada exitosamente');
      }
      
      setRecetaForm({ nombre: '', descripcion: '', ingredientes: [] });
      setEditingReceta(null);
      setShowRecetasModal(false);
      loadData();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setError('Error al guardar receta: ' + error.message);
    }
  };

  const handleEliminarReceta = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar esta receta?')) return;
    
    try {
      await recetasFirebase.eliminar(id);
      setSuccessMessage('Receta eliminada exitosamente');
      loadData();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setError('Error al eliminar receta: ' + error.message);
    }
  };

  const handleEditarReceta = (receta) => {
    setEditingReceta(receta);
    setRecetaForm({
      nombre: receta.nombre,
      descripcion: receta.descripcion || '',
      ingredientes: receta.ingredientes || []
    });
    setShowRecetasModal(true);
  };

  const agregarIngredienteReceta = () => {
    if (!ingredienteActual.codigo_producto || !ingredienteActual.cantidad_necesaria) {
      setError('Complete los datos del ingrediente');
      return;
    }
    
    if (recetaForm.ingredientes.some(ing => ing.codigo_producto === ingredienteActual.codigo_producto)) {
      setError('Este ingrediente ya fue agregado');
      return;
    }
    
    setRecetaForm({
      ...recetaForm,
      ingredientes: [...recetaForm.ingredientes, {
        codigo_producto: ingredienteActual.codigo_producto,
        cantidad: parseFloat(ingredienteActual.cantidad_necesaria)
      }]
    });
    
    setIngredienteActual({ codigo_producto: '', cantidad_necesaria: '' });
    setError('');
  };

  const eliminarIngredienteReceta = (codigoProducto) => {
    setRecetaForm({
      ...recetaForm,
      ingredientes: recetaForm.ingredientes.filter(ing => ing.codigo_producto !== codigoProducto)
    });
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
              <>
                <button onClick={() => setShowRecetasModal(true)} className="btn" style={{ backgroundColor: '#8b5cf6', color: 'white' }}>
                  📖 Gestionar Recetas
                </button>
                <button onClick={() => setShowModal(true)} className="btn btn-danger">
                  + Registrar Producción
                </button>
              </>
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
                  <th>Mermas</th>
                </tr>
              </thead>
              <tbody>
                {produccion.map((prod) => (
                  <tr 
                    key={prod.id}
                    onClick={() => abrirModalMermas(prod)}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                  >
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
                    <td>
                      {prod.mermas && prod.mermas.length > 0 ? (
                        <span style={{ color: '#ef4444', fontWeight: '600' }}>
                          {prod.mermas.length} merma{prod.mermas.length !== 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>Sin mermas</span>
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

              {/* Selector de Recetas - SIEMPRE VISIBLE */}
              <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#ede9fe', borderRadius: '0.5rem', border: '2px solid #8b5cf6' }}>
                <label className="label" style={{ color: '#6b21a8', fontWeight: '600', marginBottom: '0.5rem' }}>
                  📖 Recetas Precargadas
                </label>
                {recetas.length > 0 ? (
                  <>
                    <select
                      onChange={(e) => {
                        const receta = recetas.find(r => r.id === e.target.value);
                        if (receta) seleccionarReceta(receta);
                      }}
                      className="input"
                      style={{ marginBottom: '0.5rem' }}
                    >
                      <option value="">Seleccionar una receta...</option>
                      {recetas.map(r => (
                        <option key={r.id} value={r.id}>{r.nombre}</option>
                      ))}
                    </select>
                    <p style={{ fontSize: '0.75rem', color: '#6b21a8', margin: 0 }}>
                      💡 Seleccione una receta para cargar automáticamente plato e ingredientes
                    </p>
                  </>
                ) : (
                  <p style={{ fontSize: '0.85rem', color: '#92400e', backgroundColor: '#fef3c7', padding: '0.75rem', borderRadius: '0.375rem', margin: 0 }}>
                    ⚠️ No hay recetas guardadas. Cree una desde "Gestionar Recetas" para usar esta función.
                  </p>
                )}
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
                  min="1"
                  value={formData.cantidad}
                  onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                  className="input"
                  placeholder="Número de porciones a preparar"
                  required
                />
                {formData.cantidad && formData.ingredientes.length > 0 && (
                  <p style={{ fontSize: '0.75rem', color: '#059669', marginTop: '0.25rem', marginBottom: 0 }}>
                    ✓ Las cantidades de ingredientes se calcularán automáticamente para {formData.cantidad} porciones
                  </p>
                )}
              </div>

              {/* Sección de Ingredientes */}
              <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem', border: '1px solid #d1d5db' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#111827' }}>
                  📋 Ingredientes (Cantidad por porción)
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.75rem' }}>
                  Ingrese la cantidad en gramos (g) o litros (L) necesaria por porción. El total se calculará automáticamente.
                </p>
                
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <select
                    value={ingredienteActual.codigo_producto}
                    onChange={(e) => setIngredienteActual({ ...ingredienteActual, codigo_producto: e.target.value })}
                    className="input"
                    style={{ fontSize: '0.9rem' }}
                  >
                    <option value="">Seleccionar ingrediente</option>
                    {productosUnicos.map(p => (
                      <option key={p.id || p.codigo_producto} value={p.codigo_producto}>{p.nombre}</option>
                    ))}
                  </select>
                  
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={ingredienteActual.cantidad_necesaria}
                    onChange={(e) => setIngredienteActual({ ...ingredienteActual, cantidad_necesaria: e.target.value })}
                    className="input"
                    placeholder="Cantidad (g/L)"
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
                    <div style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '0.5rem', color: '#374151' }}>
                      Ingredientes agregados ({formData.ingredientes.length}):
                    </div>
                    <div style={{ backgroundColor: 'white', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #e5e7eb' }}>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {formData.ingredientes.map((ing, idx) => {
                          const stockDisponible = getStockDisponible(ing.codigo_producto);
                          const unidadMedida = getUnidadMedida(ing.codigo_producto);
                          const cantidadPorciones = parseInt(formData.cantidad || 0);
                          const totalNecesario = ing.cantidad_necesaria * cantidadPorciones;
                          const suficienteStock = stockDisponible >= totalNecesario;
                          
                          return (
                          <li key={idx} style={{ 
                            padding: '0.75rem',
                            borderBottom: idx < formData.ingredientes.length - 1 ? '1px solid #f3f4f6' : 'none',
                            fontSize: '0.9rem'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '600', color: '#111827', marginBottom: '0.25rem' }}>
                                  {getProductoNombre(ing.codigo_producto)}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                                  <span>📏 {ing.cantidad_necesaria} {unidadMedida} por porción</span>
                                  {cantidadPorciones > 0 && (
                                    <>
                                      <span style={{ margin: '0 0.5rem', color: '#d1d5db' }}>•</span>
                                      <span style={{ fontWeight: '600', color: '#374151' }}>
                                        Total: {totalNecesario} {unidadMedida} ({cantidadPorciones} porciones)
                                      </span>
                                      <span style={{ margin: '0 0.5rem', color: '#d1d5db' }}>•</span>
                                      <span style={{ 
                                        fontWeight: '600',
                                        color: suficienteStock ? '#059669' : '#dc2626'
                                      }}>
                                        {suficienteStock ? '✓' : '⚠️'} Stock: {stockDisponible} {unidadMedida}
                                      </span>
                                    </>
                                  )}
                                </div>
                                {!suficienteStock && cantidadPorciones > 0 && (
                                  <div style={{ 
                                    marginTop: '0.25rem',
                                    fontSize: '0.75rem', 
                                    color: '#dc2626',
                                    backgroundColor: '#fee2e2',
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '0.25rem',
                                    display: 'inline-block'
                                  }}>
                                    ⚠️ Stock insuficiente. Faltan {totalNecesario - stockDisponible} {unidadMedida}
                                  </div>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => eliminarIngrediente(ing.codigo_producto)}
                                style={{ 
                                  background: 'transparent', 
                                  border: 'none', 
                                  cursor: 'pointer', 
                                  fontSize: '1.2rem',
                                  color: '#ef4444',
                                  marginLeft: '0.5rem',
                                  padding: '0.25rem'
                                }}
                                title="Eliminar ingrediente"
                              >
                                🗑️
                              </button>
                            </div>
                          </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                )}
                
                {formData.ingredientes.length === 0 && (
                  <div style={{ 
                    color: '#6b7280', 
                    fontSize: '0.85rem', 
                    textAlign: 'center',
                    padding: '1rem',
                    backgroundColor: '#fef3c7',
                    borderRadius: '0.375rem',
                    border: '1px dashed #fbbf24'
                  }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📝</div>
                    <div style={{ fontWeight: '500', color: '#92400e' }}>
                      No hay ingredientes agregados
                    </div>
                    <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      {recetas.length > 0 
                        ? 'Seleccione una receta arriba o agregue ingredientes manualmente'
                        : 'Agregue al menos un ingrediente para continuar'}
                    </div>
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

      {/* Modal Advertencia de Stock Mínimo */}
      {showStockWarning && (
        <div className="modal-overlay" onClick={() => setShowStockWarning(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.75rem', color: '#b45309' }}>⚠️ Advertencia: Stock por debajo del mínimo</h2>
            <p style={{ color: '#6b7280', marginBottom: '0.75rem' }}>
              Al registrar esta producción, algunos productos quedarán por debajo de su stock mínimo.
            </p>
            <div style={{ maxHeight: '260px', overflowY: 'auto', marginBottom: '1rem' }}>
              <table className="table" style={{ fontSize: '0.9rem' }}>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Mínimo</th>
                    <th>Actual</th>
                    <th>Consumo</th>
                    <th>Proyectado</th>
                  </tr>
                </thead>
                <tbody>
                  {stockWarnings.map((w) => (
                    <tr key={w.codigo_producto}>
                      <td style={{ fontWeight: 500 }}>{w.nombre}</td>
                      <td>{w.minimo}</td>
                      <td>{w.actual}</td>
                      <td>-{w.consumo}</td>
                      <td style={{ color: '#b91c1c', fontWeight: 600 }}>{w.proyectado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setShowStockWarning(false)} className="btn" style={{ backgroundColor: '#6b7280', color: 'white', flex: 1 }}>
                Cancelar
              </button>
              <button onClick={confirmarAdvertenciaYContinuar} className="btn btn-danger" style={{ flex: 1 }}>
                Continuar y Registrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Mermas */}
      {showMermasModal && produccionSeleccionada && (
        <div className="modal-overlay" onClick={() => setShowMermasModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#111827' }}>
              🗑️ Registrar Mermas - {produccionSeleccionada.plato}
            </h2>
            
            <div style={{ backgroundColor: '#f3f4f6', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#4b5563' }}>
                <strong>Fecha:</strong> {new Date(produccionSeleccionada.fecha).toLocaleDateString()} | 
                <strong> Turno:</strong> {produccionSeleccionada.turno} | 
                <strong> Porciones:</strong> {produccionSeleccionada.cantidad}
              </p>
            </div>

            {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

            {/* Formulario para agregar merma */}
            <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#fef3c7', borderRadius: '0.5rem', border: '1px solid #fbbf24' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.75rem', color: '#92400e' }}>
                ➕ Agregar Merma
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr auto', gap: '0.5rem', alignItems: 'end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', color: '#374151' }}>
                    Ingrediente
                  </label>
                  <select
                    value={mermaActual.codigo_producto}
                    onChange={(e) => setMermaActual({ ...mermaActual, codigo_producto: e.target.value })}
                    className="input"
                    style={{ fontSize: '0.9rem' }}
                  >
                    <option value="">Seleccionar</option>
                    {productosUnicos.map(p => (
                      <option key={p.id || p.codigo_producto} value={p.codigo_producto}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', color: '#374151' }}>
                    Cantidad
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={mermaActual.cantidad}
                    onChange={(e) => setMermaActual({ ...mermaActual, cantidad: e.target.value })}
                    className="input"
                    placeholder="0"
                    style={{ fontSize: '0.9rem' }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', color: '#374151' }}>
                    Motivo
                  </label>
                  <input
                    type="text"
                    value={mermaActual.motivo}
                    onChange={(e) => setMermaActual({ ...mermaActual, motivo: e.target.value })}
                    className="input"
                    placeholder="Ej: Deteriorado, Quemado, etc."
                    style={{ fontSize: '0.9rem' }}
                  />
                </div>
                
                <button
                  type="button"
                  onClick={agregarMerma}
                  className="btn"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', backgroundColor: '#f59e0b', color: 'white' }}
                >
                  + Agregar
                </button>
              </div>
            </div>

            {/* Lista de mermas registradas */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.75rem', color: '#111827' }}>
                📋 Mermas Registradas ({mermas.length})
              </h3>
              
              {mermas.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
                  <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>No hay mermas registradas</p>
                </div>
              ) : (
                <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
                  <table className="table" style={{ margin: 0 }}>
                    <thead>
                      <tr>
                        <th>Ingrediente</th>
                        <th>Cantidad</th>
                        <th>Motivo</th>
                        <th>Fecha</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {mermas.map((merma, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: '500' }}>{getProductoNombre(merma.codigo_producto)}</td>
                          <td>{merma.cantidad} unidades</td>
                          <td style={{ color: '#6b7280' }}>{merma.motivo}</td>
                          <td style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
                            {new Date(merma.fecha).toLocaleString()}
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => eliminarMerma(idx)}
                              style={{ 
                                background: 'transparent', 
                                border: 'none', 
                                cursor: 'pointer', 
                                fontSize: '1.2rem',
                                color: '#ef4444'
                              }}
                              title="Eliminar merma"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Botones de acción */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                type="button" 
                onClick={() => setShowMermasModal(false)} 
                className="btn" 
                style={{ flex: 1, backgroundColor: '#6b7280', color: 'white' }}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={guardarMermas} 
                className="btn btn-danger" 
                style={{ flex: 1 }}
              >
                💾 Guardar Mermas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Gestión de Recetas */}
      {showRecetasModal && (
        <div className="modal-overlay" onClick={() => {
          setShowRecetasModal(false);
          setEditingReceta(null);
          setRecetaForm({ nombre: '', descripcion: '', ingredientes: [] });
        }}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh', overflow: 'auto' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#111827' }}>
              📖 Gestión de Recetas
            </h2>

            {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

            {/* Formulario para Crear/Editar Receta */}
            <div style={{ marginBottom: '1.5rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>
                {editingReceta ? '✏️ Editar Receta' : '➕ Crear Nueva Receta'}
              </h3>
              
              <form onSubmit={handleCrearReceta}>
                <div style={{ marginBottom: '1rem' }}>
                  <label className="label">Nombre de la Receta</label>
                  <input
                    type="text"
                    value={recetaForm.nombre}
                    onChange={(e) => setRecetaForm({ ...recetaForm, nombre: e.target.value })}
                    className="input"
                    placeholder="Ej: Lasaña Bolognesa"
                    required
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label className="label">Descripción (opcional)</label>
                  <textarea
                    value={recetaForm.descripcion}
                    onChange={(e) => setRecetaForm({ ...recetaForm, descripcion: e.target.value })}
                    className="input"
                    placeholder="Descripción breve de la receta"
                    rows="2"
                  />
                </div>

                {/* Agregar Ingredientes */}
                <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#fef3c7', borderRadius: '0.5rem', border: '1px solid #fbbf24' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: '#92400e' }}>
                    Ingredientes
                  </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <select
                      value={ingredienteActual.codigo_producto}
                      onChange={(e) => setIngredienteActual({ ...ingredienteActual, codigo_producto: e.target.value })}
                      className="input"
                      style={{ fontSize: '0.9rem' }}
                    >
                      <option value="">Seleccionar ingrediente</option>
                      {productosUnicos.map(p => (
                        <option key={p.id || p.codigo_producto} value={p.codigo_producto}>{p.nombre}</option>
                      ))}
                    </select>
                    
                    <input
                      type="number"
                      step="0.01"
                      value={ingredienteActual.cantidad_necesaria}
                      onChange={(e) => setIngredienteActual({ ...ingredienteActual, cantidad_necesaria: e.target.value })}
                      className="input"
                      placeholder="Cantidad (g/L)"
                      style={{ fontSize: '0.9rem' }}
                    />
                    
                    <button
                      type="button"
                      onClick={agregarIngredienteReceta}
                      className="btn"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', backgroundColor: '#f59e0b', color: 'white' }}
                    >
                      + Agregar
                    </button>
                  </div>

                  {recetaForm.ingredientes.length > 0 ? (
                    <div style={{ backgroundColor: 'white', borderRadius: '0.25rem', padding: '0.5rem' }}>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {recetaForm.ingredientes.map((ing, idx) => (
                          <li key={idx} style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            padding: '0.25rem',
                            fontSize: '0.9rem'
                          }}>
                            <span>
                              <strong>{getProductoNombre(ing.codigo_producto)}</strong>: {ing.cantidad} {getUnidadMedida(ing.codigo_producto)} por porción
                            </span>
                            <button
                              type="button"
                              onClick={() => eliminarIngredienteReceta(ing.codigo_producto)}
                              style={{ 
                                background: 'transparent', 
                                border: 'none', 
                                cursor: 'pointer', 
                                fontSize: '1.1rem',
                                color: '#ef4444'
                              }}
                            >
                              🗑️
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div style={{ color: '#92400e', fontSize: '0.85rem', fontStyle: 'italic' }}>
                      No hay ingredientes agregados
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingReceta(null);
                      setRecetaForm({ nombre: '', descripcion: '', ingredientes: [] });
                    }}
                    className="btn"
                    style={{ flex: 1, backgroundColor: '#6b7280', color: 'white' }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn"
                    style={{ flex: 1, backgroundColor: '#8b5cf6', color: 'white' }}
                  >
                    {editingReceta ? '💾 Actualizar Receta' : '💾 Guardar Receta'}
                  </button>
                </div>
              </form>
            </div>

            {/* Lista de Recetas Existentes */}
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>
                📚 Recetas Guardadas ({recetas.length})
              </h3>
              
              {recetas.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
                  <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>No hay recetas guardadas. Cree una nueva arriba.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {recetas.map(receta => (
                    <div key={receta.id} style={{ 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '0.5rem', 
                      padding: '1rem',
                      backgroundColor: 'white'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.25rem', color: '#111827' }}>
                            {receta.nombre}
                          </h4>
                          {receta.descripcion && (
                            <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: 0 }}>
                              {receta.descripcion}
                            </p>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleEditarReceta(receta)}
                            className="btn"
                            style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem', backgroundColor: '#3b82f6', color: 'white' }}
                          >
                            ✏️ Editar
                          </button>
                          <button
                            onClick={() => handleEliminarReceta(receta.id)}
                            className="btn"
                            style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem', backgroundColor: '#ef4444', color: 'white' }}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      
                      <div style={{ backgroundColor: '#f9fafb', padding: '0.75rem', borderRadius: '0.375rem' }}>
                        <p style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                          Ingredientes ({receta.ingredientes?.length || 0}):
                        </p>
                        <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: '#4b5563' }}>
                          {receta.ingredientes?.map((ing, idx) => (
                            <li key={idx}>
                              {getProductoNombre(ing.codigo_producto)}: {ing.cantidad} {getUnidadMedida(ing.codigo_producto)} por porción
                            </li>
                          )) || <li style={{ color: '#9ca3af' }}>Sin ingredientes</li>}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Botón Cerrar */}
            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <button
                onClick={() => {
                  setShowRecetasModal(false);
                  setEditingReceta(null);
                  setRecetaForm({ nombre: '', descripcion: '', ingredientes: [] });
                }}
                className="btn"
                style={{ backgroundColor: '#6b7280', color: 'white', minWidth: '200px' }}
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

export default Produccion;
