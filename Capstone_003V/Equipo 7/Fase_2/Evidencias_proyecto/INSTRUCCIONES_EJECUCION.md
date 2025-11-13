# 🚀 Guía de Ejecución - Sistema APT

## Estructura del Proyecto

```
Evidencias_proyecto/
├── proyecto-apt-backend/     # Backend (Node.js + Express + PostgreSQL)
└── proyecto-apt-frontend/    # Frontend (React + Vite)
```

## 📋 Requisitos Previos

- Node.js 16+ instalado
- PostgreSQL 12+ instalado y en ejecución
- Base de datos `apt_db` creada

## 🔧 Configuración Inicial

### 1. Backend

```bash
# Navegar al backend
cd proyecto-apt-backend

# Instalar dependencias (si no están instaladas)
npm install

# Verificar archivo .env existe con:
# PORT=4000
# DB_HOST=localhost
# DB_USER=postgres
# DB_PASSWORD=1234
# DB_NAME=apt_db
# DB_PORT=5432
# JWT_SECRET=csss

# Ejecutar backend
npm run dev
```

El backend estará disponible en `http://localhost:4000`

### 2. Frontend

**Abrir una nueva terminal** y ejecutar:

```bash
# Navegar al frontend
cd proyecto-apt-frontend

# Instalar dependencias (si no están instaladas)
npm install

# Ejecutar frontend
npm run dev
```

El frontend estará disponible en `http://localhost:3000`

## 🎯 Acceso al Sistema

1. Abrir navegador en `http://localhost:3000`
2. Usar credenciales de prueba:
   - **Email:** admin@apt.com
   - **Contraseña:** admin123

## 📱 Módulos Disponibles

Una vez autenticado, podrás acceder a:

- **Dashboard** - Vista general y estadísticas
- **Inventario** - Gestión de inventario con sistema FIFO
- **Productos** - Catálogo de productos
- **Proveedores** - Gestión de proveedores
- **Checklists** - Control de calidad
- **Producción** - Registro de producción de alimentos
- **Reportes** - Generación de reportes PDF

## 🔍 Verificación

### Backend
- API disponible: http://localhost:4000/test
- Documentación Swagger: http://localhost:4000/api-docs

### Frontend
- Aplicación: http://localhost:3000
- Login: http://localhost:3000/login

## ⚠️ Solución de Problemas

### Backend no inicia
- Verificar que PostgreSQL esté corriendo
- Verificar credenciales en archivo `.env`
- Verificar que la base de datos `apt_db` exista

### Frontend no se conecta al backend
- Verificar que el backend esté corriendo en puerto 4000
- Revisar consola del navegador para errores CORS
- Verificar que ambos servicios estén en ejecución

### Error de autenticación
- Crear usuario usando el endpoint `/api/auth/register`
- O usar el script `crear_usuarios_prueba.js` en el backend

## 📊 Endpoints API Principales

```
POST   /api/auth/login              # Login
POST   /api/auth/register           # Registro
GET    /api/auth/usuario            # Usuario actual

GET    /api/inventario              # Listar inventario
POST   /api/inventario              # Crear lote
DELETE /api/inventario/:id          # Eliminar lote

GET    /api/productos               # Listar productos
POST   /api/productos               # Crear producto

GET    /api/proveedores             # Listar proveedores
POST   /api/proveedores             # Crear proveedor

GET    /api/checklists              # Listar checklists
POST   /api/checklists              # Crear checklist

GET    /api/produccion              # Listar producción
POST   /api/produccion              # Registrar producción

GET    /api/reportes/inventario     # Reporte PDF inventario
GET    /api/reportes/produccion     # Reporte PDF producción
```

## 🎨 Tecnologías Utilizadas

### Backend
- Node.js + Express
- PostgreSQL
- JWT para autenticación
- Swagger para documentación
- PDFKit para reportes

### Frontend
- React 18
- Vite
- React Router
- Axios
- CSS personalizado

## 📝 Notas Importantes

- El backend debe estar corriendo ANTES de iniciar el frontend
- Los reportes PDF se generan desde el backend
- El sistema usa autenticación JWT con Bearer tokens
- El inventario implementa sistema FIFO (First In, First Out)

## 🚀 Comandos Rápidos

**Terminal 1 (Backend):**
```bash
cd proyecto-apt-backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd proyecto-apt-frontend
npm run dev
```

**Acceder:**
```
http://localhost:3000
```

¡Listo! El sistema está funcionando. 🎉
