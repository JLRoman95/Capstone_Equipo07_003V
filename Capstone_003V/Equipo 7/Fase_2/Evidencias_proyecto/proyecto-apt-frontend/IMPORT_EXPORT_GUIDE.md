# Guía de Integración de Importación/Exportación

## ✅ Instalado
- xlsx (para Excel y CSV)
- jspdf (para PDF)
- jspdf-autotable (para tablas en PDF)
- file-saver (para descargas)

## ✅ Creado
1. **src/services/importService.js** - Lectura de Excel/CSV y validaciones
2. **src/services/exportService.js** - Exportación a PDF
3. **src/components/ImportExportButtons.jsx** - Componente reutilizable
4. **src/styles/ImportExport.css** - Estilos

## 📝 Instrucciones de Integración

### Para Productos.jsx

Agregar después de `handleDelete`:

```javascript
const handleImport = async (datos) => {
  try {
    for (const producto of datos) {
      await productosFirebase.crear(producto);
    }
    loadData();
  } catch (error) {
    throw new Error('Error al importar productos: ' + error.message);
  }
};

const handleExport = async () => {
  exportarProductosPDF(productos);
};
```

Agregar antes de la tabla (después del mensaje de error):

```jsx
<ImportExportButtons
  tipo="productos"
  onImport={handleImport}
  onExport={handleExport}
  validarDatos={validarProductos}
  permisoImportar={can('productos', 'create')}
  permisoExportar={true}
/>
```

### Para Inventario.jsx

Agregar después de `handleDelete`:

```javascript
const handleImport = async (datos) => {
  try {
    for (const item of datos) {
      await inventarioFirebase.crear(item);
    }
    loadData();
  } catch (error) {
    throw new Error('Error al importar inventario: ' + error.message);
  }
};

const handleExport = async () => {
  exportarInventarioPDF(inventario);
};
```

Agregar componente:

```jsx
<ImportExportButtons
  tipo="inventario"
  onImport={handleImport}
  onExport={handleExport}
  validarDatos={validarInventario}
  permisoImportar={can('inventario', 'create')}
  permisoExportar={true}
/>
```

### Para Produccion.jsx

Agregar después de `handleDelete`:

```javascript
const handleImport = async (datos) => {
  try {
    for (const registro of datos) {
      await produccionFirebase.crear(registro);
    }
    loadData();
  } catch (error) {
    throw new Error('Error al importar producción: ' + error.message);
  }
};

const handleExport = async () => {
  exportarProduccionPDF(produccion);
};
```

Agregar componente:

```jsx
<ImportExportButtons
  tipo="produccion"
  onImport={handleImport}
  onExport={handleExport}
  validarDatos={validarProduccion}
  permisoImportar={can('produccion', 'create')}
  permisoExportar={true}
/>
```

### Para Checklists.jsx

Solo exportación (no tiene importación):

Agregar después de `handleDelete`:

```javascript
const handleExport = async () => {
  exportarChecklistsPDF(checklists);
};
```

Agregar solo botón de exportación:

```jsx
<div style={{ marginBottom: '20px' }}>
  <button onClick={handleExport} className="btn" style={{ backgroundColor: '#e74c3c', color: 'white' }}>
    📄 Exportar PDF
  </button>
</div>
```

## 🎯 Características

### Importación
- ✅ Soporta **Excel (.xlsx, .xls)** y **CSV**
- ✅ **Validación automática** de datos
- ✅ Muestra **errores detallados** por línea
- ✅ **Omite registros inválidos**, importa solo válidos
- ✅ Descarga de **plantillas** pre-formateadas

### Exportación PDF
- ✅ Tablas formateadas con **jsPDF-autoTable**
- ✅ **Encabezados** con título y fecha
- ✅ **Pie de página** con numeración
- ✅ **Colores** según tipo de dato
- ✅ **Alertas** coloreadas por prioridad
- ✅ **Inventario** con indicador de vencimiento

## 📋 Plantillas Disponibles

Al hacer clic en "Descargar Plantilla" se genera un archivo Excel con:
- **Headers correctos** (nombres de columnas)
- **Datos de ejemplo** (1-2 filas)
- **Formato listo** para completar

## 🔒 Permisos

El componente respeta los permisos:
- **Importar**: Solo si `can(recurso, 'create')`
- **Exportar**: Siempre disponible (lectura)
- **Auditor**: Solo puede exportar
- **Cocinero**: Puede importar y exportar
- **Admin**: Puede todo

## 🧪 Cómo Probar

1. **Descargar plantilla**:
   - Click en "📋 Descargar Plantilla"
   - Abrir Excel, completar datos
   - Guardar

2. **Importar datos**:
   - Click en "📥 Importar Datos"
   - Seleccionar archivo
   - Ver mensajes de éxito/error
   - Verificar tabla actualizada

3. **Exportar PDF**:
   - Click en "📄 Exportar PDF"
   - Se descarga automáticamente
   - Abrir y verificar formato

## 🐛 Validaciones Implementadas

### Proveedores
- ✅ Campos requeridos: nombre, contacto, telefono, email
- ✅ Formato de email válido
- ✅ Normalización de datos (trim, lowercase)

### Productos
- ✅ Campos requeridos: codigo_producto, nombre, categoria, unidad_medida
- ✅ Precio válido (numérico, positivo)
- ✅ Conversión de tipos

### Inventario
- ✅ Cantidad válida (entero positivo)
- ✅ Fechas válidas
- ✅ Fecha vencimiento > Fecha ingreso
- ✅ Estado por defecto: "disponible"

### Producción
- ✅ Fecha válida
- ✅ Turno válido (Mañana, Tarde, Noche)
- ✅ Cantidad positiva
- ✅ Campos requeridos completos

## 📊 Formatos PDF

Cada reporte tiene:
- **Color distintivo** en encabezado
- **Campos específicos** del módulo
- **Totales** cuando aplica (Producción)
- **Estados visuales** (Checklists ✓/✗)
- **Alertas por color** (Inventario: rojo=vencido, naranja=próximo)
- **Paginación** automática

## 🎨 Colores de Encabezados

- 🔵 Proveedores: #2980b9
- 🟢 Productos: #27ae60
- 🟠 Inventario: #e67e22
- 🟣 Producción: #9b59b6
- 🔵 Checklists: #3498db
- 🔴 Alertas: #e74c3c
