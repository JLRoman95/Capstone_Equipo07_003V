/**
 * Servicio de Exportación a PDF
 * Permite exportar reportes y registros en formato PDF
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Helpers para sanitizar datos antes de llevarlos a PDF
const toSafeDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value) ? null : value;
  if (typeof value === 'object') {
    if (typeof value.toDate === 'function') {
      const date = value.toDate();
      return isNaN(date) ? null : date;
    }
    if (typeof value.seconds === 'number') {
      const date = new Date(value.seconds * 1000);
      return isNaN(date) ? null : date;
    }
  }
  const date = new Date(value);
  return isNaN(date) ? null : date;
};

const formatDateSafe = (value, fallback = 'Sin fecha') => {
  const date = toSafeDate(value);
  return date ? date.toLocaleDateString('es-CL') : fallback;
};

const formatText = (value, fallback = 'N/A') => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : fallback;
  }
  return fallback;
};

const formatTipo = (value, fallback = 'Sin tipo') => {
  const text = formatText(value, fallback);
  return text.replace(/_/g, ' ').toUpperCase();
};

const getAutoTableFinalY = (doc) => {
  const lastTable = doc.lastAutoTable || doc.previousAutoTable;
  return lastTable?.finalY ?? null;
};

export const resumirMermasPorProducto = (registros = [], productoLookup = {}) => {
  const resumen = new Map();
  let totalCantidad = 0;
  let totalEventos = 0;

  registros.forEach((registro) => {
    if (!registro || !Array.isArray(registro.mermas)) return;
    registro.mermas.forEach((merma) => {
      if (!merma) return;
      const codigoBase = merma.codigo_producto || merma.producto || merma.nombre;
      const clave = formatText(codigoBase, 'SIN-CODIGO').toUpperCase();
      const etiqueta = productoLookup[codigoBase] || productoLookup[clave] || merma.producto || merma.nombre || merma.codigo_producto || 'Producto sin descripción';
      const cantidad = Number(merma.cantidad) || 0;

      totalEventos += 1;
      totalCantidad += cantidad;

      const existente = resumen.get(clave) || { producto: etiqueta, codigo: codigoBase || 'N/D', cantidad: 0, eventos: 0 };
      existente.cantidad += cantidad;
      existente.eventos += 1;
      resumen.set(clave, existente);
    });
  });

  const detalle = Array.from(resumen.values()).sort((a, b) => b.cantidad - a.cantidad);

  return {
    totalCantidad,
    totalEventos,
    detalle
  };
};

// Configuración de fuente para español
const configurarPDF = (doc, titulo) => {
  // Encabezado
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(titulo, 105, 20, { align: 'center' });
  
  // Fecha de generación
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const fecha = new Date().toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text(`Generado: ${fecha}`, 105, 28, { align: 'center' });
  
  return 35; // Posición Y donde empieza el contenido
};

/**
 * Exportar lista de proveedores a PDF
 */
export const exportarProveedoresPDF = (proveedores) => {
  const doc = new jsPDF();
  const startY = configurarPDF(doc, 'Reporte de Proveedores');
  
  const tableData = proveedores.map(p => [
    p.nombre,
    p.contacto,
    p.telefono,
    p.email,
    p.direccion || 'N/A'
  ]);
  
  autoTable(doc,{
    startY,
    head: [['Nombre', 'Contacto', 'Teléfono', 'Email', 'Dirección']],
    body: tableData,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { top: 35, left: 14, right: 14 }
  });
  
  // Pie de página
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Página ${i} de ${pageCount}`, 105, 285, { align: 'center' });
    doc.text('Sistema APT - Control de Cocina', 105, 290, { align: 'center' });
  }
  
  doc.save('proveedores.pdf');
};

/**
 * Exportar lista de productos a PDF
 */
export const exportarProductosPDF = (productos) => {
  const doc = new jsPDF();
  const startY = configurarPDF(doc, 'Catálogo de Productos');
  
  const tableData = productos.map(p => [
    p.codigo_producto || 'N/A',
    p.nombre || 'N/A',
    p.categoria || 'N/A',
    p.unidad_medida || 'N/A',
    p.precio_unitario ? `$${p.precio_unitario.toLocaleString('es-CL')}` : '$0'
  ]);
  
  autoTable(doc,{
    startY,
    head: [['Código', 'Nombre', 'Categoría', 'Unidad', 'Precio']],
    body: tableData,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [46, 204, 113], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      4: { halign: 'right' }
    },
    margin: { top: 35, left: 14, right: 14 }
  });
  
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Página ${i} de ${pageCount}`, 105, 285, { align: 'center' });
    doc.text('Sistema APT - Control de Cocina', 105, 290, { align: 'center' });
  }
  
  doc.save('productos.pdf');
};

