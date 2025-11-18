# Sistema de Recetas y Gestión de Lotes

## 📋 Resumen de Cambios

Se han implementado dos mejoras importantes en el sistema APT:

1. **Módulo de Producción**: Sistema de recetas con lista de ingredientes y descuento automático de inventario
2. **Módulo de Inventario**: Vista agrupada por producto con modal de lotes detallado

---

## 🍽️ Módulo de Producción - Sistema de Recetas

### Funcionalidad Implementada

#### 1. **Creación de Recetas**
- Al registrar una producción, ahora se crea una receta con lista de ingredientes
- Cada ingrediente especifica:
  - Producto (seleccionado del catálogo)
  - Cantidad necesaria por porción
  - Cantidad total calculada automáticamente

#### 2. **Proceso de Registro**
```
1. Usuario ingresa datos del plato (nombre, fecha, responsable, turno)
2. Usuario agrega ingredientes uno por uno con sus cantidades
3. Sistema calcula cantidad total: cantidad_por_porcion × número_porciones
4. Al guardar, sistema verifica disponibilidad en inventario
5. Si hay stock suficiente, descuenta automáticamente usando FIFO
6. Registra la producción con todos los detalles
```

#### 3. **Validaciones Implementadas**
- ✅ Debe tener al menos un ingrediente
- ✅ No se pueden duplicar ingredientes en la misma receta
- ✅ Verifica stock disponible antes de descontar
- ✅ Solo usa lotes NO vencidos
- ✅ Muestra error específico si falta stock

#### 4. **Descuento Automático de Inventario (FIFO)**

El sistema implementa el método FIFO (First In, First Out):

```javascript
// Ejemplo de descuento
Producción: Pollo al Horno - 10 porciones
Ingredientes:
  - Pollo (P001): 0.5 kg/porción → Total: 5 kg
  - Sal (S001): 0.02 kg/porción → Total: 0.2 kg

Inventario antes:
  Lote L001 - Pollo - 3 kg - Vence: 2024-11-20
  Lote L002 - Pollo - 4 kg - Vence: 2024-11-25

Proceso FIFO:
  1. Toma Lote L001 completo (3 kg) → Quedan 2 kg por descontar
  2. Toma del Lote L002 (2 kg) → Descuento completo
  
Inventario después:
  Lote L001 - Pollo - 0 kg (agotado)
  Lote L002 - Pollo - 2 kg (quedan)
```

#### 5. **Interfaz de Usuario**

**Formulario de Producción:**
- Campo para nombre del plato
- Selector de cantidad de porciones
- Sección de ingredientes con:
  - Dropdown de productos disponibles
  - Input numérico para cantidad por porción
  - Botón "Agregar" para añadir a la lista
  - Lista de ingredientes agregados (editable)
  - Cálculo en tiempo real de totales

**Vista de Registros:**
- Tabla expandida con columna "Ingredientes"
- Muestra lista detallada de cada ingrediente usado
- Formato: `Producto: cantidad_por_porción × porciones = total unidades`

---

## 📦 Módulo de Inventario - Gestión por Lotes

### Funcionalidad Implementada

#### 1. **Vista Principal Agrupada**

En lugar de mostrar todos los lotes individualmente, ahora muestra:

**Tabla de Productos:**
| Producto | Total Unidades | Total Lotes | Estado | Acciones |
|----------|---------------|-------------|---------|----------|
| Arroz | 150 kg | 3 lotes | 1 por vencer | 📊 Ver Lotes |
| Pollo | 25 kg | 5 lotes | OK | 📊 Ver Lotes |
| Tomate | 10 kg | 2 lotes | 1 vencido | 📊 Ver Lotes |

**Información Resumida:**
- Suma total de unidades de todos los lotes del producto
- Número total de lotes
- Alertas visuales (vencidos, por vencer)

#### 2. **Modal de Lotes Detallado**

Al hacer clic en "Ver Lotes", se abre un modal con:

**Encabezado:**
- Nombre del producto
- Código del producto
- Total de lotes
- Total de unidades

**Tabla de Lotes:**
| Lote | Cantidad | F. Ingreso | F. Vencimiento | Días Restantes | Estado | Acción |
|------|----------|------------|----------------|----------------|---------|---------|
| L001 | 50 kg | 15/11/2024 | 20/11/2024 | 2 días | ⚠️ Por Vencer | 🗑️ |
| L002 | 100 kg | 10/11/2024 | 10/12/2024 | 22 días | ✓ OK | 🗑️ |

**Características:**
- Ordenado por fecha de vencimiento (FIFO)
- Cálculo de días restantes
- Color-coding por estado:
  - 🔴 Rojo: Vencido
  - 🟡 Amarillo: Por vencer (≤7 días)
  - 🔵 Azul: Próximo a vencer (≤14 días)
  - 🟢 Verde: OK (>14 días)
- Posibilidad de eliminar lotes individuales

#### 3. **Algoritmo de Agrupación**

