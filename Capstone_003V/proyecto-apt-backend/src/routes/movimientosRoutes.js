import express from 'express';
import { body } from 'express-validator';
import { crearMovimiento, listarMovimientos } from '../controllers/movimientosController.js';

const router = express.Router();

router.get('/', listarMovimientos);

router.post(
  '/',
  [
    body('id_producto').isInt(),
    body('cantidad').isNumeric(),
    body('tipo').isIn(['entrada','salida','ajuste']),
    body('id_usuario').isInt()
  ],
  crearMovimiento
);

export default router;
