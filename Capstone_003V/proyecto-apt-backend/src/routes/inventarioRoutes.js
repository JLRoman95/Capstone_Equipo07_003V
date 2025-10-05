import express from 'express';
import { body } from 'express-validator';
import { listarInventario, crearInventario, actualizarInventario, eliminarInventario } from '../controllers/inventarioController.js';

const router = express.Router();

router.get('/', listarInventario);

router.post(
  '/',
  [
    body('id_producto').isInt(),
    body('stock_actual').isNumeric(),
    body('stock_minimo').isNumeric()
  ],
  crearInventario
);

router.put(
  '/:id',
  [
    body('stock_actual').isNumeric(),
    body('stock_minimo').isNumeric()
  ],
  actualizarInventario
);

router.delete('/:id', eliminarInventario);

export default router;
