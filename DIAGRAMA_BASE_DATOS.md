# 🗄️ DIAGRAMA DE BASE DE DATOS - SISTEMA APT
## Firestore Database Structure

---

**Proyecto**: Sistema APT - Control de Calidad Alimentaria  
**Base de Datos**: Firebase Firestore (NoSQL)  
**Project ID**: control-de-cosina  
**Fecha**: Noviembre 19, 2025  
**Versión**: 2.0 (con Sistema de Recetas y Lotes)

---

## 📊 DIAGRAMA ENTIDAD-RELACIÓN

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        FIREBASE FIRESTORE DATABASE                      │
│                         (control-de-cosina)                             │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────┐          ┌───────────────┐          ┌───────────────┐
│  PROVEEDORES  │          │   PRODUCTOS   │          │  INVENTARIO   │
│               │          │               │          │               │
│ - id          │◄─────────┤ - id          │◄─────────┤ - id          │
│ - nombre      │  1:N     │ - nombre      │  1:N     │ - codigo_prod │
│ - contacto    │          │ - codigo_prod │          │ - lote        │
│ - telefono    │          │ - categoria   │          │ - cantidad    │
│ - email       │          │ - unidad      │          │ - fecha_ingr  │
│ - direccion   │          │ - precio      │          │ - fecha_venc  │
│ - creado_en   │          │ - proveedor   │          │ - estado      │
└───────────────┘          │ - creado_en   │          │ - creado_en   │
                           └───────────────┘          └───────────────┘
                                    │                          │
                                    │ N:N                      │
                                    │ (ingredientes)           │
                                    ▼                          │
                           ┌───────────────┐                  │
                           │  PRODUCCION   │                  │
                           │               │                  │
                           │ - id          │                  │
                           │ - fecha       │                  │
                           │ - responsable │                  │
                           │ - turno       │──────────────────┘
                           │ - plato       │  Descuenta
                           │ - cantidad    │  automático
                           │ - ingredientes│  (FIFO)
                           │   └─[{        │
                           │      codigo   │
                           │      cant_ppc │
                           │      cant_tot │
                           │   }]          │
                           │ - creado_en   │
                           └───────────────┘

