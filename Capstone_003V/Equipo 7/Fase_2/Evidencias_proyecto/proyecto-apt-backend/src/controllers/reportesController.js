import { pool } from '../config/db.js';
import PDFDocument from 'pdfkit';

/**
 * Generar reporte estadístico de checklists
 */
export const reporteChecklists = async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, formato = 'json' } = req.query;

    let query = `
      SELECT 
        DATE(c.fecha) as fecha,
        c.estado,
        COUNT(*) as total
      FROM checklists c
      WHERE 1=1
    `;
    const params = [];

    if (fecha_desde) {
      params.push(fecha_desde);
      query += ` AND c.fecha >= $${params.length}`;
    }
    if (fecha_hasta) {
      params.push(fecha_hasta);
      query += ` AND c.fecha <= $${params.length}`;
    }

    query += ` GROUP BY DATE(c.fecha), c.estado ORDER BY fecha DESC`;

    const result = await pool.query(query, params);

    // Estadísticas generales (sin pendientes, solo completos)
    const statsQuery = `
      SELECT 
        COUNT(*) as total_checklists,
        COUNT(CASE WHEN estado = 'completo' THEN 1 END) as completos
      FROM checklists
      WHERE ($1::date IS NULL OR fecha >= $1::date)
        AND ($2::date IS NULL OR fecha <= $2::date)
    `;
    const statsResult = await pool.query(statsQuery, [fecha_desde || null, fecha_hasta || null]);

    // Estadísticas de items (para mostrar items OK)
    const itemsQuery = `
      SELECT 
        COUNT(*) as total_items,
        COUNT(CASE WHEN ci.resultado = 'ok' THEN 1 END) as items_ok,
        COUNT(CASE WHEN ci.resultado = 'no_ok' THEN 1 END) as items_no_ok
      FROM checklist_items ci
      JOIN checklists c ON ci.id_checklist = c.id_checklist
      WHERE ($1::date IS NULL OR c.fecha >= $1::date)
        AND ($2::date IS NULL OR c.fecha <= $2::date)
    `;
    const itemsResult = await pool.query(itemsQuery, [fecha_desde || null, fecha_hasta || null]);

    const resumen = {
      ...statsResult.rows[0],
      ...itemsResult.rows[0]
    };

    const data = {
      resumen: resumen,
      por_fecha: result.rows,
      generado: new Date().toISOString()
    };

    if (formato === 'pdf') {
      return generarPDFChecklists(res, data);
    }

    res.json(data);
  } catch (err) {
    console.error('Error generando reporte checklists:', err);
    res.status(500).json({ error: 'Error al generar reporte' });
  }
};

/**
 * Generar reporte completo de alertas automáticas
 */
export const reporteAlertas = async (req, res) => {
  try {
    const { formato = 'json' } = req.query;

    // Obtener todas las alertas automáticas
    const stockBajo = await pool.query(`
      SELECT p.id_producto, p.nombre, p.stock_actual, p.stock_minimo, pr.nombre as proveedor_nombre
      FROM productos p
      LEFT JOIN proveedores pr ON p.id_proveedor = pr.id_proveedor
      WHERE p.stock_minimo > 0 AND p.stock_actual < p.stock_minimo
      ORDER BY p.nombre
    `);

    const caducidad = await pool.query(`
      SELECT i.id_inventario, i.id_producto, i.fecha_caducidad, p.nombre as producto_nombre,
             i.stock_actual, pr.nombre as proveedor_nombre
      FROM inventario i
      JOIN productos p ON i.id_producto = p.id_producto
      LEFT JOIN proveedores pr ON p.id_proveedor = pr.id_proveedor
      WHERE i.fecha_caducidad BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
      AND i.stock_actual > 0
      ORDER BY i.fecha_caducidad ASC
    `);

    const vencidos = await pool.query(`
      SELECT i.id_inventario, i.id_producto, i.fecha_caducidad, p.nombre as producto_nombre,
             i.stock_actual, pr.nombre as proveedor_nombre
      FROM inventario i
      JOIN productos p ON i.id_producto = p.id_producto
      LEFT JOIN proveedores pr ON p.id_proveedor = pr.id_proveedor
      WHERE i.fecha_caducidad < CURRENT_DATE
      AND i.stock_actual > 0
      ORDER BY i.fecha_caducidad ASC
    `);

    const sinStock = await pool.query(`
      SELECT p.id_producto, p.nombre, p.stock_minimo, pr.nombre as proveedor_nombre
      FROM productos p
      LEFT JOIN proveedores pr ON p.id_proveedor = pr.id_proveedor
      WHERE p.stock_actual = 0
      ORDER BY p.nombre
    `);

    const data = {
      resumen: {
        total_alertas: stockBajo.rows.length + caducidad.rows.length + vencidos.rows.length + sinStock.rows.length,
        stock_bajo: stockBajo.rows.length,
        caducidad: caducidad.rows.length,
        vencidos: vencidos.rows.length,
        sin_stock: sinStock.rows.length
      },
      alertas: {
        stock_bajo: stockBajo.rows,
        caducidad: caducidad.rows,
        vencidos: vencidos.rows,
        sin_stock: sinStock.rows
      },
      generado: new Date().toISOString()
    };

    if (formato === 'pdf') {
      return generarPDFAlertas(res, data);
    }

    res.json(data);
  } catch (err) {
    console.error('Error generando reporte alertas:', err);
    res.status(500).json({ error: 'Error al generar reporte de alertas' });
  }
};

