import React, { useState, useEffect } from 'react';
import { productosFirebase, proveedoresFirebase } from '../services/firestoreService';
import { useNavigate } from 'react-router-dom';
import usePermissions from '../hooks/usePermissions';
import ImportExportButtons from '../components/ImportExportButtons';
import { validarProductos } from '../services/importService';
import { exportarProductosPDF } from '../services/exportService';

const Productos = () => {
  const navigate = useNavigate();
  const { can, getRoleName } = usePermissions();
  const [productos, setProductos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    codigo_producto: '',
    categoria: '',
    unidad_medida: '',
    precio_unitario: '',
    id_proveedor: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [prodData, provData] = await Promise.all([
        productosFirebase.listar(),
        proveedoresFirebase.listar()
      ]);
      setProductos(prodData);
      setProveedores(provData);
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
      const newProduct = {
        ...formData,
        precio_unitario: parseFloat(formData.precio_unitario)
      };
      await productosFirebase.crear(newProduct);
      setShowModal(false);
      setFormData({ nombre: '', codigo_producto: '', categoria: '', unidad_medida: '', precio_unitario: '', id_proveedor: '' });
      loadData();
    } catch (error) {
      setError('Error al crear producto');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro de eliminar este producto?')) return;
    try {
      await productosFirebase.eliminar(id);
      loadData();
    } catch (error) {
      setError('Error al eliminar');
    }
  };

  const handleImport = async (datos) => {
    try {
      for (const producto of datos) {
        await productosFirebase.crear(producto);
      }
      loadData();
    } catch (error) {
      throw new Error('Error al importar productos: ' + error.message);
    }
  };

  const handleExport = async () => {
    exportarProductosPDF(productos);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '1.5rem' }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>🥘 Productos</h1>
            <p style={{ color: '#6b7280' }}>Catálogo de productos • {getRoleName()}</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={() => navigate('/dashboard')} className="btn" style={{ backgroundColor: '#6b7280', color: 'white' }}>
              ← Volver
            </button>
            {can('productos', 'create') && (
              <button onClick={() => setShowModal(true)} className="btn btn-success">
                + Nuevo Producto
              </button>
            )}
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <ImportExportButtons
          tipo="productos"
          onImport={handleImport}
          onExport={handleExport}
          validarDatos={validarProductos}
          permisoImportar={can('productos', 'create')}
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
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Unidad</th>
                  <th>Precio</th>
                  {can('productos', 'delete') && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {productos.map((prod) => (
                  <tr key={prod.id}>
                    <td><code>{prod.codigo_producto}</code></td>
                    <td style={{ fontWeight: '500' }}>{prod.nombre}</td>
                    <td>{prod.categoria}</td>
                    <td>{prod.unidad_medida}</td>
                    <td>${prod.precio_unitario?.toLocaleString()}</td>
                    {can('productos', 'delete') && (
                      <td>
                        <button onClick={() => handleDelete(prod.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>
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

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Nuevo Producto</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Nombre</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Código</label>
                <input
                  type="text"
                  value={formData.codigo_producto}
                  onChange={(e) => setFormData({ ...formData, codigo_producto: e.target.value })}
                  className="input"
                  placeholder="Ej: ARR001"
                  required
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Categoría</label>
                <select
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  className="input"
                  required
                >
                  <option value="">Seleccionar</option>
                  <option value="Granos">Granos</option>
                  <option value="Carnes">Carnes</option>
                  <option value="Verduras">Verduras</option>
                  <option value="Lacteos">Lácteos</option>
                  <option value="Panaderia">Panadería</option>
                  <option value="Aceites">Aceites</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Unidad de Medida</label>
                <select
                  value={formData.unidad_medida}
                  onChange={(e) => setFormData({ ...formData, unidad_medida: e.target.value })}
                  className="input"
                  required
                >
                  <option value="">Seleccionar</option>
                  <option value="kg">Kilogramos (kg)</option>
                  <option value="litros">Litros</option>
                  <option value="unidades">Unidades</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Precio Unitario ($)</label>
                <input
                  type="number"
                  value={formData.precio_unitario}
                  onChange={(e) => setFormData({ ...formData, precio_unitario: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="label">Proveedor</label>
                <select
                  value={formData.id_proveedor}
                  onChange={(e) => setFormData({ ...formData, id_proveedor: e.target.value })}
                  className="input"
                  required
                >
                  <option value="">Seleccionar proveedor</option>
                  {proveedores.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn" style={{ flex: 1, backgroundColor: '#6b7280', color: 'white' }}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-success" style={{ flex: 1 }}>
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

export default Productos;
