# 🚀 Guía Rápida - Sistema APT

## ⚡ Inicio Rápido (3 pasos)

### 1️⃣ Ejecutar el Script Automático
```
Hacer doble clic en: INICIAR_SISTEMA.bat
```

### 2️⃣ Abrir el Navegador
```
http://localhost:3000
```

### 3️⃣ Iniciar Sesión
```
Email: admin@apt.com
Contraseña: admin123
```

---

## 📱 Navegación del Sistema

```
┌─────────────────────────────────────────────┐
│          🏠 DASHBOARD                       │
│  Vista general con estadísticas             │
└─────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
┌───────▼──────┐       ┌────────▼─────┐
│ 📦 INVENTARIO│       │ 🥘 PRODUCTOS │
│ - Ver lotes  │       │ - Crear      │
│ - Crear lote │       │ - Editar     │
│ - FIFO       │       │ - Eliminar   │
└──────────────┘       └──────────────┘
        │                       │
┌───────▼──────┐       ┌────────▼─────┐
│ 🚚 PROVEEDORES│      │ ✅ CHECKLISTS│
│ - Gestión    │       │ - Calidad    │
│ - Contactos  │       │ - Turnos     │
└──────────────┘       └──────────────┘
        │                       │
┌───────▼──────┐       ┌────────▼─────┐
│ 👨‍🍳 PRODUCCIÓN│      │ 📊 REPORTES  │
│ - Registrar  │       │ - PDF        │
│ - Historial  │       │ - Descargar  │
└──────────────┘       └──────────────┘
```

---

## 🎯 Flujo de Trabajo Típico

### Día 1: Configuración Inicial

1. **Crear Proveedores**
   ```
   Dashboard → Proveedores → + Nuevo Proveedor
   ```

2. **Crear Productos**
   ```
   Dashboard → Productos → + Nuevo Producto
   ```

3. **Registrar Inventario**
   ```
   Dashboard → Inventario → + Nuevo Lote
   ```

### Día 2+: Operación Diaria

1. **Revisar Dashboard**
   - Ver alertas activas
   - Revisar estadísticas

2. **Crear Checklist del Día**
   ```
   Dashboard → Checklists → + Nuevo Checklist
   ```

3. **Registrar Producción**
   ```
   Dashboard → Producción → + Registrar Producción
   ```

4. **Generar Reportes**
   ```
   Dashboard → Reportes → Generar Reporte
   ```

---

## 🎨 Códigos de Color

### Estado de Inventario
- 🟢 **Verde (OK)**: Producto en buen estado
- 🟡 **Amarillo (Por Vencer)**: Menos de 7 días para caducar
- 🔴 **Rojo (Vencido)**: Producto caducado

### Estados de Checklist
- 🟡 **Amarillo**: Pendiente
- 🟢 **Verde**: Completo

---

## ⚠️ Alertas del Sistema

El sistema genera alertas automáticas para:

| Tipo | Condición | Acción Recomendada |
|------|-----------|-------------------|
| 🔴 Stock Bajo | Stock < Stock Mínimo | Realizar pedido |
| 🟡 Por Vencer | Caducidad < 7 días | Usar pronto |
| 🔴 Vencido | Fecha pasada | Eliminar producto |

---

## 📋 Atajos de Teclado

- `Esc` - Cerrar modales
- `Enter` - Enviar formularios
- Click en tarjetas - Navegar a módulo

---

## 🔧 Resolución de Problemas Comunes

### ❌ "No se puede conectar al servidor"
**Solución:** Verificar que el backend esté corriendo en puerto 4000

### ❌ "Error de autenticación"
**Solución:** Volver a hacer login

### ❌ "La página no carga"
**Solución:** 
1. Refrescar navegador (F5)
2. Limpiar caché
3. Verificar consola de errores

---

## 📊 Ejemplo de Uso: Registro de Inventario

```
1. Click en "Inventario" desde Dashboard
2. Click en "+ Nuevo Lote"
3. Completar formulario:
   - Seleccionar producto: "Pollo"
   - Stock actual: 50
   - Stock mínimo: 10
   - Fecha de caducidad: 2024-12-31
4. Click en "Guardar"
5. ✅ Lote registrado con éxito
```

---

## 🎓 Roles y Permisos

### 👑 Admin
- Acceso completo a todos los módulos
- Puede eliminar registros
- Gestión de usuarios

### 👨‍🍳 Cocinero
- Gestión de inventario (crear/editar)
- Registro de producción
- Checklists
- Ver reportes

### 👁️ Auditor
- Solo lectura en inventario
- Checklists
- Ver reportes
- No puede crear/editar

---

## 📱 Pantallas Principales

### Login
```
┌─────────────────────────┐
│   Sistema APT           │
│                         │
│   Email: [_________]    │
│   Pass:  [_________]    │
│                         │
│   [Iniciar Sesión]      │
│                         │
│   ¿No tienes cuenta?    │
└─────────────────────────┘
```

### Dashboard
```
┌───────────────────────────────┐
│ Sistema APT    [Usuario] [X]  │
├───────────────────────────────┤
│ ⚠️ 3 Alertas Activas          │
├───────────────────────────────┤
│ [📦]  [🥘]  [🚚]              │
│ [✅]  [👨‍🍳]  [📊]             │
├───────────────────────────────┤
│ 📦 25  👨‍🍳 10  ⚠️ 3         │
└───────────────────────────────┘
```

---

## 💡 Tips y Mejores Prácticas

1. **Revisar Dashboard diariamente** para ver alertas
2. **Registrar inventario inmediatamente** al recibir productos
3. **Usar sistema FIFO** - el sistema lo hace automático
4. **Generar reportes semanalmente** para análisis
5. **Completar checklists diarios** para control de calidad
6. **Mantener datos de proveedores actualizados**

---

## 📞 Soporte

Para problemas técnicos:
1. Revisar `INSTRUCCIONES_EJECUCION.md`
2. Revisar `RESUMEN_PROYECTO.md`
3. Consultar Swagger: http://localhost:4000/api-docs

---

**¡Listo para usar! 🎉**

```
   _____ _     _                        
  / ____(_)   | |                       
 | (___  _ ___| |_ ___ _ __ ___   __ _  
  \___ \| / __| __/ _ \ '_ ` _ \ / _` | 
  ____) | \__ \ ||  __/ | | | | | (_| | 
 |_____/|_|___/\__\___|_| |_| |_|\__,_| 
                                        
        ___  ____  ______ 
       /   |/ __ \/_  __/ 
      / /| / /_/ / / /    
     / ___ \____/ / /     
    /_/  |_|     /_/      
                          
```