/**
 * Generar reporte de estado del stock (mejorado con más detalles)
 */
export const reporteStock = async (req, res) => {
  try {
    const { formato = 'json' } = req.query;

    const query = `
      SELECT 
        p.nombre,
        p.categoria,
        p.stock_actual,
        p.stock_minimo,
        CASE 
          WHEN p.stock_actual <= 0 THEN 'Sin stock'
          WHEN p.stock_actual < p.stock_minimo THEN 'Stock bajo'
          WHEN p.stock_actual < (p.stock_minimo * 2) THEN 'Stock medio'
          ELSE 'Stock suficiente'
        END as estado_stock,
        pr.nombre as proveedor_nombre,
        COUNT(i.id_inventario) as total_lotes,
        MIN(i.fecha_caducidad) as proxima_caducidad,
        MAX(i.fecha_ingreso) as ultimo_ingreso,
        SUM(CASE WHEN i.fecha_caducidad < CURRENT_DATE THEN i.stock_actual ELSE 0 END) as stock_vencido,
        SUM(CASE WHEN i.fecha_caducidad BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' THEN i.stock_actual ELSE 0 END) as stock_por_vencer
      FROM productos p
      LEFT JOIN proveedores pr ON p.id_proveedor = pr.id_proveedor
      LEFT JOIN inventario i ON p.id_producto = i.id_producto AND i.stock_actual > 0
      GROUP BY p.id_producto, p.nombre, p.categoria, p.stock_actual, p.stock_minimo, pr.nombre
      ORDER BY 
        CASE 
          WHEN p.stock_actual <= 0 THEN 1
          WHEN p.stock_actual < p.stock_minimo THEN 2
          ELSE 3
        END,
        p.nombre
    `;

    const result = await pool.query(query);

    const statsQuery = `
      SELECT 
        COUNT(*) as total_productos,
        COUNT(CASE WHEN stock_actual <= 0 THEN 1 END) as sin_stock,
        COUNT(CASE WHEN stock_actual > 0 AND stock_actual < stock_minimo THEN 1 END) as stock_bajo,
        COUNT(CASE WHEN stock_actual >= stock_minimo THEN 1 END) as stock_suficiente,
        COUNT(CASE WHEN categoria = 'Carnes' THEN 1 END) as productos_carnes,
        COUNT(CASE WHEN categoria = 'Verduras' THEN 1 END) as productos_verduras,
        COUNT(CASE WHEN categoria = 'Lacteos' THEN 1 END) as productos_lacteos
      FROM productos
    `;
    const statsResult = await pool.query(statsQuery);

    // Estadísticas adicionales de inventario
    const inventarioQuery = `
      SELECT 
        COUNT(*) as total_lotes,
        COUNT(CASE WHEN fecha_caducidad < CURRENT_DATE THEN 1 END) as lotes_vencidos,
        COUNT(CASE WHEN fecha_caducidad BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' THEN 1 END) as lotes_por_vencer
      FROM inventario
      WHERE stock_actual > 0
    `;
    const inventarioResult = await pool.query(inventarioQuery);

    const data = {
      resumen: {
        ...statsResult.rows[0],
        ...inventarioResult.rows[0]
      },
      productos: result.rows,
      categorias: {
        carnes: result.rows.filter(p => p.categoria === 'Carnes'),
        verduras: result.rows.filter(p => p.categoria === 'Verduras'),
        lacteos: result.rows.filter(p => p.categoria === 'Lacteos')
      },
      criticos: result.rows.filter(p => p.estado_stock === 'Sin stock' || p.estado_stock === 'Stock bajo'),
      generado: new Date().toISOString()
    };

    if (formato === 'pdf') {
      return generarPDFStock(res, data);
    }

    res.json(data);
  } catch (err) {
    console.error('Error generando reporte stock:', err);
    res.status(500).json({ error: 'Error al generar reporte' });
  }
};

/**
 * Generar PDF del reporte de checklists (mejorado con más detalles)
 */
