import React, { useState } from 'react';

/**
 * Props:
 * - onRegister({email,password,role}) => Promise resolving { token, role, user }
 * - onSuccess(result)
 */
export default function Register({ onRegister, onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ok, setOk] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setOk(null);

    if (!email || !password) {
      setError('Email y contraseña requeridos.');
      return;
    }
    if (password !== password2) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (!onRegister) {
      setError('Función de registro no disponible.');
      return;
    }

    setLoading(true);
    try {
      const result = await onRegister({ email, password, role });
      setLoading(false);
      setOk('Registro exitoso.');
      if (onSuccess) onSuccess(result);
    } catch (err) {
      setLoading(false);
      setError(err?.message || 'Error al registrar.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4 font-inter">
      <div className="w-full max-w-sm bg-white p-8 rounded-xl shadow-2xl transition-all duration-300">
        <div className="text-center mb-6">
          <h2 className="mt-2 text-2xl font-extrabold text-gray-900">Crear cuenta</h2>
          <p className="mt-1 text-sm text-gray-600">Registra un nuevo usuario</p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">{error}</div>}
        {ok && <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-800 rounded-lg text-sm">{ok}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg"
              placeholder="correo@ejemplo.com"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg"
              placeholder="********"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Repite contraseña</label>
            <input
              type="password"
              required
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg"
              placeholder="********"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol (opcional)</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg">
              <option value="user">Usuario</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <button type="submit" disabled={loading} className="w-full py-3 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60">
            {loading ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
        </form>
      </div>
    </div>
  );
}