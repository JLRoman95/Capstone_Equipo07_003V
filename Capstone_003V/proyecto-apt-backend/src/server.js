import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import proveedorRoutes from './routes/proveedorRoutes.js';
import productoRoutes from './routes/productoRoutes.js';
import inventarioRoutes from './routes/inventarioRoutes.js';
import movimientosRoutes from './routes/movimientosRoutes.js';
import { setupSwagger } from './swagger/swaggerRoutes.js';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Ruta base
app.get('/', (req, res) => {
  res.send('Servidor APT funcionando correctamente');
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/proveedores', proveedorRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/movimientos', movimientosRoutes);

// Swagger (documentación)
setupSwagger(app);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Servidor corriendo en puerto ${PORT}`));