/**
 * Exportar inventario a PDF
 */
export const exportarInventarioPDF = (inventario) => {
  const doc = new jsPDF('landscape'); // Horizontal para más columnas
  const startY = configurarPDF(doc, 'Reporte de Inventario');
  
  const tableData = inventario.map(item => {
    const diasRestantes = Math.ceil(
      (new Date(item.fecha_vencimiento) - new Date()) / (1000 * 60 * 60 * 24)
    );
    
    return [
      item.codigo_producto,
      item.lote,
      item.cantidad_unidades,
      new Date(item.fecha_ingreso).toLocaleDateString('es-CL'),
      new Date(item.fecha_vencimiento).toLocaleDateString('es-CL'),
      diasRestantes > 0 ? `${diasRestantes} días` : 'VENCIDO',
      item.estado
    ];
  });
  
  autoTable(doc,{
    startY,
    head: [['Código', 'Lote', 'Cantidad', 'F. Ingreso', 'F. Vencimiento', 'Días Rest.', 'Estado']],
    body: tableData,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [230, 126, 34], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      2: { halign: 'center' },
      3: { halign: 'center' },
      4: { halign: 'center' },
      5: { halign: 'center' },
      6: { halign: 'center' }
    },
    didParseCell: function(data) {
      // Colorear filas según días restantes
      if (data.section === 'body' && data.column.index === 5) {
        const diasText = data.cell.raw;
        if (diasText === 'VENCIDO') {
          data.cell.styles.textColor = [231, 76, 60];
          data.cell.styles.fontStyle = 'bold';
        } else {
          const dias = parseInt(diasText);
          if (dias <= 3) {
            data.cell.styles.textColor = [231, 76, 60];
          } else if (dias <= 7) {
            data.cell.styles.textColor = [243, 156, 18];
          }
        }
      }
    },
    margin: { top: 35, left: 14, right: 14 }
  });
  
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Página ${i} de ${pageCount}`, 148, 200, { align: 'center' });
    doc.text('Sistema APT - Control de Cocina', 148, 205, { align: 'center' });
  }
  
  doc.save('inventario.pdf');
};

/**
 * Exportar producción a PDF
 */
export const exportarProduccionPDF = (produccion) => {
  const doc = new jsPDF();
  const startY = configurarPDF(doc, 'Reporte de Producción con Ingredientes');
  
  const tableData = produccion.map(p => {
    const ingredientesTexto = p.ingredientes && p.ingredientes.length > 0
      ? p.ingredientes.map(ing => `${ing.codigo_producto} (${ing.cantidad_total}u)`).join(', ')
      : 'Sin detalles';
    
    return [
      new Date(p.fecha).toLocaleDateString('es-CL'),
      p.turno,
      p.responsable,
      p.plato,
      p.cantidad,
      ingredientesTexto
    ];
  });
  
  // Calcular totales
  const totalPorciones = produccion.reduce((sum, p) => sum + p.cantidad, 0);
  
  autoTable(doc,{
    startY,
    head: [['Fecha', 'Turno', 'Responsable', 'Plato', 'Cantidad', 'Ingredientes']],
    body: tableData,
    foot: [['', '', '', 'TOTAL', totalPorciones, '']],
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [155, 89, 182], textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: [155, 89, 182], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      4: { halign: 'center', cellWidth: 18 },
      5: { fontSize: 7, cellWidth: 60 }
    },
    margin: { top: 35, left: 14, right: 14 }
  });
  
  const resumenMermas = resumirMermasPorProducto(produccion);
  if (resumenMermas.totalEventos > 0) {
    let sectionY = getAutoTableFinalY(doc) || doc.previousAutoTable?.finalY || startY + 60;
    if (sectionY > 230) {
      doc.addPage();
      sectionY = 20;
    } else {
      sectionY += 12;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumen de Mermas', 14, sectionY);
    sectionY += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Eventos registrados: ${resumenMermas.totalEventos}`, 14, sectionY);
    sectionY += 6;
    doc.text(`Cantidad total descartada: ${resumenMermas.totalCantidad} unidades`, 14, sectionY);
    sectionY += 10;

    autoTable(doc, {
      startY: sectionY,
      head: [['Producto', 'Eventos', 'Cantidad Total']],
      body: resumenMermas.detalle.map(item => [
        `${formatText(item.producto, 'Producto sin descripción')} (${formatText(item.codigo, 'N/D')})`,
        item.eventos,
        item.cantidad
      ]),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [15, 118, 110], textColor: 255 },
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'center' }
      },
      margin: { left: 14, right: 14 }
    });

  }

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Página ${i} de ${pageCount}`, 105, 285, { align: 'center' });
    doc.text('Sistema APT - Control de Cocina', 105, 290, { align: 'center' });
  }
  
  doc.save('produccion.pdf');
};

/**
 * Exportar checklists a PDF
 */
export const exportarChecklistsPDF = (checklists) => {
  const doc = new jsPDF();
  const startY = configurarPDF(doc, 'Reporte de Checklists de Calidad');
  
  const tableData = [];
  checklists.forEach(checklist => {
    tableData.push([
      new Date(checklist.fecha).toLocaleDateString('es-CL'),
      checklist.turno,
      checklist.responsable,
      checklist.estado === 'completo' ? '✓ Completo' : '✗ Pendiente',
      `${checklist.items.filter(i => i.completado).length}/${checklist.items.length}`
    ]);
  });
  
  autoTable(doc,{
    startY,
    head: [['Fecha', 'Turno', 'Responsable', 'Estado', 'Tareas']],
    body: tableData,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [52, 152, 219], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      3: { halign: 'center' },
      4: { halign: 'center' }
    },
    didParseCell: function(data) {
      if (data.section === 'body' && data.column.index === 3) {
        if (data.cell.raw.includes('✓')) {
          data.cell.styles.textColor = [46, 204, 113];
        } else {
          data.cell.styles.textColor = [231, 76, 60];
        }
      }
    },
    margin: { top: 35, left: 14, right: 14 }
  });
  
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Página ${i} de ${pageCount}`, 105, 285, { align: 'center' });
    doc.text('Sistema APT - Control de Cocina', 105, 290, { align: 'center' });
  }
  
  doc.save('checklists.pdf');
};

