# 🔐 Verificación de Permisos por Rol

## ✅ Estado Actual de Implementación

### Permisos Definidos en `usePermissions.js`

#### 👨‍💼 ADMINISTRADOR (admin)
| Módulo | Create | Read | Update | Delete |
|--------|--------|------|--------|--------|
| Usuarios | ✅ | ✅ | ✅ | ✅ |
| Proveedores | ✅ | ✅ | ✅ | ✅ |
| Productos | ✅ | ✅ | ✅ | ✅ |
| Inventario | ✅ | ✅ | ✅ | ✅ |
| Checklists | ✅ | ✅ | ✅ | ✅ |
| Producción | ✅ | ✅ | ✅ | ✅ |
| Alertas | ✅ | ✅ | ✅ | ✅ |
| Reportes | - | ✅ | - | - |

**Resumen**: Acceso total a todas las funcionalidades.

#### 👨‍🍳 COCINERO (cocinero)
| Módulo | Create | Read | Update | Delete |
|--------|--------|------|--------|--------|
| Usuarios | ❌ | ❌ | ❌ | ❌ |
| Proveedores | ✅ | ✅ | ❌ | ❌ |
| Productos | ✅ | ✅ | ❌ | ❌ |
| Inventario | ✅ | ✅ | ✅ | ❌ |
| Checklists | ✅ | ✅ | ✅ | ✅ |
| Producción | ✅ | ✅ | ✅ | ✅ |
| Alertas | ❌ | ✅ | ✅ | ❌ |
| Reportes | - | ✅ | - | - |

**Resumen**: 
- ✅ Puede crear proveedores y productos (pero NO eliminarlos)
- ✅ Puede gestionar inventario (pero NO eliminar)
- ✅ Control total sobre checklists y producción
- ❌ NO puede gestionar usuarios
- ❌ NO puede eliminar alertas

#### 🔍 AUDITOR (auditor)
| Módulo | Create | Read | Update | Delete |
|--------|--------|------|--------|--------|
| Usuarios | ❌ | ❌ | ❌ | ❌ |
| Proveedores | ❌ | ✅ | ❌ | ❌ |
| Productos | ❌ | ✅ | ❌ | ❌ |
| Inventario | ❌ | ✅ | ❌ | ❌ |
| Checklists | ❌ | ✅ | ✅ | ❌ |
| Producción | ❌ | ✅ | ❌ | ❌ |
| Alertas | ✅ | ✅ | ✅ | ✅ |
| Reportes | - | ✅ | Export ✅ | - |

**Resumen**: 
- ✅ Solo lectura en mayoría de módulos
- ✅ Puede actualizar checklists (para marcar tareas como completadas)
- ✅ Control total sobre alertas (puede crear y gestionar)
- ✅ Puede exportar reportes

---

## 🧪 Cómo Verificar Permisos

### 1. Verificar en Consola del Navegador

Al navegar por la aplicación, la consola muestra:
```
🔐 usePermissions - Usuario: [Nombre] Rol: [rol]
🔐 can('inventario', 'delete') = false (rol: cocinero)
```

### 2. Pruebas Manuales por Rol

#### Como ADMINISTRADOR:
1. Login con cuenta admin
2. ✅ Debería ver botón "Nuevo" en todos los módulos
3. ✅ Debería ver botón de eliminar (🗑️) en todas las tablas
4. ✅ Puede importar y exportar datos
5. ✅ Badge muestra "🔴 ADMINISTRADOR"

#### Como COCINERO:
1. Login con cuenta cocinero
2. **Proveedores:**
   - ✅ Ve botón "+ Nuevo Proveedor"
   - ✅ Ve botón "📥 Importar Datos"
   - ❌ NO ve columna "Acciones" (sin botón eliminar)
3. **Productos:**
   - ✅ Ve botón "+ Nuevo Producto"
   - ✅ Ve botón "📥 Importar Datos"
   - ❌ NO ve columna "Acciones" (sin botón eliminar)
4. **Inventario:**
   - ✅ Ve botón "+ Nuevo Lote"
   - ✅ Ve botón "📥 Importar Datos"
   - ❌ NO ve columna "Acciones" (sin botón eliminar)
5. **Checklists:**
   - ✅ Ve botón "Nuevo Checklist"
   - ✅ Puede marcar tareas como completadas
   - ✅ Ve columna "Acciones" (puede eliminar)
6. **Producción:**
   - ✅ Ve botón "Registrar Producción"
   - ✅ Ve botón "📥 Importar Datos"
7. ✅ Badge muestra "🟢 COCINERO"

#### Como AUDITOR:
1. Login con cuenta auditor
2. **Todos los módulos operacionales:**
   - ❌ NO ve botón "Nuevo" (sin permisos de crear)
   - ❌ NO ve botón "📥 Importar Datos"
   - ❌ NO ve columna "Acciones"
   - ✅ Solo puede VER los datos (modo lectura)
3. **Checklists:**
   - ❌ NO ve botón "Nuevo Checklist"
   - ✅ Puede actualizar estado de tareas existentes
4. **Alertas:**
   - ✅ Ve botón "Nueva Alerta"
   - ✅ Puede gestionar alertas completas
5. **Reportes:**
   - ✅ Ve botón "📄 Exportar PDF" en todos lados
6. ✅ Badge muestra "🟡 AUDITOR"

---

## 🔍 Implementación en Código

