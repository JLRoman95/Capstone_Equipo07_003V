import express from 'express';
import { registrarProduccion, listarProduccion } from '../controllers/produccionController.js';

const router = express.Router();

router.post('/', registrarProduccion);
router.get('/', listarProduccion);

export default router;
