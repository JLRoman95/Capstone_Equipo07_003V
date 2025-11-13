import express from 'express';
import { body } from 'express-validator';
import {
  crearProducto,
  listarProductos,
  actualizarProducto,
  eliminarProducto
} from '../controllers/productoController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/permissionsMiddleware.js';

const router = express.Router();

// Todos los endpoints requieren autenticación
router.use(verifyToken);

// Listar todos los productos - todos los roles que tengan permiso de lectura
router.get('/', requirePermission('productos', 'read'), listarProductos);

// Crear un nuevo producto - admin y cocinero
router.post(
  '/',
  requirePermission('productos', 'create'),
  [
    body('nombre').notEmpty().withMessage('Nombre es obligatorio'),
    body('codigo').notEmpty().withMessage('Código es obligatorio'),
    body('categoria').notEmpty().withMessage('Categoría es obligatoria'),
    body('unidad_medida').notEmpty().withMessage('Unidad de medida es obligatoria'),
    body('id_proveedor').isInt().withMessage('ID de proveedor debe ser un número entero')
  ],
  crearProducto
);

// Actualizar un producto por ID - admin y auditor
router.put(
  '/:id',
  requirePermission('productos', 'update'),
  [
    body('nombre').notEmpty().withMessage('Nombre es obligatorio'),
    body('codigo').notEmpty().withMessage('Código es obligatorio'),
    body('categoria').notEmpty().withMessage('Categoría es obligatoria'),
    body('unidad_medida').notEmpty().withMessage('Unidad de medida es obligatoria'),
    body('id_proveedor').isInt().withMessage('ID de proveedor debe ser un número entero')
  ],
  actualizarProducto
);

// Eliminar un producto por ID - solo admin
router.delete('/:id', requirePermission('productos', 'delete'), eliminarProducto);

export default router;