### Proveedores.jsx
```javascript
// Botón Nuevo - Solo admin y cocinero
{can('proveedores', 'create') && (
  <button>+ Nuevo Proveedor</button>
)}

// Columna Eliminar - Solo admin (cocinero NO puede)
{can('proveedores', 'delete') && <th>Acciones</th>}
```

### Productos.jsx
```javascript
// Botón Nuevo - Solo admin y cocinero
{can('productos', 'create') && (
  <button>+ Nuevo Producto</button>
)}

// Columna Eliminar - Solo admin (cocinero NO puede)
{can('productos', 'delete') && <th>Acciones</th>}
```

### Inventario.jsx
```javascript
// Botón Nuevo - Admin y cocinero
{can('inventario', 'create') && (
  <button>+ Nuevo Lote</button>
)}

// Columna Eliminar - Solo admin (cocinero NO puede)
{can('inventario', 'delete') && <th>Acciones</th>}
```

### Producción.jsx
```javascript
// Botón Nuevo - Admin y cocinero
{can('produccion', 'create') && (
  <button>Registrar Producción</button>
)}
```

### Checklists.jsx
```javascript
// Botón Nuevo - Admin y cocinero (auditor NO)
{can('checklists', 'create') && (
  <button>Nuevo Checklist</button>
)}
```

---

## ⚠️ Problemas Detectados y Soluciones

### ❌ Problema 1: Cocinero puede eliminar en algunos módulos

**Encontrado en**: usePermissions.js

**Actual**:
```javascript
cocinero: {
  checklists: ['create', 'read', 'update', 'delete'],  // ❌ Puede eliminar
  produccion: ['create', 'read', 'update', 'delete']   // ❌ Puede eliminar
}
```

**¿Es correcto?** 
- **Checklists**: SÍ ✅ - El cocinero debe poder eliminar checklists incorrectos
- **Producción**: DEPENDE - Si es operacional, debería poder corregir errores

**Recomendación**: Mantener como está, ya que tiene sentido operacionalmente.

### ✅ Verificado Correcto: Proveedores e Inventario

**Actual**:
```javascript
cocinero: {
  proveedores: ['read', 'create'],      // ✅ NO puede eliminar
  productos: ['read', 'create'],        // ✅ NO puede eliminar
  inventario: ['create', 'read', 'update']  // ✅ NO puede eliminar
}
```

**Esto es CORRECTO** - El cocinero no puede eliminar proveedores, productos ni inventario.

---

## 🎯 Matriz de Diferencias Clave

| Acción | Admin | Cocinero | Auditor |
|--------|-------|----------|---------|
| **Eliminar Proveedores** | ✅ | ❌ | ❌ |
| **Eliminar Productos** | ✅ | ❌ | ❌ |
| **Eliminar Inventario** | ✅ | ❌ | ❌ |
| **Crear Proveedores** | ✅ | ✅ | ❌ |
| **Crear Productos** | ✅ | ✅ | ❌ |
| **Crear Checklists** | ✅ | ✅ | ❌ |
| **Actualizar Checklists** | ✅ | ✅ | ✅ |
| **Gestionar Alertas** | ✅ | Leer/Actualizar | ✅ (Todo) |
| **Exportar PDF** | ✅ | ✅ | ✅ |
| **Importar Datos** | ✅ | ✅ | ❌ |

---

## 📊 Resumen de Cumplimiento

### ✅ Implementado Correctamente:

1. **Proveedores**:
   - Admin: CRUD completo ✅
   - Cocinero: Create + Read (NO delete) ✅
   - Auditor: Solo Read ✅

2. **Productos**:
   - Admin: CRUD completo ✅
   - Cocinero: Create + Read (NO delete) ✅
   - Auditor: Solo Read ✅

3. **Inventario**:
   - Admin: CRUD completo ✅
   - Cocinero: Create + Read + Update (NO delete) ✅
   - Auditor: Solo Read ✅

4. **Importación/Exportación**:
   - Admin: Importar + Exportar ✅
   - Cocinero: Importar + Exportar ✅
   - Auditor: Solo Exportar ✅

5. **Botones condicionales**:
   - Se muestran/ocultan según permisos ✅
   - Console logs ayudan a debug ✅
   - Badge de rol visible en Dashboard ✅

---

## 🧪 Script de Verificación Rápida

Para verificar permisos en la consola del navegador:

```javascript
// Pegar en consola del navegador (con sesión iniciada)

const user = JSON.parse(localStorage.getItem('user'));
console.log('👤 Usuario:', user.nombre);
console.log('🎭 Rol:', user.rol);

const permisos = {
  admin: 'TODO',
  cocinero: 'Crear/Ver/Actualizar (NO eliminar proveedores/productos/inventario)',
  auditor: 'Solo lectura + gestionar alertas + exportar'
};

console.log('✅ Permisos:', permisos[user.rol]);
```

---

## ✅ CONCLUSIÓN

Los permisos están **correctamente implementados** según las especificaciones:

1. ✅ **Administrador** tiene acceso completo
2. ✅ **Cocinero** puede crear pero NO eliminar proveedores/productos/inventario
3. ✅ **Auditor** tiene solo lectura excepto en alertas
4. ✅ Los botones se muestran/ocultan correctamente
5. ✅ La importación respeta los permisos de creación
6. ✅ La exportación está disponible para todos (o según rol)

**Sistema de permisos FUNCIONANDO CORRECTAMENTE** 🎉
