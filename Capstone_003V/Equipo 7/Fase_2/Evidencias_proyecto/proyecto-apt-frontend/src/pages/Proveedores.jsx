import React, { useState, useEffect, useMemo } from 'react';
import { proveedoresFirebase } from '../services/firestoreService';
import { useNavigate } from 'react-router-dom';
import usePermissions from '../hooks/usePermissions';
import ImportExportButtons from '../components/ImportExportButtons';
import { validarProveedores } from '../services/importService';
import { exportarProveedoresPDF } from '../services/exportService';

const Proveedores = () => {
  const navigate = useNavigate();
  const { can, getRoleName } = usePermissions();
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [dedupeMessage, setDedupeMessage] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    contacto: '',
    telefono: '',
    email: '',
    direccion: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await proveedoresFirebase.listar();
      const cleaned = await removeDuplicates(data);
      setProveedores(cleaned);
    } catch (error) {
      setError('Error al cargar proveedores');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const normalizeText = (value) => value?.toString().trim().toLowerCase() || '';
  const normalizePhone = (value) => value?.toString().replace(/[^0-9+]/g, '') || '';

  const buildDuplicateKey = (prov) => {
    const emailKey = normalizeText(prov.email);
    if (emailKey) return `email:${emailKey}`;
    const phoneKey = normalizePhone(prov.telefono);
    if (phoneKey) return `phone:${phoneKey}`;
    const nombreKey = normalizeText(prov.nombre);
    const contactoKey = normalizeText(prov.contacto);
    if (nombreKey || contactoKey) return `nombre:${nombreKey}|contacto:${contactoKey}`;
    return prov.id || `tmp:${Math.random().toString(36).substring(2)}`;
  };

  const removeDuplicates = async (lista) => {
    const map = new Map();
    const duplicates = [];

    lista.forEach((prov) => {
      const key = buildDuplicateKey(prov);
      if (map.has(key)) {
        duplicates.push(prov);
      } else {
        map.set(key, prov);
      }
    });

    if (duplicates.length) {
      await Promise.all(
        duplicates
          .filter((dup) => dup?.id)
          .map((dup) => proveedoresFirebase.eliminar(dup.id))
      );
      setDedupeMessage(`${duplicates.length} proveedores duplicados fueron eliminados automáticamente.`);
    } else {
      setDedupeMessage('');
    }

    return Array.from(map.values());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await proveedoresFirebase.crear(formData);
      setShowModal(false);
      setFormData({ nombre: '', contacto: '', telefono: '', email: '', direccion: '' });
      loadData();
    } catch (error) {
      setError('Error al crear proveedor');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro de eliminar este proveedor?')) return;
    try {
      await proveedoresFirebase.eliminar(id);
      loadData();
    } catch (error) {
      setError('Error al eliminar');
    }
  };

  const handleImport = async (datos) => {
    try {
      for (const proveedor of datos) {
        await proveedoresFirebase.crear(proveedor);
      }
      loadData();
    } catch (error) {
      throw new Error('Error al importar proveedores: ' + error.message);
    }
  };

  const handleExport = async () => {
    exportarProveedoresPDF(proveedores);
  };

  const proveedoresConId = useMemo(() =>
    proveedores.map((prov, index) => ({
      ...prov,
      displayId: `PRV-${String(index + 1).padStart(3, '0')}`
    })),
    [proveedores]
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '1.5rem' }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>🚚 Proveedores</h1>
            <p style={{ color: '#6b7280' }}>Gestión de proveedores • {getRoleName()}</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={() => navigate('/dashboard')} className="btn" style={{ backgroundColor: '#6b7280', color: 'white' }}>
              ← Volver
            </button>
            {can('proveedores', 'create') && (
              <button onClick={() => setShowModal(true)} className="btn" style={{ backgroundColor: '#8b5cf6', color: 'white' }}>
                + Nuevo Proveedor
              </button>
            )}
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {!error && dedupeMessage && (
          <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
            {dedupeMessage}
          </div>
        )}

        <ImportExportButtons
          tipo="proveedores"
          onImport={handleImport}
          onExport={handleExport}
          validarDatos={validarProveedores}
          permisoImportar={can('proveedores', 'create')}
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
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Contacto</th>
                  <th>Teléfono</th>
                  <th>Email</th>
                  <th>Dirección</th>
                  {can('proveedores', 'delete') && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {proveedoresConId.map((prov) => (
                  <tr key={prov.id || prov.displayId}>
                    <td>
                      <code>{prov.displayId}</code>
                    </td>
                    <td style={{ fontWeight: '500' }}>{prov.nombre}</td>
                    <td>{prov.contacto}</td>
                    <td>{prov.telefono}</td>
                    <td>{prov.email}</td>
                    <td>{prov.direccion}</td>
                    {can('proveedores', 'delete') && (
                      <td>
                        <button onClick={() => handleDelete(prov.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>
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
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Nuevo Proveedor</h2>
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
                <label className="label">Contacto</label>
                <input
                  type="text"
                  value={formData.contacto}
                  onChange={(e) => setFormData({ ...formData, contacto: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Teléfono</label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="label">Dirección</label>
                <input
                  type="text"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn" style={{ flex: 1, backgroundColor: '#6b7280', color: 'white' }}>
                  Cancelar
                </button>
                <button type="submit" className="btn" style={{ flex: 1, backgroundColor: '#8b5cf6', color: 'white' }}>
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

export default Proveedores;