```javascript
agruparInventarioPorProducto() {
  // Recorre todos los lotes en inventario
  // Agrupa por codigo_producto
  // Calcula:
  //   - total_unidades (suma de todos los lotes)
  //   - lotes_por_vencer (≤7 días)
  //   - lotes_vencidos
  // Retorna array de productos únicos
}
```

#### 4. **Ventajas del Nuevo Sistema**

✅ **Vista más limpia**: Un solo registro por producto en lugar de docenas de lotes
✅ **Información rápida**: Se ve de un vistazo qué productos tienen problemas
✅ **Detalles on-demand**: Modal solo cuando se necesita ver lotes específicos
✅ **FIFO visual**: Los lotes se muestran en orden de uso
✅ **Gestión eficiente**: Fácil identificar qué lotes eliminar o usar primero

---

## 🔄 Flujo de Trabajo Completo

### Escenario: Producción de "Arroz con Pollo"

#### Paso 1: Registrar Producción
```
Usuario en módulo Producción:
1. Plato: "Arroz con Pollo"
2. Cantidad: 20 porciones
3. Ingredientes:
   - Arroz → 0.1 kg/porción → Total: 2 kg
   - Pollo → 0.15 kg/porción → Total: 3 kg
   - Sal → 0.01 kg/porción → Total: 0.2 kg
4. Click "Guardar"
```

#### Paso 2: Verificación Automática
```
Sistema verifica inventario:
✓ Arroz: 5 kg disponibles (suficiente)
✓ Pollo: 8 kg disponibles (suficiente)
✓ Sal: 1 kg disponible (suficiente)
```

#### Paso 3: Descuento FIFO
```
Sistema descuenta automáticamente:

Arroz (necesita 2 kg):
  Lote L-ARR-001: 1 kg (Vence: 25/11) → Usa todo → 0 kg
  Lote L-ARR-002: 5 kg (Vence: 30/11) → Usa 1 kg → 4 kg

Pollo (necesita 3 kg):
  Lote L-POL-001: 3 kg (Vence: 22/11) → Usa todo → 0 kg

Sal (necesita 0.2 kg):
  Lote L-SAL-001: 1 kg (Vence: 01/12) → Usa 0.2 kg → 0.8 kg
```

#### Paso 4: Registro Guardado
```
Producción registrada:
  ID: PROD-001
  Plato: Arroz con Pollo
  Cantidad: 20 porciones
  Ingredientes: [
    { codigo: 'ARR-001', cantidad_por_porcion: 0.1, cantidad_total: 2 },
    { codigo: 'POL-001', cantidad_por_porcion: 0.15, cantidad_total: 3 },
    { codigo: 'SAL-001', cantidad_por_porcion: 0.01, cantidad_total: 0.2 }
  ]
```

#### Paso 5: Vista en Inventario
```
Usuario ve en Inventario:
- Arroz: 4 kg (1 lote activo)
- Pollo: 5 kg (0 lotes del agotado, otros lotes disponibles)
- Sal: 0.8 kg (1 lote)

Al hacer clic en "Ver Lotes" de Arroz:
  Lote L-ARR-002: 4 kg, Vence: 30/11, Estado: OK
```

---

## 📊 Estructura de Datos Firestore

### Colección: `produccion`

```javascript
{
  id: "PROD-001",
  fecha: "2024-11-18",
  responsable: "Juan Pérez",
  turno: "Mañana",
  plato: "Arroz con Pollo",
  cantidad: 20,
  ingredientes: [
    {
      codigo_producto: "ARR-001",
      cantidad_necesaria: 0.1,        // Por porción
      cantidad_total: 2                // Total usado
    },
    {
      codigo_producto: "POL-001",
      cantidad_necesaria: 0.15,
      cantidad_total: 3
    }
  ],
  creado_en: "2024-11-18T10:30:00Z"
}
```

### Colección: `inventario`

```javascript
// Múltiples documentos por producto (un doc = un lote)
{
  id: "INV-001",
  codigo_producto: "ARR-001",
  lote: "L-ARR-001",
  cantidad_unidades: 5,
  fecha_ingreso: "2024-11-15",
  fecha_vencimiento: "2024-12-15",
  estado: "disponible"
}
```

---

## 🎨 Componentes Modificados

### 1. **Produccion.jsx**

**Estados agregados:**
```javascript
const [ingredienteActual, setIngredienteActual] = useState({
  codigo_producto: '',
  cantidad_necesaria: ''
});
const [successMessage, setSuccessMessage] = useState('');
```

**Funciones nuevas:**
- `agregarIngrediente()` - Añade ingrediente a la receta
- `eliminarIngrediente()` - Remueve ingrediente de la receta
- `handleSubmit()` - Validación, verificación de stock, descuento FIFO

**Importaciones necesarias:**
```javascript
import { inventarioFirebase } from '../services/firestoreService';
```

### 2. **Inventario.jsx**