┌───────────────┐          ┌───────────────┐          ┌───────────────┐
│  CHECKLISTS   │          │    ALERTAS    │          │   USUARIOS    │
│               │          │               │          │  (Firebase    │
│ - id          │          │ - id          │          │   Auth)       │
│ - fecha       │          │ - tipo        │          │               │
│ - turno       │          │ - titulo      │          │ - uid         │
│ - responsable │          │ - mensaje     │          │ - email       │
│ - items[]     │          │ - fecha       │          │ - displayName │
│   └─[{        │          │ - prioridad   │          │ - rol         │
│      tarea    │          │ - estado      │          │   (admin/     │
│      completo │          │ - creado_en   │          │    cocinero/  │
│   }]          │          └───────────────┘          │    auditor)   │
│ - estado      │                                     │ - createdAt   │
│ - creado_en   │                                     └───────────────┘
└───────────────┘
```

---

## 📋 COLECCIONES DETALLADAS

### 1. 📦 PROVEEDORES

**Nombre de la colección**: `proveedores`  
**Propósito**: Gestión de proveedores de productos alimentarios  
**Relaciones**: 1:N con `productos`

```javascript
{
  id: "auto-generated-id",              // String (Auto ID Firestore)
  nombre: "Distribuidora Central S.A.", // String (requerido)
  contacto: "Juan Pérez",               // String (requerido)
  telefono: "+56912345678",             // String (validación formato)
  email: "contacto@distcentral.cl",     // String (validación email)
  direccion: "Av. Principal 123, Santiago", // String
  creado_en: "2024-11-19T10:30:00Z"     // Timestamp
}
```

**Índices**:
- Ninguno (colección pequeña)

**Validaciones**:
- ✅ Nombre único
- ✅ Email formato válido
- ✅ Teléfono formato válido (+56XXXXXXXXX)

---

### 2. 🥗 PRODUCTOS

**Nombre de la colección**: `productos`  
**Propósito**: Catálogo de productos/ingredientes  
**Relaciones**: 
- N:1 con `proveedores`
- 1:N con `inventario`
- N:N con `produccion` (a través de ingredientes)

```javascript
{
  id: "auto-generated-id",           // String (Auto ID Firestore)
  codigo_producto: "ARR-001",        // String (único, requerido)
  nombre: "Arroz Grado 1",           // String (requerido)
  categoria: "Granos",               // String (Granos|Carnes|Verduras|Lácteos|Otros)
  unidad_medida: "kg",               // String (kg|unidades|litros)
  precio_unitario: 1500,             // Number (pesos chilenos)
  proveedor_nombre: "Dist. Central", // String (referencia)
  creado_en: "2024-11-19T10:30:00Z"  // Timestamp
}
```

**Índices**:
- `codigo_producto` (único)

**Validaciones**:
- ✅ Código producto único
- ✅ Precio > 0
- ✅ Categoría válida

---

### 3. 📊 INVENTARIO

**Nombre de la colección**: `inventario`  
**Propósito**: Control de stock por lotes con sistema FIFO  
**Relaciones**: N:1 con `productos`

```javascript
{
  id: "auto-generated-id",              // String (Auto ID Firestore)
  codigo_producto: "ARR-001",           // String (FK a productos)
  lote: "L-ARR-20241119-001",           // String (único por producto)
  cantidad_unidades: 50,                // Number (stock actual)
  fecha_ingreso: "2024-11-19",          // Date (formato YYYY-MM-DD)
  fecha_vencimiento: "2025-02-19",      // Date (formato YYYY-MM-DD)
  estado: "disponible",                 // String (disponible|agotado|vencido)
  creado_en: "2024-11-19T10:30:00Z"     // Timestamp
}
```

**Índices compuestos recomendados**:
1. `codigo_producto` ASC + `fecha_vencimiento` ASC (para FIFO)
2. `fecha_vencimiento` ASC + `estado` ASC (para alertas)

**Ordenamiento FIFO**:
```javascript
// Query para obtener lotes en orden FIFO
inventario
  .where('codigo_producto', '==', 'ARR-001')
  .where('fecha_vencimiento', '>', new Date())
  .orderBy('fecha_vencimiento', 'asc')
```

**Estados del lote**:
- `disponible`: Stock > 0 y no vencido
- `agotado`: Stock = 0
- `vencido`: fecha_vencimiento < fecha_actual

**Validaciones**:
- ✅ Cantidad ≥ 0
- ✅ Fecha vencimiento > Fecha ingreso
- ✅ Lote único por producto

---

### 4. 🍳 PRODUCCION (con Sistema de Recetas)

**Nombre de la colección**: `produccion`  
**Propósito**: Registro de platos producidos con descuento automático de inventario  
**Relaciones**: N:N con `productos` (a través de array ingredientes)

```javascript
{
  id: "auto-generated-id",              // String (Auto ID Firestore)
  fecha: "2024-11-19",                  // Date (formato YYYY-MM-DD)
  responsable: "María González",        // String (nombre del cocinero)
  turno: "Mañana",                      // String (Mañana|Tarde|Noche)
  plato: "Arroz con Pollo",             // String (nombre del plato)
  cantidad: 20,                         // Number (porciones producidas)
  
  // ⭐ NUEVO: Sistema de Recetas
  ingredientes: [                       // Array de objetos
    {
      codigo_producto: "ARR-001",       // String (FK a productos)
      cantidad_necesaria: 0.1,          // Number (kg por porción)
      cantidad_total: 2                 // Number (kg totales = 0.1 × 20)
    },
    {
      codigo_producto: "POL-001",       // String (FK a productos)
      cantidad_necesaria: 0.15,         // Number (kg por porción)
      cantidad_total: 3                 // Number (kg totales = 0.15 × 20)
    }
  ],
  
  creado_en: "2024-11-19T14:30:00Z"     // Timestamp
}
```

**Índices**:
- `fecha` DESC (para listado reciente)

**Proceso de Descuento Automático** (FIFO):
```javascript
// Pseudocódigo del descuento automático
AL_REGISTRAR_PRODUCCION:
  1. Calcular cantidad_total de cada ingrediente
  2. Para cada ingrediente:
     a. Obtener lotes disponibles ordenados por fecha_vencimiento ASC
     b. Verificar stock total disponible ≥ cantidad_total
     c. Si hay stock suficiente:
        - Descontar cantidad de lotes en orden FIFO
        - Actualizar cantidad_unidades de cada lote
        - Si lote queda en 0, marcar como 'agotado'
     d. Si NO hay stock:
        - CANCELAR operación
        - Mostrar error "Stock insuficiente"
  3. Registrar producción con ingredientes[]
