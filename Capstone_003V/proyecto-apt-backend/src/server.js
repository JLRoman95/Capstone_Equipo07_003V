import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import proveedorRoutes from './routes/proveedorRoutes.js';
import productoRoutes from './routes/productoRoutes.js';
import inventarioRoutes from './routes/inventarioRoutes.js';
import movimientosRoutes from './routes/movimientosRoutes.js';
import checklistRoutes from './routes/checklistRoutes.js';
import { setupSwagger } from './swagger/swaggerRoutes.js';
import alertasRoutes from './routes/alertasRoutes.js';
import produccionRoutes from './routes/produccionRoutes.js';

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

// Servir frontend
app.use(express.static(path.join(__dirname, 'frontend')));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/proveedores', proveedorRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/movimientos', movimientosRoutes);
app.use('/api/checklists', checklistRoutes);
app.use('/api/alertas', alertasRoutes);
app.use('/api/produccion', produccionRoutes);

setupSwagger(app);

// Ruta base
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'login.html'));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Servidor corriendo en puerto ${PORT}`));
