# 👁️ PERMISOS VISIBLES EN LA INTERFAZ

## 🎨 DIFERENCIAS VISUALES POR ROL

### 1. 🏷️ **Badge de Rol en Dashboard**

En la esquina superior derecha del Dashboard verás un badge de color según tu rol:

- 🔴 **Rojo** = Administrador
- 🟡 **Naranja** = Auditor  
- 🟢 **Verde** = Cocinero

---

### 2. 📦 **INVENTARIO**

#### Como **ADMINISTRADOR** (admin):
```
✅ Botón "Nuevo Lote" visible
✅ Columna "Acciones" con botón 🗑️ eliminar
✅ Puede crear, ver y eliminar lotes
```

#### Como **COCINERO** (cocinero):
```
✅ Botón "Nuevo Lote" visible
❌ Columna "Acciones" OCULTA (sin botón eliminar)
✅ Puede crear y ver lotes
❌ NO puede eliminar lotes (protección de trazabilidad)
```

#### Como **AUDITOR** (auditor):
```
❌ Botón "Nuevo Lote" OCULTO
❌ Columna "Acciones" OCULTA
👁️ Solo puede VER la tabla (modo lectura)
```

**Subtítulo visible:**
- Administrador: "Gestión de inventario con sistema FIFO • Administrador"
- Cocinero: "Gestión de inventario con sistema FIFO • Cocinero"
- Auditor: "Gestión de inventario con sistema FIFO • Auditor"

---

### 3. 🥘 **PRODUCTOS**

#### Como **ADMINISTRADOR** (admin):
```
✅ Botón "Nuevo Producto" visible
✅ Columna "Acciones" con botón 🗑️ eliminar
✅ Puede crear, ver y eliminar productos
```

#### Como **COCINERO** (cocinero):
```
✅ Botón "Nuevo Producto" visible
❌ Columna "Acciones" OCULTA
✅ Puede crear productos nuevos que llegan
✅ Puede ver el catálogo completo
❌ NO puede eliminar productos
```

#### Como **AUDITOR** (auditor):
```
❌ Botón "Nuevo Producto" OCULTO
❌ Columna "Acciones" OCULTA
👁️ Solo puede VER el catálogo (verificar fichas técnicas)
```

---

### 4. 🚚 **PROVEEDORES**

#### Como **ADMINISTRADOR** (admin):
```
✅ Botón "Nuevo Proveedor" visible
✅ Columna "Acciones" con botón 🗑️ eliminar
✅ Puede crear, ver y eliminar proveedores
```

#### Como **COCINERO** (cocinero):
```
✅ Botón "Nuevo Proveedor" visible
❌ Columna "Acciones" OCULTA
✅ Puede registrar proveedores nuevos
✅ Puede ver la lista completa
❌ NO puede eliminar proveedores
```

#### Como **AUDITOR** (auditor):
```
❌ Botón "Nuevo Proveedor" OCULTO
❌ Columna "Acciones" OCULTA
👁️ Solo puede VER la lista (verificar certificaciones)
```

---

### 5. 👨‍🍳 **PRODUCCIÓN**

#### Como **ADMINISTRADOR** (admin):
```
✅ Botón "Registrar Producción" visible
✅ Puede crear y ver registros de producción
```

#### Como **COCINERO** (cocinero):
```
✅ Botón "Registrar Producción" visible
✅ Puede registrar las producciones de su turno
✅ Puede ver el historial completo
```

#### Como **AUDITOR** (auditor):
```
❌ Botón "Registrar Producción" OCULTO
👁️ Solo puede VER los registros (supervisión)
❌ NO puede crear producciones (solo audita)
```

---

### 6. ✅ **CHECKLISTS**

#### Como **ADMINISTRADOR** (admin):
```
✅ Botón "Nuevo Checklist" visible
✅ Puede crear, ver, modificar y eliminar checklists
```

#### Como **COCINERO** (cocinero):
```
✅ Botón "Nuevo Checklist" visible
✅ Puede crear checklists de su turno
✅ Puede completar tareas
✅ Puede eliminar checklists incorrectos
🎯 Responsabilidad principal del rol
```

#### Como **AUDITOR** (auditor):
```
❌ Botón "Nuevo Checklist" OCULTO
✅ Puede VER todos los checklists
✅ Puede APROBAR/RECHAZAR checklists
✅ Puede agregar OBSERVACIONES
❌ NO puede crear ni eliminar checklists
```

---

### 7. 🚨 **ALERTAS**

#### Como **ADMINISTRADOR** (admin):
```
✅ Acceso completo a todas las alertas
✅ Puede crear, ver, modificar y eliminar
```

#### Como **COCINERO** (cocinero):
```
✅ Puede VER todas las alertas
✅ Puede RESOLVER alertas de su área
❌ NO puede crear nuevas alertas
```

#### Como **AUDITOR** (auditor):
```
✅ Puede CREAR alertas de no conformidades
✅ Puede VER todas las alertas
✅ Puede MODIFICAR y CERRAR alertas
🎯 Gestión completa de no conformidades
```

---

### 8. 📊 **REPORTES**

#### Como **ADMINISTRADOR** (admin):
```
✅ Puede ver todos los reportes
✅ Puede EXPORTAR en PDF
```

#### Como **COCINERO** (cocinero):
```
✅ Puede VER reportes
❌ NO puede exportar (solo consulta)
```