```

**Validaciones**:
- ✅ Al menos 1 ingrediente
- ✅ Stock suficiente de todos los ingredientes
- ✅ Cantidad porciones > 0
- ✅ Ingredientes no duplicados

---

### 5. ✅ CHECKLISTS

**Nombre de la colección**: `checklists`  
**Propósito**: Control de tareas de limpieza y calidad  
**Relaciones**: Ninguna (independiente)

```javascript
{
  id: "auto-generated-id",              // String (Auto ID Firestore)
  fecha: "2024-11-19",                  // Date (formato YYYY-MM-DD)
  turno: "Mañana",                      // String (Mañana|Tarde|Noche)
  responsable: "Carlos Ruiz",           // String (nombre del responsable)
  
  items: [                              // Array de tareas
    {
      tarea: "Limpieza de mesones",     // String
      completado: true                  // Boolean
    },
    {
      tarea: "Desinfección de equipos", // String
      completado: false                 // Boolean
    },
    {
      tarea: "Revisión de temperaturas",// String
      completado: true                  // Boolean
    }
  ],
  
  estado: "pendiente",                  // String (pendiente|completo)
  creado_en: "2024-11-19T08:00:00Z"     // Timestamp
}
```

**Índices**:
- `fecha` DESC (para listado reciente)
- `estado` ASC (para filtrar pendientes)

**Cálculo de estado**:
```javascript
// Estado se actualiza automáticamente
estado = items.every(item => item.completado) ? 'completo' : 'pendiente'
```

**Validaciones**:
- ✅ Al menos 1 tarea
- ✅ Fecha válida

---

### 6. 🚨 ALERTAS

**Nombre de la colección**: `alertas`  
**Propósito**: Notificaciones de eventos importantes (vencimientos, stock bajo)  
**Relaciones**: Ninguna (generadas automáticamente)

```javascript
{
  id: "auto-generated-id",              // String (Auto ID Firestore)
  tipo: "vencimiento_proximo",          // String (vencimiento_proximo|stock_bajo|calidad)
  titulo: "Producto por vencer",        // String
  mensaje: "Arroz Lote L-001 vence en 3 días", // String
  fecha: "2024-11-19T10:00:00Z",        // Timestamp
  prioridad: "alta",                    // String (alta|media|baja)
  estado: "activa",                     // String (activa|resuelta|descartada)
  
  // Datos adicionales opcionales
  metadata: {
    codigo_producto: "ARR-001",         // String (opcional)
    lote: "L-ARR-001",                  // String (opcional)
    cantidad_restante: 5                // Number (opcional)
  },
  
  creado_en: "2024-11-19T10:00:00Z"     // Timestamp
}
```

**Índices compuestos**:
- `estado` ASC + `prioridad` DESC + `fecha` DESC

**Tipos de alertas**:
1. `vencimiento_proximo`: Producto vence en ≤7 días
2. `stock_bajo`: Producto con stock < umbral
3. `calidad`: Problemas de calidad detectados

**Prioridades**:
- `alta`: Requiere acción inmediata (vence en 1-3 días)
- `media`: Requiere atención (vence en 4-7 días)
- `baja`: Informativa

**Validaciones**:
- ✅ Tipo válido
- ✅ Prioridad válida
- ✅ Estado válido

---

### 7. 👤 USUARIOS (Firebase Authentication)

**Servicio**: Firebase Authentication  
**Propósito**: Autenticación y autorización de usuarios  
**Método**: Email/Password

```javascript
// Usuario en Firebase Auth
{
  uid: "auto-generated-uid",            // String (único)
  email: "admin@apt.com",               // String (único, requerido)
  displayName: "Administrador",         // String (opcional)
  photoURL: null,                       // String (opcional)
  emailVerified: false,                 // Boolean
  disabled: false,                      // Boolean
  metadata: {
    creationTime: "2024-11-19T10:00:00Z",
    lastSignInTime: "2024-11-19T14:30:00Z"
  },
  
  // Custom Claims (para roles)
  customClaims: {
    role: "admin"                       // String (admin|cocinero|auditor)
  }
}
```

**Roles del Sistema**:

| Rol | Permisos | Descripción |
|-----|----------|-------------|
| `admin` | CREATE, READ, UPDATE, DELETE en todos los módulos | Administrador completo |
| `cocinero` | CREATE, READ en Producción, Checklists, Inventario | Usuario operativo |
| `auditor` | READ en todos los módulos | Solo visualización |

**Matriz de Permisos**:

```
┌─────────────┬───────┬──────────┬─────────┐
│   Módulo    │ Admin │ Cocinero │ Auditor │
├─────────────┼───────┼──────────┼─────────┤
│ Proveedores │ CRUD  │    R     │    R    │
│ Productos   │ CRUD  │    R     │    R    │
│ Inventario  │ CRUD  │   CR     │    R    │
│ Producción  │ CRUD  │   CR     │    R    │
│ Checklists  │ CRUD  │   CR     │    R    │
│ Alertas     │ CRUD  │    R     │    R    │
│ Reportes    │  R    │    R     │    R    │
└─────────────┴───────┴──────────┴─────────┘

