import express from 'express';
import { body } from 'express-validator';
import {
  crearProveedor,
  listarProveedores,
  actualizarProveedor,
  eliminarProveedor
} from '../controllers/proveedorController.js';

const router = express.Router();

// Listar todos los proveedores
router.get('/', listarProveedores);

// Crear un nuevo proveedor
router.post(
  '/',
  body('nombre').notEmpty().withMessage('Nombre es obligatorio'),
  crearProveedor
);

// Actualizar un proveedor por ID
router.put(
  '/:id',
  body('nombre').notEmpty().withMessage('Nombre es obligatorio'),
  actualizarProveedor
);

// Eliminar un proveedor por ID
router.delete('/:id', eliminarProveedor);

export default router;
