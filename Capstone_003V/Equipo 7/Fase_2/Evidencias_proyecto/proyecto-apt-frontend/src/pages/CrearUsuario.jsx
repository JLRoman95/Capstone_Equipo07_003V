import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../config/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import usePermissions from '../hooks/usePermissions';

const CrearUsuario = () => {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
    rol: 'cocinero'
  });

  // Verificar permisos - solo admin puede crear usuarios
  React.useEffect(() => {
    if (!can('proveedores', 'create')) { // Usamos proveedores como proxy para admin
      setError('No tienes permisos para crear usuarios');
      setTimeout(() => navigate('/dashboard'), 2000);
    }
  }, [can, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validaciones
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (!formData.nombre.trim()) {
      setError('El nombre es requerido');
      return;
    }

    if (!['admin', 'cocinero', 'auditor'].includes(formData.rol)) {
      setError('Rol inválido');
      return;
    }

    try {
      setLoading(true);

      // Crear usuario en Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const user = userCredential.user;

      // Guardar datos adicionales en Firestore (colección usuarios)
      await setDoc(doc(db, 'usuarios', user.uid), {
        nombre: formData.nombre,
        email: formData.email,
        rol: formData.rol,
        creado_en: new Date().toISOString(),
        activo: true
      });

      setSuccess(`Usuario ${formData.nombre} creado exitosamente con rol: ${formData.rol}`);
      
      // Limpiar formulario
      setFormData({
        nombre: '',
        email: '',
        password: '',
        confirmPassword: '',
        rol: 'cocinero'
      });

      // Redirigir después de 2 segundos
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (error) {
      console.error('Error al crear usuario:', error);
      
      // Mensajes de error específicos
      switch (error.code) {
        case 'auth/email-already-in-use':
          setError('Este email ya está registrado');
          break;
        case 'auth/invalid-email':
          setError('Email inválido');
          break;
        case 'auth/weak-password':
          setError('La contraseña es muy débil');
          break;
        default:
          setError('Error al crear usuario: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '1.5rem' }}>
      <div className="container" style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>👤 Crear Usuario</h1>
            <p style={{ color: '#6b7280' }}>Registro de nuevos usuarios del sistema</p>
          </div>
          <button onClick={() => navigate('/dashboard')} className="btn" style={{ backgroundColor: '#6b7280', color: 'white' }}>
            ← Volver
          </button>
        </div>

        {/* Alertas */}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            ❌ {error}
          </div>
        )}
        
        {success && (
          <div className="alert" style={{ backgroundColor: '#d1fae5', color: '#065f46', marginBottom: '1rem' }}>
            ✅ {success}
          </div>
        )}

        {/* Formulario */}
        <div className="card">
          <form onSubmit={handleSubmit}>
            {/* Nombre */}
            <div style={{ marginBottom: '1rem' }}>
              <label className="label">Nombre Completo *</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className="input"
                placeholder="Ej: Juan Pérez González"
                required
                disabled={loading}
              />
            </div>

            {/* Email */}
            <div style={{ marginBottom: '1rem' }}>
              <label className="label">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input"
                placeholder="usuario@ejemplo.com"
                required
                disabled={loading}
              />
            </div>

            {/* Contraseña */}
            <div style={{ marginBottom: '1rem' }}>
              <label className="label">Contraseña *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input"
                placeholder="Mínimo 6 caracteres"
                required
                disabled={loading}
                minLength={6}
              />
            </div>

            {/* Confirmar Contraseña */}
            <div style={{ marginBottom: '1rem' }}>
              <label className="label">Confirmar Contraseña *</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="input"
                placeholder="Repite la contraseña"
                required
                disabled={loading}
                minLength={6}
              />
            </div>

            {/* Rol */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="label">Rol *</label>
              <select
                name="rol"
                value={formData.rol}
                onChange={handleChange}
                className="input"
                required
                disabled={loading}
              >
                <option value="cocinero">👨‍🍳 Cocinero</option>
                <option value="auditor">📋 Auditor</option>
                <option value="admin">⚙️ Administrador</option>
              </select>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                {formData.rol === 'admin' && '• Acceso completo: crea checklists y administra módulos críticos'}
                {formData.rol === 'cocinero' && '• Registra producción/inventario y solo consulta checklists completados'}
                {formData.rol === 'auditor' && '• Supervisa calidad: edita checklists y levanta hallazgos'}
              </p>
            </div>

            {/* Botones */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="btn"
                style={{ flex: 1, backgroundColor: '#6b7280', color: 'white' }}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 1 }}
                disabled={loading}
              >
                {loading ? 'Creando...' : 'Crear Usuario'}
              </button>
            </div>
          </form>
        </div>

        {/* Información adicional */}
        <div className="card" style={{ marginTop: '1.5rem', backgroundColor: '#eff6ff' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1e40af' }}>
            ℹ️ Información sobre Roles
          </h3>
          <ul style={{ color: '#1e3a8a', fontSize: '0.875rem', marginLeft: '1.5rem' }}>
            <li><strong>Admin:</strong> Control total del sistema; crea checklists y puede eliminarlos</li>
            <li><strong>Cocinero:</strong> Registra producción/inventario y únicamente visualiza checklists completados</li>
            <li><strong>Auditor:</strong> Revisa y edita checklists, gestiona alertas y seguimiento de calidad</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CrearUsuario;
