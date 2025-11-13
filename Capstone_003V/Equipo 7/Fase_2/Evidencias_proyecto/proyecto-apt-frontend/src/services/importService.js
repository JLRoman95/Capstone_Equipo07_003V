/**
 * Servicio de Importación de Datos
 * Permite importar datos desde archivos Excel (.xlsx) y CSV
 */

import * as XLSX from 'xlsx';

/**
 * Leer archivo Excel o CSV y convertirlo a JSON
 * @param {File} file - Archivo a leer
 * @returns {Promise<Array>} Array de objetos con los datos
 */
export const leerArchivoExcel = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Leer la primera hoja
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convertir a JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          raw: false, // Convertir fechas y números a strings
          dateNF: 'yyyy-mm-dd' // Formato de fecha
        });
        
        resolve(jsonData);
      } catch (error) {
        reject(new Error('Error al leer el archivo: ' + error.message));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Leer archivo CSV
 * @param {File} file - Archivo CSV
 * @returns {Promise<Array>} Array de objetos con los datos
 */
export const leerArchivoCSV = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n');
        
        if (lines.length === 0) {
          reject(new Error('El archivo CSV está vacío'));
          return;
        }
        
        // Primera línea = headers
        const headers = lines[0].split(',').map(h => h.trim().replace(/["\r]/g, ''));
        
        // Convertir líneas a objetos
        const data = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const values = line.split(',').map(v => v.trim().replace(/["\r]/g, ''));
          const obj = {};
          
          headers.forEach((header, index) => {
            obj[header] = values[index] || '';
          });
          
          data.push(obj);
        }
        
        resolve(data);
      } catch (error) {
        reject(new Error('Error al leer el archivo CSV: ' + error.message));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'));
    };
    
    reader.readAsText(file, 'UTF-8');
  });
};

/**
 * Validar y transformar datos de proveedores
 */
export const validarProveedores = (data) => {
  const errores = [];
  const datosValidos = [];
  
  data.forEach((row, index) => {
    const lineNumber = index + 2; // +2 porque Excel empieza en 1 y tiene header
    
    // Validar campos requeridos
    if (!row.nombre || !row.contacto || !row.telefono || !row.email) {
      errores.push(`Línea ${lineNumber}: Faltan campos requeridos (nombre, contacto, telefono, email)`);
      return;
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(row.email)) {
      errores.push(`Línea ${lineNumber}: Email inválido (${row.email})`);
      return;
    }
    
    datosValidos.push({
      nombre: row.nombre.trim(),
      contacto: row.contacto.trim(),
      telefono: row.telefono.toString().trim(),
      email: row.email.trim().toLowerCase(),
      direccion: row.direccion ? row.direccion.trim() : ''
    });
  });
  
  return { datosValidos, errores };
};

/**
 * Validar y transformar datos de productos
 */
export const validarProductos = (data) => {
  const errores = [];
  const datosValidos = [];
  
  data.forEach((row, index) => {
    const lineNumber = index + 2;
    
    // Validar campos requeridos
    if (!row.codigo_producto || !row.nombre || !row.categoria || !row.unidad_medida) {
      errores.push(`Línea ${lineNumber}: Faltan campos requeridos`);
      return;
    }
    
    // Validar precio
    const precio = parseFloat(row.precio_unitario);
    if (isNaN(precio) || precio < 0) {
      errores.push(`Línea ${lineNumber}: Precio inválido (${row.precio_unitario})`);
      return;
    }
    
    datosValidos.push({
      codigo_producto: row.codigo_producto.toString().trim(),
      nombre: row.nombre.trim(),
      categoria: row.categoria.trim(),
      unidad_medida: row.unidad_medida.trim(),
      precio_unitario: precio
    });
  });
  
  return { datosValidos, errores };
};

/**
 * Validar y transformar datos de inventario
 */
export const validarInventario = (data) => {
  const errores = [];
  const datosValidos = [];
  
  data.forEach((row, index) => {
    const lineNumber = index + 2;
    
    // Validar campos requeridos
    if (!row.codigo_producto || !row.lote || !row.cantidad_unidades || !row.fecha_ingreso || !row.fecha_vencimiento) {
      errores.push(`Línea ${lineNumber}: Faltan campos requeridos`);
      return;
    }
    
    // Validar cantidad
    const cantidad = parseInt(row.cantidad_unidades);
    if (isNaN(cantidad) || cantidad <= 0) {
      errores.push(`Línea ${lineNumber}: Cantidad inválida (${row.cantidad_unidades})`);
      return;
    }
    
    // Validar fechas
    const fechaIngreso = new Date(row.fecha_ingreso);
    const fechaVencimiento = new Date(row.fecha_vencimiento);
    
    if (isNaN(fechaIngreso.getTime())) {
      errores.push(`Línea ${lineNumber}: Fecha de ingreso inválida (${row.fecha_ingreso})`);
      return;
    }
    
    if (isNaN(fechaVencimiento.getTime())) {
      errores.push(`Línea ${lineNumber}: Fecha de vencimiento inválida (${row.fecha_vencimiento})`);
      return;
    }
    
    if (fechaVencimiento <= fechaIngreso) {
      errores.push(`Línea ${lineNumber}: Fecha de vencimiento debe ser posterior a fecha de ingreso`);
      return;
    }
    
    datosValidos.push({
      codigo_producto: row.codigo_producto.toString().trim(),
      lote: row.lote.toString().trim(),
      cantidad_unidades: cantidad,
      fecha_ingreso: row.fecha_ingreso,
      fecha_vencimiento: row.fecha_vencimiento,
      estado: row.estado || 'disponible'
    });
  });
  
  return { datosValidos, errores };
};

/**
 * Validar y transformar datos de producción
 */
export const validarProduccion = (data) => {
  const errores = [];
  const datosValidos = [];
  
  data.forEach((row, index) => {
    const lineNumber = index + 2;
    
    // Validar campos requeridos
    if (!row.fecha || !row.responsable || !row.turno || !row.plato || !row.cantidad) {
      errores.push(`Línea ${lineNumber}: Faltan campos requeridos`);
      return;
    }
    
    // Validar cantidad
    const cantidad = parseInt(row.cantidad);
    if (isNaN(cantidad) || cantidad <= 0) {
      errores.push(`Línea ${lineNumber}: Cantidad inválida (${row.cantidad})`);
      return;
    }
    
    // Validar fecha
    const fecha = new Date(row.fecha);
    if (isNaN(fecha.getTime())) {
      errores.push(`Línea ${lineNumber}: Fecha inválida (${row.fecha})`);
      return;
    }
    
    // Validar turno
    const turnosValidos = ['Mañana', 'Tarde', 'Noche'];
    if (!turnosValidos.includes(row.turno)) {
      errores.push(`Línea ${lineNumber}: Turno inválido (debe ser: Mañana, Tarde o Noche)`);
      return;
    }
    
    datosValidos.push({
      fecha: row.fecha,
      responsable: row.responsable.trim(),
      turno: row.turno,
      plato: row.plato.trim(),
      cantidad: cantidad
    });
  });
  
  return { datosValidos, errores };
};

/**
 * Descargar plantilla Excel para importación
 */
export const descargarPlantilla = (tipo) => {
  let headers = [];
  let datos = [];
  
  switch (tipo) {
    case 'proveedores':
      headers = ['nombre', 'contacto', 'telefono', 'email', 'direccion'];
      datos = [
        ['Proveedor Ejemplo S.A.', 'Juan Pérez', '+56912345678', 'contacto@ejemplo.cl', 'Av. Principal 123, Santiago']
      ];
      break;
      
    case 'productos':
      headers = ['codigo_producto', 'nombre', 'categoria', 'unidad_medida', 'precio_unitario'];
      datos = [
        ['PROD001', 'Arroz', 'Granos', 'kg', 1200],
        ['PROD002', 'Pollo', 'Carnes', 'kg', 3500]
      ];
      break;
      
    case 'inventario':
      headers = ['codigo_producto', 'lote', 'cantidad_unidades', 'fecha_ingreso', 'fecha_vencimiento', 'estado'];
      datos = [
        ['PROD001', 'L20241113', 100, '2024-11-13', '2025-11-13', 'disponible']
      ];
      break;
      
    case 'produccion':
      headers = ['fecha', 'responsable', 'turno', 'plato', 'cantidad'];
      datos = [
        ['2024-11-13', 'Jorge González', 'Mañana', 'Cazuela', 80]
      ];
      break;
      
    default:
      throw new Error('Tipo de plantilla no válido');
  }
  
  // Crear workbook
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...datos]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');
  
  // Descargar archivo
  XLSX.writeFile(workbook, `plantilla_${tipo}.xlsx`);
};