#### Como **AUDITOR** (auditor):
```
✅ Puede VER todos los reportes
✅ Puede EXPORTAR reportes oficiales en PDF
```

---

## 🔍 CÓMO VERIFICAR LOS PERMISOS

### Opción 1: Crear 3 usuarios de prueba

Puedes crear 3 cuentas diferentes para probar:

1. **Usuario Administrador**:
   - Email: `admin@apt.com`
   - Rol: Administrador
   - Verás TODOS los botones y acciones

2. **Usuario Cocinero**:
   - Email: `cocinero@apt.com`
   - Rol: Cocinero
   - NO verás botones de eliminar en Inventario/Productos/Proveedores

3. **Usuario Auditor**:
   - Email: `auditor@apt.com`
   - Rol: Auditor
   - NO verás botones de crear en Inventario/Productos/Proveedores/Producción

### Opción 2: Cambiar rol en Firebase Console

1. Ve a Firebase Console → Firestore Database
2. Busca tu usuario en la colección `usuarios`
3. Edita el campo `rol` a: `admin`, `cocinero` o `auditor`
4. Cierra sesión y vuelve a iniciar sesión
5. Verás la interfaz cambiar según el nuevo rol

---

## 📸 RESUMEN VISUAL

### Tabla de Botones Visibles

| Página | Botón | Admin | Cocinero | Auditor |
|--------|-------|-------|----------|---------|
| **Inventario** | + Nuevo Lote | ✅ | ✅ | ❌ |
| **Inventario** | 🗑️ Eliminar | ✅ | ❌ | ❌ |
| **Productos** | + Nuevo Producto | ✅ | ✅ | ❌ |
| **Productos** | 🗑️ Eliminar | ✅ | ❌ | ❌ |
| **Proveedores** | + Nuevo Proveedor | ✅ | ✅ | ❌ |
| **Proveedores** | 🗑️ Eliminar | ✅ | ❌ | ❌ |
| **Producción** | + Registrar | ✅ | ✅ | ❌ |
| **Checklists** | + Nuevo Checklist | ✅ | ✅ | ❌ |

---

## 🎯 CASOS DE USO VISUALES

### Escenario 1: Auditor revisa inventario

1. Auditor inicia sesión
2. Ve badge **🟡 AUDITOR** en dashboard
3. Entra a "Inventario"
4. Ve el subtítulo: "Gestión de inventario con sistema FIFO • **Auditor**"
5. **NO ve** botón "Nuevo Lote"
6. **NO ve** columna "Acciones" ni botones eliminar
7. Puede revisar fechas de vencimiento y lotes FIFO
8. No puede crear ni eliminar nada (solo audita)

### Escenario 2: Cocinero registra producción

1. Cocinero inicia sesión
2. Ve badge **🟢 COCINERO** en dashboard
3. Entra a "Producción"
4. Ve el subtítulo: "Registro de producción de alimentos • **Cocinero**"
5. **SÍ ve** botón "Registrar Producción"
6. Registra: "Cazuela de Vacuno - 80 porciones"
7. Puede ver su registro en la tabla

### Escenario 3: Cocinero intenta eliminar inventario

1. Cocinero entra a "Inventario"
2. Ve botón "Nuevo Lote" (puede crear)
3. **NO ve** botón 🗑️ en la tabla (protección)
4. Puede crear lotes pero no eliminarlos
5. Seguridad: No puede borrar trazabilidad

---

## ⚙️ IMPLEMENTACIÓN TÉCNICA

Los permisos se controlan con el hook `usePermissions()`:

```javascript
const { can, getRoleName, isRole } = usePermissions();

// Mostrar botón solo si tiene permiso
{can('inventario', 'create') && (
  <button>+ Nuevo Lote</button>
)}

// Mostrar columna solo si tiene permiso
{can('inventario', 'delete') && <th>Acciones</th>}

// Mostrar rol actual
<p>{getRoleName()}</p>  // "Administrador", "Cocinero", "Auditor"
```

---

## 🔒 SEGURIDAD

- ✅ Los botones se OCULTAN si no tienes permiso (no solo se deshabilitan)
- ✅ Si intentas acceder por URL directa, el backend valida permisos
- ✅ No puedes "inspeccionar elemento" para ver botones ocultos
- ✅ El rol se muestra claramente en el header (badge de color)
- ✅ Cada página muestra tu rol en el subtítulo

---

## 🆘 PREGUNTAS FRECUENTES

**P: ¿Puedo cambiar mi propio rol?**
R: No. Solo el administrador puede cambiar roles desde Firebase Console.

**P: ¿Por qué no veo el botón "Nuevo Lote" en Inventario?**
R: Porque eres Auditor. Los auditores solo pueden VER datos, no crearlos.

**P: ¿Por qué puedo crear productos pero no eliminarlos?**
R: Porque eres Cocinero. Puedes registrar productos nuevos que llegan, pero no eliminar (evita pérdida de datos).

**P: ¿Cómo sé qué rol tengo?**
R: Mira el badge de color en la esquina superior derecha del Dashboard:
- 🔴 Rojo = Administrador
- 🟡 Naranja = Auditor
- 🟢 Verde = Cocinero

---

¡Ahora los permisos son **completamente visibles** en la interfaz! 🎉
