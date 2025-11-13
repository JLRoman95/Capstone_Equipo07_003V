import express from 'express';
import { body } from 'express-validator';
import {
  crearProveedor,
  listarProveedores,
  actualizarProveedor,
  eliminarProveedor
} from '../controllers/proveedorController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/permissionsMiddleware.js';

const router = express.Router();

// Todos los endpoints requieren autenticación
router.use(verifyToken);

// Listar todos los proveedores - todos los roles que tengan permiso de lectura
router.get('/', requirePermission('proveedores', 'read'), listarProveedores);

// Crear un nuevo proveedor - admin y cocinero
router.post(
  '/',
  requirePermission('proveedores', 'create'),
  body('nombre').notEmpty().withMessage('Nombre es obligatorio'),
  crearProveedor
);

// Actualizar un proveedor por ID - solo admin
router.put(
  '/:id',
  requirePermission('proveedores', 'update'),
  body('nombre').notEmpty().withMessage('Nombre es obligatorio'),
  actualizarProveedor
);

// Eliminar un proveedor por ID - solo admin
router.delete('/:id', requirePermission('proveedores', 'delete'), eliminarProveedor);

export default router;
