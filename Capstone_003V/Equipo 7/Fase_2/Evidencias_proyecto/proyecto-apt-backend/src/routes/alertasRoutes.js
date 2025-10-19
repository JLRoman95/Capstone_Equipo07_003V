// src/routes/alertasRoutes.js
import express from 'express';
import { listarAlertas, crearAlerta, actualizarAlerta } from '../controllers/alertasController.js';

const router = express.Router();

// Listar (con filtros opcionales)
router.get('/', listarAlertas);

// Crear (manual)
router.post('/', crearAlerta);

// Actualizar estado
router.put('/:id', actualizarAlerta);

export default router;
