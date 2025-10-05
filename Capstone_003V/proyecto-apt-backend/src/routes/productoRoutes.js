import express from 'express';
import { body } from 'express-validator';
import {
  crearProducto,
  listarProductos,
  actualizarProducto,
  eliminarProducto
} from '../controllers/productoController.js';

const router = express.Router();

// Listar todos los productos
router.get('/', listarProductos);

// Crear un nuevo producto
router.post(
  '/',
  body('nombre').notEmpty().withMessage('Nombre es obligatorio'),
  body('codigo').notEmpty().withMessage('Código es obligatorio'),
  crearProducto
);

// Actualizar un producto por ID
router.put(
  '/:id',
  body('nombre').notEmpty().withMessage('Nombre es obligatorio'),
  body('codigo').notEmpty().withMessage('Código es obligatorio'),
  actualizarProducto
);

// Eliminar un producto por ID
router.delete('/:id', eliminarProducto);

export default router;
