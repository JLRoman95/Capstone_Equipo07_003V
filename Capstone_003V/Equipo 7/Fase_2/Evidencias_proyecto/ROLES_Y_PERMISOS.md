# 👥 ROLES Y PERMISOS DEL SISTEMA

## 📋 ROLES DISPONIBLES

El sistema cuenta con **3 roles** distintos, cada uno con permisos específicos según sus responsabilidades:

1. **Administrador** (admin)
2. **Cocinero** (cocinero)
3. **Auditor** (auditor)

---

## 🔐 PERMISOS POR ROL

### 1. 👨‍💼 ADMINISTRADOR (`admin`)

**Descripción:** Control total del sistema. Gestiona usuarios, configuraciones y tiene acceso a todas las funcionalidades.

#### ✅ Permisos Completos (CRUD):
- ✅ **Usuarios**: Crear, ver, modificar, eliminar usuarios
- ✅ **Proveedores**: Crear, ver, modificar, eliminar proveedores
- ✅ **Productos**: Crear, ver, modificar, eliminar productos
- ✅ **Inventario**: Crear, ver, modificar, eliminar lotes
- ✅ **Checklists**: Crear, ver, modificar, eliminar checklists
- ✅ **Producción**: Crear, ver, modificar, eliminar registros
- ✅ **Alertas**: Crear, ver, modificar, eliminar alertas
- ✅ **Reportes**: Ver y exportar reportes

#### 🎯 Casos de Uso:
- Gestionar cuentas de usuarios del sistema
- Configurar proveedores y productos
- Supervisar todas las operaciones
- Generar reportes gerenciales
- Resolver alertas críticas del sistema
- Auditar todas las actividades

---

### 2. 👨‍🍳 COCINERO (`cocinero`)

**Descripción:** Personal operativo de cocina. Responsable del día a día: recepción de productos, registro de producción y control de calidad.

#### ✅ Permisos por Módulo:

**Usuarios:**
- ❌ Sin permisos (no puede gestionar usuarios)

**Proveedores:**
- ✅ **Leer**: Ver listado de proveedores
- ✅ **Crear**: Agregar nuevos proveedores cuando llega un producto nuevo

**Productos:**
- ✅ **Leer**: Ver catálogo de productos
- ✅ **Crear**: Registrar productos nuevos que llegan a la cocina

**Inventario:**
- ✅ **Leer**: Consultar stock disponible
- ✅ **Crear**: Registrar nuevos lotes de productos (FIFO)
- ✅ **Modificar**: Actualizar cantidades al usar productos
- ❌ **Eliminar**: No puede eliminar lotes (muy riesgoso)

**Checklists:**
- ✅ **Leer**: Ver checklists asignados
- ✅ **Crear**: Crear nuevos checklists de turno
- ✅ **Modificar**: Completar tareas del checklist
- ✅ **Eliminar**: Eliminar checklists incorrectos
- 🎯 **Responsabilidad principal**

**Producción:**
- ✅ **Leer**: Ver registros de producción
- ✅ **Crear**: Registrar nuevas producciones del turno
- ✅ **Modificar**: Corregir registros del día
- ✅ **Eliminar**: Eliminar registros incorrectos

**Alertas:**
- ✅ **Leer**: Ver alertas del sistema
- ✅ **Modificar**: Marcar alertas como resueltas en su área

**Reportes:**
- ✅ **Leer**: Solo consulta (sin exportar)

#### 🎯 Casos de Uso:
- Registrar productos recibidos del proveedor
- Crear lotes nuevos en el inventario (con fecha de vencimiento)
- Completar checklists de limpieza e higiene del turno
- Registrar las producciones del día (platos preparados)
- Marcar como usados los productos del inventario
- Ver y resolver alertas de stock bajo en su turno
- Consultar reportes para planificar su trabajo

#### 🚫 Restricciones:
- No puede eliminar lotes de inventario (evita pérdida de trazabilidad)
- No puede gestionar usuarios
- No puede exportar reportes oficiales

---

### 3. 🔍 AUDITOR (`auditor`)

**Descripción:** Encargado de calidad y cumplimiento normativo. Supervisa, audita y genera reportes, pero NO opera el sistema.

#### ✅ Permisos por Módulo:

**Usuarios:**
- ❌ Sin permisos (no puede gestionar usuarios)

**Proveedores:**
- ✅ **Leer**: Solo consulta (verificar certificaciones)
- ❌ **Crear/Modificar/Eliminar**: No puede gestionar proveedores

**Productos:**
- ✅ **Leer**: Solo consulta (verificar fichas técnicas)
- ❌ **Crear/Modificar/Eliminar**: No puede gestionar productos

**Inventario:**
- ✅ **Leer**: Solo consulta (auditar FIFO, vencimientos)
- ❌ **Crear/Modificar/Eliminar**: No puede crear lotes ni modificar stock

**Checklists:**
- ✅ **Leer**: Ver todos los checklists
- ✅ **Modificar**: Aprobar/rechazar checklists, agregar observaciones
- ❌ **Crear/Eliminar**: No crea ni elimina checklists