function generarPDFChecklists(res, data) {
  const doc = new PDFDocument({ margin: 50 });
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=reporte-checklists-completo.pdf');
  
  doc.pipe(res);
  
  // Título y encabezado
  doc.fontSize(20).text('Reporte Completo de Checklists - Sistema APT', 50, 50);
  doc.fontSize(12).text(`Generado: ${new Date().toLocaleDateString('es-ES')} - ${new Date().toLocaleTimeString('es-ES')}`, 50, 80);
  doc.fontSize(10).text('Este reporte contiene estadísticas detalladas de todos los checklists del sistema', 50, 100);
  
  // Línea separadora
  doc.moveTo(50, 120).lineTo(550, 120).stroke();
  
  // Resumen General Ampliado
  const resumen = data.resumen;
  const tasaCompletado = resumen.total_checklists > 0 ? Math.round((resumen.completos / resumen.total_checklists) * 100) : 0;
  
  doc.fontSize(16).fillColor('black').text('RESUMEN GENERAL', 50, 140);
  doc.fontSize(12)
    .text(`Total de Checklists: ${resumen.total_checklists}`, 70, 170)
    .text(`Completos: ${resumen.completos} (${tasaCompletado}%)`, 70, 190)
    .text(`Items OK: ${resumen.items_ok || 0}`, 70, 210)
    .text(`Eficiencia del Sistema: ${tasaCompletado >= 80 ? 'Excelente' : tasaCompletado >= 60 ? 'Buena' : 'Requiere Atencion'}`, 70, 230);
    
  // Análisis de Rendimiento
  doc.fontSize(14).text('ANALISIS DE RENDIMIENTO', 50, 260);
  const rendimiento = tasaCompletado >= 80 ? 'El sistema muestra un excelente rendimiento' :
                     tasaCompletado >= 60 ? 'El rendimiento es satisfactorio' :
                     'Se recomienda revisar los procesos de checklist';
  doc.fontSize(11).text(rendimiento, 70, 280);
  
  // Detalle por Fecha (expandido a 20 registros)
  let y = 310;
  doc.fontSize(16).text('HISTORIAL DETALLADO POR FECHA', 50, y);
  y += 30;
  
  if (data.por_fecha && data.por_fecha.length > 0) {
    // Encabezados de tabla
    doc.fontSize(10).fillColor('blue')
      .text('Fecha', 70, y)
      .text('Estado', 150, y)
      .text('Cantidad', 230, y)
      .text('Observaciones', 310, y);
    
    y += 20;
    doc.moveTo(50, y).lineTo(550, y).stroke(); // Línea bajo encabezados
    y += 10;
    
    data.por_fecha.slice(0, 20).forEach((item, index) => {
      if (y > 700) {
        doc.addPage();
        y = 50;
        doc.fontSize(14).text('HISTORIAL DETALLADO (continuacion)', 50, y);
        y += 30;
      }
      
      const fecha = new Date(item.fecha).toLocaleDateString('es-ES');
      const estado = item.estado.charAt(0).toUpperCase() + item.estado.slice(1);
      
      doc.fontSize(9).fillColor('black')
        .text(fecha, 70, y)
        .text(estado, 150, y)
        .text(item.total.toString(), 230, y);
        
      // Indicador de estado sin emojis
      if (item.estado === 'completo') {
        doc.fillColor('green').text('OK', 310, y);
      } else {
        doc.fillColor('gray').text('--', 310, y);
      }
      
      y += 18;
    });
    
    if (data.por_fecha.length > 20) {
      doc.fontSize(10).fillColor('gray')
        .text(`... y ${data.por_fecha.length - 20} registros mas`, 70, y + 10);
    }
  } else {
    doc.fontSize(11).text('No hay datos de historial disponibles', 70, y);
  }
  
  // Recomendaciones
  if (y > 650) {
    doc.addPage();
    y = 50;
  } else {
    y += 40;
  }
  
  doc.fontSize(16).fillColor('black').text('RECOMENDACIONES', 50, y);
  y += 25;
  
  const recomendaciones = [];
  if (tasaCompletado < 70) {
    recomendaciones.push('• Revisar los procesos de checklist para mejorar la tasa de completado');
    recomendaciones.push('• Capacitar al personal en el uso del sistema');
  }
  if (resumen.items_ok && resumen.total_items && (resumen.items_ok / resumen.total_items) < 0.8) {
    recomendaciones.push('• Revisar items marcados como no conformes');
  }
  if (recomendaciones.length === 0) {
    recomendaciones.push('• Mantener el excelente trabajo en el sistema de checklists');
    recomendaciones.push('• Continuar con los procesos actuales');
  }
  
  recomendaciones.forEach(rec => {
    doc.fontSize(10).text(rec, 70, y);
    y += 15;
  });
  
  // Footer
  doc.fontSize(8).fillColor('gray')
    .text('Sistema APT - Gestión de Checklists | Generado automáticamente', 50, doc.page.height - 50);
  
  doc.end();
}

/**
 * Generar PDF del reporte de stock (completamente mejorado)
 */
