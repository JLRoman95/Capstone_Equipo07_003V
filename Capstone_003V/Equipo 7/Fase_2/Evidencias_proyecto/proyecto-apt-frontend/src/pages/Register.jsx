import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
    rol: 'cocinero'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      await register(formData.nombre, formData.email, formData.password, formData.rol);
      setSuccess('Usuario registrado exitosamente');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error('Error completo:', err);
      setError(err.message || 'Error al registrar usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="card" style={{ maxWidth: '28rem', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>Crear Cuenta</h1>
          <p style={{ color: '#6b7280' }}>Sistema APT</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label className="label" htmlFor="nombre">Nombre Completo</label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              value={formData.nombre}
              onChange={handleChange}
              className="input"
              placeholder="Juan Pérez"
              required
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label className="label" htmlFor="email">Correo Electrónico</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="input"
              placeholder="usuario@ejemplo.com"
              required
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label className="label" htmlFor="rol">Rol</label>
            <select
              id="rol"
              name="rol"
              value={formData.rol}
              onChange={handleChange}
              className="input"
              required
            >
              <option value="cocinero">Cocinero</option>
              <option value="auditor">Auditor</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label className="label" htmlFor="password">Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className="input"
              placeholder="••••••••"
              required
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label className="label" htmlFor="confirmPassword">Confirmar Contraseña</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="input"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-success"
            style={{ width: '100%', padding: '0.75rem' }}
          >
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <button
            onClick={() => navigate('/login')}
            style={{ background: 'transparent', border: 'none', color: '#10b981', cursor: 'pointer', textDecoration: 'underline' }}
          >
            ¿Ya tienes cuenta? Inicia sesión aquí
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;