C = Create  |  R = Read  |  U = Update  |  D = Delete
```

---

## 🔗 RELACIONES ENTRE COLECCIONES

### Relación 1: Proveedores → Productos (1:N)

```
┌───────────────┐
│  PROVEEDOR    │
│  id: P001     │
└───────┬───────┘
        │ 1
        │
        │ N
        ▼
┌───────────────────┐
│    PRODUCTO       │
│    id: PROD-001   │
│    proveedor: P001│
└───────────────────┘
```

**Implementación**: 
- Campo `proveedor_nombre` en `productos` (desnormalizado para performance)
- Sin FK estricta (NoSQL permite flexibilidad)

### Relación 2: Productos → Inventario (1:N)

```
┌───────────────┐
│   PRODUCTO    │
│   codigo: A01 │
└───────┬───────┘
        │ 1
        │
        │ N (múltiples lotes)
        ▼
┌─────────────────────┐
│    INVENTARIO       │
│    Lote L001: 50kg  │
│    Lote L002: 30kg  │
│    Lote L003: 20kg  │
└─────────────────────┘
```

**Implementación**:
- Campo `codigo_producto` en `inventario` (FK no estricta)
- Un producto puede tener múltiples lotes simultáneos
- Sistema FIFO maneja orden de uso

### Relación 3: Productos ↔ Producción (N:N con ingredientes)

```
┌───────────────┐        ┌─────────────────┐        ┌───────────────┐
│   PRODUCTO    │        │   INGREDIENTES  │        │  PRODUCCION   │
│   Arroz       │◄───────┤   [{            │───────►│   Arroz con   │
│   Pollo       │        │     cod: ARR    │        │   Pollo       │
│   Sal         │        │     cant: 0.1   │        │   20 porc.    │
└───────────────┘        │   },{           │        └───────────────┘
                         │     cod: POL    │
                         │     cant: 0.15  │
                         │   }]            │
                         └─────────────────┘
```

**Implementación**:
- Array `ingredientes[]` dentro de documento `produccion`
- Cada ingrediente tiene `codigo_producto` (referencia)
- No se usa colección intermedia (embedded documents)

---

## 📈 ÍNDICES RECOMENDADOS

### Índices Simples

```javascript
// Colección: productos
CREATE INDEX ON productos (codigo_producto ASC)

// Colección: inventario
CREATE INDEX ON inventario (codigo_producto ASC)
CREATE INDEX ON inventario (fecha_vencimiento ASC)

// Colección: produccion
CREATE INDEX ON produccion (fecha DESC)

// Colección: checklists
CREATE INDEX ON checklists (fecha DESC)
CREATE INDEX ON checklists (estado ASC)

