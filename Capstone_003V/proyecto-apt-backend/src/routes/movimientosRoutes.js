import express from 'express';
import { body } from 'express-validator';
import { crearMovimiento, listarMovimientos } from '../controllers/movimientosController.js';

const router = express.Router();

// Listar todos los movimientos
router.get('/', listarMovimientos);

// Crear un nuevo movimiento
router.post(
  '/',
  [
    body('id_producto')
      .isInt({ gt: 0 })
      .withMessage('El id_producto debe ser un entero mayor a 0'),
    body('cantidad')
      .isFloat({ gt: 0 })
      .withMessage('La cantidad debe ser un número mayor a 0'),
    body('tipo')
      .isIn(['entrada', 'salida', 'ajuste'])
      .withMessage('El tipo debe ser "entrada", "salida" o "ajuste"'),
    body('id_usuario')
      .isInt({ gt: 0 })
      .withMessage('El id_usuario debe ser un entero mayor a 0')
  ],
  crearMovimiento
);

export default router;
