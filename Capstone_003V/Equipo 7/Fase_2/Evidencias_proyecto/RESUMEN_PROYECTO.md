# 📦 Sistema APT - Proyecto Completo

## 🎯 Descripción del Proyecto

Sistema APT (Análisis y Planificación de Alimentos) es una aplicación web completa para el control de calidad alimentaria, gestión de inventario FIFO, producción y generación de reportes.

## 📂 Estructura del Proyecto

```
Evidencias_proyecto/
│
├── proyecto-apt-backend/           # Backend (API REST)
│   ├── src/
│   │   ├── config/                 # Configuración BD
│   │   ├── controllers/            # Lógica de negocio
│   │   ├── middleware/             # Autenticación y permisos
│   │   ├── routes/                 # Rutas de la API
│   │   ├── swagger/                # Documentación API
│   │   └── server.js               # Punto de entrada
│   ├── package.json
│   ├── .env                        # Variables de entorno
│   └── README.md
│
├── proyecto-apt-frontend/          # Frontend (React)
│   ├── src/
│   │   ├── components/             # Componentes reutilizables
│   │   ├── context/                # Context API (Auth)
│   │   ├── pages/                  # Páginas de la aplicación
│   │   ├── services/               # Servicios API
│   │   ├── App.jsx                 # Componente principal
│   │   ├── main.jsx                # Punto de entrada
│   │   └── index.css               # Estilos globales
│   ├── package.json
│   ├── vite.config.js
│   └── README.md
│
├── INSTRUCCIONES_EJECUCION.md      # Guía de ejecución
└── INICIAR_SISTEMA.bat             # Script de inicio rápido
```

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** v16+
- **Express** v5.1.0 - Framework web
- **PostgreSQL** v8.16+ - Base de datos
- **JWT** - Autenticación
- **Bcrypt** - Encriptación de contraseñas
- **Swagger** - Documentación API
- **PDFKit** - Generación de reportes PDF
- **CORS** - Manejo de peticiones cross-origin

### Frontend
- **React** v18.2.0 - Librería UI
- **Vite** v5.0.0 - Build tool
- **React Router** v6.20.0 - Navegación
- **Axios** v1.6.0 - Cliente HTTP
- **CSS** personalizado - Estilos

## 📋 Funcionalidades Principales

### 1. Autenticación y Autorización
- Login con email y contraseña
- Registro de nuevos usuarios
- Roles: Admin, Cocinero, Auditor
- Protección de rutas con JWT
- Sistema de permisos por rol

### 2. Gestión de Inventario (FIFO)
- Registro de lotes de productos
- Control de fechas de caducidad
- Alertas de productos por vencer
- Alertas de stock bajo
- Sistema FIFO automático
- Actualización de stock

### 3. Catálogo de Productos
- CRUD completo de productos
- Categorización (Carnes, Verduras, Lácteos, etc.)
- Unidades de medida (kg, litros, unidades)
- Stock mínimo configurable
- Relación con proveedores

### 4. Gestión de Proveedores
- Registro de proveedores
- Información de contacto
- Relación con productos

### 5. Checklists de Calidad
- Creación de checklists por turno
- Estados: Pendiente, Completo
- Registro de tareas
- Control de calidad diario

### 6. Registro de Producción
- Registro de producción por turno
- Asignación de responsables
- Historial de producción
- Productos utilizados

### 7. Sistema de Reportes
- Reporte de inventario en PDF
- Reporte de producción por fechas en PDF
- Descarga automática
- Formato profesional

## 🔐 Sistema de Seguridad

### Autenticación
- JWT (JSON Web Tokens)
- Tokens almacenados en localStorage
- Expiración de tokens
- Middleware de verificación

### Permisos por Rol

| Módulo | Admin | Cocinero | Auditor |
|--------|-------|----------|---------|
| Inventario (Lectura) | ✅ | ✅ | ✅ |
| Inventario (Crear/Editar) | ✅ | ✅ | ❌ |
| Inventario (Eliminar) | ✅ | ❌ | ❌ |
| Productos | ✅ | ✅ | ❌ |
| Proveedores | ✅ | ✅ | ❌ |
| Checklists | ✅ | ✅ | ✅ |
| Producción | ✅ | ✅ | ❌ |
| Reportes | ✅ | ✅ | ✅ |

## 🗄️ Base de Datos

### Tablas Principales
1. **usuarios** - Usuarios del sistema
2. **proveedores** - Proveedores de productos
3. **productos** - Catálogo de productos
4. **inventario** - Lotes de inventario (FIFO)
5. **checklists** - Checklists de control
6. **items_checklist** - Items de cada checklist
7. **produccion_alimentos** - Registros de producción
8. **productos_usados_produccion** - Relación producción-productos
9. **alertas_automaticas** - Alertas del sistema

## 🚀 Instalación y Ejecución