**Estados agregados:**
```javascript
const [showLotesModal, setShowLotesModal] = useState(false);
const [productoSeleccionado, setProductoSeleccionado] = useState(null);
const [lotesProducto, setLotesProducto] = useState([]);
```

**Funciones nuevas:**
- `agruparInventarioPorProducto()` - Agrupa lotes por producto
- `verLotesProducto()` - Abre modal con lotes del producto

### 3. **exportService.js**

**Función modificada:**
```javascript
exportarProduccionPDF(produccion)
```

**Cambios:**
- Columna adicional "Ingredientes" en el PDF
- Formato compacto: `COD (cantidad)` separados por comas
- Ajuste de anchos de columna para que quepa todo

---

## ⚠️ Consideraciones Importantes

### 1. **Datos Existentes**
- Las producciones creadas antes de esta actualización no tendrán ingredientes
- Se muestra "Sin detalles" en la tabla para registros antiguos
- No afecta la funcionalidad, solo la visualización

### 2. **Rendimiento**
- La agrupación de inventario se hace en el cliente (React)
- Con inventarios grandes (>1000 lotes), podría ser lento
- Solución futura: Agregar índices en Firestore y agrupar en backend

### 3. **Validación de Stock**
- Solo verifica stock en el momento del registro
- Si otro usuario agota un producto simultáneamente, puede fallar
- Solución futura: Usar transacciones de Firestore

### 4. **Eliminación de Lotes**
- Eliminar un lote desde el modal cierra el modal automáticamente
- Hay que volver a abrir para ver los lotes actualizados
- Esto es intencional para evitar confusión

---

## 🚀 Próximas Mejoras Sugeridas

### Alta Prioridad
1. **Recetas guardadas**: Crear catálogo de recetas predefinidas
2. **Historial de uso**: Gráficos de consumo por ingrediente
3. **Alertas de stock bajo**: Notificar cuando un producto está por agotarse

### Media Prioridad
4. **Edición de producción**: Permitir modificar recetas ya registradas
5. **Costo por plato**: Calcular costo total basado en precios de productos
6. **Exportar recetas**: PDF con las recetas completas

### Baja Prioridad
7. **Unidades múltiples**: Soportar kg, unidades, litros, etc.
8. **Conversiones**: Sistema de conversión entre unidades
9. **Merge de lotes**: Unificar lotes del mismo producto con misma fecha

---

## 📝 Testing Manual

### Test 1: Crear Producción con Ingredientes
1. Ir a módulo Producción
2. Clic en "Registrar Producción"
3. Llenar datos básicos
4. Agregar 2-3 ingredientes con cantidades
5. Verificar cálculo de totales
6. Guardar y verificar que aparece en la tabla
7. Verificar que la columna "Ingredientes" muestra los detalles

### Test 2: Descuento de Inventario
1. Anotar cantidad de un producto en Inventario
2. Crear producción usando ese producto
3. Volver a Inventario
4. Verificar que la cantidad disminuyó correctamente

### Test 3: FIFO
1. Crear 2 lotes del mismo producto con fechas diferentes
2. Crear producción que use ese producto
3. Verificar que se descuenta del lote con fecha más cercana

### Test 4: Vista Agrupada de Inventario
1. Ir a módulo Inventario
2. Verificar que se ven productos únicos
3. Clic en "Ver Lotes" de un producto
4. Verificar modal con todos los lotes
5. Verificar ordenamiento por fecha de vencimiento

### Test 5: Exportar PDF Producción
1. Crear varias producciones con ingredientes
2. Exportar a PDF
3. Verificar que aparece columna "Ingredientes"
4. Verificar que los datos son correctos

---

## 🐛 Solución de Problemas

### Problema: "Inventario insuficiente"
**Causa**: No hay stock suficiente de algún ingrediente
**Solución**: 
1. Revisar mensaje de error (dice qué producto falta)
2. Ir a Inventario → Ver lotes del producto
3. Agregar nuevo lote o reducir cantidad de porciones

### Problema: Ingredientes no aparecen en tabla
**Causa**: Producciones antiguas sin ingredientes
**Solución**: Normal, solo afecta registros anteriores a la actualización

### Problema: Modal de lotes vacío
**Causa**: Producto sin lotes registrados
**Solución**: Ir a "Nuevo Lote" y crear al menos un lote del producto

### Problema: Se descuenta de lotes vencidos
**Causa**: Bug en validación de fechas
**Solución**: Verificar que las fechas de vencimiento estén correctas en inventario

---

## 📚 Referencias

- [Documentación Firestore](https://firebase.google.com/docs/firestore)
- [Sistema FIFO](https://es.wikipedia.org/wiki/FIFO)
- [React useState Hook](https://react.dev/reference/react/useState)
- [jsPDF autoTable](https://github.com/simonbengtsson/jsPDF-AutoTable)

---

**Fecha de implementación**: 18 de noviembre, 2024  
**Versión del sistema**: 2.0  
**Desarrollador**: GitHub Copilot (Claude Sonnet 4.5)
