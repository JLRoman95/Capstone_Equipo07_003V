// middleware/permissionsMiddleware.js
import dotenv from 'dotenv';
dotenv.config();

/**
 * Definición de permisos por rol y recurso
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
    usuarios: [], // Sin permisos
    proveedores: ['read', 'create'], // Puede ver y agregar nuevos proveedores
    productos: ['read', 'create'], // Puede ver y agregar productos que llegan
    inventario: ['create', 'read', 'update'], // Sin delete (muy riesgoso)
    checklists: ['create', 'read', 'update', 'delete'], // Su responsabilidad principal
    produccion: ['create', 'read', 'update', 'delete'], // Registra producciones
    alertas: ['read', 'update'], // Puede resolver las de su área
    reportes: ['read'] // Solo consulta
  },
  auditor: {
    usuarios: [], // Sin permisos
    proveedores: ['read'], // Solo consulta, no puede crear
    productos: ['read'], // Solo consulta, no puede crear ni editar
    inventario: ['read'], // Solo consulta, no puede crear lotes
    checklists: ['read', 'update'], // Puede aprobar/rechazar
    produccion: ['read'], // Solo supervisión, no puede crear registros
    alertas: ['create', 'read', 'update', 'delete'], // Gestión completa de no conformidades
    reportes: ['read', 'export'] // Generar informes
  }
};

/**
 * Middleware para verificar permisos granulares
 * @param {string} resource - Recurso (ej: 'productos', 'inventario')
 * @param {string} action - Acción (create, read, update, delete)
 */
export const requirePermission = (resource, action) => {
  return (req, res, next) => {
    try {
      // Verificar que el usuario esté autenticado
      if (!req.user) {
        return res.status(401).json({ 
          error: 'Usuario no autenticado',
          code: 'NO_AUTH' 
        });
      }

      const { rol } = req.user;
      
      // Verificar que el rol existe
      if (!PERMISSIONS[rol]) {
        return res.status(403).json({ 
          error: 'Rol no válido',
          code: 'INVALID_ROLE',
          user_role: rol 
        });
      }

      // Verificar que el recurso existe para el rol
      if (!PERMISSIONS[rol][resource]) {
        const resourceMessages = {
          productos: 'productos',
          proveedores: 'proveedores',
          inventario: 'inventario',
          checklists: 'checklists',
          produccion: 'registros de producción',
          alertas: 'alertas',
          reportes: 'reportes'
        };

        const resourceMsg = resourceMessages[resource] || resource;

        return res.status(403).json({ 
          error: `No tienes permisos para acceder a ${resourceMsg}`,
          code: 'RESOURCE_DENIED',
          user_role: rol
        });
      }

      // Verificar que el rol tiene el permiso específico
      if (!PERMISSIONS[rol][resource].includes(action)) {
        const actionMessages = {
          create: 'crear',
          read: 'consultar',
          update: 'modificar',
          delete: 'eliminar'
        };

        const resourceMessages = {
          productos: 'productos',
          proveedores: 'proveedores',
          inventario: 'inventario',
          checklists: 'checklists',
          produccion: 'registros de producción',
          alertas: 'alertas',
          reportes: 'reportes'
        };

        const actionMsg = actionMessages[action] || action;
        const resourceMsg = resourceMessages[resource] || resource;

        return res.status(403).json({ 
          error: `No tienes permisos para ${actionMsg} ${resourceMsg}`,
          code: 'ACTION_DENIED',
          user_role: rol
        });
      }

      // Log de auditoría de permisos
      console.log(`✅ Permiso concedido: ${rol} puede ${action} en ${resource}`);
      
      next();
    } catch (err) {
      console.error('Error en verificación de permisos:', err);
      return res.status(500).json({ 
        error: 'Error interno en verificación de permisos',
        code: 'PERMISSION_ERROR' 
      });
    }
  };
};

/**
 * Middleware legacy para compatibilidad hacia atrás
 * Mapea roles antiguos al nuevo sistema
 */
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    if (allowedRoles.includes(req.user.rol)) {
      next();
    } else {
      return res.status(403).json({ 
        error: 'No tienes permisos para acceder a este recurso',
        required_roles: allowedRoles,
        user_role: req.user.rol
      });
    }
  };
};

/**
 * Función para verificar permisos programáticamente
 * @param {string} rol - Rol del usuario
 * @param {string} resource - Recurso
 * @param {string} action - Acción
 * @returns {boolean}
 */
export const hasPermission = (rol, resource, action) => {
  return PERMISSIONS[rol]?.[resource]?.includes(action) || false;
};

/**
 * Obtener todos los permisos de un rol
 * @param {string} rol - Rol del usuario
 * @returns {object} Permisos del rol
 */
export const getRolePermissions = (rol) => {
  return PERMISSIONS[rol] || {};
};

/**
 * Middleware para endpoints que requieren múltiples permisos
 * @param {Array} permissions - Array de objetos {resource, action}
 */
export const requireMultiplePermissions = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const { rol } = req.user;
    const deniedPermissions = [];

    for (const permission of permissions) {
      if (!hasPermission(rol, permission.resource, permission.action)) {
        deniedPermissions.push(permission);
      }
    }

    if (deniedPermissions.length > 0) {
      return res.status(403).json({
        error: 'Permisos insuficientes',
        denied_permissions: deniedPermissions,
        user_role: rol
      });
    }

    next();
  };
};