### Opción 1: Script Automático
```bash
# Doble clic en:
INICIAR_SISTEMA.bat
```

### Opción 2: Manual

**Terminal 1 - Backend:**
```bash
cd proyecto-apt-backend
npm install
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd proyecto-apt-frontend
npm install
npm run dev
```

**Acceder:**
- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- API Docs: http://localhost:4000/api-docs

## 👤 Usuarios de Prueba

| Email | Contraseña | Rol |
|-------|-----------|-----|
| admin@apt.com | admin123 | Admin |

## 📡 API Endpoints

### Autenticación
```
POST   /api/auth/login
POST   /api/auth/register
GET    /api/auth/usuario
```

### Inventario
```
GET    /api/inventario
POST   /api/inventario
PUT    /api/inventario/:id
DELETE /api/inventario/:id
GET    /api/inventario/fifo/:id_producto
GET    /api/inventario/proximo/:id_producto
```

### Productos
```
GET    /api/productos
POST   /api/productos
PUT    /api/productos/:id
DELETE /api/productos/:id
```

### Proveedores
```
GET    /api/proveedores
POST   /api/proveedores
PUT    /api/proveedores/:id
DELETE /api/proveedores/:id
```

### Checklists
```
GET    /api/checklists
POST   /api/checklists
PUT    /api/checklists/:id
GET    /api/checklists/:id/items
```

### Producción
```
GET    /api/produccion
POST   /api/produccion
```

### Alertas
```
POST   /api/alertas-automaticas/generar
GET    /api/alertas-automaticas/contar
```

### Reportes
```
GET    /api/reportes/inventario
GET    /api/reportes/produccion?fecha_inicio=YYYY-MM-DD&fecha_fin=YYYY-MM-DD
```

## 🎨 Características de la UI

- Diseño responsive
- Interfaz intuitiva y moderna
- Navegación fluida entre módulos
- Alertas visuales de estado
- Modales para formularios
- Tablas organizadas
- Sistema de colores por módulo
- Feedback visual de acciones

## 📊 Características del Sistema FIFO

El sistema implementa FIFO (First In, First Out) para el inventario:

1. **Registro de lotes** con fecha de ingreso
2. **Priorización automática** por fecha de ingreso
3. **Alertas de caducidad** (7 días antes)
4. **Control visual** con colores:
   - 🟢 Verde: OK
   - 🟡 Amarillo: Por vencer (< 7 días)
   - 🔴 Rojo: Vencido

## 🔔 Sistema de Alertas

Alertas automáticas para:
- Stock bajo (por debajo del mínimo)
- Productos por vencer (< 7 días)
- Productos vencidos
- Contador de alertas en Dashboard

## 📈 Reportes

Los reportes se generan en PDF e incluyen:

### Reporte de Inventario
- Lista completa de productos
- Stock actual y mínimo
- Fechas de caducidad
- Estado de cada lote
- Fecha de generación

### Reporte de Producción
- Producción por rango de fechas
- Responsables
- Turnos
- Productos utilizados
- Estadísticas

## 🛡️ Seguridad Implementada

- Contraseñas encriptadas con bcrypt
- Tokens JWT con expiración
- Validación de datos en backend
- Sanitización de inputs
- Protección contra SQL injection
- CORS configurado
- Headers de seguridad

## 📝 Notas de Desarrollo

- El backend usa ES Modules (import/export)
- El frontend usa React Hooks
- Código limpio y comentado
- Estructura modular
- Separación de responsabilidades
- Manejo de errores centralizado

## 🐛 Testing

Para ejecutar los tests:

```bash
# Backend
cd proyecto-apt-backend
npm test

# Frontend
cd proyecto-apt-frontend
npm test
```

## 📦 Build para Producción

```bash
# Backend
cd proyecto-apt-backend
npm start

# Frontend
cd proyecto-apt-frontend
npm run build
npm run preview
```

## 🤝 Contribución

Este es un proyecto académico para el curso de Capstone.

**Equipo 7 - Sección 003V**

## 📄 Licencia

Proyecto académico - Todos los derechos reservados.

---

## ✅ Checklist de Verificación

Antes de ejecutar, verificar:
- [ ] Node.js instalado (v16+)
- [ ] PostgreSQL instalado y corriendo
- [ ] Base de datos `apt_db` creada
- [ ] Archivo `.env` configurado en backend
- [ ] Dependencias instaladas (`npm install`)
- [ ] Puerto 4000 disponible (backend)
- [ ] Puerto 3000 disponible (frontend)

## 🎓 Documentación Adicional

- **Swagger UI**: http://localhost:4000/api-docs
- **README Backend**: /proyecto-apt-backend/README.md
- **README Frontend**: /proyecto-apt-frontend/README.md
- **Instrucciones de Ejecución**: /INSTRUCCIONES_EJECUCION.md

---

**¡Sistema listo para usar! 🚀**
