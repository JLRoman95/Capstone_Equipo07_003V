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
import checklistRoutes from './routes/checklistRoutes.js';
import { setupSwagger } from './swagger/swaggerRoutes.js';
import alertasAutomaticasRoutes from './routes/alertasAutomaticasRoutes.js';
import produccionRoutes from './routes/produccionRoutes.js';
import reportesRoutes from './routes/reportesRoutes.js';

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Servir frontend
app.use(express.static(path.join(__dirname, 'frontend')));

// Ruta de prueba
app.get('/test', (req, res) => {
  res.json({ message: 'Servidor funcionando correctamente', timestamp: new Date().toISOString() });
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/proveedores', proveedorRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/checklists', checklistRoutes);
app.use('/api/alertas-automaticas', alertasAutomaticasRoutes);
app.use('/api/produccion', produccionRoutes);
app.use('/api/reportes', reportesRoutes);

setupSwagger(app);

// Ruta base
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'login.html'));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor corriendo en puerto ${PORT}`);
  console.log(`🌐 Acceso local: http://localhost:${PORT}`);
  console.log(`🔧 Swagger docs: http://localhost:${PORT}/api-docs`);
});