/**
 * Exportar alertas a PDF
 */
export const exportarAlertasPDF = (alertas) => {
  const doc = new jsPDF();
  const startY = configurarPDF(doc, 'Reporte de Alertas del Sistema');
  
  const tableData = alertas.map(alerta => [
    formatTipo(alerta.tipo),
    formatText(alerta.titulo, 'Sin título'),
    formatText(alerta.descripcion, 'Sin descripción'),
    formatText(alerta.prioridad, 'N/D').toUpperCase(),
    formatText(alerta.estado, 'N/D'),
    formatDateSafe(alerta.fecha)
  ]);
  
  autoTable(doc,{
    startY,
    head: [['Tipo', 'Título', 'Descripción', 'Prioridad', 'Estado', 'Fecha']],
    body: tableData,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [231, 76, 60], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 40 },
      2: { cellWidth: 60 },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 25, halign: 'center' }
    },
    didParseCell: function(data) {
      if (data.section === 'body' && data.column.index === 3) {
        if (data.cell.raw === 'ALTA') {
          data.cell.styles.textColor = [231, 76, 60];
          data.cell.styles.fontStyle = 'bold';
        } else if (data.cell.raw === 'MEDIA') {
          data.cell.styles.textColor = [243, 156, 18];
        }
      }
    },
    margin: { top: 35, left: 14, right: 14 }
  });
  
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Página ${i} de ${pageCount}`, 105, 285, { align: 'center' });
    doc.text('Sistema APT - Control de Cocina', 105, 290, { align: 'center' });
  }
  
  doc.save('alertas.pdf');
};

/**
 * Exportar reporte consolidado (resumen general)
 */
export const exportarReporteConsolidadoPDF = (datos) => {
  const doc = new jsPDF();
  const startY = configurarPDF(doc, 'Reporte Consolidado del Sistema');
  
  let currentY = startY;
  
  // Resumen general
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumen General', 14, currentY);
  currentY += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total de Proveedores: ${datos.proveedores || 0}`, 20, currentY);
  currentY += 6;
  doc.text(`Total de Productos: ${datos.productos || 0}`, 20, currentY);
  currentY += 6;
  doc.text(`Items en Inventario: ${datos.inventario || 0}`, 20, currentY);
  currentY += 6;
  doc.text(`Registros de Producción: ${datos.produccion || 0}`, 20, currentY);
  currentY += 6;
  doc.text(`Checklists Completados: ${datos.checklistsCompletos || 0} / ${datos.checklists || 0}`, 20, currentY);
  currentY += 6;
  doc.text(`Alertas Activas: ${datos.alertasActivas || 0}`, 20, currentY);
  currentY += 12;
  
  // Alertas críticas
  const alertasCriticas = Array.isArray(datos.alertasCriticas) ? datos.alertasCriticas : [];
  if (alertasCriticas.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Alertas Críticas', 14, currentY);
    currentY += 8;
    
    autoTable(doc,{
      startY: currentY,
      head: [['Prioridad', 'Tipo', 'Descripción']],
      body: alertasCriticas.map(a => [
        formatText(a.prioridad, 'N/D').toUpperCase(),
        formatTipo(a.tipo, 'sin tipo'),
        formatText(a.descripcion, 'Sin descripción')
      ]),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [231, 76, 60], textColor: 255 },
      margin: { left: 14, right: 14 }
    });
    
    const finalY = getAutoTableFinalY(doc);
    if (finalY) {
      currentY = finalY + 10;
    }
  }
  
  // Productos próximos a vencer
  const productosProximos = Array.isArray(datos.productosProximosVencer) ? datos.productosProximosVencer : [];
  if (productosProximos.length > 0) {
    if (currentY > 240) {
      doc.addPage();
      currentY = 20;
    }
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Productos Próximos a Vencer', 14, currentY);
    currentY += 8;
    
    autoTable(doc,{
      startY: currentY,
      head: [['Código', 'Lote', 'Fecha Vencimiento', 'Días Restantes']],
      body: productosProximos.map(p => [
        formatText(p.codigo_producto || p.producto, 'Sin código'),
        formatText(p.lote || p.numero_lote, 'Sin lote'),
        formatDateSafe(p.fecha_vencimiento),
        Number.isFinite(p.diasRestantes) ? `${p.diasRestantes} días` : 'N/D'
      ]),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [243, 156, 18], textColor: 255 },
      margin: { left: 14, right: 14 }
    });
    currentY = getAutoTableFinalY(doc) ? getAutoTableFinalY(doc) + 12 : currentY + 12;
  }
  const resumenMermas = datos.mermasResumen;
  if (resumenMermas && resumenMermas.totalEventos > 0) {
    if (currentY > 240 || !currentY) {
      doc.addPage();
      currentY = 20;
    }
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Mermas Registradas', 14, currentY);
    currentY += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Eventos totales: ${resumenMermas.totalEventos}`, 14, currentY);
    currentY += 6;
    doc.text(`Cantidad total descartada: ${resumenMermas.totalCantidad} unidades`, 14, currentY);
    currentY += 8;

    autoTable(doc, {
      startY: currentY,
      head: [['Producto', 'Eventos', 'Cantidad']],
      body: resumenMermas.detalle.map(item => [
        `${formatText(item.producto, 'Producto')} (${formatText(item.codigo, 'N/D')})`,
        item.eventos,
        item.cantidad
      ]),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [99, 102, 241], textColor: 255 },
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'center' }
      },
      margin: { left: 14, right: 14 }
    });
  }
  
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Página ${i} de ${pageCount}`, 105, 285, { align: 'center' });
    doc.text('Sistema APT - Control de Cocina', 105, 290, { align: 'center' });
  }
  
  doc.save('reporte_consolidado.pdf');
};