function generarPDFStock(res, data) {
  const doc = new PDFDocument({ margin: 40 });
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=reporte-stock-completo.pdf');
  
  doc.pipe(res);
  
  // Título y encabezado
  doc.fontSize(20).text('Reporte Completo de Stock - Sistema APT', 40, 40);
  doc.fontSize(12).text(`Generado: ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}`, 40, 70);
  doc.fontSize(10).text('Este reporte incluye analisis detallado de inventario, alertas y recomendaciones', 40, 90);
  
  // Línea separadora
  doc.moveTo(40, 110).lineTo(560, 110).stroke();
  
  // Resumen General Expandido
  const resumen = data.resumen;
  let y = 130;
  
  doc.fontSize(16).fillColor('black').text('RESUMEN EJECUTIVO', 40, y);
  y += 25;
  
  // Primera columna de estadísticas
  doc.fontSize(12)
    .text(`Total de Productos: ${resumen.total_productos}`, 60, y)
    .text(`Total de Lotes: ${resumen.total_lotes}`, 60, y + 20)
    // Distribución por Categoría
  doc.fontSize(12)
    .text(`Productos por Categoria:`, 60, y + 40);
    
  // Segunda columna de estadísticas
  doc.text(`Sin Stock: ${resumen.sin_stock} (${Math.round((resumen.sin_stock / (resumen.total_productos || 1)) * 100)}%)`, 300, y)
    .text(`Stock Bajo: ${resumen.stock_bajo} (${Math.round((resumen.stock_bajo / (resumen.total_productos || 1)) * 100)}%)`, 300, y + 20)
    .text(`Stock Suficiente: ${resumen.stock_suficiente} (${Math.round((resumen.stock_suficiente / (resumen.total_productos || 1)) * 100)}%)`, 300, y + 40);
    
  y += 60;
  doc.fontSize(11)
    .text(`Carnes: ${resumen.productos_carnes || 0}`, 80, y)
    .text(`Verduras: ${resumen.productos_verduras || 0}`, 200, y)
    .text(`Lacteos: ${resumen.productos_lacteos || 0}`, 320, y);
  
  // Estado de los lotes
  y += 30;
  doc.fontSize(14).text('ESTADO DE LOTES EN INVENTARIO', 40, y);
  y += 20;
  doc.fontSize(11)
    .text(`Lotes Vencidos: ${resumen.lotes_vencidos} (requieren eliminacion inmediata)`, 60, y)
    .text(`Lotes por Vencer (7 dias): ${resumen.lotes_por_vencer} (requieren atencion prioritaria)`, 60, y + 18);
    
  // Alertas Críticas
  y += 50;
  if (y > 700) {
    doc.addPage();
    y = 50;
  }
  
  doc.fontSize(16).fillColor('red').text('ALERTAS CRITICAS', 40, y);
  y += 25;
  
  const alertasCriticas = data.criticos.filter(p => p.estado_stock === 'Sin stock');
  const alertasStock = data.criticos.filter(p => p.estado_stock === 'Stock bajo');
  
  if (alertasCriticas.length > 0) {
    doc.fontSize(14).fillColor('black').text('PRODUCTOS SIN STOCK (CRITICO)', 40, y);
    y += 20;
    
    alertasCriticas.slice(0, 15).forEach((producto, index) => {
      if (y > 720) {
        doc.addPage();
        y = 50;
        doc.fontSize(14).text('PRODUCTOS SIN STOCK (continuacion)', 40, y);
        y += 20;
      }
      
      doc.fontSize(10).fillColor('red')
        .text(`${index + 1}. ${producto.nombre}`, 60, y)
        .fillColor('black')
        .text(`Stock: ${producto.stock_actual} | Min: ${producto.stock_minimo}`, 300, y)
        .text(`Proveedor: ${producto.proveedor_nombre || 'N/A'}`, 450, y);
      y += 15;
    });
    
    if (alertasCriticas.length > 15) {
      doc.fontSize(10).fillColor('gray')
        .text(`... y ${alertasCriticas.length - 15} productos mas sin stock`, 60, y);
      y += 15;
    }
  }
  
  y += 20;
  if (alertasStock.length > 0) {
    if (y > 650) {
      doc.addPage();
      y = 50;
    }
    
    doc.fontSize(14).fillColor('black').text('PRODUCTOS CON STOCK BAJO', 40, y);
    y += 20;
    
    alertasStock.slice(0, 20).forEach((producto, index) => {
      if (y > 720) {
        doc.addPage();
        y = 50;
        doc.fontSize(14).text('PRODUCTOS CON STOCK BAJO (continuacion)', 40, y);
        y += 20;
      }
      
      const porcentajeStock = Math.round((producto.stock_actual / (producto.stock_minimo || 1)) * 100);
      
      doc.fontSize(10).fillColor('orange')
        .text(`${index + 1}. ${producto.nombre}`, 60, y)
        .fillColor('black')
        .text(`Actual: ${producto.stock_actual} | Min: ${producto.stock_minimo} (${porcentajeStock}%)`, 280, y)
        .text(`Proveedor: ${producto.proveedor_nombre || 'N/A'}`, 480, y);
      y += 15;
    });
    
    if (alertasStock.length > 20) {
      doc.fontSize(10).fillColor('gray')
        .text(`... y ${alertasStock.length - 20} productos mas con stock bajo`, 60, y);
      y += 15;
    }
  }
  
  // Análisis por Categoría
  y += 30;
  if (y > 650) {
    doc.addPage();
    y = 50;
  }
  
  doc.fontSize(16).fillColor('black').text('ANALISIS POR CATEGORIA', 40, y);
  y += 25;
  
  ['Carnes', 'Verduras', 'Lacteos'].forEach(categoria => {
    const productosCat = data.productos.filter(p => p.categoria === categoria);
    if (productosCat.length > 0) {
      const sinStock = productosCat.filter(p => p.stock_actual === 0).length;
      const stockBajo = productosCat.filter(p => p.stock_actual > 0 && p.stock_actual < p.stock_minimo).length;
      const stockSuficiente = productosCat.filter(p => p.stock_actual >= p.stock_minimo).length;
      
      doc.fontSize(12).text(`${categoria}:`, 60, y);
      doc.fontSize(10)
        .text(`Total productos: ${productosCat.length}`, 80, y + 18)
        .text(`Sin stock: ${sinStock}`, 280, y + 18)
        .text(`Stock bajo: ${stockBajo}`, 280, y + 33)
        .text(`Stock suficiente: ${stockSuficiente}`, 280, y + 48);
      y += 70;
    }
  });
  
  // Análisis Detallado de Vencimientos
  y += 20;
  if (y > 600) {
    doc.addPage();
    y = 50;
  }
  
  doc.fontSize(16).text('ANALISIS DETALLADO DE VENCIMIENTOS', 40, y);
  y += 25;
  
  // Productos con fechas críticas
  const productosConFechas = data.productos.filter(p => p.proxima_caducidad);
  const vencenEn7Dias = productosConFechas.filter(p => {
    const fechaCad = new Date(p.proxima_caducidad);
    const hoy = new Date();
    const diffDias = Math.ceil((fechaCad - hoy) / (1000 * 60 * 60 * 24));
    return diffDias >= 0 && diffDias <= 7;
  });
  
  const vencenEn30Dias = productosConFechas.filter(p => {
    const fechaCad = new Date(p.proxima_caducidad);
    const hoy = new Date();
    const diffDias = Math.ceil((fechaCad - hoy) / (1000 * 60 * 60 * 24));
    return diffDias > 7 && diffDias <= 30;
  });
  
  const yaVencidos = productosConFechas.filter(p => {
    const fechaCad = new Date(p.proxima_caducidad);
    const hoy = new Date();
    return fechaCad < hoy;
  });
  
  // Resumen de vencimientos
  doc.fontSize(12)
    .text(`Productos ya vencidos: ${yaVencidos.length}`, 60, y)
    .text(`Vencen en 7 dias: ${vencenEn7Dias.length}`, 250, y)
    .text(`Vencen en 30 dias: ${vencenEn30Dias.length}`, 400, y);
  y += 30;
  
  // Listado detallado de productos críticos
  if (yaVencidos.length > 0) {
    doc.fontSize(14).fillColor('red').text('PRODUCTOS VENCIDOS (RETIRAR INMEDIATAMENTE):', 60, y);
    y += 20;
    yaVencidos.slice(0, 10).forEach((producto, index) => {
      const fechaCad = new Date(producto.proxima_caducidad);
      const diasVencido = Math.ceil((new Date() - fechaCad) / (1000 * 60 * 60 * 24));
      doc.fontSize(9).fillColor('red')
        .text(`${index + 1}. ${producto.nombre}`, 80, y)
        .text(`Vencio: ${fechaCad.toLocaleDateString('es-ES')}`, 250, y)
        .text(`${diasVencido} dias atrasado`, 350, y)
        .text(`Stock: ${producto.stock_actual}`, 450, y);
      y += 12;
    });
    y += 15;
  }
  
  if (vencenEn7Dias.length > 0) {
    doc.fontSize(14).fillColor('orange').text('VENCEN EN 7 DIAS (USO PRIORITARIO):', 60, y);
    y += 20;
    vencenEn7Dias.slice(0, 10).forEach((producto, index) => {
      const fechaCad = new Date(producto.proxima_caducidad);
      const diasRestantes = Math.ceil((fechaCad - new Date()) / (1000 * 60 * 60 * 24));
      doc.fontSize(9).fillColor('orange')
        .text(`${index + 1}. ${producto.nombre}`, 80, y)
        .text(`Vence: ${fechaCad.toLocaleDateString('es-ES')}`, 250, y)
        .text(`${diasRestantes} dias restantes`, 350, y)
        .text(`Stock: ${producto.stock_actual}`, 450, y);
      y += 12;
    });
    y += 15;
  }
  
  // Todos los productos (tabla detallada)
  y += 20;
  if (y > 600) {
    doc.addPage();
    y = 50;
  }
  
  doc.fontSize(16).text('INVENTARIO COMPLETO', 40, y);
  y += 25;
  
  // Encabezados de tabla
  doc.fontSize(9).fillColor('blue')
    .text('Producto', 60, y)
    .text('Cat.', 180, y)
    .text('Stock', 220, y)
    .text('Min', 260, y)
    .text('Estado', 290, y)
    .text('Lotes', 340, y)
    .text('Prox. Vencimiento', 370, y)
    .text('Dias Rest.', 480, y);
  
  y += 15;
  doc.moveTo(40, y).lineTo(560, y).stroke(); // Línea bajo encabezados
  y += 10;
  
  data.productos.slice(0, 40).forEach((producto, index) => {
    if (y > 720) {
      doc.addPage();
      y = 50;
      doc.fontSize(14).text('INVENTARIO COMPLETO (continuacion)', 40, y);
      y += 25;
      // Repetir encabezados
      doc.fontSize(9).fillColor('blue')
        .text('Producto', 60, y)
        .text('Cat.', 180, y)
        .text('Stock', 220, y)
        .text('Min', 260, y)
        .text('Estado', 290, y)
        .text('Lotes', 340, y)
        .text('Prox. Vencimiento', 370, y)
        .text('Dias Rest.', 480, y);
      y += 20;
    }
    
    // Color según estado del stock
    let color = 'black';
    if (producto.estado_stock === 'Sin stock') color = 'red';
    else if (producto.estado_stock === 'Stock bajo') color = 'orange';
    else if (producto.estado_stock === 'Stock suficiente') color = 'green';
    
    const proxCaducidad = producto.proxima_caducidad ? 
      new Date(producto.proxima_caducidad).toLocaleDateString('es-ES') : 'N/A';
      
    // Calcular días restantes
    let diasRestantes = 'N/A';
    let colorFecha = 'black';
    if (producto.proxima_caducidad) {
      const fechaCad = new Date(producto.proxima_caducidad);
      const hoy = new Date();
      const diffDias = Math.ceil((fechaCad - hoy) / (1000 * 60 * 60 * 24));
      if (diffDias < 0) {
        diasRestantes = `${Math.abs(diffDias)}d venc.`;
        colorFecha = 'red';
      } else if (diffDias <= 7) {
        diasRestantes = `${diffDias}d`;
        colorFecha = 'orange';
      } else {
        diasRestantes = `${diffDias}d`;
        colorFecha = 'black';
      }
    }
    
    doc.fontSize(8).fillColor(color)
      .text(producto.nombre.substring(0, 18), 60, y)
      .text(producto.categoria?.substring(0, 8) || 'N/A', 180, y)
      .text(producto.stock_actual?.toString() || '0', 220, y)
      .text(producto.stock_minimo?.toString() || '0', 260, y)
      .text(producto.estado_stock.substring(0, 8), 290, y)
      .text(producto.total_lotes?.toString() || '0', 340, y)
      .text(proxCaducidad, 370, y)
      .fillColor(colorFecha)
      .text(diasRestantes, 480, y);
    
    y += 12;
  });
  
  if (data.productos.length > 40) {
    doc.fontSize(10).fillColor('gray')
      .text(`... y ${data.productos.length - 40} productos más en el inventario completo`, 60, y + 10);
  }
  
  // Recomendaciones
  if (y > 650) {
    doc.addPage();
    y = 50;
  } else {
    y += 40;
  }
  
  doc.fontSize(16).fillColor('black').text('RECOMENDACIONES DE GESTION', 40, y);
  y += 25;
  
  const recomendaciones = [];
  
  if (alertasCriticas.length > 0) {
    recomendaciones.push(`URGENTE: Reabastecer ${alertasCriticas.length} productos sin stock inmediatamente`);
  }
  if (alertasStock.length > 0) {
    recomendaciones.push(`Planificar reabastecimiento de ${alertasStock.length} productos con stock bajo`);
  }
  if (resumen.lotes_vencidos > 0) {
    recomendaciones.push(`Eliminar ${resumen.lotes_vencidos} lotes vencidos del inventario`);
  }
  if (resumen.lotes_por_vencer > 0) {
    recomendaciones.push(`Priorizar uso de ${resumen.lotes_por_vencer} lotes que vencen pronto`);
  }
  
  const eficiencia = Math.round((resumen.stock_suficiente / (resumen.total_productos || 1)) * 100);
  if (eficiencia >= 80) {
    recomendaciones.push('Excelente gestion de inventario - mantener procesos actuales');
  } else if (eficiencia >= 60) {
    recomendaciones.push('Mejorar planificacion de compras para optimizar stock');
  } else {
    recomendaciones.push('Revisar completamente la estrategia de gestion de inventario');
  }
  
  recomendaciones.forEach(rec => {
    doc.fontSize(10).text(rec, 60, y);
    y += 18;
  });
  
  doc.end();
}

