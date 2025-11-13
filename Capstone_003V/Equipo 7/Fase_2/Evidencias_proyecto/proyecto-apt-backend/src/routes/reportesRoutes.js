import express from 'express';
import { reporteChecklists, reporteStock, reporteAlertas } from '../controllers/reportesController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/permissionsMiddleware.js';

const router = express.Router();

// Todos los endpoints requieren autenticación
router.use(verifyToken);

// Reporte de checklists - todos los roles que tengan permiso de lectura
router.get('/checklists', requirePermission('reportes', 'read'), reporteChecklists);

// Reporte de stock - todos los roles que tengan permiso de lectura
router.get('/stock', requirePermission('reportes', 'read'), reporteStock);

// Reporte de alertas - todos los roles que tengan permiso de lectura
router.get('/alertas', requirePermission('reportes', 'read'), reporteAlertas);

export default router;