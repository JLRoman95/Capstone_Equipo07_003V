import express from 'express';
import {
  crearChecklist,
  listarChecklists,
  listarItemsChecklist,
  actualizarChecklist
} from '../controllers/checklistController.js';
import {
  revisarChecklist,
  checklistsPendientesAuditoria,
  estadisticasAuditoria
} from '../controllers/auditChecklistController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/permissionsMiddleware.js';

const router = express.Router();

// Todos los endpoints requieren autenticación
router.use(verifyToken);

// Crear nuevo checklist con ítems - admin y cocinero
router.post('/', requirePermission('checklists', 'create'), crearChecklist);

// Listar todos los checklists - todos los roles que tengan permiso de lectura
router.get('/', requirePermission('checklists', 'read'), listarChecklists);

// Listar ítems de un checklist específico - todos los roles con lectura
router.get('/:id/items', requirePermission('checklists', 'read'), listarItemsChecklist);

// Actualizar checklist y sus ítems - admin, cocinero y auditor
router.put('/:id', requirePermission('checklists', 'update'), actualizarChecklist);

// === RUTAS ESPECÍFICAS DE AUDITORÍA ===

// Revisar checklist (auditor) - solo auditor y admin
router.put('/:id/revisar', requirePermission('checklists', 'update'), revisarChecklist);

// Obtener checklists pendientes de auditoría - solo auditor y admin  
router.get('/pendientes/auditoria', requirePermission('auditoria', 'read'), checklistsPendientesAuditoria);

// Estadísticas de auditoría - solo auditor y admin
router.get('/estadisticas/auditoria', requirePermission('auditoria', 'read'), estadisticasAuditoria);

export default router;