// Colección: alertas
CREATE INDEX ON alertas (estado ASC)
CREATE INDEX ON alertas (fecha DESC)
```

### Índices Compuestos

```javascript
// Para FIFO en inventario
CREATE COMPOSITE INDEX ON inventario (
  codigo_producto ASC,
  fecha_vencimiento ASC,
  __name__ ASC
)

// Para alertas activas por prioridad
CREATE COMPOSITE INDEX ON alertas (
  estado ASC,
  prioridad DESC,
  fecha DESC,
  __name__ ASC
)

// Para producción por fecha
CREATE COMPOSITE INDEX ON produccion (
  fecha DESC,
  __name__ ASC
)
```

---

## 🔒 REGLAS DE SEGURIDAD (Firestore Rules)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Función helper para verificar autenticación
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Función helper para verificar rol admin
    function isAdmin() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.rol == 'admin';
    }
    
    // Función helper para verificar rol cocinero
    function isCocinero() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.rol == 'cocinero';
    }
    
    // PROVEEDORES: Solo admin puede escribir, todos pueden leer
    match /proveedores/{proveedor} {
      allow read: if isAuthenticated();
      allow create, update, delete: if isAdmin();
    }
    
    // PRODUCTOS: Solo admin puede escribir, todos pueden leer
    match /productos/{producto} {
      allow read: if isAuthenticated();
      allow create, update, delete: if isAdmin();
    }
    
    // INVENTARIO: Admin escribe todo, cocinero puede crear
    match /inventario/{item} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && (isAdmin() || isCocinero());
      allow update, delete: if isAdmin();
    }
    
    // PRODUCCION: Admin escribe todo, cocinero puede crear
    match /produccion/{registro} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && (isAdmin() || isCocinero());
      allow update, delete: if isAdmin();
    }
    
    // CHECKLISTS: Admin escribe todo, cocinero puede crear/actualizar
    match /checklists/{checklist} {
      allow read: if isAuthenticated();
      allow create, update: if isAuthenticated() && (isAdmin() || isCocinero());
      allow delete: if isAdmin();
    }
    
    // ALERTAS: Todos pueden leer, solo admin puede modificar
    match /alertas/{alerta} {
      allow read: if isAuthenticated();
      allow create, update, delete: if isAdmin();
    }
    
    // USUARIOS: Solo el propio usuario puede leer sus datos
    match /usuarios/{userId} {
      allow read: if isAuthenticated() && request.auth.uid == userId;
      allow write: if false; // Solo se maneja via Firebase Auth
    }
  }
}
```

---

## 📊 DIAGRAMA DE FLUJO DE DATOS

### Flujo 1: Registro de Producción con Descuento Automático

```
┌─────────────────────────────────────────────────────────────────┐
│  INICIO: Usuario registra producción "Arroz con Pollo - 20p"   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │ Selecciona ingredientes:          │
         │ - Arroz: 0.1 kg/p → 2 kg total    │
         │ - Pollo: 0.15 kg/p → 3 kg total   │
         └───────────────┬───────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │ Sistema calcula totales           │
         │ cantidad_total = cant_ppc × porc  │
         └───────────────┬───────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │ Verifica stock disponible FIFO    │
         │ Query: WHERE codigo = 'ARR-001'   │
         │        AND venc > hoy             │
         │        ORDER BY venc ASC          │
         └───────────┬───────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
   [Stock OK]              [Stock INSUFICIENTE]
        │                         │
        │                         ▼
        │              ┌──────────────────────┐
        │              │ ERROR: Mostrar alerta│
        │              │ "Falta X kg de Y"    │
        │              └──────────────────────┘
        │
        ▼
┌────────────────────────────────┐
│ Descuenta FIFO:                │
│ 1. Toma Lote L001 (completo)   │
│ 2. Si falta, toma Lote L002    │
│ 3. Actualiza cantidad_unidades │
└────────────┬───────────────────┘
             │
             ▼
┌────────────────────────────────┐
│ Guarda documento produccion:   │
│ {                              │
│   plato: "Arroz con Pollo",    │
│   cantidad: 20,                │
│   ingredientes: [{...}]        │
│ }                              │
└────────────┬───────────────────┘
             │
             ▼
┌────────────────────────────────┐
│ ✅ ÉXITO: Producción registrada│
│    Inventario actualizado      │
└────────────────────────────────┘
```

