import express from 'express';
import {
  crearChecklist,
  listarChecklists,
  listarItemsChecklist,
  actualizarChecklist
} from '../controllers/checklistController.js';

const router = express.Router();

// Crear nuevo checklist con ítems
router.post('/', crearChecklist);

// Listar todos los checklists
router.get('/', listarChecklists);

// Listar ítems de un checklist específico
router.get('/:id/items', listarItemsChecklist);

// Actualizar checklist y sus ítems
router.put('/:id', actualizarChecklist);

export default router;
