import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000/api';

// Crear instancia de axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Servicios de autenticación
export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  register: async (nombre, email, password, rol = 'cocinero') => {
    const response = await api.post('/auth/register', { nombre, email, password, rol });
    return response.data;
  },

  getUsuario: async () => {
    const response = await api.get('/auth/usuario');
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  isAuthenticated: () => !!localStorage.getItem('token'),

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};

// Servicios de inventario
export const inventarioService = {
  listar: async () => {
    const response = await api.get('/inventario');
    return response.data;
  },

  crear: async (data) => {
    const response = await api.post('/inventario', data);
    return response.data;
  },

  actualizar: async (id, data) => {
    const response = await api.put(`/inventario/${id}`, data);
    return response.data;
  },

  eliminar: async (id) => {
    const response = await api.delete(`/inventario/${id}`);
    return response.data;
  },

  obtenerFIFO: async (idProducto) => {
    const response = await api.get(`/inventario/fifo/${idProducto}`);
    return response.data;
  },

  obtenerProximoLote: async (idProducto) => {
    const response = await api.get(`/inventario/proximo/${idProducto}`);
    return response.data;
  }
};

// Servicios de productos
export const productoService = {
  listar: async () => {
    const response = await api.get('/productos');
    return response.data;
  },

  crear: async (data) => {
    const response = await api.post('/productos', data);
    return response.data;
  },

  actualizar: async (id, data) => {
    const response = await api.put(`/productos/${id}`, data);
    return response.data;
  },

  eliminar: async (id) => {
    const response = await api.delete(`/productos/${id}`);
    return response.data;
  },

  obtenerPorId: async (id) => {
    const response = await api.get(`/productos/${id}`);
    return response.data;
  }
};

// Servicios de proveedores
export const proveedorService = {
  listar: async () => {
    const response = await api.get('/proveedores');
    return response.data;
  },

  crear: async (data) => {
    const response = await api.post('/proveedores', data);
    return response.data;
  },

  actualizar: async (id, data) => {
    const response = await api.put(`/proveedores/${id}`, data);
    return response.data;
  },

  eliminar: async (id) => {
    const response = await api.delete(`/proveedores/${id}`);
    return response.data;
  }
};

// Servicios de checklists
export const checklistService = {
  listar: async () => {
    const response = await api.get('/checklists');
    return response.data;
  },

  crear: async (data) => {
    const response = await api.post('/checklists', data);
    return response.data;
  },

  actualizar: async (id, data) => {
    const response = await api.put(`/checklists/${id}`, data);
    return response.data;
  },

  listarItems: async (idChecklist) => {
    const response = await api.get(`/checklists/${idChecklist}/items`);
    return response.data;
  }
};

// Servicios de producción
export const produccionService = {
  listar: async () => {
    const response = await api.get('/produccion');
    return response.data;
  },

  registrar: async (data) => {
    const response = await api.post('/produccion', data);
    return response.data;
  }
};

// Servicios de alertas
export const alertaService = {
  generar: async () => {
    const response = await api.post('/alertas-automaticas/generar');
    return response.data;
  },

  contar: async () => {
    const response = await api.get('/alertas-automaticas/contar');
    return response.data;
  }
};

// Servicios de reportes
export const reporteService = {
  inventario: async () => {
    const response = await api.get('/reportes/inventario', {
      responseType: 'blob'
    });
    return response.data;
  },

  produccion: async (fechaInicio, fechaFin) => {
    const response = await api.get('/reportes/produccion', {
      params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin },
      responseType: 'blob'
    });
    return response.data;
  }
};

export default api;