### Flujo 2: Vista de Inventario Agrupado por Producto

```
┌─────────────────────────────────┐
│ Usuario abre módulo Inventario  │
└───────────────┬─────────────────┘
                │
                ▼
┌───────────────────────────────────────┐
│ Sistema obtiene todos los lotes       │
│ Query: inventario.listar()            │
└───────────┬───────────────────────────┘
            │
            ▼
┌───────────────────────────────────────┐
│ Agrupa lotes por codigo_producto:     │
│                                       │
│ Arroz: [L001: 50kg, L002: 30kg]       │
│ Pollo: [L003: 25kg, L004: 15kg]       │
│ Tomate: [L005: 10kg]                  │
└───────────┬───────────────────────────┘
            │
            ▼
┌───────────────────────────────────────┐
│ Calcula totales por producto:         │
│                                       │
│ Arroz: 80kg total, 2 lotes            │
│ Pollo: 40kg total, 2 lotes            │
│ Tomate: 10kg total, 1 lote            │
└───────────┬───────────────────────────┘
            │
            ▼
┌───────────────────────────────────────┐
│ Muestra tabla agrupada:               │
│ [Producto] [Total] [Lotes] [Estado]   │
│ Arroz      80kg    2       OK          │
│ Pollo      40kg    2       1 por vencer│
└───────────┬───────────────────────────┘
            │
            ▼ (Usuario hace click)
┌───────────────────────────────────────┐
│ Abre modal con lotes del producto:    │
│                                       │
│ ARROZ                                 │
│ Lote L001: 50kg, vence 20/12/2024     │
│ Lote L002: 30kg, vence 15/01/2025     │
└───────────────────────────────────────┘
```

---

## 📐 ESTIMACIÓN DE VOLUMEN DE DATOS

### Proyección a 1 año de operación

| Colección | Docs/día | Docs/año | Tamaño promedio | Total estimado |
|-----------|----------|----------|-----------------|----------------|
| proveedores | 1 | 365 | 200 bytes | 73 KB |
| productos | 5 | 1,825 | 300 bytes | 548 KB |
| inventario | 10 | 3,650 | 250 bytes | 913 KB |
| produccion | 20 | 7,300 | 500 bytes | 3.65 MB |
| checklists | 3 | 1,095 | 400 bytes | 438 KB |
| alertas | 15 | 5,475 | 300 bytes | 1.64 MB |
| **TOTAL** | **54** | **19,710** | - | **~7.3 MB** |

### Operaciones estimadas (reads/writes por día)

| Operación | Cantidad/día | Tipo |
|-----------|--------------|------|
| Login/Auth | 50 | Read |
| Dashboard stats | 200 | Read |
| Ver inventario | 100 | Read |
| Crear producción | 20 | Write + Read (FIFO) |
| Ver reportes | 30 | Read |
| Exportar PDF | 10 | Read |
| **Total Reads** | **~500** | - |
| **Total Writes** | **~50** | - |

**Costo estimado Firestore**: ~$0.06 USD/día (plan Blaze)

---

## 🔧 OPTIMIZACIONES IMPLEMENTADAS

### 1. Desnormalización Estratégica
- `proveedor_nombre` duplicado en `productos` (evita joins)
- `codigo_producto` en vez de ObjectID (más legible)

### 2. Índices Compuestos
- FIFO query optimizada con índice compuesto
- Alertas activas con índice multi-campo

### 3. Carga Lazy
- Dashboard carga estadísticas con `Promise.all()`
- Lotes se cargan on-demand (modal)

### 4. Caching en Cliente
- AuthContext mantiene usuario en memoria
- Productos/proveedores se cachean en componentes

---

## 📚 REFERENCIAS

- [Firestore Data Modeling](https://firebase.google.com/docs/firestore/manage-data/structure-data)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firestore Indexes](https://firebase.google.com/docs/firestore/query-data/indexing)
- [NoSQL Best Practices](https://cloud.google.com/datastore/docs/best-practices)

---

**Última actualización**: 19 de noviembre, 2025  
**Versión**: 2.0 (con Sistema de Recetas y Gestión de Lotes)  
**Autor**: Equipo 7 - Capstone Project
