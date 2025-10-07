import express from 'express';
import { body } from 'express-validator';
import { listarInventario, crearInventario, actualizarInventario, eliminarInventario } from '../controllers/inventarioController.js';

const router = express.Router();

router.get('/', listarInventario);

router.post(
  '/',
  [
    body('id_producto').isInt().withMessage('id_producto debe ser un número entero'),
    body('stock_actual').isNumeric().withMessage('stock_actual debe ser un número'),
    body('stock_minimo').optional().isNumeric().withMessage('stock_minimo debe ser un número'),
    body('fecha_caducidad').isISO8601().withMessage('fecha_caducidad debe ser una fecha válida (YYYY-MM-DD)')
  ],
  crearInventario
);

router.put(
  '/:id',
  [
    body('stock_actual').optional().isNumeric().withMessage('stock_actual debe ser un número'),
    body('stock_minimo').optional().isNumeric().withMessage('stock_minimo debe ser un número'),
    body('fecha_caducidad').optional().isISO8601().withMessage('fecha_caducidad debe ser una fecha válida (YYYY-MM-DD)')
  ],
  actualizarInventario
);

router.delete('/:id', eliminarInventario);

export default router;
