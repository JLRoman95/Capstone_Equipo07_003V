import express from 'express';
import { body } from 'express-validator';
import { 
  listarInventario, 
  crearInventario, 
  actualizarInventario, 
  eliminarInventario, 
  obtenerInventarioFIFO, 
  obtenerProximoLoteFIFO 
} from '../controllers/inventarioController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/permissionsMiddleware.js';

const router = express.Router();

// Todos los endpoints requieren autenticación
router.use(verifyToken);

// Listar inventario - todos los roles que tengan permiso de lectura (ordenado por FIFO)
router.get('/', requirePermission('inventario', 'read'), listarInventario);

// Obtener inventario FIFO por producto
router.get('/fifo/:id_producto', requirePermission('inventario', 'read'), obtenerInventarioFIFO);

// Obtener próximo lote a usar (FIFO)
router.get('/proximo/:id_producto', requirePermission('inventario', 'read'), obtenerProximoLoteFIFO);

// Crear inventario - admin y cocinero
router.post(
  '/',
  requirePermission('inventario', 'create'),
  [
    body('id_producto').isInt().withMessage('id_producto debe ser un número entero'),
    body('stock_actual').isNumeric().withMessage('stock_actual debe ser un número'),
    body('stock_minimo').optional().isNumeric().withMessage('stock_minimo debe ser un número'),
    body('fecha_caducidad').isISO8601().withMessage('fecha_caducidad debe ser una fecha válida (YYYY-MM-DD)')
  ],
  crearInventario
);

// Actualizar inventario - admin y cocinero
router.put(
  '/:id',
  requirePermission('inventario', 'update'),
  [
    body('stock_actual').optional().isNumeric().withMessage('stock_actual debe ser un número'),
    body('stock_minimo').optional().isNumeric().withMessage('stock_minimo debe ser un número'),
    body('fecha_caducidad').optional().isISO8601().withMessage('fecha_caducidad debe ser una fecha válida (YYYY-MM-DD)')
  ],
  actualizarInventario
);

// Eliminar inventario - solo admin (muy riesgoso para cocinero)
router.delete('/:id', requirePermission('inventario', 'delete'), eliminarInventario);

export default router;
