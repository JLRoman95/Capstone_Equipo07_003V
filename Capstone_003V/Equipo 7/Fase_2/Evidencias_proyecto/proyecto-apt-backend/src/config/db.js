import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pkg;

export const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

// Variable para indicar si PostgreSQL está disponible
export let isPostgresAvailable = false;

// Intentar conectar a PostgreSQL
pool.connect()
  .then(() => {
    console.log('✅ Conectado a PostgreSQL');
    isPostgresAvailable = true;
  })
  .catch(err => {
    console.warn('⚠️ PostgreSQL no disponible, usando Firebase como backend');
    console.warn('Para usar todas las funcionalidades, instala PostgreSQL');
    isPostgresAvailable = false;
  });
