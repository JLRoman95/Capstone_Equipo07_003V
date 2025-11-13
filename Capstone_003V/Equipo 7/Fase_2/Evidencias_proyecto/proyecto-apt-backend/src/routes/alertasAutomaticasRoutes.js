// src/routes/alertasAutomaticasRoutes.js
import express from 'express';
import { generarAlertasAutomaticas, contarAlertas } from '../controllers/alertasAutomaticasController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/permissionsMiddleware.js';

const router = express.Router();

// Todos los endpoints requieren autenticación
router.use(verifyToken);

// Obtener todas las alertas automáticas
router.get('/', requirePermission('alertas', 'read'), generarAlertasAutomaticas);

// Obtener solo el conteo de alertas (para dashboard)
router.get('/conteo', requirePermission('alertas', 'read'), contarAlertas);

export default router;