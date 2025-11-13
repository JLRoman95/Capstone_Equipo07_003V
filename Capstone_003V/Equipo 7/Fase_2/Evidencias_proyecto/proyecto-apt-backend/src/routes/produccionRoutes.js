import express from 'express';
import { registrarProduccion, listarProduccion } from '../controllers/produccionController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/permissionsMiddleware.js';

const router = express.Router();

// Todos los endpoints requieren autenticación
router.use(verifyToken);

// Registrar producción - admin y cocinero
router.post('/', requirePermission('produccion', 'create'), registrarProduccion);

// Listar producción - todos los roles que tengan permiso de lectura
router.get('/', requirePermission('produccion', 'read'), listarProduccion);

export default router;