/**
 * Generar PDF del reporte de alertas
 */
function generarPDFAlertas(res, data) {
  const doc = new PDFDocument({ margin: 40 });
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=reporte-alertas-completo.pdf');
  
  doc.pipe(res);
  
  // Título y encabezado
  doc.fontSize(20).text('Reporte Completo de Alertas - Sistema APT', 40, 40);
  doc.fontSize(12).text(`Generado: ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}`, 40, 70);
  doc.fontSize(10).text('Este reporte incluye todas las alertas automáticas del sistema', 40, 90);
  
  // Línea separadora
  doc.moveTo(40, 110).lineTo(560, 110).stroke();
  
  // Resumen de Alertas
  const resumen = data.resumen;
  let y = 130;
  
  doc.fontSize(16).fillColor('red').text('RESUMEN DE ALERTAS ACTIVAS', 40, y);
  y += 30;
  
  doc.fontSize(14).fillColor('black')
    .text(`Total de Alertas: ${resumen.total_alertas}`, 60, y)
    .text(`Criticas: ${resumen.sin_stock + resumen.vencidos}`, 300, y);
  y += 25;
  
  doc.fontSize(12)
    .text(`Sin Stock: ${resumen.sin_stock}`, 80, y)
    .text(`Stock Bajo: ${resumen.stock_bajo}`, 200, y)
    .text(`Por Caducar: ${resumen.caducidad}`, 320, y)
    .text(`Vencidos: ${resumen.vencidos}`, 450, y);
  
  y += 40;
  
  // SECCIÓN 1: PRODUCTOS SIN STOCK (CRÍTICO)
  if (data.alertas.sin_stock.length > 0) {
    doc.fontSize(16).fillColor('red').text('PRODUCTOS SIN STOCK (ACCION INMEDIATA)', 40, y);
    y += 25;
    
    doc.fontSize(10).fillColor('black')
      .text('Producto', 60, y)
      .text('Stock Mínimo', 250, y)
      .text('Proveedor', 350, y)
      .text('Urgencia', 480, y);
    
    y += 15;
    doc.moveTo(40, y).lineTo(560, y).stroke();
    y += 10;
    
    data.alertas.sin_stock.forEach((producto, index) => {
      if (y > 720) {
        doc.addPage();
        y = 50;
        doc.fontSize(16).text('PRODUCTOS SIN STOCK (continuacion)', 40, y);
        y += 30;
      }
      
      doc.fontSize(10).fillColor('red')
        .text(`${index + 1}. ${producto.nombre}`, 60, y)
        .fillColor('black')
        .text(producto.stock_minimo?.toString() || 'N/A', 250, y)
        .text(producto.proveedor_nombre || 'Sin proveedor', 350, y)
        .fillColor('red')
        .text('CRÍTICA', 480, y);
      y += 15;
    });
    y += 20;
  }
  
  // SECCIÓN 2: PRODUCTOS VENCIDOS
  if (data.alertas.vencidos.length > 0) {
    if (y > 600) {
      doc.addPage();
      y = 50;
    }
    
    doc.fontSize(16).fillColor('red').text('PRODUCTOS VENCIDOS (RETIRAR DEL INVENTARIO)', 40, y);
    y += 25;
    
    doc.fontSize(10).fillColor('black')
      .text('Producto', 60, y)
      .text('Fecha Vencimiento', 200, y)
      .text('Stock Actual', 320, y)
      .text('Proveedor', 400, y)
      .text('Días Vencido', 500, y);
    
    y += 15;
    doc.moveTo(40, y).lineTo(560, y).stroke();
    y += 10;
    
    data.alertas.vencidos.forEach((producto, index) => {
      if (y > 720) {
        doc.addPage();
        y = 50;
        doc.fontSize(16).text('PRODUCTOS VENCIDOS (continuacion)', 40, y);
        y += 30;
      }
      
      const fechaVenc = new Date(producto.fecha_caducidad);
      const diasVencido = Math.floor((new Date() - fechaVenc) / (1000 * 60 * 60 * 24));
      
      doc.fontSize(10).fillColor('red')
        .text(`${index + 1}. ${producto.producto_nombre}`, 60, y)
        .fillColor('black')
        .text(fechaVenc.toLocaleDateString('es-ES'), 200, y)
        .text(producto.stock_actual?.toString() || '0', 320, y)
        .text(producto.proveedor_nombre || 'N/A', 400, y)
        .fillColor('red')
        .text(`${diasVencido}`, 500, y);
      y += 15;
    });
    y += 20;
  }
  
  // SECCIÓN 3: PRODUCTOS CON STOCK BAJO
  if (data.alertas.stock_bajo.length > 0) {
    if (y > 600) {
      doc.addPage();
      y = 50;
    }
    
    doc.fontSize(16).fillColor('orange').text('PRODUCTOS CON STOCK BAJO', 40, y);
    y += 25;
    
    doc.fontSize(10).fillColor('black')
      .text('Producto', 60, y)
      .text('Stock Actual', 200, y)
      .text('Stock Mínimo', 280, y)
      .text('% del Mínimo', 360, y)
      .text('Proveedor', 450, y);
    
    y += 15;
    doc.moveTo(40, y).lineTo(560, y).stroke();
    y += 10;
    
    data.alertas.stock_bajo.forEach((producto, index) => {
      if (y > 720) {
        doc.addPage();
        y = 50;
        doc.fontSize(16).text('PRODUCTOS CON STOCK BAJO (continuacion)', 40, y);
        y += 30;
      }
      
      const porcentaje = Math.round((producto.stock_actual / (producto.stock_minimo || 1)) * 100);
      
      doc.fontSize(10).fillColor('orange')
        .text(`${index + 1}. ${producto.nombre}`, 60, y)
        .fillColor('black')
        .text(producto.stock_actual?.toString() || '0', 200, y)
        .text(producto.stock_minimo?.toString() || '0', 280, y)
        .text(`${porcentaje}%`, 360, y)
        .text(producto.proveedor_nombre || 'N/A', 450, y);
      y += 15;
    });
    y += 20;
  }
  
  // SECCIÓN 4: PRODUCTOS PRÓXIMOS A CADUCAR
  if (data.alertas.caducidad.length > 0) {
    if (y > 600) {
      doc.addPage();
      y = 50;
    }
    
    doc.fontSize(16).fillColor('purple').text('PRODUCTOS PROXIMOS A CADUCAR (7 DIAS)', 40, y);
    y += 25;
    
    doc.fontSize(10).fillColor('black')
      .text('Producto', 60, y)
      .text('Fecha Caducidad', 200, y)
      .text('Stock Actual', 320, y)
      .text('Días Restantes', 400, y)
      .text('Prioridad', 480, y);
    
    y += 15;
    doc.moveTo(40, y).lineTo(560, y).stroke();
    y += 10;
    
    data.alertas.caducidad.forEach((producto, index) => {
      if (y > 720) {
        doc.addPage();
        y = 50;
        doc.fontSize(16).text('PRODUCTOS PROXIMOS A CADUCAR (continuacion)', 40, y);
        y += 30;
      }
      
      const fechaCad = new Date(producto.fecha_caducidad);
      const diasRestantes = Math.floor((fechaCad - new Date()) / (1000 * 60 * 60 * 24));
      const prioridad = diasRestantes <= 1 ? 'ALTA' : diasRestantes <= 3 ? 'MEDIA' : 'NORMAL';
      
      doc.fontSize(10).fillColor('purple')
        .text(`${index + 1}. ${producto.producto_nombre}`, 60, y)
        .fillColor('black')
        .text(fechaCad.toLocaleDateString('es-ES'), 200, y)
        .text(producto.stock_actual?.toString() || '0', 320, y)
        .text(diasRestantes.toString(), 400, y)
        .fillColor(prioridad === 'ALTA' ? 'red' : prioridad === 'MEDIA' ? 'orange' : 'green')
        .text(prioridad, 480, y);
      y += 15;
    });
    y += 20;
  }
  
  // PLAN DE ACCIÓN
  if (y > 650) {
    doc.addPage();
    y = 50;
  } else {
    y += 30;
  }
  
  doc.fontSize(16).fillColor('black').text('PLAN DE ACCION RECOMENDADO', 40, y);
  y += 25;
  
  const acciones = [];
  
  if (resumen.sin_stock > 0) {
    acciones.push(`URGENTE: Contactar proveedores para ${resumen.sin_stock} productos sin stock`);
  }
  if (resumen.vencidos > 0) {
    acciones.push(`INMEDIATO: Retirar ${resumen.vencidos} lotes vencidos del inventario`);
  }
  if (resumen.stock_bajo > 0) {
    acciones.push(`PLANIFICAR: Reabastecimiento de ${resumen.stock_bajo} productos con stock bajo`);
  }
  if (resumen.caducidad > 0) {
    acciones.push(`PRIORIZAR: Uso de ${resumen.caducidad} productos que vencen pronto`);
  }
  
  if (acciones.length === 0) {
    acciones.push('Sin alertas criticas - Sistema funcionando correctamente');
  }
  
  acciones.forEach((accion, index) => {
    doc.fontSize(11).fillColor('black').text(`${index + 1}. ${accion}`, 60, y);
    y += 20;
  });
  
  // Footer
  doc.fontSize(8).fillColor('gray')
    .text(`Sistema APT - Alertas automáticas | Total: ${resumen.total_alertas} alertas activas`, 40, doc.page.height - 50)
    .text('Este reporte debe revisarse diariamente para mantener la calidad del inventario', 40, doc.page.height - 35);
  
  doc.end();
}