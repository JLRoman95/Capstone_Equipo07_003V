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
  [
    body('nombre').notEmpty().withMessage('Nombre es obligatorio'),
    body('codigo').notEmpty().withMessage('Código es obligatorio'),
    body('categoria').notEmpty().withMessage('Categoría es obligatoria'),
    body('unidad_medida').notEmpty().withMessage('Unidad de medida es obligatoria'),
    body('id_proveedor').isInt().withMessage('ID de proveedor debe ser un número entero')
  ],
  crearProducto
);

// Actualizar un producto por ID
router.put(
  '/:id',
  [
    body('nombre').notEmpty().withMessage('Nombre es obligatorio'),
    body('codigo').notEmpty().withMessage('Código es obligatorio'),
    body('categoria').notEmpty().withMessage('Categoría es obligatoria'),
    body('unidad_medida').notEmpty().withMessage('Unidad de medida es obligatoria'),
    body('id_proveedor').isInt().withMessage('ID de proveedor debe ser un número entero')
  ],
  actualizarProducto
);

// Eliminar un producto por ID
router.delete('/:id', eliminarProducto);

export default router;