**Producción:**
- ✅ **Leer**: Solo supervisión (auditar registros)
- ❌ **Crear/Modificar/Eliminar**: No puede crear ni modificar producciones

**Alertas:**
- ✅ **Leer**: Ver todas las alertas
- ✅ **Crear**: Generar alertas de no conformidades detectadas
- ✅ **Modificar**: Actualizar estado de alertas
- ✅ **Eliminar**: Cerrar alertas resueltas
- 🎯 **Gestión completa de no conformidades**

**Reportes:**
- ✅ **Leer**: Ver todos los reportes
- ✅ **Exportar**: Generar informes oficiales en PDF

#### 🎯 Casos de Uso:
- Auditar cumplimiento de checklists de limpieza
- Verificar trazabilidad del inventario (FIFO)
- Revisar registros de producción
- Crear alertas de no conformidades detectadas
- Generar reportes de auditoría para gerencia
- Aprobar/rechazar checklists con observaciones
- Verificar fechas de vencimiento en inventario
- Supervisar que los cocineros sigan los protocolos

#### 🚫 Restricciones:
- No puede crear lotes de inventario (solo audita)
- No puede registrar producciones (solo supervisa)
- No puede gestionar productos ni proveedores (solo consulta)
- No puede eliminar registros históricos

---

## 📊 TABLA COMPARATIVA RÁPIDA

| Módulo | Administrador | Cocinero | Auditor |
|--------|--------------|----------|---------|
| **Usuarios** | ✅ Gestión total | ❌ Sin acceso | ❌ Sin acceso |
| **Proveedores** | ✅ CRUD completo | ✅ Ver + Crear | 👁️ Solo ver |
| **Productos** | ✅ CRUD completo | ✅ Ver + Crear | 👁️ Solo ver |
| **Inventario** | ✅ CRUD completo | ✅ Ver/Crear/Modificar | 👁️ Solo ver |
| **Checklists** | ✅ CRUD completo | ✅ CRUD completo | ✅ Ver + Aprobar |
| **Producción** | ✅ CRUD completo | ✅ CRUD completo | 👁️ Solo ver |
| **Alertas** | ✅ CRUD completo | ✅ Ver + Resolver | ✅ CRUD completo |
| **Reportes** | ✅ Ver + Exportar | 👁️ Solo ver | ✅ Ver + Exportar |

**Leyenda:**
- ✅ = Acceso completo
- 👁️ = Solo lectura/consulta
- ❌ = Sin acceso

---

## 🔄 FLUJO DE TRABAJO TÍPICO

### Escenario: Recepción de productos y control de calidad

1. **Cocinero (Turno Mañana)**:
   - Recibe productos del proveedor
   - Crea nuevo lote en inventario (L20241113)
   - Completa checklist de higiene matutino
   - Registra producción de 80 porciones de cazuela

2. **Auditor**:
   - Revisa el checklist del turno mañana
   - Verifica que el lote tenga fecha de vencimiento correcta
   - Aprueba el checklist con observación: "Mejorar orden en bodega"
   - Genera alerta de "mejora continua" para el área

3. **Administrador**:
   - Revisa alerta del auditor
   - Genera reporte semanal de producción
   - Gestiona usuarios (da de alta nuevo cocinero)

---

## 🎓 RECOMENDACIONES POR ROL

### Para Cocineros:
1. Siempre completa el checklist de tu turno
2. Registra TODOS los lotes con fecha de vencimiento
3. Marca alertas como resueltas cuando termines la acción
4. Revisa las alertas de stock bajo antes de empezar el turno

### Para Auditores:
1. Revisa checklists diariamente
2. Verifica cumplimiento FIFO en inventario
3. Crea alertas descriptivas (qué, dónde, cuándo, cómo corregir)
4. Genera reportes semanales para gerencia

### Para Administradores:
1. Supervisa el trabajo de auditores y cocineros
2. Gestiona usuarios activos del sistema
3. Revisa reportes mensuales
4. Resuelve alertas críticas que otros roles no pueden

---

## 🔒 SEGURIDAD

- ✅ Cada rol solo puede hacer lo que necesita (principio de mínimo privilegio)
- ✅ Las acciones están registradas en Firebase (auditoría)
- ✅ Los permisos se validan en el backend (no se puede saltear desde el frontend)
- ✅ Las alertas críticas requieren aprobación de administrador

---

## 📝 NOTAS IMPORTANTES

1. **Los roles NO son acumulativos**: Un cocinero no puede hacer lo del auditor y viceversa
2. **El administrador puede hacer TODO**: Es el único con control total
3. **Los auditores NO operan**: Solo supervisan y reportan
4. **Los cocineros NO pueden eliminar inventario**: Evita pérdida de trazabilidad
5. **Todos los roles pueden ver alertas**: La seguridad alimentaria es responsabilidad de todos

---

## 🆘 SOPORTE

Si necesitas cambiar tu rol o tienes dudas sobre permisos:
- Contacta al **Administrador del sistema**
- Los roles se asignan al crear la cuenta (no se pueden auto-modificar)
