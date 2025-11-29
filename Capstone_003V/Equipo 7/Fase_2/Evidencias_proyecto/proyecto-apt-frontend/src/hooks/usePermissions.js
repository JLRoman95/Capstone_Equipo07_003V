// Hook para verificar permisos del usuario
import { useAuth } from '../context/AuthContext';

/**
 * Definición de permisos por rol (igual al backend)
 */
const PERMISSIONS = {
  admin: {
    usuarios: ['create', 'read', 'update', 'delete'],
    proveedores: ['create', 'read', 'update', 'delete'],
    productos: ['create', 'read', 'update', 'delete'],
    inventario: ['create', 'read', 'update', 'delete'],
    checklists: ['create', 'read', 'update', 'delete'],
    produccion: ['create', 'read', 'update', 'delete'],
    alertas: ['create', 'read', 'update', 'delete'],
    reportes: ['read', 'export']
  },
  cocinero: {
    usuarios: [],
    proveedores: ['read', 'create'],
    productos: ['read', 'create'],
    inventario: ['create', 'read', 'update'],
    checklists: ['create', 'read', 'update'],
    produccion: ['create', 'read', 'update'],
    alertas: ['read', 'update'],
    reportes: ['read']
  },
  auditor: {
    usuarios: [],
    proveedores: ['read'],
    productos: ['read'],
    inventario: ['read'],
    checklists: ['read', 'update'],
    produccion: ['read'],
    alertas: ['create', 'read', 'update', 'delete'],
    reportes: ['read', 'export']
  }
};

/**
 * Hook personalizado para verificar permisos
 */
export const usePermissions = () => {
  const { user } = useAuth();
  const userRole = user?.rol || 'cocinero';

  // Debug: Mostrar rol actual
  console.log('🔐 usePermissions - Usuario:', user?.nombre, 'Rol:', userRole);

  /**
   * Verifica si el usuario tiene un permiso específico
   * @param {string} resource - Recurso (ej: 'productos', 'inventario')
   * @param {string} action - Acción (create, read, update, delete)
   * @returns {boolean}
   */
  const can = (resource, action) => {
    if (!PERMISSIONS[userRole]) return false;
    if (!PERMISSIONS[userRole][resource]) return false;
    const result = PERMISSIONS[userRole][resource].includes(action);
    console.log(`🔐 can('${resource}', '${action}') = ${result} (rol: ${userRole})`);
    return result;
  };

  /**
   * Verifica si el usuario NO tiene un permiso
   */
  const cannot = (resource, action) => {
    return !can(resource, action);
  };

  /**
   * Verifica si el usuario es de un rol específico
   */
  const isRole = (role) => {
    return userRole === role;
  };

  /**
   * Obtiene el rol del usuario actual
   */
  const getRole = () => {
    return userRole;
  };

  /**
   * Obtiene el nombre legible del rol
   */
  const getRoleName = () => {
    const roleNames = {
      admin: 'Administrador',
      cocinero: 'Cocinero',
      auditor: 'Auditor'
    };
    return roleNames[userRole] || userRole;
  };

  return {
    can,
    cannot,
    isRole,
    getRole,
    getRoleName,
    userRole
  };
};

export default usePermissions;
