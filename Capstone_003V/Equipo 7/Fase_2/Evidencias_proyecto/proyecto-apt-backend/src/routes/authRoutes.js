import express from 'express';
import { registerUser, loginUser, getUsuario } from '../controllers/authController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

// ✅ Nueva ruta para obtener datos del usuario autenticado
router.get('/usuario', verifyToken, getUsuario);

export default router;
